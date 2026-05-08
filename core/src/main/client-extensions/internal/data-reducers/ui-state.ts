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

import { type Action, type AnyAction } from "typescript-fsa";

import { Activity, type ActivityReducers } from "@com.mgmtp.a12.client/client-core";

import { OverviewEngineActions } from "../actions.js";
import { Commands, uiStateReducer } from "../../../store/index.js";

/** @internal */
export const uiStateDataReducer: ActivityReducers.DataReducer = {
	reduce(
		dataHolders: Activity.DataHolder[],
		action: Action<OverviewEngineActions.CommandPayload | OverviewEngineActions.EventPayload>,
		defaultDataHolder?: Activity.DataHolder
	): Activity.DataHolder[] {
		if (
			!(OverviewEngineActions.command.match(action) || OverviewEngineActions.event.match(action)) ||
			!defaultDataHolder
		) {
			return dataHolders;
		}

		const defaultUiState = defaultDataHolder.slices.uiState;
		const newUiState = uiStateReducer(defaultUiState, action.payload.engineAction);

		const newLoadingState = getNextLoadingState(defaultDataHolder, action.payload.engineAction);

		// If both UI state and loading state are the same as the default, return the original data holders.
		if (defaultUiState === newUiState && newLoadingState === defaultDataHolder.loadingState) {
			return dataHolders;
		}

		return dataHolders.map((dataHolder) => {
			if (Activity.DataHolder.hasDescriptor(dataHolder.descriptor)(defaultDataHolder)) {
				return {
					...dataHolder,
					slices: { ...dataHolder.slices, uiState: newUiState },
					loadingState: newLoadingState
				};
			}

			return dataHolder;
		});
	}
};

/**
 * This function determines the next loading state based on the current data holder's loading state.
 * When a `setQueryParameters` command is received and the current loading state is "without", it will return "missing"
 * to mark the data holder as needed to be loaded. Otherwise, it will return the current loading state.
 */
function getNextLoadingState(dataHolder: Activity.DataHolder, engineAction: AnyAction): Activity.LoadingState {
	if (Commands.setQueryParameters.match(engineAction) && dataHolder.loadingState === "without") {
		return "missing";
	}

	return dataHolder.loadingState;
}
