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
import { onFilterItemEditCanceled } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-item-edit-canceled.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters
} from "./helpers.js";

describe("onFilterItemEditCanceled", () => {
	it("passes through non-matching actions", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onFilterItemEditCanceled);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state is missing", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditCanceled);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterItemEditCanceled({}));

		expect(dispatched).toHaveLength(0);
	});

	it("clears editingFilter by setting it to null", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditCanceled);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const filterState = makeFilterState({
			filters: { filter1: filter },
			editingFilter: { filterId: "filter1", options: { criteria: "typed" }, resetCounter: 0 }
		});
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditCanceled({}));

		const states = getDispatchedFilterStates(dispatched);
		expect(states).toHaveLength(1);
		expect(states[0].editingFilter).toBeNull();
	});

	it("dispatches setFilterState command", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditCanceled);
		const filterState = makeFilterState({ editingFilter: null });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditCanceled({}));

		expect(dispatched).toHaveLength(1);
		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
	});

	it("preserves other filter state fields (filters, options, snapshot)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditCanceled);
		const filter = makeFilterItemState({ filterId: "filter1" });
		const filterState = makeFilterState({
			filters: { filter1: filter },
			snapshot: "snap123",
			filterSelectorOptions: {
				open: true,
				searchBar: { enabled: true, value: false },
				showSetFiltersOnly: { enabled: true, value: false },
				viewMode: "overlay"
			},
			editingFilter: { filterId: "filter1", options: {}, resetCounter: 0 }
		});
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditCanceled({}));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters).toEqual({ filter1: filter });
		expect(states[0].snapshot).toBe("snap123");
		expect(states[0].filterSelectorOptions.open).toBe(true);
	});

	it("does not dispatch setQueryParameters (no refetch)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditCanceled);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterItemEditCanceled({}));

		expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
	});

	it("works when editingFilter is already null (idempotent)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditCanceled);
		const filterState = makeFilterState({ editingFilter: null });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditCanceled({}));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].editingFilter).toBeNull();
	});

	it("always calls next with the action", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemEditCanceled);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const action = Events.NewFilter.onFilterItemEditCanceled({});

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemEditCanceled);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterItemEditCanceled({}));

		expect(result).toBe(sentinelResult);
	});
});
