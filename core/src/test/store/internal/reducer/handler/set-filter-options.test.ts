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
import { handleSetFilterOptions } from "../../../../../main/store/internal/reducer/handler/set-filter-options.js";
import { makeUiState, makeFilterState, makeFilterItemState } from "../../middleware/events/new-filter/helpers.js";

describe("handleSetFilterOptions", () => {
	it("returns state unchanged when newFilter slice is undefined", () => {
		const state = makeUiState(undefined);
		const action = Commands.setFilterOptions({ filterId: "f1", options: { criteria: "x" } });

		const result = handleSetFilterOptions(state, action);

		expect(result).toBe(state);
	});

	it("returns state unchanged when target filter does not exist", () => {
		const ui = makeUiState(makeFilterState({ filters: {} }));
		const action = Commands.setFilterOptions({ filterId: "missing", options: { criteria: "x" } });

		const result = handleSetFilterOptions(ui, action);

		expect(result).toBe(ui);
	});

	it("merges options into target filter", () => {
		const f1 = makeFilterItemState({ filterId: "f1", options: { criteria: "old", extra: "keep" } });
		const ui = makeUiState(makeFilterState({ filters: { f1 } }));
		const action = Commands.setFilterOptions({ filterId: "f1", options: { criteria: "new" } });

		const result = handleSetFilterOptions(ui, action);

		expect(result.newFilter?.filters.f1?.options).toEqual({ criteria: "new", extra: "keep" });
	});

	it("preserves referential equality for unrelated filters", () => {
		const f1 = makeFilterItemState({ filterId: "f1" });
		const f2 = makeFilterItemState({ filterId: "f2" });
		const ui = makeUiState(makeFilterState({ filters: { f1, f2 } }));
		const action = Commands.setFilterOptions({ filterId: "f1", options: { criteria: "x" } });

		const result = handleSetFilterOptions(ui, action);

		expect(result.newFilter?.filters.f2).toBe(f2);
	});

	it("targets editingFilter when its id matches", () => {
		const editingFilter = {
			filterId: "f1",
			options: { criteria: "edit-old" }
		} as NonNullable<ReturnType<typeof makeFilterState>["editingFilter"]>;
		const ui = makeUiState(makeFilterState({ editingFilter }));
		const action = Commands.setFilterOptions({ filterId: "f1", options: { criteria: "edit-new" } });

		const result = handleSetFilterOptions(ui, action);

		expect(result.newFilter?.editingFilter?.options).toEqual({ criteria: "edit-new" });
	});
});
