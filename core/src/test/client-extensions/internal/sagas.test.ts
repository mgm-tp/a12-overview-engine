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

import { runSaga } from "redux-saga";
import { it, vi, expect, describe, beforeEach } from "vitest";

import type { Activity } from "@com.mgmtp.a12.client/client-core";
import { ActivityActions } from "@com.mgmtp.a12.client/client-core";

import { OverviewEngineActions } from "../../../main/client-extensions/internal/actions.js";
import { createApplicationSagas } from "../../../main/client-extensions/internal/sagas.js";
import { OverviewEngineSelectors } from "../../../main/client-extensions/internal/selectors.js";
import { Events, EventNames } from "../../../main/store/index.js";

vi.mock("@com.mgmtp.a12.client/client-core", async (importOriginal) => {
	// eslint-disable-next-line @typescript/consistent-type-imports
	const original = await importOriginal<typeof import("@com.mgmtp.a12.client/client-core")>();

	return {
		...original,
		ActivitySagas: {
			...original.ActivitySagas,
			acquireActivityLock: vi.fn<() => Promise<string>>().mockResolvedValue("lock-1")
		},
		StoreSagas: {
			...original.StoreSagas,
			waitForStateChange: vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
		}
	};
});

// -- Helpers -----------------------------------------------------------------

const ACTIVITY_ID = "test-activity";
const DEFAULT_DESCRIPTOR: Activity.DataHolderDescriptor = { name: "default" };
const EMBEDDED_DESCRIPTOR: Activity.DataHolderDescriptor = { name: "embedded" };

function makeDataHolder(
	descriptor: Activity.DataHolderDescriptor,
	data?: object,
	uiStateSlice?: object
): Activity.DataHolder {
	return {
		descriptor,
		data,
		slices: uiStateSlice ? { uiState: uiStateSlice } : {},
		dirty: false,
		loadingState: "loaded",
		savingState: "saved"
	} as Activity.DataHolder;
}

function makeActivity(dataHolders: Activity.DataHolder[]): Activity {
	return {
		id: ACTIVITY_ID,
		activationTimestamp: Date.now(),
		descriptor: DEFAULT_DESCRIPTOR,
		dataHolders
	};
}

function makeState(activity: Activity): object {
	return { activities: { [ACTIVITY_ID]: activity } };
}

function makeDocumentListData(totalDocumentsCount: number, documents: unknown[] = []) {
	return { documents, totalDocumentsCount };
}

// -- Tests -------------------------------------------------------------------

describe("com.mgmtp.a12.overview-engine.client-extensions.internal.sagas", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("exportingSaga", () => {
		it("dispatches loadData with embedded descriptor when action payload has descriptor", async () => {
			const sagas = createApplicationSagas();
			// exportingSaga is the 3rd entry (index 2) in createApplicationSagas
			const exportingSagaDescriptor = sagas[2];

			const action = OverviewEngineActions.event({
				activityId: ACTIVITY_ID,
				dataHolderDescriptor: EMBEDDED_DESCRIPTOR,
				engineAction: Events.onExport({})
			});

			const dispatched: unknown[] = [];

			await runSaga(
				{
					dispatch: (a) => dispatched.push(a),
					getState: () =>
						makeState(makeActivity([makeDataHolder(DEFAULT_DESCRIPTOR), makeDataHolder(EMBEDDED_DESCRIPTOR)]))
				},
				exportingSagaDescriptor.handle as Parameters<typeof runSaga>[1],
				action
			).toPromise();

			const loadDataAction = dispatched.find((a) => ActivityActions.loadData.match(a as unknown));

			expect(loadDataAction).toMatchObject({
				payload: { dataHolderDescriptors: [EMBEDDED_DESCRIPTOR] }
			});
		});

		it("falls back to default descriptor when action payload has no descriptor", async () => {
			const sagas = createApplicationSagas();
			const exportingSagaDescriptor = sagas[2];

			const action = OverviewEngineActions.event({
				activityId: ACTIVITY_ID,
				engineAction: Events.onExport({})
			});

			const dispatched: unknown[] = [];

			await runSaga(
				{
					dispatch: (a) => dispatched.push(a),
					getState: () =>
						makeState(makeActivity([makeDataHolder(DEFAULT_DESCRIPTOR), makeDataHolder(EMBEDDED_DESCRIPTOR)]))
				},
				exportingSagaDescriptor.handle as Parameters<typeof runSaga>[1],
				action
			).toPromise();

			const loadDataAction = dispatched.find((a) => ActivityActions.loadData.match(a as unknown));

			expect(loadDataAction).toMatchObject({
				payload: { dataHolderDescriptors: [DEFAULT_DESCRIPTOR] }
			});
		});
	});

	describe("multiSelectionDeleteSaga", () => {
		it("deletes rows from embedded holder, not default holder (regression)", async () => {
			const sagas = createApplicationSagas();
			// multiSelectionDeleteSaga is the 5th entry (index 4)
			const multiDeleteSagaDescriptor = sagas[4];

			const defaultRowState = { "doc-A": { selected: true } };
			const embeddedRowState = { "doc-B": { selected: true } };

			// uiState returns different rowState depending on which descriptor is passed
			vi.spyOn(OverviewEngineSelectors, "uiState").mockImplementation(
				(_activityId: string, options?: { descriptor?: Activity.DataHolderDescriptor }) => {
					const rowState = options?.descriptor?.name === EMBEDDED_DESCRIPTOR.name ? embeddedRowState : defaultRowState;

					return () => ({ rowState });
				}
			);

			const action = OverviewEngineActions.event({
				activityId: ACTIVITY_ID,
				dataHolderDescriptor: EMBEDDED_DESCRIPTOR,
				engineAction: Events.onEventButtonClicked({ event: EventNames.MULTIPLE_DOCUMENTS_DELETE })
			});

			const dispatched: unknown[] = [];

			await runSaga(
				{
					dispatch: (a) => dispatched.push(a),
					getState: () =>
						makeState(makeActivity([makeDataHolder(DEFAULT_DESCRIPTOR), makeDataHolder(EMBEDDED_DESCRIPTOR)]))
				},
				multiDeleteSagaDescriptor.handle as Parameters<typeof runSaga>[1],
				action
			).toPromise();

			const removeDataAction = dispatched.find((a) => ActivityActions.removeData.match(a as unknown));

			expect(removeDataAction).toMatchObject({
				payload: { deletedDocumentIds: ["doc-B"] }
			});

			// regression: must NOT include doc-A (from default holder)
			expect(
				(removeDataAction as { payload: { deletedDocumentIds: string[] } }).payload.deletedDocumentIds
			).not.toContain("doc-A");
		});
	});

	describe("goToLastValidPage", () => {
		it("reads totalDocumentsCount from embedded holder, not default (regression via queryParametersChangedSaga)", async () => {
			const sagas = createApplicationSagas();
			// queryParametersChangedSaga is index 1; it calls goToLastValidPage with descriptor
			const queryParamsSagaDescriptor = sagas[1];

			const defaultData = makeDocumentListData(100);
			// Embedded holder has only 5 docs, page size 10 → maxPage = 0
			const embeddedData = makeDocumentListData(5);

			const embeddedUiState = { pagination: { pageNumber: 3, pageSize: 10 } };

			const activity = makeActivity([
				makeDataHolder(DEFAULT_DESCRIPTOR, defaultData, { pagination: { pageNumber: 0, pageSize: 10 } }),
				makeDataHolder(EMBEDDED_DESCRIPTOR, embeddedData, embeddedUiState)
			]);

			const { Commands } = await import("../../../main/store/index.js");
			const { OverviewEngineActions: OEActions } = await import("../../../main/client-extensions/internal/actions.js");

			const action = OEActions.command({
				activityId: ACTIVITY_ID,
				dataHolderDescriptor: EMBEDDED_DESCRIPTOR,
				engineAction: Commands.setQueryParameters({ scrolling: undefined })
			});

			const dispatched: unknown[] = [];

			await runSaga(
				{
					dispatch: (a) => dispatched.push(a),
					getState: () => makeState(activity)
				},
				queryParamsSagaDescriptor.handle as Parameters<typeof runSaga>[1],
				action
			).toPromise();

			const onPageClickedAction = dispatched.find((a) => {
				const isEvent = OverviewEngineActions.event.match(a as unknown);

				if (!isEvent) {
					return false;
				}

				const payload = (a as { payload: { engineAction: unknown } }).payload;

				return Events.onPageClicked.match(payload.engineAction as never);
			});

			// embedded holder is on page 3 but maxPage is 0 (5 docs / 10 pageSize)
			// so a page correction event should be dispatched targeting page 0
			expect(onPageClickedAction).toBeDefined();
			expect(onPageClickedAction).toMatchObject({
				payload: { engineAction: { payload: { pageNumber: 0 } } }
			});
		});
	});
});
