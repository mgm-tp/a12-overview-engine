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
import { createOnFilterSelectorReset } from "../../../../../../main/store/internal/middleware/events/new-filter/on-reset-filter-selector.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters,
	createMockFilterStateSelectors
} from "./helpers.js";

describe("createOnFilterSelectorReset [REFETCH]", () => {
	function buildMiddleware(selectorOverrides = {}) {
		const filterStateSelectors = createMockFilterStateSelectors(selectorOverrides);

		return {
			filterStateSelectors,
			middleware: createOnFilterSelectorReset({ filterStateSelectors })
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

		invoke(Events.NewFilter.onFilterSelectorReset());

		expect(dispatched).toHaveLength(0);
	});

	it("resets ALL filters in both surfaces", () => {
		const resetOptions = { criteria: "" };
		const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => resetOptions) });
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const filter1 = makeFilterItemState({ filterId: "filter1", options: { criteria: "set1" } });
		const filter2 = makeFilterItemState({
			filterId: "filter2",
			options: { criteria: "set2" },
			model: { id: "filter2", type: "string", preferFilterBar: true } as ReturnType<typeof makeFilterItemState>["model"]
		});
		const filterState = makeFilterState({ filters: { filter1, filter2 } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorReset());

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].options).toBe(resetOptions);
		expect(states[0].filters["filter2"].options).toBe(resetOptions);
	});

	it("sets appliedOptions to resetOptions for ALL filters", () => {
		const resetOptions = { criteria: "" };
		const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => resetOptions) });
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const filter1 = makeFilterItemState({ filterId: "filter1", options: { criteria: "set" } });
		const filter2 = makeFilterItemState({ filterId: "filter2", options: { criteria: "also-set" } });
		const filterState = makeFilterState({ filters: { filter1, filter2 } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorReset());

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].appliedOptions).toBe(resetOptions);
		expect(states[0].filters["filter2"].appliedOptions).toBe(resetOptions);
	});

	it("increments resetCounter on ALL filters", () => {
		const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const filter1 = makeFilterItemState({ filterId: "filter1", resetCounter: 2 });
		const filter2 = makeFilterItemState({ filterId: "filter2", resetCounter: 0 });
		const filterState = makeFilterState({ filters: { filter1, filter2 } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorReset());

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].resetCounter).toBe(3);
		expect(states[0].filters["filter2"].resetCounter).toBe(1);
	});

	it("updates the snapshot so the Apply button becomes disabled", () => {
		const { middleware } = buildMiddleware({
			toResetOptions: vi.fn(() => ({})),
			toEffectiveOptions: vi.fn((_m: object, opts: object) => opts)
		});
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "set" } });
		const filterState = makeFilterState({ filters: { filter1: filter }, snapshot: "old-snapshot" });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorReset());

		const states = getDispatchedFilterStates(dispatched);
		expect(typeof states[0].snapshot).toBe("string");
		expect(states[0].snapshot).not.toBe("old-snapshot");
	});

	it("resets the shared invert and joinOperator current + applied to their modeled defaults", () => {
		const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);

		const filterState = makeFilterState({
			queryOptions: {
				invert: {
					default: { enabled: true, value: false },
					current: { enabled: true, value: true },
					applied: { enabled: true, value: true }
				},
				joinOperator: {
					default: { enabled: true, value: "and" },
					current: { enabled: true, value: "or" },
					applied: { enabled: true, value: "or" }
				}
			}
		});
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorReset());

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].queryOptions.invert.current).toEqual({ enabled: true, value: false });
		expect(states[0].queryOptions.invert.applied).toEqual({ enabled: true, value: false });
		expect(states[0].queryOptions.joinOperator.current).toEqual({ enabled: true, value: "and" });
		expect(states[0].queryOptions.joinOperator.applied).toEqual({ enabled: true, value: "and" });
	});

	it("[REFETCH] dispatches setQueryParameters", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterSelectorReset());

		const queryParams = getDispatchedQueryParameters(dispatched);
		expect(queryParams).toHaveLength(1);
	});

	it("[REFETCH] resets pagination when current page is non-zero", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue({
			...makeUiState(makeFilterState()),
			pagination: { pageNumber: 2, pageSize: 25 }
		} as ReturnType<typeof makeUiState>);

		invoke(Events.NewFilter.onFilterSelectorReset());

		const queryParamAction = dispatched.find((action) =>
			Commands.setQueryParameters.match(action as Parameters<typeof Commands.setQueryParameters.match>[0])
		) as ReturnType<typeof Commands.setQueryParameters>;

		expect(queryParamAction.payload.pagination?.pageNumber).toBe(0);
	});

	it("dispatches setFilterState before setQueryParameters", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterSelectorReset());

		expect(dispatched).toHaveLength(2);
		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
		expect(
			Commands.setQueryParameters.match(dispatched[1] as Parameters<typeof Commands.setQueryParameters.match>[0])
		).toBe(true);
	});

	it("handles empty filters map without errors", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filterState = makeFilterState({ filters: {} });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterSelectorReset());

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters).toEqual({});
	});

	it("always calls next with the action", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const action = Events.NewFilter.onFilterSelectorReset();

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterSelectorReset());

		expect(result).toBe(sentinelResult);
	});
});
