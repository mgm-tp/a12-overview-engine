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

import { type Dispatch } from "redux";

import { Events } from "../../store/index.js";
import { type OverviewEngineApi } from "../api.js";
import type { OverviewModel } from "../../overview-model.js";

export function defaultMapDispatchToEventHandlers(dispatch: Dispatch): OverviewEngineApi.EventHandlers {
	return {
		onMultiSelectionClear() {
			dispatch(Events.onMultiSelectionCleared({}));
		},
		onRowsSelect(params) {
			dispatch(Events.onRowsSelected({ documentsSelection: params }));
		},
		onOverallMultiSelectionButtonClick(params) {
			dispatch(Events.onOverallMultiSelectionButtonClicked(params));
		},
		onMultiSelectionButtonClick() {
			dispatch(Events.onMultiSelectionButtonClicked({}));
		},
		onLatestSelectedDocumentIdChange(params) {
			dispatch(Events.onLatestSelectedDocumentIdChanged({ latestSelectedDocumentId: params.latestSelectedDocumentId }));
		},
		onLatestSelectedDocumentIdsChange(params) {
			dispatch(
				Events.onLatestSelectedDocumentIdsChanged({ latestSelectedDocumentIds: params.latestSelectedDocumentIds })
			);
		},
		onEventButtonClickRequest(params) {
			dispatch(Events.onEventButtonClickedRequest(params));
		},
		onEventButtonClick(event: string, button?: OverviewModel.Button) {
			dispatch(Events.onEventButtonClicked({ event, button }));
		},
		onRowButtonClickRequest(params) {
			dispatch(Events.onRowButtonClickedRequest(params));
		},
		onRowButtonClick(params) {
			dispatch(Events.onRowButtonClicked(params));
		},
		onRowClick(params) {
			dispatch(Events.onRowClicked(params));
		},
		onColumnWidthsChange(params) {
			dispatch(Events.onColumnWidthsChanged({ columnWidths: params.columnWidths }));
		},
		onSearch(params) {
			dispatch(Events.onSearched({ searchString: params }));
		},
		onInfiniteScroll(params) {
			dispatch(Events.onInfiniteScrolled(params));
		},
		onScrollToRowHandled() {
			dispatch(Events.onScrollToRowHandled({}));
		},
		onPageChange(params) {
			dispatch(Events.onPageClicked({ pageNumber: params }));
		},
		onNextPageClick() {
			dispatch(Events.onNextPageClicked({}));
		},
		onPreviousPageClick() {
			dispatch(Events.onPreviousPageClicked({}));
		},
		onFilterChange(params) {
			dispatch(Events.onFilterChanged({ activeFilters: params }));
		},
		onSort(params) {
			dispatch(Events.onSorted(params));
		},
		onDialogConfirm() {
			dispatch(Events.onDialogConfirmed({}));
		},
		onDialogClose() {
			dispatch(Events.onDialogClosed({}));
		}
	};
}
