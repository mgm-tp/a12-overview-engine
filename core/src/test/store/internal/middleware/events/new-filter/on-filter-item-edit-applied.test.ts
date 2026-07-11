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
import { onFilterItemEditApplied } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-item-edit-applied.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters
} from "./helpers.js";

describe("onFilterItemEditApplied [REFETCH]", () => {
	it("passes through non-matching actions", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state is missing", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		expect(dispatched).toHaveLength(0);
	});

	it("returns early when editingFilter is null (no dropdown open)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filterState = makeFilterState({ editingFilter: null });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		expect(dispatched).toHaveLength(0);
	});

	it("merges editing options into the filter's main options", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "old", extra: "keep" } });
		const editingOptions = { criteria: "new" };
		const editingFilter = { filterId: "filter1", options: editingOptions, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		const states = getDispatchedFilterStates(dispatched);
		expect(states).toHaveLength(1);
		expect(states[0].filters["filter1"].options).toEqual({ criteria: "new", extra: "keep" });
	});

	it("merges editing options into appliedOptions so overflow→bar revert preserves committed value", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({
			filterId: "filter1",
			options: { criteria: "old", extra: "keep" },
			appliedOptions: { criteria: "old", extra: "keep" }
		});
		const editingFilter = { filterId: "filter1", options: { criteria: "new" }, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].appliedOptions).toEqual({ criteria: "new", extra: "keep" });
	});

	it("clears editingFilter after applying (sets it to null)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const editingFilter = { filterId: "filter1", options: { criteria: "x" }, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].editingFilter).toBeNull();
	});

	it("[REFETCH] dispatches setQueryParameters", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const editingFilter = { filterId: "filter1", options: {}, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		const queryParams = getDispatchedQueryParameters(dispatched);
		expect(queryParams).toHaveLength(1);
	});

	it("[REFETCH] resets pagination to page 0 when current page is non-zero", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const editingFilter = { filterId: "filter1", options: {}, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
		store.getState.mockReturnValue({
			...makeUiState(filterState),
			pagination: { pageNumber: 3, pageSize: 10 }
		} as ReturnType<typeof makeUiState>);

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		const queryParamAction = dispatched.find((action) =>
			Commands.setQueryParameters.match(action as Parameters<typeof Commands.setQueryParameters.match>[0])
		) as ReturnType<typeof Commands.setQueryParameters>;

		expect(queryParamAction.payload.pagination?.pageNumber).toBe(0);
	});

	it("dispatches both setFilterState and setQueryParameters in correct order", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const editingFilter = { filterId: "filter1", options: {}, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		expect(dispatched).toHaveLength(2);
		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
		expect(
			Commands.setQueryParameters.match(dispatched[1] as Parameters<typeof Commands.setQueryParameters.match>[0])
		).toBe(true);
	});

	it("does not modify other filters when applying", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditApplied);
		const filter1 = makeFilterItemState({ filterId: "filter1", options: { criteria: "old" } });
		const filter2 = makeFilterItemState({ filterId: "filter2", options: { criteria: "untouched" } });
		const editingFilter = { filterId: "filter1", options: { criteria: "new" }, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1, filter2 }, editingFilter });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter2"].options).toEqual({ criteria: "untouched" });
	});

	it("always calls next with the action", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const editingFilter = { filterId: "filter1", options: {}, resetCounter: 0 };
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter }, editingFilter })));
		const action = Events.NewFilter.onFilterItemEditApplied(undefined);

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemEditApplied);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const editingFilter = { filterId: "filter1", options: {}, resetCounter: 0 };
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter }, editingFilter })));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterItemEditApplied(undefined));

		expect(result).toBe(sentinelResult);
	});
});
