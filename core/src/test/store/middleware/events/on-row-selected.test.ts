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
import { onRowsSelected } from "../../../../main/store/internal/middleware/events/on-row-selected.js";
import type { UiState } from "../../../../main/store/internal/store.js";

function createMockStore(uiState: UiState) {
	return {
		getState: vi.fn(() => uiState),
		dispatch: vi.fn()
	};
}

describe("onRowsSelected middleware", () => {
	it("selection without linkId updates rowState at outer level", () => {
		const store = createMockStore({ rowState: {} });
		const next = vi.fn();
		const action = Events.onRowsSelected({
			documentsSelection: [{ documentId: "doc1", selected: true }]
		});

		onRowsSelected(store)(next)(action);

		expect(next).toHaveBeenCalledWith(action);
		expect(store.dispatch).toHaveBeenCalledOnce();

		const dispatchedAction = store.dispatch.mock.calls[0][0];
		expect(Commands.setRowState.match(dispatchedAction)).toBe(true);
		expect(dispatchedAction.payload.rowState).toEqual({ doc1: { selected: true } });
	});

	it("selection with linkId updates rowState[docRef].byLink[linkId]", () => {
		const store = createMockStore({ rowState: {} });
		const next = vi.fn();
		const action = Events.onRowsSelected({
			documentsSelection: [{ documentId: "doc1", linkId: "link1", selected: true }]
		});

		onRowsSelected(store)(next)(action);

		expect(store.dispatch).toHaveBeenCalledOnce();

		const dispatchedAction = store.dispatch.mock.calls[0][0];
		expect(Commands.setRowState.match(dispatchedAction)).toBe(true);
		expect(dispatchedAction.payload.rowState).toEqual({
			doc1: { byLink: { link1: { selected: true } } }
		});
	});

	it("mixed selection updates both outer and byLink", () => {
		const store = createMockStore({ rowState: {} });
		const next = vi.fn();
		const action = Events.onRowsSelected({
			documentsSelection: [
				{ documentId: "doc1", selected: true },
				{ documentId: "doc2", linkId: "link2", selected: true }
			]
		});

		onRowsSelected(store)(next)(action);

		const dispatchedAction = store.dispatch.mock.calls[0][0];
		expect(dispatchedAction.payload.rowState).toEqual({
			doc1: { selected: true },
			doc2: { byLink: { link2: { selected: true } } }
		});
	});

	it("preserves existing byLink entries when adding new linkId selections", () => {
		const store = createMockStore({
			rowState: { doc1: { byLink: { existingLink: { selected: true } } } }
		});
		const next = vi.fn();
		const action = Events.onRowsSelected({
			documentsSelection: [{ documentId: "doc1", linkId: "newLink", selected: true }]
		});

		onRowsSelected(store)(next)(action);

		const dispatchedAction = store.dispatch.mock.calls[0][0];
		expect(dispatchedAction.payload.rowState).toEqual({
			doc1: { byLink: { existingLink: { selected: true }, newLink: { selected: true } } }
		});
	});

	it("does not dispatch for non-matching actions", () => {
		const store = createMockStore({ rowState: {} });
		const next = vi.fn();
		const unrelatedAction = { type: "SOME_OTHER_ACTION" };

		onRowsSelected(store)(next)(unrelatedAction);

		expect(next).toHaveBeenCalledWith(unrelatedAction);
		expect(store.dispatch).not.toHaveBeenCalled();
	});
});
