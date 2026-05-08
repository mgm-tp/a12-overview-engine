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
import { put, call, select, takeLatest } from "typed-redux-saga";

import { Activity, ActivitySagas, ActivityActions, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import { Events, OverviewActivity, OverviewEngineActions } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { assert } from "../../utils.js";

export const PersonSagas = [rowClickSaga];

function* rowClickSaga(): SagaIterator<void> {
	yield* takeLatest(
		(anyAction: AnyAction) =>
			OverviewEngineActions.event.match(anyAction) && Events.onRowClicked.match(anyAction.payload.engineAction),
		handleRowClick
	);
}

function* handleRowClick(
	action: Action<OverviewEngineActions.EventPayload<Action<Events.RowClickedPayload>>>
): SagaIterator<void> {
	const { activityId, engineAction } = action.payload;
	const { documentId } = engineAction.payload;

	const activity = yield* select(ActivitySelectors.activityById(activityId));
	assert(activity);

	if ("showcase" in activity.descriptor && activity.descriptor.showcase !== "person") {
		return;
	}

	const data = yield* select(
		ActivitySelectors.activityPropById(activityId, (activity) => Activity.findDefaultDataHolder(activity)?.data)
	);
	const documents = OverviewActivity.Data.DocumentListData.isInstance(data) ? data.documents : [];

	const document = documents.find((d) => d?.id === documentId);

	if (document === undefined) {
		throw new Error(`Could not find document with id ${documentId}`);
	}

	const createActivityAction = ActivityActions.create({
		activityDescriptor: { ...activity.descriptor, instance: document.id, model: document.modelId },
		initiatingActivityId: action.payload.activityId
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
