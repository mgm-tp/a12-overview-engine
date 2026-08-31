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

import { Events, Commands } from "../../../../main/store/internal/actions.js";
import { onMultiSelectionCleared } from "../../../../main/store/internal/middleware/events/on-multi-selection-cleared.js";
import type { UiState } from "../../../../main/store/internal/store.js";

function createMockStore(uiState: UiState) {
	return {
		getState: vi.fn(() => uiState),
		dispatch: vi.fn()
	};
}

describe("onMultiSelectionCleared middleware", () => {
	it("clears selected in rowState", () => {
		const store = createMockStore({
			rowState: { doc1: { selected: true }, doc2: { selected: true } }
		});
		const next = vi.fn();
		const action = Events.onMultiSelectionCleared({});

		onMultiSelectionCleared(store)(next)(action);

		expect(store.dispatch).toHaveBeenCalledOnce();
		const dispatchedAction = store.dispatch.mock.calls[0][0];
		expect(Commands.setRowState.match(dispatchedAction)).toBe(true);
		expect(dispatchedAction.payload.rowState).toEqual({
			doc1: { selected: false },
			doc2: { selected: false }
		});
	});

	it("clears selected in rowState[docRef].byLink[linkId]", () => {
		const store = createMockStore({
			rowState: {
				doc1: { byLink: { link1: { selected: true } } },
				doc2: { byLink: { link2: { selected: true } } }
			}
		});
		const next = vi.fn();
		const action = Events.onMultiSelectionCleared({});

		onMultiSelectionCleared(store)(next)(action);

		expect(store.dispatch).toHaveBeenCalledOnce();
		const dispatchedAction = store.dispatch.mock.calls[0][0];
		expect(dispatchedAction.payload.rowState).toEqual({
			doc1: { selected: false, byLink: { link1: { selected: false } } },
			doc2: { selected: false, byLink: { link2: { selected: false } } }
		});
	});

	it("clears both outer and byLink selected flags", () => {
		const store = createMockStore({
			rowState: {
				doc1: { selected: true },
				doc2: { byLink: { link1: { selected: true } } }
			}
		});
		const next = vi.fn();
		const action = Events.onMultiSelectionCleared({});

		onMultiSelectionCleared(store)(next)(action);

		expect(store.dispatch).toHaveBeenCalledOnce();
		const dispatchedAction = store.dispatch.mock.calls[0][0];
		expect(dispatchedAction.payload.rowState).toEqual({
			doc1: { selected: false },
			doc2: { selected: false, byLink: { link1: { selected: false } } }
		});
	});

	it("does not dispatch when nothing is selected", () => {
		const store = createMockStore({
			rowState: { doc1: { selected: false } }
		});
		const next = vi.fn();
		const action = Events.onMultiSelectionCleared({});

		onMultiSelectionCleared(store)(next)(action);

		expect(store.dispatch).not.toHaveBeenCalled();
	});

	it("does not dispatch for non-matching actions", () => {
		const store = createMockStore({ rowState: {} });
		const next = vi.fn();
		const unrelatedAction = { type: "SOME_OTHER_ACTION" };

		onMultiSelectionCleared(store)(next)(unrelatedAction);

		expect(next).toHaveBeenCalledWith(unrelatedAction);
		expect(store.dispatch).not.toHaveBeenCalled();
	});
});
