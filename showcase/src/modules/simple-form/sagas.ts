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

import { set } from "lodash-es";
import { put, select, takeEvery, type SagaGenerator } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { Activity, ActivityActions, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { assert } from "../../utils.js";

import { SimpleFormActions } from "./actions.js";

export const SimpleFormSagas: (() => SagaGenerator<void>)[] = [valueChangedSaga, saveSaga, cancelSaga];

function* valueChangedSaga(): SagaGenerator<void> {
	yield* takeEvery(
		SimpleFormActions.onValueChanged.match,
		function* (action: Action<SimpleFormActions.ValueChangedPayload>) {
			const { activityId, path, value } = action.payload;
			const activity = yield* select(ActivitySelectors.activityById(activityId));
			assert(activity, `Activity ${activityId} not found`);

			const data = { ...Activity.findDefaultDataHolder(activity)?.data };

			set(data, `document.${path}`, value);

			yield* put(ActivityActions.setData({ activityId, data, dirty: true }));
		}
	);
}

function* saveSaga(): SagaGenerator<void> {
	yield* takeEvery(SimpleFormActions.onSave.match, function* (action: Action<SimpleFormActions.SavePayload>) {
		yield* put(ActivityActions.save.started({ activityId: action.payload.activityId }));
	});
}

function* cancelSaga(): SagaGenerator<void> {
	yield* takeEvery(SimpleFormActions.onCancel.match, function* (action: Action<SimpleFormActions.CancelPayload>) {
		yield* put(
			ActivityActions.cancelRequested({
				activityIds: [action.payload.activityId]
			})
		);
	});
}
