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

import * as React from "react";
import { Provider } from "react-redux";

import { renderHook } from "@testing-library/react";
import { type Reducer, type Middleware, applyMiddleware, legacy_createStore as createStore } from "redux";
import { it, vi, expect, describe, beforeEach } from "vitest";

import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { useEventHandlers } from "../../../../../main/client-extensions/internal/view/hooks/use-event-handlers.js";
import { SortingOrder, type UiState } from "../../../../../main/store/index.js";

// -- Mocks -------------------------------------------------------------------

/*
 * useModels is mocked to return a minimal overview model with one sortable ReferenceColumn.
 * ReferenceColumn.isAssignableFrom: "elementRef" in column && no "linkReferences" array.
 * This avoids setting up the full model/Redux model-graph state.
 */
vi.mock("../../../../../main/client-extensions/internal/view/hooks/use-models.js", () => ({
	useModels: vi.fn().mockReturnValue({
		overviewModel: {
			content: {
				columns: [{ id: "col1", elementRef: "elem1" }],
				configuration: {}
			}
		},
		documentModel: {},
		queryModel: undefined,
		subDocumentModels: undefined,
		modelGraph: undefined
	})
}));

/*
 * DocumentModelUtils.getElementPathForId is mocked so ReferenceColumn path resolution
 * returns a known string without needing a real DocumentModel.
 */
vi.mock("../../../../../main/models/internal/shared.js", async (importOriginal) => {
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	const original = await importOriginal<typeof import("../../../../../main/models/internal/shared.js")>();

	return {
		...original,
		DocumentModelUtils: {
			...original.DocumentModelUtils,
			getElementPathForId: vi.fn().mockReturnValue("sortable-field")
		}
	};
});

// -- Helpers -----------------------------------------------------------------

const ACTIVITY_ID = "test-activity";
const DEFAULT_DESCRIPTOR: Activity.DataHolderDescriptor = { name: "default" };
const EMBEDDED_DESCRIPTOR: Activity.DataHolderDescriptor = { name: "embedded" };

function makeDataHolder(descriptor: Activity.DataHolderDescriptor, sorting: UiState["sorting"]): Activity.DataHolder {
	return {
		descriptor,
		slices: { uiState: { sorting } },
		dirty: false,
		loadingState: "loaded",
		savingState: "saved"
	} as Activity.DataHolder;
}

function makeDispatchCapture(captured: unknown[]): Middleware {
	return () => (next) => (action) => {
		captured.push(action);

		return next(action);
	};
}

function makeStore(activity: Activity, captured: unknown[]) {
	const state = {
		activities: { [ACTIVITY_ID]: activity },
		models: { applicationModel: {}, modelGraph: {}, models: {} }
	};
	const reducer: Reducer = (s = state) => s;

	return createStore(reducer, state, applyMiddleware(makeDispatchCapture(captured)));
}

function makeActivity(defaultSorting: UiState["sorting"], embeddedSorting: UiState["sorting"]): Activity {
	return {
		id: ACTIVITY_ID,
		activationTimestamp: Date.now(),
		descriptor: DEFAULT_DESCRIPTOR,
		dataHolders: [
			makeDataHolder(DEFAULT_DESCRIPTOR, defaultSorting),
			makeDataHolder(EMBEDDED_DESCRIPTOR, embeddedSorting)
		]
	};
}

function makeMinimalParams(
	overrides: Partial<Parameters<typeof useEventHandlers>[0]> = {}
): Parameters<typeof useEventHandlers>[0] {
	return {
		activityId: ACTIVITY_ID,
		uiState: {} as UiState,
		data: [],
		eventHandlerProps: undefined,
		loaderRef: { current: null },
		listRef: { current: null },
		rowStyling: undefined,
		...overrides
	};
}

// -- Tests -------------------------------------------------------------------

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.view.hooks.use-event-handlers — embedded mode — onColumnClick", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	/*
	 * Column 0 resolves to path "sortable-field" (mocked DocumentModelUtils), preferred ASC.
	 *
	 * computeNextSorting logic:
	 *   currentSorting matches path + order === preferred → flip → DESC
	 *   no currentSorting for path → use preferred → ASC
	 *
	 * Embedded holder: sorting [{ path: "sortable-field", order: ASC }]
	 * Default holder:  sorting [] (undefined currentSorting for the column path)
	 */
	it("uses embedded holder's sorting to compute next sort order — flips ASC to DESC", () => {
		const onSort = vi.fn();
		const captured: unknown[] = [];

		const activity = makeActivity(
			[], // default: no sorting
			[{ path: "sortable-field", order: SortingOrder.ASC }] // embedded: currently ASC
		);

		const store = makeStore(activity, captured);

		const { result } = renderHook(
			() =>
				useEventHandlers(
					makeMinimalParams({
						dataHolderDescriptor: EMBEDDED_DESCRIPTOR,
						eventHandlerProps: { onSort }
					})
				),
			{ wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider> }
		);

		result.current.onColumnClick?.(0);

		// embedded holder is ASC on this column → preferred is ASC → flip to DESC
		expect(onSort).toHaveBeenCalledOnce();
		expect(onSort).toHaveBeenCalledWith({ sorting: [{ path: "sortable-field", order: SortingOrder.DESC }] });
	});

	it("uses default holder's sorting (no descriptor) — no current sort → starts at preferred ASC", () => {
		const onSort = vi.fn();
		const captured: unknown[] = [];

		const activity = makeActivity(
			[], // default: no sorting
			[{ path: "sortable-field", order: SortingOrder.ASC }] // embedded: currently ASC
		);

		const store = makeStore(activity, captured);

		const { result } = renderHook(
			() =>
				useEventHandlers(
					makeMinimalParams({
						// no descriptor → default holder
						eventHandlerProps: { onSort }
					})
				),
			{ wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider> }
		);

		result.current.onColumnClick?.(0);

		// default holder has no sorting for this column → new sort at preferred (ASC)
		expect(onSort).toHaveBeenCalledOnce();
		expect(onSort).toHaveBeenCalledWith({ sorting: [{ path: "sortable-field", order: SortingOrder.ASC }] });
	});

	it("two embedded instances compute independent sort orders from their own state", () => {
		const EMBEDDED_DESCRIPTOR_A: Activity.DataHolderDescriptor = { name: "embedded-a" };
		const EMBEDDED_DESCRIPTOR_B: Activity.DataHolderDescriptor = { name: "embedded-b" };

		const onSortA = vi.fn();
		const onSortB = vi.fn();

		const activityA = {
			id: ACTIVITY_ID,
			activationTimestamp: Date.now(),
			descriptor: DEFAULT_DESCRIPTOR,
			dataHolders: [
				makeDataHolder(DEFAULT_DESCRIPTOR, []),
				makeDataHolder(EMBEDDED_DESCRIPTOR_A, [{ path: "sortable-field", order: SortingOrder.ASC }]),
				makeDataHolder(EMBEDDED_DESCRIPTOR_B, []) // B has no sorting yet
			]
		};

		const capturedA: unknown[] = [];
		const capturedB: unknown[] = [];
		const storeA = makeStore(activityA, capturedA);
		const storeB = makeStore(activityA, capturedB);

		const { result: resultA } = renderHook(
			() =>
				useEventHandlers(
					makeMinimalParams({
						dataHolderDescriptor: EMBEDDED_DESCRIPTOR_A,
						eventHandlerProps: { onSort: onSortA }
					})
				),
			{ wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={storeA}>{children}</Provider> }
		);

		const { result: resultB } = renderHook(
			() =>
				useEventHandlers(
					makeMinimalParams({
						dataHolderDescriptor: EMBEDDED_DESCRIPTOR_B,
						eventHandlerProps: { onSort: onSortB }
					})
				),
			{ wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={storeB}>{children}</Provider> }
		);

		resultA.current.onColumnClick?.(0);
		resultB.current.onColumnClick?.(0);

		// A already has ASC → flip to DESC
		expect(onSortA).toHaveBeenCalledWith({ sorting: [{ path: "sortable-field", order: SortingOrder.DESC }] });
		// B has no sorting → start at preferred ASC
		expect(onSortB).toHaveBeenCalledWith({ sorting: [{ path: "sortable-field", order: SortingOrder.ASC }] });
	});
});
