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

import { Commands } from "../../../../main/store/internal/actions.js";
import type { UiState } from "../../../../main/store/internal/store.js";
import { setRowState } from "../../../../main/store/internal/reducer/handler/set-row-state.js";

function makeAction(payload: Commands.SetRowStatePayload) {
	return Commands.setRowState(payload);
}

describe("setRowState reducer handler", () => {
	it("writes rowState from payload", () => {
		const state: UiState = {};
		const result = setRowState(state, makeAction({ rowState: { doc1: { selected: true } } }));

		expect(result.rowState).toEqual({ doc1: { selected: true } });
	});

	it("writes rowState with byLink sub-map", () => {
		const state: UiState = {};
		const result = setRowState(
			state,
			makeAction({
				rowState: { doc1: { selected: true, byLink: { link1: { selected: true } } } }
			})
		);

		expect(result.rowState).toEqual({ doc1: { selected: true, byLink: { link1: { selected: true } } } });
	});

	it("preserves rowState[docRef].byLink[linkId] correctly", () => {
		const state: UiState = {
			rowState: { doc1: { selected: false, byLink: { link1: { selected: true } } } }
		};
		const result = setRowState(
			state,
			makeAction({
				rowState: { doc1: { selected: true, byLink: { link1: { selected: true }, link2: { selected: false } } } }
			})
		);

		expect(result.rowState).toEqual({
			doc1: { selected: true, byLink: { link1: { selected: true }, link2: { selected: false } } }
		});
	});

	it("overwrites entire rowState", () => {
		const state: UiState = {
			rowState: { doc1: { selected: true, byLink: { link1: { selected: true } } } }
		};
		const result = setRowState(state, makeAction({ rowState: { doc2: { selected: false } } }));

		expect(result.rowState).toEqual({ doc2: { selected: false } });
	});
});
