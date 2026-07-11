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
import { onFilterSelectorOptionsChanged } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-selector-options-changed.js";

import {
	makeUiState,
	makeFilterState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters
} from "./helpers.js";

describe("onFilterSelectorOptionsChanged", () => {
	it("passes through non-matching actions", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state is missing", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterSelectorOptionsChanged({ options: {} }));

		expect(dispatched).toHaveLength(0);
	});

	it("merges searchBar option into FS options", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(
			Events.NewFilter.onFilterSelectorOptionsChanged({
				options: { searchBar: { enabled: true, value: true } }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filterSelectorOptions.searchBar).toEqual({ enabled: true, value: true });
	});

	it("merges viewMode into FS options", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(
			Events.NewFilter.onFilterSelectorOptionsChanged({
				options: { viewMode: "docked" }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filterSelectorOptions.viewMode).toBe("docked");
	});

	it("preserves other options when partially updating", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		const filterState = makeFilterState({
			filterSelectorOptions: {
				open: false,
				searchBar: { enabled: true, value: false },
				showSetFiltersOnly: { enabled: true, value: false },
				viewMode: "overlay"
			}
		});
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(
			Events.NewFilter.onFilterSelectorOptionsChanged({
				options: { searchBar: { enabled: true, value: true } }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filterSelectorOptions.searchBar).toEqual({ enabled: true, value: true });
		expect(states[0].filterSelectorOptions.showSetFiltersOnly).toEqual({ enabled: true, value: false });
		expect(states[0].filterSelectorOptions.viewMode).toBe("overlay");
	});

	it("does NOT modify shared global invert/joinOperator (those live at the FilterState top level)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		const filterState = makeFilterState();
		const originalQueryOptions = filterState.queryOptions;
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(
			Events.NewFilter.onFilterSelectorOptionsChanged({
				options: { searchBar: { enabled: true, value: true } }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].queryOptions).toEqual(originalQueryOptions);
	});

	it("does NOT dispatch setQueryParameters (deferred to Apply All)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterSelectorOptionsChanged({ options: {} }));

		expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
	});

	it("dispatches setFilterState command", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterSelectorOptionsChanged({ options: {} }));

		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
	});

	it("always calls next with the action", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const action = Events.NewFilter.onFilterSelectorOptionsChanged({ options: {} });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterSelectorOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterSelectorOptionsChanged({ options: {} }));

		expect(result).toBe(sentinelResult);
	});
});
