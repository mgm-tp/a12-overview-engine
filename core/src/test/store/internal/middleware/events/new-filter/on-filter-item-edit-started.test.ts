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
import { onFilterItemEditStarted } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-item-edit-started.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters
} from "./helpers.js";

describe("onFilterItemEditStarted", () => {
	it("passes through non-matching actions", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state (newFilter) is missing", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" }));

		expect(dispatched).toHaveLength(0);
	});

	it("creates an isolated editing copy with the filter's current options", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		const filterOptions = { criteria: "hello" };
		const filter = makeFilterItemState({ filterId: "filter1", options: filterOptions });
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states).toHaveLength(1);
		expect(states[0].editingFilter).toEqual({
			filterId: "filter1",
			options: filterOptions,
			resetCounter: 0
		});
	});

	it("dispatches setFilterState with editingFilter set", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		const filter = makeFilterItemState({ filterId: "myFilter", options: { value: 42 } });
		const filterState = makeFilterState({ filters: { myFilter: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "myFilter" }));

		expect(dispatched).toHaveLength(1);
		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
	});

	it("preserves existing filter state fields when setting editingFilter", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "x" } });
		const filterState = makeFilterState({
			filters: { filter1: filter },
			filterSelectorOptions: {
				open: true,
				searchBar: { enabled: true, value: false },
				showSetFiltersOnly: { enabled: true, value: false },
				viewMode: "overlay"
			},
			snapshot: "abc"
		});
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filterSelectorOptions.open).toBe(true);
		expect(states[0].snapshot).toBe("abc");
	});

	it("does not dispatch setQueryParameters (no refetch)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" }));

		expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
	});

	it("always calls next with the action", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemEditStarted);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const action = Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("initializes resetCounter to 0 in editing copy", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		const filter = makeFilterItemState({ filterId: "filter1", resetCounter: 5 });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].editingFilter?.resetCounter).toBe(0);
	});

	it("uses the filter's current options (not initialOptions) for the editing copy", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemEditStarted);
		const currentOptions = { criteria: "current" };
		const initialOptions = { criteria: "default" };
		const filter = makeFilterItemState({ filterId: "filter1", options: currentOptions, initialOptions });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].editingFilter?.options).toBe(currentOptions);
	});

	it("returns the result of next(action)", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemEditStarted);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterItemEditStarted({ filterId: "filter1" }));

		expect(result).toBe(sentinelResult);
	});
});
