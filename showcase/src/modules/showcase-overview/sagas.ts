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

/**
 * @packageDocumentation
 * @module extensions/crud
 */
import { type AnyAction } from "redux";
import { type Action } from "typescript-fsa";
import { type SagaIterator } from "redux-saga";
import { put, select, takeLatest } from "typed-redux-saga";

import { ActivityActions, NotificationActions } from "@com.mgmtp.a12.client/client-core";
import {
	Events,
	Commands,
	OverviewEngineActions,
	OverviewEngineSelectors
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { SHOWCASE_RESOURCE_KEYS } from "../../config/resources.js";

export const ShowcaseOverviewSagas = [rowButtonClickSaga, eventButtonClickSaga, searchNotificationSaga];

function* rowButtonClickSaga(): SagaIterator<void> {
	yield* takeLatest(
		(anyAction: AnyAction) =>
			OverviewEngineActions.event.match(anyAction) && Events.onRowButtonClicked.match(anyAction.payload.engineAction),
		handleRowButtonClick
	);
}

function* handleRowButtonClick(
	action: Action<OverviewEngineActions.EventPayload<Action<Events.RowButtonClickedPayload>>>
): SagaIterator<void> {
	const { activityId, engineAction } = action.payload;
	const { documentId, rowActionModel } = engineAction.payload;

	if (rowActionModel.event === "delete") {
		yield* put(ActivityActions.removeData({ instanceId: documentId, activityId }));
	}

	yield* put(
		NotificationActions.add({
			severity: "info",
			duration: 5000,
			title: { key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event.title },
			message: {
				key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event.documentButtonMessage,
				args: {
					eventName: { type: "plain", value: rowActionModel.event },
					instanceId: { type: "plain", value: documentId }
				}
			}
		})
	);
}

function* eventButtonClickSaga(): SagaIterator<void> {
	yield* takeLatest(
		(anyAction: AnyAction) =>
			OverviewEngineActions.event.match(anyAction) && Events.onEventButtonClicked.match(anyAction.payload.engineAction),
		handleEventButtonClick
	);
}

function* handleEventButtonClick(
	action: Action<OverviewEngineActions.EventPayload<Action<Events.EventButtonClickedPayload>>>
): SagaIterator<void> {
	const { activityId, engineAction } = action.payload;
	const { button, event } = engineAction.payload;
	const { rowState = {} } = yield* select(OverviewEngineSelectors.uiState(activityId));

	// This is the limitation of the current overview engine implementation
	// where we can not distinguish the button is normal button or multi-selection button
	// so we have to check the existence of "type" property to determine the button type
	// because only the normal button has that property since it is OverviewModel.ButtonElement
	const isMultiSelectionEvent = !!button && !("type" in button);

	const selectedDocuments = Object.keys(rowState).filter((id) => rowState[id].selected);

	yield* put(
		NotificationActions.add({
			severity: "info",
			duration: 5000,
			title: { key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event.title },
			message: {
				key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event[
					isMultiSelectionEvent ? "multiSelectionButtonMessage" : "eventButtonMessage"
				],
				args: {
					eventName: { type: "plain", value: event },
					numberOfDocuments: { type: "plain", value: selectedDocuments.length }
				}
			}
		})
	);
}

function* searchNotificationSaga(): SagaIterator<void> {
	yield* takeLatest(
		(anyAction: AnyAction) =>
			OverviewEngineActions.command.match(anyAction) &&
			Commands.setQueryParameters.match(anyAction.payload.engineAction),
		handleSearchNotificationSaga
	);
}

function* handleSearchNotificationSaga(
	action: Action<OverviewEngineActions.EventPayload<Action<Commands.SetQueryParametersPayload>>>
): SagaIterator<void> {
	const { activityId } = action.payload;
	const { searchString } = yield* select(OverviewEngineSelectors.uiState(activityId));

	if (searchString) {
		yield* put(
			NotificationActions.add({
				severity: "info",
				duration: 5000,
				title: { key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event.title },
				message: {
					key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event.searchEventMessage,
					args: {
						searchString: { type: "plain", value: searchString }
					}
				}
			})
		);
	}
}
