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

import { Commands } from "../actions.js";
import type { UiState } from "../store.js";

import { handleSetColumnWidths } from "./handler/set-column-widths.js";
import { handleSetDialog } from "./handler/set-dialog.js";
import { handleSetDisabled } from "./handler/set-disabled.js";
import { handleSetExpandedMultiSelection } from "./handler/set-expanded-multi-selection.js";
import { handleSetFilterOptions } from "./handler/set-filter-options.js";
import { handleSetFilterState } from "./handler/set-filter-state.js";
import { handleSetLatestSelectedDocumentId } from "./handler/set-latest-selected-document-id.js";
import { handleSetLatestSelectedDocumentIds } from "./handler/set-latest-selected-document-ids.js";
import { handleSetMobileSearchBar } from "./handler/set-mobile-search-bar.js";
import { handleSetQueryParametersChanged } from "./handler/set-query-parameters-changed.js";
import { setRowState } from "./handler/set-row-state.js";
import { handleSetScrollToRow } from "./handler/set-scroll-to-row.js";

export function uiStateReducer(state: UiState | undefined, action: UnknownAction): UiState {
	if (state === undefined) {
		return {};
	} else if (Commands.setRowState.match(action)) {
		return setRowState(state, action);
	} else if (Commands.setColumnWidths.match(action)) {
		return handleSetColumnWidths(state, action);
	} else if (Commands.setExpandedMultiSelection.match(action)) {
		return handleSetExpandedMultiSelection(state, action);
	} else if (Commands.setLatestSelectedDocumentId.match(action)) {
		return handleSetLatestSelectedDocumentId(state, action);
	} else if (Commands.setLatestSelectedDocumentIds.match(action)) {
		return handleSetLatestSelectedDocumentIds(state, action);
	} else if (Commands.setDialog.match(action)) {
		return handleSetDialog(state, action);
	} else if (Commands.setDisabled.match(action)) {
		return handleSetDisabled(state, action);
	} else if (Commands.setMobileSearchBar.match(action)) {
		return handleSetMobileSearchBar(state, action);
	} else if (Commands.setQueryParameters.match(action)) {
		return handleSetQueryParametersChanged(state, action);
	} else if (Commands.setScrollToRow.match(action)) {
		return handleSetScrollToRow(state, action);
	} else if (Commands.setFilterState.match(action)) {
		return handleSetFilterState(state, action);
	} else if (Commands.setFilterOptions.match(action)) {
		return handleSetFilterOptions(state, action);
	}

	return state;
}
