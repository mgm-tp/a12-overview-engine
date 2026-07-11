/*
 * SPDX-License-Identifier: EUPL-1.2 OR LicenseRef-commercial
 *
 * Copyright (c) 2012-2026 mgm technology partners GmbH
 *
 * Dual License
 * ------------
 * This source file is part of the mgm A12 Platform and available under
 * a choice of two different licenses:
 *
 * 1. Open-Source License - EUPL v1.2
 *    You may redistribute and/or modify this file under the terms of the
 *    European Union Public License, version 1.2 - see https://eupl.eu/.
 *
 * 2. Commercial License
 *    Alternatively, you may obtain a commercial license from
 *    mgm technology partners GmbH, that permits use of this software
 *    under different terms (including support and maintenance services).
 *
 *    Please contact a12-license@mgm-tp.com for more information.
 *
 * You must select and comply with exactly one of the above license options.
 *
 * Warranty Disclaimer (applies to either option)
 * ----------------------------------------------
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT WARRANTY OF ANY KIND,
 * WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NON-INFRINGEMENT, EXCEPT WHERE SUCH DISCLAIMERS ARE HELD TO BE
 * LEGALLY INVALID. SEE THE RESPECTIVE LICENSE TEXT FOR DETAILS.
 */

import { it, vi, expect, describe } from "vitest";

import { Events } from "../../../../../../main/store/internal/actions.js";
import { onFilterSelectorVisibilityChanged } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-selector-visibility-changed.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters,
	createMockFilterStateSelectors
} from "./helpers.js";

describe("onFilterSelectorVisibilityChanged", () => {
	function buildMiddleware(selectorOverrides = {}) {
		const filterStateSelectors = createMockFilterStateSelectors(selectorOverrides);

		return {
			filterStateSelectors,
			middleware: onFilterSelectorVisibilityChanged
		};
	}

	it("passes through non-matching actions", () => {
		const { middleware } = buildMiddleware();
		const { invoke, next, dispatched } = createMiddlewareTest(middleware);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state is missing", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

		expect(dispatched).toHaveLength(0);
	});

	describe("when opening (visible: true)", () => {
		it("sets selectorOpen to true", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);
			const filterState = makeFilterState({
				filterSelectorOptions: {
					open: false,
					searchBar: { enabled: true, value: false },
					showSetFiltersOnly: { enabled: true, value: false },
					viewMode: "overlay"
				}
			});
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filterSelectorOptions.open).toBe(true);
		});

		it("does NOT revert filter options on open", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({
				filterId: "filter1",
				options: { criteria: "current" },
				appliedOptions: { criteria: "applied" }
			});
			const filterState = makeFilterState({
				filters: { filter1: filter },
				filterSelectorOptions: {
					open: false,
					searchBar: { enabled: true, value: false },
					showSetFiltersOnly: { enabled: true, value: false },
					viewMode: "overlay"
				}
			});
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].options).toEqual({ criteria: "current" });
		});

		it("dispatches exactly one setFilterState", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);
			store.getState.mockReturnValue(makeUiState(makeFilterState()));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			expect(dispatched).toHaveLength(1);
		});

		it("does not dispatch setQueryParameters (no refetch on open)", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);
			store.getState.mockReturnValue(makeUiState(makeFilterState()));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

			expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
		});
	});

	describe("when closing (visible: false)", () => {
		it("sets selectorOpen to false", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);
			const filterState = makeFilterState({
				filterSelectorOptions: {
					open: true,
					searchBar: { enabled: true, value: false },
					showSetFiltersOnly: { enabled: true, value: false },
					viewMode: "overlay"
				}
			});
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filterSelectorOptions.open).toBe(false);
		});

		it("reverts filterSelector-area filter options to appliedOptions on close", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const appliedOptions = { criteria: "applied" };
			const filter = makeFilterItemState({
				filterId: "filter1",
				options: { criteria: "unapplied" },
				appliedOptions
			});
			const filterState = makeFilterState({
				filters: { filter1: filter },
				filterSelectorOptions: {
					open: true,
					searchBar: { enabled: true, value: false },
					showSetFiltersOnly: { enabled: true, value: false },
					viewMode: "overlay"
				}
			});
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].options).toBe(appliedOptions);
		});

		it("does NOT revert filterBar-area filters on close", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const barFilter = makeFilterItemState({
				filterId: "barFilter",
				options: { criteria: "bar-current" },
				appliedOptions: { criteria: "bar-applied" },
				area: "filterBar"
			});
			const selectorFilter = makeFilterItemState({
				filterId: "selectorFilter",
				options: { criteria: "fs-unapplied" },
				appliedOptions: { criteria: "fs-applied" },
				area: "filterSelector"
			});
			const filterState = makeFilterState({ filters: { barFilter, selectorFilter } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["barFilter"].options).toEqual({ criteria: "bar-current" });
			expect(states[0].filters["selectorFilter"].options).toEqual({ criteria: "fs-applied" });
		});

		it("reverts staged queryOptions.invert.current to its applied value on close", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filterState = makeFilterState({
				queryOptions: {
					invert: {
						default: { enabled: true, value: false },
						current: { enabled: true, value: true },
						applied: { enabled: true, value: false }
					},
					joinOperator: {
						default: { enabled: true, value: "and" },
						current: { enabled: true, value: "and" },
						applied: { enabled: true, value: "and" }
					}
				},
				filterSelectorOptions: {
					open: true,
					searchBar: { enabled: true, value: false },
					showSetFiltersOnly: { enabled: true, value: false },
					viewMode: "overlay"
				}
			});
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].queryOptions.invert.current).toEqual({ enabled: true, value: false });
		});

		it("reverts staged queryOptions.joinOperator.current to its applied value on close", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filterState = makeFilterState({
				queryOptions: {
					invert: {
						default: { enabled: true, value: false },
						current: { enabled: true, value: false },
						applied: { enabled: true, value: false }
					},
					joinOperator: {
						default: { enabled: true, value: "and" },
						current: { enabled: true, value: "or" },
						applied: { enabled: true, value: "and" }
					}
				},
				filterSelectorOptions: {
					open: true,
					searchBar: { enabled: true, value: false },
					showSetFiltersOnly: { enabled: true, value: false },
					viewMode: "overlay"
				}
			});
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].queryOptions.joinOperator.current).toEqual({ enabled: true, value: "and" });
		});

		it("does not dispatch setQueryParameters (no refetch on close)", () => {
			const { middleware } = buildMiddleware();
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);
			store.getState.mockReturnValue(
				makeUiState(
					makeFilterState({
						filterSelectorOptions: {
							open: true,
							searchBar: { enabled: true, value: false },
							showSetFiltersOnly: { enabled: true, value: false },
							viewMode: "overlay"
						}
					})
				)
			);

			invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: false }));

			expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
		});
	});

	it("always calls next with the action", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const action = Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterSelectorVisibilityChanged({ visible: true }));

		expect(result).toBe(sentinelResult);
	});
});
