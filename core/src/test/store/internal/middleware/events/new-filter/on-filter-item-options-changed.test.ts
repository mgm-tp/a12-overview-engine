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
import { onFilterItemOptionsChanged } from "../../../../../../main/store/internal/middleware/events/new-filter/on-filter-item-options-changed.js";

import {
	makeUiState,
	makeFilterState,
	makeFilterItemState,
	createMiddlewareTest,
	getDispatchedFilterOptions,
	getDispatchedQueryParameters
} from "./helpers.js";

describe("onFilterItemOptionsChanged", () => {
	it("passes through non-matching actions", () => {
		const { invoke, next, dispatched } = createMiddlewareTest(onFilterItemOptionsChanged);
		const action = Events.onSearched({ searchString: "test" });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(dispatched).toHaveLength(0);
	});

	it("returns early when filter state is missing", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemOptionsChanged);
		store.getState.mockReturnValue(makeUiState(undefined));

		invoke(Events.NewFilter.onFilterItemOptionsChanged({ filterId: "filter1", options: { criteria: "x" } }));

		expect(dispatched).toHaveLength(0);
	});

	it("dispatches setFilterOptions with the action's filterId + options", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemOptionsChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterItemOptionsChanged({ filterId: "filter1", options: { criteria: "new" } }));

		expect(
			Commands.setFilterOptions.match(dispatched[0] as Parameters<typeof Commands.setFilterOptions.match>[0])
		).toBe(true);

		const payloads = getDispatchedFilterOptions(dispatched);
		expect(payloads).toEqual([{ filterId: "filter1", options: { criteria: "new" } }]);
	});

	it("forwards the same payload regardless of whether editing is active", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemOptionsChanged);
		const filter = makeFilterItemState({ filterId: "filter1", options: { criteria: "main" } });
		const editingFilter = { filterId: "filter1", options: { criteria: "editing" }, resetCounter: 0 };
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter }, editingFilter })));

		invoke(Events.NewFilter.onFilterItemOptionsChanged({ filterId: "filter1", options: { criteria: "typed" } }));

		expect(getDispatchedFilterOptions(dispatched)).toEqual([{ filterId: "filter1", options: { criteria: "typed" } }]);
	});

	it("does not dispatch setQueryParameters (no refetch)", () => {
		const { store, invoke, dispatched } = createMiddlewareTest(onFilterItemOptionsChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));

		invoke(Events.NewFilter.onFilterItemOptionsChanged({ filterId: "filter1", options: {} }));

		expect(getDispatchedQueryParameters(dispatched)).toHaveLength(0);
	});

	it("always calls next with the action", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemOptionsChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const action = Events.NewFilter.onFilterItemOptionsChanged({ filterId: "filter1", options: {} });

		invoke(action);

		expect(next).toHaveBeenCalledWith(action);
	});

	it("returns the result of next(action)", () => {
		const { store, invoke, next } = createMiddlewareTest(onFilterItemOptionsChanged);
		const filter = makeFilterItemState({ filterId: "filter1" });
		store.getState.mockReturnValue(makeUiState(makeFilterState({ filters: { filter1: filter } })));
		const sentinelResult = Symbol("result");
		vi.mocked(next).mockReturnValue(sentinelResult);

		const result = invoke(Events.NewFilter.onFilterItemOptionsChanged({ filterId: "filter1", options: {} }));

		expect(result).toBe(sentinelResult);
	});
});
