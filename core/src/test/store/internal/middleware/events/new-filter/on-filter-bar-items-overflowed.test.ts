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
import { createOnFilterBarItemsOverflowed } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-bar-items-overflowed.js";
import { UiStateSelector } from "../../../../../../main/store/internal/selectors/ui-state.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters,
	createMockFilterStateSelectors
} from "./helpers.js";

describe("createOnFilterBarItemsOverflowed", () => {
	function buildMiddleware(selectorOverrides = {}) {
		const filterStateSelectors = createMockFilterStateSelectors(selectorOverrides);

		return {
			filterStateSelectors,
			middleware: createOnFilterBarItemsOverflowed({ filterStateSelectors })
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

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["filter1"] }));

		expect(dispatched).toHaveLength(0);
	});

	it('sets area="filterSelector" for filters in the hidden list', () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1", area: "filterBar" });
		(filter.model as { preferFilterBar: boolean }).preferFilterBar = true;
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["filter1"] }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].area).toBe("filterSelector");
	});

	it('sets area="filterBar" for filters NOT in the hidden list', () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1", area: "filterSelector" });
		(filter.model as { preferFilterBar: boolean }).preferFilterBar = true;
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].area).toBe("filterBar");
	});

	it("reverts filter options to appliedOptions when a filter moves from FS back to bar", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const appliedOptions = { criteria: "applied" };
		const filter = makeFilterItemState({
			filterId: "filter1",
			area: "filterSelector",
			options: { criteria: "unapplied" },
			appliedOptions
		});
		(filter.model as { preferFilterBar: boolean }).preferFilterBar = true;
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].options).toBe(appliedOptions);
	});

	it("does NOT revert options for filters staying in the bar", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const currentOptions = { criteria: "current" };
		const filter = makeFilterItemState({
			filterId: "filter1",
			area: "filterBar",
			options: currentOptions,
			appliedOptions: { criteria: "applied" }
		});
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].options).toBe(currentOptions);
	});

	it("clears editingFilter when the edited filter overflows to FS", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1", area: "filterBar" });
		const editingFilter = { filterId: "filter1", options: { criteria: "editing" }, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1: filter }, editingFilter });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["filter1"] }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].editingFilter).toBeNull();
	});

	it("preserves editingFilter when the edited filter is still in the bar", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filter1 = makeFilterItemState({ filterId: "filter1", area: "filterBar" });
		const filter2 = makeFilterItemState({ filterId: "filter2", area: "filterBar" });
		const existingEditing = { filterId: "filter1", options: { criteria: "editing" }, resetCounter: 0 };
		const filterState = makeFilterState({ filters: { filter1, filter2 }, editingFilter: existingEditing });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["filter2"] }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].editingFilter).toEqual(existingEditing);
	});

	it("handles empty filterIds (no overflowing filters)", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1", area: "filterBar" });
		const filterState = makeFilterState({ filters: { filter1: filter } });
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filters["filter1"].area).toBe("filterBar");
	});

	it("does not dispatch setQueryParameters (UI-only, no refetch)", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["filter1"] }));

		expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
	});

	it("dispatches setFilterState command", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, dispatched } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
	});

	it("always calls next with the action", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const action = Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { middleware } = buildMiddleware();
		const { store, invoke, next } = createMiddlewareTest(middleware);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

		expect(result).toBe(sentinelResult);
	});

	describe("snapshot recompute on FS-area membership change", () => {
		it("recomputes snapshot reflecting new FS-area set when bar filter overflows into FS", () => {
			const { middleware, filterStateSelectors } = buildMiddleware({
				toEffectiveOptions: vi.fn((_m: object, opts: object) => opts)
			});
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const committedOptions = { criteria: "committed" };
			const barFilter = makeFilterItemState({
				filterId: "barA",
				area: "filterBar",
				options: committedOptions,
				appliedOptions: committedOptions
			});
			(barFilter.model as { preferFilterBar: boolean }).preferFilterBar = true;
			const filterState = makeFilterState({ filters: { barA: barFilter }, snapshot: "stale" });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["barA"] }));

			const states = getDispatchedFilterStates(dispatched);
			const newSnapshot = states[0].snapshot;
			expect(newSnapshot).not.toBe("stale");

			const expected = UiStateSelector.NewFilter.computeFiltersSnapshot(
				states[0].filters,
				states[0].queryOptions,
				filterStateSelectors
			);
			expect(newSnapshot).toBe(expected);
		});

		it("recomputes snapshot when filter moves FS→bar (membership shrinks)", () => {
			const { middleware, filterStateSelectors } = buildMiddleware({
				toEffectiveOptions: vi.fn((_m: object, opts: object) => opts)
			});
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const appliedOptions = { criteria: "applied" };
			const overflowedFilter = makeFilterItemState({
				filterId: "B",
				area: "filterSelector",
				options: appliedOptions,
				appliedOptions
			});
			(overflowedFilter.model as { preferFilterBar: boolean }).preferFilterBar = true;
			const filterState = makeFilterState({ filters: { B: overflowedFilter }, snapshot: "stale" });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

			const states = getDispatchedFilterStates(dispatched);
			const newSnapshot = states[0].snapshot;
			const expected = UiStateSelector.NewFilter.computeFiltersSnapshot(
				states[0].filters,
				states[0].queryOptions,
				filterStateSelectors
			);
			expect(newSnapshot).toBe(expected);
		});

		it("snapshot recompute uses the post-update filter map (area already flipped)", () => {
			const { middleware, filterStateSelectors } = buildMiddleware({
				toEffectiveOptions: vi.fn((_m: object, opts: object) => opts)
			});
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({
				filterId: "C",
				area: "filterBar",
				options: { criteria: "v" },
				appliedOptions: { criteria: "v" }
			});
			(filter.model as { preferFilterBar: boolean }).preferFilterBar = true;
			const filterState = makeFilterState({ filters: { C: filter } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: ["C"] }));

			const states = getDispatchedFilterStates(dispatched);
			const expected = UiStateSelector.NewFilter.computeFiltersSnapshot(
				states[0].filters,
				states[0].queryOptions,
				filterStateSelectors
			);
			expect(states[0].snapshot).toBe(expected);
		});

		it("snapshot is deterministic across no-op invocations (idempotent)", () => {
			const { middleware } = buildMiddleware({
				toEffectiveOptions: vi.fn((_m: object, opts: object) => opts)
			});
			const { store, invoke, dispatched } = createMiddlewareTest(middleware);

			const filter = makeFilterItemState({
				filterId: "D",
				area: "filterBar",
				options: { criteria: "v" },
				appliedOptions: { criteria: "v" }
			});
			(filter.model as { preferFilterBar: boolean }).preferFilterBar = true;
			const filterState = makeFilterState({ filters: { D: filter } });
			store.getState.mockReturnValue(makeUiState(filterState));

			invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));
			invoke(Events.NewFilter.onFilterBarItemsOverflowed({ filterIds: [] }));

			const states = getDispatchedFilterStates(dispatched);
			expect(states[0].snapshot).toBe(states[1].snapshot);
		});
	});
});
