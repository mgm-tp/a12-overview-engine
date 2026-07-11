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
import { createOnSingleFilterReset } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-item-reset.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters,
	createMockFilterStateSelectors
} from "./helpers.js";

describe("createOnSingleFilterReset", () => {
	function buildMiddleware(selectorOverrides = {}) {
		const filterStateSelectors = createMockFilterStateSelectors(selectorOverrides);

		return {
			filterStateSelectors,
			middleware: createOnSingleFilterReset({ filterStateSelectors })
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

		invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

		expect(dispatched).toHaveLength(0);
	});

	describe("when no editing is active (FS in-place reset)", () => {
		it("resets the filter options via filterStateSelectors.toResetOptions()", () => {
			const resetOptions = { criteria: "" };
			const { middleware } = buildMiddleware({
				toResetOptions: vi.fn(() => resetOptions)
			});
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "set-value" } });
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter: null });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].options).toBe(resetOptions);
		});

		it("increments resetCounter on the filter", () => {
			const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1", resetCounter: 2 });
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter: null });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].resetCounter).toBe(3);
		});

		it("does not modify other filters", () => {
			const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter1 = makeFilterItemState({ filterId: "filter1", options: { criteria: "set" } });
			const filter2 = makeFilterItemState({ filterId: "filter2", options: { criteria: "untouched" } });
			const filterState = makeFilterState({ filters: { filter1, filter2 }, editingFilter: null });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter2"].options).toEqual({ criteria: "untouched" });
		});

		it("does not dispatch setQueryParameters (deferred to Apply All)", () => {
			const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1" });
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter: null });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
		});

		it("calls filterStateSelectors.toResetOptions with the filter state", () => {
			const mockReset = vi.fn(() => ({}));
			const { middleware } = buildMiddleware({ toResetOptions: mockReset });
			const { store, invoke } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "val" } });
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter: null });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({ options: { criteria: "val" } }));
		});
	});

	describe("when editing is active (FB dropdown open)", () => {
		it("resets the editingFilter options instead of the main filter", () => {
			const resetOptions = { criteria: "" };
			const { middleware } = buildMiddleware({
				toResetOptions: vi.fn(() => resetOptions)
			});
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "main" } });
			const editingFilter = { filterId: "filter1", options: { criteria: "editing" }, resetCounter: 0 };
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].editingFilter?.options).toBe(resetOptions);
		});

		it("increments editingFilter.resetCounter", () => {
			const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1" });
			const editingFilter = { filterId: "filter1", options: {}, resetCounter: 1 };
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].editingFilter?.resetCounter).toBe(2);
		});

		it("does not modify the main filter options when editing is active", () => {
			const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({ criteria: "" })) });
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "main" } });
			const editingFilter = { filterId: "filter1", options: { criteria: "editing" }, resetCounter: 0 };
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].options).toEqual({ criteria: "main" });
		});

		it("does not dispatch setQueryParameters when editing is active", () => {
			const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({ filterId: "filter1" });
			const editingFilter = { filterId: "filter1", options: {}, resetCounter: 0 };
			const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

			expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
		});
	});

	it("always calls next with the action", () => {
		const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
		const { store, invoke, next } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const action = Events.NewFilter.onFilterItemReset({ filterId: "filter1" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { middleware } = buildMiddleware({ toResetOptions: vi.fn(() => ({})) });
		const { store, invoke, next } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterItemReset({ filterId: "filter1" }));

		expect(result).toBe(sentinelResult);
	});
});
