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

import type { UnknownAction } from "redux";
import { all, put, call, select, type SagaGenerator } from "typed-redux-saga";

import {
	Activity,
	StoreSagas,
	ActivitySagas,
	type Selector,
	ActivityActions,
	ActivitySelectors,
	type ApplicationSaga
} from "@com.mgmtp.a12.client/client-core";
import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import { Events, Commands, EventNames } from "../../store/index.js";

import { OverviewEngineActions } from "./actions.js";
import { OverviewActivity } from "./activity.js";
import { EnumeratedStringDataHolder } from "./data-holder.js";
import { OverviewEngineSelectors } from "./selectors.js";

const logger = LoggerFactory.getLogger("overview-engine/client-extensions");

/** @internal */
export function createApplicationSagas(): ApplicationSaga.Descriptor[] {
	return [
		reloadActivityDataSaga(),
		queryParametersChangedSaga(),
		exportingSaga(),
		enumeratedStringQueryParametersChangedSaga(),
		multiSelectionDeleteSaga()
	];
}

function reloadActivityDataSaga(): ApplicationSaga.Descriptor {
	return {
		canHandle: (ad: Activity.Descriptor, action: UnknownAction) => {
			// ad.instance === undefined is trying to reproduce the same behavior from reloadOverview function
			// client/core/src/core/application/internal/adapter/shared.ts
			return ad.instance === undefined && ActivityActions.reloadData.match(action);
		},
		handle: (action: Action<ActivityActions.ActivityActionPayload>) => {
			return handleReloadActivityData(action);
		}
	};
}

function* handleReloadActivityData({ payload }: Action<ActivityActions.ActivityActionPayload>): SagaGenerator<void> {
	const { activityId } = payload;
	// set the lock in store (can be used by the UI)
	const lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "dataSagas.reload", {
		key: "Loading data"
	});

	if (lockId === undefined) {
		return;
	}

	const activity = yield* select(ActivitySelectors.activityById(activityId));
	const enumeratedStringDataHolders = activity?.dataHolders?.filter(EnumeratedStringDataHolder.isInstance) ?? [];

	yield* all(
		enumeratedStringDataHolders.flatMap((dh) => {
			if (!dh.data) {
				return undefined;
			}

			return put(
				OverviewEngineActions.enumeratedStringQueryParametersChanged({
					activityId,
					fieldPath: dh.data.fieldPath,
					modelId: dh.data.modelId,
					keyword: dh.data.keyword,
					nextPage: false,
					reload: true
				})
			);
		})
	);

	yield* put(ActivityActions.loadData(payload));

	const done = yield* call(() => StoreSagas.waitForStateChange(loadedOrError(activityId)));

	if (done) {
		yield* put(ActivityActions.unlock({ activityId, lockId }));
	}

	yield* call(goToLastValidPage, activityId);
}

function exportingSaga(): ApplicationSaga.Descriptor {
	return {
		canHandle: (ad: Activity.Descriptor, action: UnknownAction) => {
			return OverviewEngineActions.event.match(action) && Events.onExport.match(action.payload.engineAction);
		},
		*handle(action: Action<OverviewEngineActions.CommandPayload<Action<Events.ExportPayload>>>) {
			const { activityId } = action.payload;
			// set the lock in store (can be used by the UI)
			const lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "dataSagas.export", {
				key: "Exporting"
			});

			if (lockId === undefined) {
				return;
			}

			const { dataHolderDescriptor } = action.payload;
			let descriptor = dataHolderDescriptor;

			if (!descriptor) {
				const defaultDataHolder = Activity.findDefaultDataHolder(
					yield* select(ActivitySelectors.activityById(activityId))
				);

				if (!defaultDataHolder) {
					throw new Error(`Default data holder for activity ${activityId} does not exist`);
				}

				descriptor = defaultDataHolder.descriptor;
			}

			const additionalPayload = { exporting: true };

			yield* put(
				ActivityActions.loadData({
					activityId,
					dataHolderDescriptors: [descriptor],
					...additionalPayload
				})
			);

			const done = yield* call(() => StoreSagas.waitForStateChange(loadedOrError(activityId)));

			if (done) {
				yield* put(ActivityActions.unlock({ activityId, lockId }));
			}
		}
	};
}

function multiSelectionDeleteSaga(): ApplicationSaga.Descriptor {
	return {
		canHandle: (ad: Activity.Descriptor, action: UnknownAction) => {
			return (
				OverviewEngineActions.event.match(action) &&
				Events.onEventButtonClicked.match(action.payload.engineAction) &&
				action.payload.engineAction.payload.event === EventNames.MULTIPLE_DOCUMENTS_DELETE
			);
		},
		*handle(action: Action<OverviewEngineActions.EventPayload<Action<Events.EventButtonClickedPayload>>>) {
			const { activityId, dataHolderDescriptor } = action.payload;
			const { rowState } = yield* select(
				OverviewEngineSelectors.uiState(activityId, { descriptor: dataHolderDescriptor })
			);

			if (!rowState) {
				return;
			}

			const deletedDocumentIds = Object.entries(rowState)
				.filter(([, entry]) => {
					if (entry.selected) {
						return true;
					}

					if (entry.byLink) {
						return Object.values(entry.byLink).some((linkEntry) => linkEntry.selected);
					}

					return false;
				})
				.map(([key]) => key);

			if (!deletedDocumentIds.length) {
				return;
			}

			const lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "dataSagas.multiSelectionDelete", {
				key: "Multi-selection delete"
			});

			if (lockId === undefined) {
				return;
			}

			const additionalPayload = { deletedDocumentIds };
			yield* put(ActivityActions.removeData({ activityId, instanceId: "", ...additionalPayload }));

			const done = yield* call(() => StoreSagas.waitForStateChange(loadedOrError(activityId)));

			if (done) {
				yield* put(ActivityActions.unlock({ activityId, lockId }));
			}
		}
	};
}

function queryParametersChangedSaga(): ApplicationSaga.Descriptor {
	return {
		canHandle: (ad: Activity.Descriptor, action: UnknownAction) => {
			return (
				OverviewEngineActions.command.match(action) && Commands.setQueryParameters.match(action.payload.engineAction)
			);
		},
		*handle(action: Action<OverviewEngineActions.CommandPayload<Action<Commands.SetQueryParametersPayload>>>) {
			const { scrolling } = action.payload.engineAction.payload;

			const { dataHolderDescriptor } = action.payload;
			const dataHolderDescriptors = dataHolderDescriptor ? [dataHolderDescriptor] : undefined;

			if (scrolling) {
				/**
				 * Here we just dispatch a new loadData directly
				 */
				yield* put(ActivityActions.loadData({ activityId: action.payload.activityId, dataHolderDescriptors }));
			} else {
				yield* call(handleQueryParametersChanged, action);
			}
		}
	};
}

function* handleQueryParametersChanged(
	action: Action<OverviewEngineActions.CommandPayload<Action<Commands.SetQueryParametersPayload>>>
): SagaGenerator<void> {
	const { activityId } = action.payload;
	// set the lock in store (can be used by the UI)
	const lockId = yield* call(ActivitySagas.acquireActivityLock, activityId, "dataSagas.queryParametersChangedSaga", {
		key: "Loading documents"
	});

	if (lockId === undefined) {
		return;
	}

	const { dataHolderDescriptor } = action.payload;
	let dataHolderDescriptors = dataHolderDescriptor ? [dataHolderDescriptor] : undefined;

	if (!dataHolderDescriptor) {
		const defaultDataHolder = Activity.findDefaultDataHolder(yield* select(ActivitySelectors.activityById(activityId)));

		if (!defaultDataHolder) {
			throw new Error(`Default data holder for activity ${activityId} does not exist`);
		}

		dataHolderDescriptors = [defaultDataHolder.descriptor];
	}

	yield* put(ActivityActions.loadData({ activityId, dataHolderDescriptors }));

	const done = yield* call(() => StoreSagas.waitForStateChange(loadedOrError(activityId)));

	if (done) {
		yield* put(ActivityActions.unlock({ activityId, lockId }));
	}

	yield* call(goToLastValidPage, activityId, dataHolderDescriptor);
}

function loadedOrError(activityId: string): Selector<{ stateChanged: boolean; returnValue: boolean }> {
	return (state) => {
		const activity = ActivitySelectors.activityById(activityId)(state);

		if (!activity) {
			return { stateChanged: true, returnValue: true };
		}

		const loadingState = ActivitySelectors.loadingState(activity);

		if (loadingState.state === "loaded" || loadingState.state === "error" || loadingState.state === "without") {
			return { stateChanged: true, returnValue: true };
		}

		return { stateChanged: false, returnValue: false };
	};
}

function* goToLastValidPage(
	activityId: string,
	dataHolderDescriptor?: Activity.DataHolderDescriptor
): SagaGenerator<void> {
	const activity = yield* select(ActivitySelectors.activityById(activityId));

	if (activity === undefined) {
		return;
	}

	const dataHolder = dataHolderDescriptor
		? activity.dataHolders.find(Activity.DataHolder.hasDescriptor(dataHolderDescriptor))
		: Activity.findDefaultDataHolder(activity);
	const data = dataHolder?.data;

	if (!OverviewActivity.Data.DocumentListData.isInstance(data)) {
		return;
	}

	const totalDocumentsCount = data.totalDocumentsCount;
	const uiStateWithoutDefaults = yield* select(
		OverviewEngineSelectors.uiStateWithoutDefaults(activityId, dataHolderDescriptor)
	);

	if (uiStateWithoutDefaults?.pagination === undefined || totalDocumentsCount === undefined) {
		return;
	}

	const maxPageNumber = Math.max(0, Math.ceil(totalDocumentsCount / uiStateWithoutDefaults.pagination.pageSize) - 1);
	logger.log(
		`Activity[${activity.id}]: [ ` +
			`totalDocumentsCount: ${totalDocumentsCount}, ` +
			`pageNumber: ${uiStateWithoutDefaults?.pagination.pageNumber}, ` +
			`pageSize: ${uiStateWithoutDefaults?.pagination.pageSize}, ` +
			`maxPageNumber: ${maxPageNumber} ` +
			`]`
	);

	if (uiStateWithoutDefaults.pagination.pageNumber > maxPageNumber) {
		yield* put(
			OverviewEngineActions.event({ activityId, engineAction: Events.onPageClicked({ pageNumber: maxPageNumber }) })
		);
	}
}

function enumeratedStringQueryParametersChangedSaga(): ApplicationSaga.Descriptor {
	return {
		canHandle: (ad: Activity.Descriptor, action: UnknownAction) =>
			OverviewEngineActions.enumeratedStringQueryParametersChanged.match(action),
		handle: handleEnumeratedStringQueryParametersChangedSaga
	};
}

function* handleEnumeratedStringQueryParametersChangedSaga({
	payload
}: Action<OverviewEngineActions.EnumeratedStringQueryParametersChangedPayload>): SagaGenerator<void> {
	const { activityId, fieldPath, keyword, modelId } = payload;

	const activity = yield* select(ActivitySelectors.activityById(activityId));

	if (!activity) {
		throw new Error(`No activity found for id ${activityId}.`);
	}

	const dataHolder = activity.dataHolders?.find(EnumeratedStringDataHolder.isInstanceByFieldPath(fieldPath));

	if (dataHolder) {
		if (!dataHolder.data?.candidates.length || payload.nextPage) {
			yield* put(ActivityActions.loadData({ activityId, dataHolderDescriptors: [dataHolder.descriptor] }));
		}

		return;
	}

	const descriptor = EnumeratedStringDataHolder.createDescriptor(fieldPath);

	yield* all([
		put(
			OverviewEngineActions.createEnumeratedStringDataHolder({
				data: { fieldPath, keyword, candidates: [], modelId },
				activityId,
				descriptor
			})
		),
		put(
			ActivityActions.loadData({
				activityId,
				dataHolderDescriptors: [descriptor],
				missingOnly: true
			})
		)
	]);
}
