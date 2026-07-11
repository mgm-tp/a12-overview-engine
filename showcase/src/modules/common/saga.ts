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

import { all, put, takeEvery, type SagaGenerator } from "typed-redux-saga";

import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import { JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { ActivityActions, NotificationActions } from "@com.mgmtp.a12.client/client-core";
// tag::handleErrorSaga[]
export function* handleErrorSaga(): SagaGenerator<void> {
	yield* takeEvery((action: unknown) => ActivityActions.error.match(action), handle);
}

function* handle(action: Action<ActivityActions.ErrorPayload>): SagaGenerator<void> {
	const { activityId } = action.payload;
	const addNotificationEffects = [];

	if (Array.isArray(action.payload.error) && JsonRpc2Response.hasErrors(action.payload.error)) {
		for (const rpcError of action.payload.error) {
			if (!JsonRpc2Response.error.isInstance(rpcError)) {
				continue;
			}

			const { error } = rpcError;

			if (!JsonRpc2Response.Exception.isInstance(error.data)) {
				continue;
			}

			const notificationAction = NotificationActions.add({
				activityId,
				severity: "error",
				title: {
					key: error.data.title.key,
					defaults: { en: error.data.title.default }
				},
				message: {
					key: error.data.description.key,
					defaults: { en: error.data.description.default }
				}
			});
			addNotificationEffects.push(put(notificationAction));
		}
	}

	yield* all(addNotificationEffects);
}

// end::handleErrorSaga[]
