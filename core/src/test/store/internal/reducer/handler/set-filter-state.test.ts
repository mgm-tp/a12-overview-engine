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

import { it, expect, describe } from "vitest";

import { Commands } from "../../../../../main/store/internal/actions.js";
import { handleSetFilterState } from "../../../../../main/store/internal/reducer/handler/set-filter-state.js";

import { makeUiState, makeFilterState } from "../../middleware/events/new-filter/helpers.js";

describe("handleSetFilterState", () => {
	it("seeds newFilter slice when previously undefined (set = override semantics)", () => {
		const state = makeUiState(undefined);
		const seed = makeFilterState();
		const action = Commands.setFilterState({ state: seed });

		const result = handleSetFilterState(state, action);

		expect(result.newFilter).toBe(seed);
	});

	it("replaces newFilter slice with payload state", () => {
		const initial = makeFilterState({ snapshot: "old" });
		const next = makeFilterState({ snapshot: "new" });
		const ui = makeUiState(initial);
		const action = Commands.setFilterState({ state: next });

		const result = handleSetFilterState(ui, action);

		expect(result.newFilter).toBe(next);
		expect(result).not.toBe(ui);
	});

	it("preserves other UiState properties", () => {
		const ui = { newFilter: makeFilterState(), disabled: true } as unknown as ReturnType<typeof makeUiState> & {
			disabled: boolean;
		};
		const action = Commands.setFilterState({ state: makeFilterState({ snapshot: "x" }) });

		const result = handleSetFilterState(ui, action) as typeof ui;

		expect(result.disabled).toBe(true);
	});
});
