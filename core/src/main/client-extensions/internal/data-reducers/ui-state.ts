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

import { Activity, type ActivityReducers } from "@com.mgmtp.a12.client/client-core";
import type { Action } from "@com.mgmtp.a12.client/typescript-fsa-redux-5-compat";

import { uiStateReducer } from "../../../store/index.js";
import { OverviewEngineActions } from "../actions.js";

/** @internal */
export const uiStateDataReducer: ActivityReducers.DataReducer = {
	reduce(
		dataHolders: Activity.DataHolder[],
		action: Action<OverviewEngineActions.CommandPayload | OverviewEngineActions.EventPayload>,
		defaultDataHolder?: Activity.DataHolder
	): Activity.DataHolder[] {
		if (!(OverviewEngineActions.command.match(action) || OverviewEngineActions.event.match(action))) {
			return dataHolders;
		}

		const targetDataHolder = action.payload.dataHolderDescriptor
			? dataHolders.find(Activity.DataHolder.hasDescriptor(action.payload.dataHolderDescriptor))
			: defaultDataHolder;

		if (!targetDataHolder) {
			return dataHolders;
		}

		const defaultUiState = targetDataHolder.slices.uiState;
		const newUiState = uiStateReducer(defaultUiState, action.payload.engineAction);

		// If the UI state is the same as the default, return the original data holders.
		if (defaultUiState === newUiState) {
			return dataHolders;
		}

		return dataHolders.map((dataHolder) => {
			if (Activity.DataHolder.hasDescriptor(dataHolder.descriptor)(targetDataHolder)) {
				return {
					...dataHolder,
					slices: { ...dataHolder.slices, uiState: newUiState }
				};
			}

			return dataHolder;
		});
	}
};
