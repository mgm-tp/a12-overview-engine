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

import { createSelector } from "reselect";

import { type OverviewEngineApi } from "../../../view/api.js";
import {
	type UiState,
	type Sorting,
	type Scrolling,
	type ColumnWidths,
	type PaginationState,
	type ScrollToRowRequest
} from "../store.js";

import { type Selector } from "./selector.js";

/**
 * These selectors provide access to the ui state in the store
 */
export namespace UiStateSelector {
	export function rowState(): Selector<OverviewEngineApi.RowState | undefined, UiState> {
		return (state) => state.rowState;
	}

	export function totalSelectedRows(): Selector<number, UiState> {
		return (state) => totalSelectedRowsSelector(state);
	}

	export function hasSelectedRow(): Selector<boolean, UiState> {
		return (state) => totalSelectedRowsSelector(state) > 0;
	}

	const totalSelectedRowsSelector = createSelector([(state: UiState) => state.rowState], (rowState) => {
		return Object.values(rowState ?? {}).filter((row) => row.selected).length;
	});

	export function columnWidths(): Selector<ColumnWidths | undefined, UiState> {
		return (state) => state.columnWidths;
	}

	export function expandedMultiSelection(): Selector<boolean, UiState> {
		return (state) => !!state.expandedMultiSelection;
	}

	/** @internal */
	export function latestSelectedDocumentId(): Selector<string | null, UiState> {
		return (state) => state.latestSelectedDocumentId ?? null;
	}

	/** @internal */
	export function latestSelectedDocumentIds(): Selector<string[] | null, UiState> {
		return (state) => state.latestSelectedDocumentIds ?? null;
	}

	export function dialog(): Selector<OverviewEngineApi.Dialog | null, UiState> {
		return (state) => state.dialog ?? null;
	}

	export function searchString(): Selector<string | undefined, UiState> {
		return (state) => state.searchString;
	}

	export function sorting(): Selector<Sorting[] | undefined, UiState> {
		return (state) => state.sorting;
	}

	export function scrolling(): Selector<Scrolling | undefined, UiState> {
		return (state) => state.scrolling;
	}

	export function activeFilters(): Selector<OverviewEngineApi.FilterMap | undefined, UiState> {
		return (state) => state.activeFilters;
	}

	export function enumeratedStringFilterMap(): Selector<
		OverviewEngineApi.EnumeratedStringFilterMap | undefined,
		UiState
	> {
		return (state) => state.enumeratedStringFilterMap;
	}

	export function pagination(): Selector<PaginationState | undefined, UiState> {
		return (state) => state.pagination;
	}

	/** @internal */
	export function queryParameters(): Selector<
		Pick<UiState, "searchString" | "sorting" | "scrolling" | "activeFilters" | "pagination">,
		UiState
	> {
		return (state) => {
			return {
				searchString: state.searchString,
				sorting: state.sorting,
				scrolling: state.scrolling,
				activeFilters: state.activeFilters,
				pagination: state.pagination
			};
		};
	}

	export function disabled(): Selector<boolean, UiState> {
		return (state) => !!state.disabled;
	}

	export function scrollToRow(): Selector<ScrollToRowRequest | undefined, UiState> {
		return (state) => state.scrollToRow;
	}
}
