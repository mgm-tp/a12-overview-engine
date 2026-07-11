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
import { onFilterCollapsedChanged } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-collapsed-changed.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters
} from "./helpers.js";

describe("onFilterCollapsedChanged", () => {
	it("passes through non-matching actions", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state is missing", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true }));

		expect(dispatched).toHaveLength(0);
	});

	describe("when filterId is provided (single filter toggle)", () => {
		it("collapses a single filter by id", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const filter = makeFilterItemState({ filterId: "filter1", collapsed: false });
			const filterState = makeFilterState({ filters: { filter1: filter } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].collapsed).toBe(true);
		});

		it("expands a single filter by id", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const filter = makeFilterItemState({ filterId: "filter1", collapsed: true });
			const filterState = makeFilterState({ filters: { filter1: filter } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: false }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].collapsed).toBe(false);
		});

		it("does not modify other filters", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const filter1 = makeFilterItemState({ filterId: "filter1", collapsed: false });
			const filter2 = makeFilterItemState({ filterId: "filter2", collapsed: false });
			const filterState = makeFilterState({ filters: { filter1, filter2 } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter2"].collapsed).toBe(false);
		});
	});

	describe("when filterId is null (collapse/expand all)", () => {
		it("collapses all filters when filterId is null and collapsed is true", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const filter1 = makeFilterItemState({ filterId: "filter1", collapsed: false });
			const filter2 = makeFilterItemState({ filterId: "filter2", collapsed: false });
			const filter3 = makeFilterItemState({ filterId: "filter3", collapsed: false });
			const filterState = makeFilterState({ filters: { filter1, filter2, filter3 } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: null, collapsed: true }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].collapsed).toBe(true);
			expect(states[0].filters["filter2"].collapsed).toBe(true);
			expect(states[0].filters["filter3"].collapsed).toBe(true);
		});

		it("expands all filters when filterId is null and collapsed is false", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const filter1 = makeFilterItemState({ filterId: "filter1", collapsed: true });
			const filter2 = makeFilterItemState({ filterId: "filter2", collapsed: true });
			const filterState = makeFilterState({ filters: { filter1, filter2 } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: null, collapsed: false }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["filter1"].collapsed).toBe(false);
			expect(states[0].filters["filter2"].collapsed).toBe(false);
		});

		it("handles empty filters map gracefully", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const filterState = makeFilterState({ filters: {} });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: null, collapsed: true }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters).toEqual({});
		});

		it("does not collapse Filter Bar filters when toggling all", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const fsFilter = makeFilterItemState({ filterId: "fs1", area: "filterSelector", collapsed: false });
			const barFilter = makeFilterItemState({ filterId: "bar1", area: "filterBar", collapsed: false });
			store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { fs1: fsFilter, bar1: barFilter } })));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: null, collapsed: true }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].filters["fs1"].collapsed).toBe(true);
			expect(states[0].filters["bar1"].collapsed).toBe(false);
		});
	});

	describe("when filterId targets a Filter Bar filter", () => {
		it("ignores the event without dispatching", () => {
			const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
			const barFilter = makeFilterItemState({ filterId: "bar1", area: "filterBar", collapsed: false });
			store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { bar1: barFilter } })));

			invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "bar1", collapsed: true }));

			expect(dispatched).toHaveLength(0);
		});
	});

	it("dispatches setFilterState command", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true }));

		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
	});

	it("does not dispatch setQueryParameters (UI-only, no refetch)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true }));

		expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
	});

	it("preserves other filter properties when toggling collapsed", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterCollapsedChanged);
		const filter = makeFilterItemState({
			filterId: "filter1",
			collapsed: false,
			options: { criteria: "preserved" },
			resetCounter: 5
		});
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].options).toEqual({ criteria: "preserved" });
		expect(states[0].filters["filter1"].resetCounter).toBe(5);
	});

	it("always calls next with the action", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterCollapsedChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const action = Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterCollapsedChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterCollapsedChanged({ filterId: "filter1", collapsed: true }));

		expect(result).toBe(sentinelResult);
	});
});
