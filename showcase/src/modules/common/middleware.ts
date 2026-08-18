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

// tag::presetFilterMiddleware[]

import { isEqual } from "lodash-es";
import { type Middleware } from "redux";

import { type Activity, ActivityActions } from "@com.mgmtp.a12.client/client-core";
import {
	type UiState,
	OverviewEngineActions,
	type OverviewEngineApi
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

export const createInitialUiStateMiddleware: (
	initialUiState: UiState,
	targetDescriptor: Activity.Descriptor,
	skipInitialLoad?: boolean
) => Middleware = (initialUiState, targetDescriptor, skipInitialLoad) => () => (next) => (action) => {
	if (ActivityActions.push.match(action)) {
		const { activity } = action.payload;

		if (!isTargetOverviewActivity(activity, targetDescriptor) || !isSliceEmpty(activity)) {
			return next(action);
		}

		return next(
			OverviewEngineActions.createActivity(
				{
					activityId: activity.id,
					activityDescriptor: activity.descriptor,
					loadingState: skipInitialLoad ? "without" : "missing"
				},
				initialUiState
			)
		);
	}

	return next(action);
};

export const createPresetFilterMiddleware = (
	presetFilter: OverviewEngineApi.FilterMap,
	targetDescriptor: Activity.Descriptor,
	skipInitialLoad?: boolean
): Middleware => createInitialUiStateMiddleware({ activeFilters: presetFilter }, targetDescriptor, skipInitialLoad);

function isTargetOverviewActivity(activity: Activity, targetDescriptor: Activity.Descriptor) {
	return isEqual(activity.descriptor, targetDescriptor);
}

function isSliceEmpty(activity: Activity) {
	return Object.keys(activity.dataHolders?.[0].slices ?? {}).length === 0;
}

// end::presetFilterMiddleware[]
