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
import { put, call, select, takeLatest, type SagaGenerator } from "typed-redux-saga";

import { ActivitySelectors, NotificationActions } from "@com.mgmtp.a12.client/client-core";
import { type Action, actionCreatorFactory } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";
import {
	Events,
	OverviewEngineActions,
	EnumeratedStringDataHolder
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { SHOWCASE_RESOURCE_KEYS } from "../../config/resources.js";

export const ProductOverviewSagas = [rowClickSaga, customEnumeratedStringSearchingSaga];

// tag::handleCustomRowActionSaga[]
function* rowClickSaga(): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return OverviewEngineActions.event.match(action) && Events.onRowClicked.match(action.payload.engineAction);
	}, handleRowButtonClick);
}

function* handleRowButtonClick(
	action: Action<OverviewEngineActions.EventPayload<Action<Events.RowClickedPayload>>>
): SagaGenerator<void> {
	const { documentId } = action.payload.engineAction.payload;

	yield* put(
		NotificationActions.add({
			severity: "info",
			duration: 5000,
			title: { key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event.title },
			message: {
				key: SHOWCASE_RESOURCE_KEYS.showcase.notifications.event.documentClickMessage,
				args: {
					instanceId: { type: "plain", value: documentId }
				}
			}
		})
	);
}
// end::handleCustomRowActionSaga[]

const factory = actionCreatorFactory("ProductShowcase");
// tag::customEnumeratedStringQueryAction[]
export const customEnumeratedStringQuery = factory<OverviewEngineActions.EnumeratedStringQueryParametersChangedPayload>(
	"CUSTOM_ENUMERATED_STRING_QUERY"
);
// end::customEnumeratedStringQueryAction[]

// tag::customEnumeratedStringSearchingSaga[]
function* customEnumeratedStringSearchingSaga(): SagaGenerator<void> {
	yield* takeLatest((action: unknown) => {
		return customEnumeratedStringQuery.match(action);
	}, handleCustomEnumeratedStringSearching);
}

function* handleCustomEnumeratedStringSearching(
	action: Action<OverviewEngineActions.EnumeratedStringQueryParametersChangedPayload>
): SagaGenerator<void> {
	const { activityId, fieldPath, keyword, nextPage } = action.payload;
	const activity = yield* select(ActivitySelectors.activityById(activityId));

	if (!activity) {
		throw new Error(`No activity found for id ${activityId}.`);
	}

	// Find data holder for enumeratedStringFilterMap by current fieldPath
	const dataHolder = activity.dataHolders?.find(
		(dataHolder) => EnumeratedStringDataHolder.isInstance(dataHolder) && dataHolder.descriptor.fieldPath === fieldPath
	);

	if (!dataHolder) {
		// Create data holder if not exists
		yield* put(
			OverviewEngineActions.createEnumeratedStringDataHolder({
				data: { fieldPath, keyword, candidates: [] },
				activityId,
				descriptor: EnumeratedStringDataHolder.createDescriptor(fieldPath)
			})
		);
	} else {
		// clean data holder before updating, no need to do it if using enumeratedStringQueryParametersChanged
		yield* put(
			OverviewEngineActions.setEnumeratedStringCandidates({
				activityId,
				fieldPath,
				fullSize: 0,
				candidates: []
			})
		);
	}

	// Get list of candidates and ful size by keyword.
	const { candidates: newCandidates, fullSize } = yield* call(requestCandidates, fieldPath, keyword, nextPage);

	// Update the candidates and fullSize
	yield* put(
		OverviewEngineActions.setEnumeratedStringCandidates({
			activityId,
			fieldPath,
			fullSize,
			candidates: newCandidates
		})
	);
}

async function requestCandidates(
	fieldPath: string,
	keyword: string,
	nextPage: boolean
): Promise<{ candidates: string[]; fullSize: number }> {
	const fullCandidates = ["barcode", "customized system number"];
	const candidatesByKeyword = fullCandidates.filter((candidate) => candidate.includes(keyword));

	return Promise.resolve({ candidates: !nextPage ? candidatesByKeyword : [], fullSize: candidatesByKeyword.length });
}

// end::customEnumeratedStringSearchingSaga[]
