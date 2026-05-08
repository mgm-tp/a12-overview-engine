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

import { type Middleware } from "redux";

import { onSorted } from "./events/on-sorted.js";
import { onSearched } from "./events/on-searched.js";
import { onPageClicked } from "./events/on-page-clicked.js";
import { onRowsSelected } from "./events/on-row-selected.js";
import { onScrollToRow } from "./events/on-scroll-to-row.js";
import { onDialogClosed } from "./events/on-dialog-closed.js";
import { onFilterChanged } from "./events/on-filter-changed.js";
import { onDialogConfirmed } from "./events/on-dialog-confirmed.js";
import { onNextPageClicked } from "./events/on-next-page-clicked.js";
import { onInfiniteScrolled } from "./events/on-infinite-scrolled.js";
import { onColumnWidthsChanged } from "./events/on-column-widths-changed.js";
import { onPreviousPageClicked } from "./events/on-previous-page-clicked.js";
import { onMultiSelectionCleared } from "./events/on-multi-selection-cleared.js";
import { onRowButtonClickedRequest } from "./events/on-row-button-clicked-request.js";
import { onEventButtonClickedRequest } from "./events/on-event-button-clicked-request.js";
import { onMultiSelectionButtonClicked } from "./events/on-multi-selection-button-clicked.js";
import { onLatestSelectedDocumentIdChanged } from "./events/on-latest-selected-document-id-changed.js";
import { onLatestSelectedDocumentIdsChanged } from "./events/on-latest-selected-document-ids-changed.js";
import { onOverallMultiSelectionButtonClicked } from "./events/on-overall-multi-selection-button-clicked.js";

export function createEngineMiddlewares(): Middleware[] {
	return [
		onRowsSelected,
		onSearched,
		onInfiniteScrolled,
		onPageClicked,
		onNextPageClicked,
		onPreviousPageClicked,
		onFilterChanged,
		onSorted,
		onMultiSelectionButtonClicked,
		onOverallMultiSelectionButtonClicked,
		onMultiSelectionCleared,
		onLatestSelectedDocumentIdChanged,
		onLatestSelectedDocumentIdsChanged,
		onEventButtonClickedRequest,
		onRowButtonClickedRequest,
		onDialogConfirmed,
		onDialogClosed,
		onColumnWidthsChanged,
		onScrollToRow
	];
}
