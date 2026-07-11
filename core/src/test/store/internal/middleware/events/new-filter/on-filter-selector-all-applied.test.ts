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

import { Events, Commands } from "../../../../../../main/store/internal/actions.js";
import { createOnSelectorApplyAll } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-selector-all-applied.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters,
	createMockFilterStateSelectors
} from "./helpers.js";

describe("createOnSelectorApplyAll [REFETCH]", () => {
	function buildMiddleware(selectorOverrides = {}) {
		const filterStateSelectors = createMockFilterStateSelectors(selectorOverrides);

		return {
			filterStateSelectors,
			middleware: createOnSelectorApplyAll({ filterStateSelectors })
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

		invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		expect(dispatched).toHaveLength(0);
	});

	it("sets appliedOptions on filterSelector-area filters", () => {
		const selectorFilters = createMockFilterStateSelectors({});
		const { middleware } = { middleware: createOnSelectorApplyAll({ filterStateSelectors: selectorFilters }) };
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "current" } });
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].appliedOptions).toEqual({ criteria: "current" });
	});

	it("does NOT set appliedOptions on filterBar-area filters", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const originalApplied = { criteria: "original-applied" };
		const barFilter = makeFilterItemState({
			filterId: "barFilter",
			options: { criteria: "bar" },
			appliedOptions: originalApplied,
			area: "filterBar"
		});
		const selectorFilter = makeFilterItemState({
			filterId: "selectorFilter",
			options: { criteria: "fs" },
			area: "filterSelector"
		});
		const filterState = makeFilterState({ filters: { barFilter, selectorFilter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["barFilter"].appliedOptions).toEqual(originalApplied);
		expect(states[0].filters["selectorFilter"].appliedOptions).toEqual({ criteria: "fs" });
	});

	it("updates the snapshot in the dispatched state", () => {
		const { middleware } = buildMiddleware({
			toEffectiveOptions: vi.fn((_m: object, opts: object) => opts)
		});
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "val" } });
		const filterState = makeFilterState({ filters: { filter1: filter }, snapshot: "old-snapshot" });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		const states = getDispatchedFilterStates(dispatched);
		expect(typeof states[0].snapshot).toBe("string");
		expect(states[0].snapshot.length).toBeGreaterThan(0);
	});

	it("[REFETCH] dispatches setQueryParameters", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		const queryParams = getDispatchedQueryParameters(dispatched);
		expect(queryParams).toHaveLength(1);
	});

	it("[REFETCH] resets pagination when current page is non-zero", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue({
			...makeUiState(makeFilterState()),
			pagination: { pageNumber: 5, pageSize: 20 }
		} as ReturnType<typeof makeUiState>);

		invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		const queryParamAction = dispatched.find((action) =>
			Commands.setQueryParameters.match(action as Parameters<typeof Commands.setQueryParameters.match>[0])
		) as ReturnType<typeof Commands.setQueryParameters>;

		expect(queryParamAction.payload.pagination?.pageNumber).toBe(0);
	});

	it("dispatches setFilterState before setQueryParameters", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		expect(dispatched).toHaveLength(2);
		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
		expect(
			Commands.setQueryParameters.match(dispatched[1] as Parameters<typeof Commands.setQueryParameters.match>[0])
		).toBe(true);
	});

	it("always calls next with the action", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const action = Events.NewFilter.onFilterSelectorAllApplied(undefined);

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterSelectorAllApplied(undefined));

		expect(result).toBe(sentinelResult);
	});
});
