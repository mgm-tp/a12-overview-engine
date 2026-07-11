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

import { put, call, select, takeLatest, type SagaGenerator } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { Activity, ActivitySagas, ActivityActions, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import { Events, OverviewActivity, OverviewEngineActions } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { assert } from "../../utils.js";

const CANCEL_EVENT = "event_cancel";

/**
 * Reusable row-click handler. When the row's `customEvent` matches `selectEvent`,
 * it sets `descriptorKey` on the activity descriptor with the document id.
 */
export function* handleRowClickWithCustomEvent(
	action: Action<OverviewEngineActions.EventPayload<Action<Events.RowClickedPayload>>>,
	showcase: string,
	selectEvent: string,
	descriptorKey: string
): SagaGenerator<void> {
	const { activityId, engineAction } = action.payload;
	const { documentId, linkId, customEvent } = engineAction.payload;

	const activity = yield* select(ActivitySelectors.activityById(activityId));
	assert(activity);

	if ("showcase" in activity.descriptor && activity.descriptor.showcase !== showcase) {
		return;
	}

	const data = yield* select(
		ActivitySelectors.activityPropById(activityId, (a) => Activity.findDefaultDataHolder(a)?.data)
	);
	const documents = OverviewActivity.Data.DocumentListData.isInstance(data) ? data.documents : [];
	const document = documents.find((d) => d?.id === documentId && d?.linkId === linkId);

	if (document === undefined) {
		throw new Error(`Could not find document with id ${documentId}`);
	}

	const descriptor = {
		...activity.descriptor,
		instance: document.id,
		model: document.modelId,
		linkId: linkId ?? undefined,
		...(customEvent === selectEvent ? { [descriptorKey]: document.id } : {})
	};

	const createActivityAction = ActivityActions.create({
		activityDescriptor: descriptor,
		initiatingActivityId: activityId
	});

	const childActivityWithInstance = yield* select(ActivitySelectors.childActivityWithInstance(activityId));

	if (childActivityWithInstance) {
		yield* put(
			ActivityActions.cancelRequested({
				activityIds: [childActivityWithInstance.id],
				replacementActivity: createActivityAction.payload.activity
			})
		);

		const cancelled = yield* call(ActivitySagas.waitForResponseCancelRequested);

		if (!cancelled) {
			return;
		}
	} else {
		yield* put(createActivityAction);
	}
}

/**
 * Reusable cancel-button saga for a given showcase module.
 */
export function createCancelButtonSaga(showcase: string) {
	return function* cancelButtonSaga(): SagaGenerator<void> {
		yield* takeLatest(
			(action: unknown) =>
				OverviewEngineActions.event.match(action) &&
				Events.onEventButtonClicked.match(action.payload.engineAction) &&
				action.payload.engineAction.payload.event === CANCEL_EVENT,
			function* handleCancelButtonClick(
				action: Action<OverviewEngineActions.EventPayload<Action<Events.EventButtonClickedPayload>>>
			): SagaGenerator<void> {
				const { activityId } = action.payload;

				const activity = yield* select(ActivitySelectors.activityById(activityId));

				if (!activity || !("showcase" in activity.descriptor) || activity.descriptor.showcase !== showcase) {
					return;
				}

				yield* put(ActivityActions.cancelRequested({ activityIds: [activityId] }));
			}
		);
	};
}
