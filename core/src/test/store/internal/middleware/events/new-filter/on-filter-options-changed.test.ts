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
import { onFilterOptionsChanged } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-options-changed.js";

import {
	makeUiState,
	makeFilterState,
	createMiddlewareTest,
	getDispatchedFilterStates,
	getDispatchedQueryParameters
} from "./helpers.js";

describe("onFilterOptionsChanged [STAGED]", () => {
	it("passes through non-matching actions", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state is missing", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterOptionsChanged({ invert: { enabled: true, value: true } }));

		expect(dispatched).toHaveLength(0);
	});

	it("stages joinOperator.current at the FilterState top level", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		const filterState = makeFilterState();
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(
			Events.NewFilter.onFilterOptionsChanged({
				joinOperator: { enabled: true, value: "or" }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].queryOptions.joinOperator.current).toEqual({ enabled: true, value: "or" });
	});

	it("stages invert.current at the FilterState top level", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		const filterState = makeFilterState();
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(
			Events.NewFilter.onFilterOptionsChanged({
				invert: { enabled: true, value: true }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].queryOptions.invert.current).toEqual({ enabled: true, value: true });
	});

	it("preserves the other field when only one is updated", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		const filterState = makeFilterState();
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(
			Events.NewFilter.onFilterOptionsChanged({
				joinOperator: { enabled: true, value: "or" }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].queryOptions.invert.current).toEqual({ enabled: true, value: false });
		expect(states[0].queryOptions.joinOperator.current).toEqual({ enabled: true, value: "or" });
	});

	it("does not modify filterSelectorOptions (panel-local state)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		const filterState = makeFilterState();
		const originalOptions = filterState.filterSelectorOptions;
		store.getState.mockReturnValue(makeUiState(filterState));

		invoke(
			Events.NewFilter.onFilterOptionsChanged({
				invert: { enabled: true, value: true }
			})
		);

		const states = getDispatchedFilterStates(dispatched);
		expect(states[0].filterSelectorOptions).toEqual(originalOptions);
	});

	it("[STAGED] does NOT dispatch setQueryParameters (change waits for Apply all)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterOptionsChanged({ invert: { enabled: true, value: true } }));

		const queryParams = getDispatchedQueryParameters(dispatched);
		expect(queryParams).toHaveLength(0);
	});

	it("[STAGED] dispatches only setFilterState when something changes", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterOptionsChanged({ invert: { enabled: true, value: true } }));

		expect(dispatched).toHaveLength(1);
		expect(Commands.setFilterState.match(dispatched[0] as Parameters<typeof Commands.setFilterState.match>[0])).toBe(
			true
		);
	});

	it("no-ops when payload has neither invert nor joinOperator", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));

		invoke(Events.NewFilter.onFilterOptionsChanged({}));

		expect(dispatched).toHaveLength(0);
	});

	it("always calls next with the action", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const action = Events.NewFilter.onFilterOptionsChanged({ invert: { enabled: true, value: true } });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterOptionsChanged);
		store.getState.mockReturnValue(makeUiState(makeFilterState()));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterOptionsChanged({ invert: { enabled: true, value: true } }));

		expect(result).toBe(sentinelResult);
	});
});
