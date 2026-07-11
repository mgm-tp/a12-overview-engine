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

import type { Dispatch } from "redux";

import { Events } from "../../store/index.js";
import type { OverviewEngineApi } from "../api.js";
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
			dispatch(Events.onOverallMultiSelectionButtonClicked({ documentsSelection: params }));
		},
		onMultiSelectionButtonClick() {
			dispatch(Events.onMultiSelectionButtonClicked({}));
		},
		onLatestSelectedDocumentIdChange(params) {
			dispatch(Events.onLatestSelectedDocumentIdChanged(params));
		},
		onLatestSelectedDocumentIdsChange(params) {
			dispatch(Events.onLatestSelectedDocumentIdsChanged(params));
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
			dispatch(Events.onColumnWidthsChanged(params));
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
		},
		onMobileSearchBarToggle(params) {
			dispatch(Events.onMobileSearchBarToggle(params));
		},
		newFilter: {
			onFilterSelectorOptionsChanged(params): void {
				dispatch(Events.NewFilter.onFilterSelectorOptionsChanged(params));
			},
			onFilterOptionsChanged(params): void {
				dispatch(Events.NewFilter.onFilterOptionsChanged(params));
			},
			onFilterItemOptionsChanged<Options = object>(params: Events.NewFilter.FilterItemOptionsChangedPayload<Options>) {
				dispatch(
					Events.NewFilter.onFilterItemOptionsChanged(
						params as Events.NewFilter.FilterItemOptionsChangedPayload<object>
					)
				);
			},
			onFilterSelectorAllApplied() {
				dispatch(Events.NewFilter.onFilterSelectorAllApplied());
			},
			onFilterItemEditApplied() {
				dispatch(Events.NewFilter.onFilterItemEditApplied());
			},
			onFilterItemReset(params) {
				dispatch(Events.NewFilter.onFilterItemReset(params));
			},
			onFilterSelectorReset() {
				dispatch(Events.NewFilter.onFilterSelectorReset());
			},
			onFilterBarReset() {
				dispatch(Events.NewFilter.onFilterBarReset());
			},
			onFilterSelectorVisibilityChanged(params) {
				dispatch(Events.NewFilter.onFilterSelectorVisibilityChanged(params));
			},
			onFilterItemEditStarted(params) {
				dispatch(Events.NewFilter.onFilterItemEditStarted(params));
			},
			onFilterItemEditCanceled(params) {
				dispatch(Events.NewFilter.onFilterItemEditCanceled(params));
			},
			onFilterCollapsedChanged(params) {
				dispatch(Events.NewFilter.onFilterCollapsedChanged(params));
			},
			onFilterBarItemsOverflowed(params) {
				dispatch(Events.NewFilter.onFilterBarItemsOverflowed(params));
			},
			onFilterItemSettingsOpened(params) {
				dispatch(Events.NewFilter.onFilterItemSettingsOpened(params));
			},
			onFilterItemSettingsClosed() {
				dispatch(Events.NewFilter.onFilterItemSettingsClosed({}));
			}
		}
	};
}
