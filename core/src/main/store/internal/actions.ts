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

import { actionCreatorFactory } from "typescript-fsa";

import { type JSONDocument } from "../../models/index.js";
import { type OverviewEngineApi } from "../../view/api.js";
import type { OverviewModel } from "../../overview-model.js";

import {
	type Sorting,
	type Scrolling,
	type ColumnWidths,
	type PaginationState,
	type ScrollToRowRequest
} from "./store.js";

/**
 * Actions which get triggered by a UI Event.
 */
export namespace Events {
	const factory = actionCreatorFactory("EVENT");

	/**
	 *

	/**
	 * Programmatically request scrolling the list to a specific row by either index or docRef.
	 */
	export const onScrollToRow = factory<ScrollToRowPayload>("onScrollToRow");
	export type ScrollToRowPayload =
		| {
				readonly docRef?: string;
				readonly autoFocus?: boolean;
		  }
		| {
				readonly rowIndex?: number;
				readonly autoFocus?: boolean;
		  };

	/** @internal */
	export const onScrollToRowHandled = factory<ScrollToRowHandledPayload>("onScrollToRowHandled");
	/** @internal */
	export interface ScrollToRowHandledPayload {}

	export const onRowsSelected = factory<RowsSelectedPayload>("onRowsSelected");
	export interface RowsSelectedPayload {
		/** Array of document ids and their modified selection states */
		readonly documentsSelection: {
			readonly documentId: string;
			readonly selected: boolean;
		}[];
	}

	export const onSearched = factory<SearchedPayload>("onSearched");
	export interface SearchedPayload {
		readonly searchString: string;
	}

	/**
	 *
	 */
	export const onInfiniteScrolled = factory<InfiniteScrolledPayload>("onInfiniteScrolled");
	export interface InfiniteScrolledPayload {
		readonly scrolling: Scrolling;
	}

	/**
	 *
	 */
	export const onPageClicked = factory<PageClickedPayload>("onPageClicked");
	export interface PageClickedPayload {
		readonly pageNumber: number;
	}

	/**
	 *
	 */
	export const onNextPageClicked = factory<NextPageClickedPayload>("onNextPageClicked");
	export interface NextPageClickedPayload {}

	/**
	 *
	 */
	export const onPreviousPageClicked = factory<PreviousPageClickedPayload>("onPreviousPageClicked");
	export interface PreviousPageClickedPayload {}

	/**
	 *
	 */
	export const onFilterChanged = factory<FilterChangedPayload>("onFilterChanged");
	export interface FilterChangedPayload {
		readonly activeFilters: OverviewEngineApi.FilterMap;
	}

	/**
	 *
	 */
	export const onSorted = factory<SortedPayload>("onSorted");
	export interface SortedPayload {
		readonly sorting?: Sorting[];
	}

	/**
	 *
	 */
	export const onMultiSelectionButtonClicked = factory<MultiSelectionButtonClickedPayload>(
		"onMultiSelectionButtonClicked"
	);
	export interface MultiSelectionButtonClickedPayload {}

	/**
	 *
	 */
	export const onOverallMultiSelectionButtonClicked = factory<OverallMultiSelectionButtonClickedPayload>(
		"onOverallMultiSelectionButtonClicked"
	);
	export interface OverallMultiSelectionButtonClickedPayload {
		readonly affectedRowIds: string[];
		readonly selected: boolean;
	}

	/**
	 *
	 */
	export const onMultiSelectionCleared = factory<MultiSelectionClearedPayload>("onMultiSelectionCleared");
	export interface MultiSelectionClearedPayload {}

	/**
	 * @internal
	 */
	export const onLatestSelectedDocumentIdChanged = factory<LatestSelectedDocumentIdChangedPayload>(
		"onLatestSelectedDocumentIdChanged"
	);
	export interface LatestSelectedDocumentIdChangedPayload {
		readonly latestSelectedDocumentId: string | null;
	}

	/**
	 * @internal
	 */
	export const onLatestSelectedDocumentIdsChanged = factory<LatestSelectedDocumentIdsChangedPayload>(
		"onLatestSelectedDocumentIdsChanged"
	);
	export interface LatestSelectedDocumentIdsChangedPayload {
		readonly latestSelectedDocumentIds: string[] | null;
	}

	/**
	 *
	 *
	 */
	export const onEventButtonClickedRequest = factory<EventButtonClickedRequestPayload>("onEventButtonClickedRequest");
	export interface EventButtonClickedRequestPayload {
		readonly buttonModel: OverviewModel.Button;
		readonly componentKey: string;
	}

	/**
	 *
	 *
	 */
	export const onEventButtonClicked = factory<EventButtonClickedPayload>("onEventButtonClicked");
	export interface EventButtonClickedPayload {
		readonly event: string;
		readonly button?: OverviewModel.Button;
	}

	/**
	 *
	 *
	 */
	export const onRowButtonClickedRequest = factory<RowButtonClickedRequestPayload>("onRowButtonClickedRequest");
	export interface RowButtonClickedRequestPayload {
		readonly row: JSONDocument;
		readonly rowActionModel: OverviewModel.Button;
		readonly componentKey: string;
	}

	/**
	 *
	 *
	 */
	export const onRowButtonClicked = factory<RowButtonClickedPayload>("onRowButtonClicked");
	export interface RowButtonClickedPayload {
		readonly documentId: string;
		readonly rowActionModel: OverviewModel.Button;
	}

	/**
	 *
	 *
	 */
	export const onRowClicked = factory<RowClickedPayload>("onRowClicked");
	export interface RowClickedPayload {
		readonly documentId: string;
		readonly customEvent?: string;
	}

	/**
	 *
	 *
	 */
	export const onColumnWidthsChanged = factory<ColumnWidthsChangedPayload>("onColumnWidthsChanged");
	export interface ColumnWidthsChangedPayload {
		readonly columnWidths: ColumnWidths;
	}

	/**
	 *
	 *
	 */
	export const onDialogConfirmed = factory<DialogConfirmedPayload>("onDialogConfirmed");
	export interface DialogConfirmedPayload {}

	/**
	 *
	 *
	 */
	export const onDialogClosed = factory<DialogClosedPayload>("onDialogClosed");
	export interface DialogClosedPayload {}

	/**
	 *
	 * @internal
	 */
	export const onExport = factory<ExportPayload>("onExport");
	/** @internal */
	export interface ExportPayload {}
}

/**
 * Actions which lead to a state change.
 */
export namespace Commands {
	const factory = actionCreatorFactory("COMMAND");

	/**
	 *
	 */
	export const setRowState = factory<SetRowStatePayload>("setRowState");
	/** Array of document ids and their modified selection states */
	export interface SetRowStatePayload {
		readonly rowState: OverviewEngineApi.RowState;
	}

	/**
	 *
	 *
	 */
	export const setColumnWidths = factory<SetColumnWidthsPayload>("setColumnWidths");
	export interface SetColumnWidthsPayload {
		readonly columnWidths: ColumnWidths;
	}

	/**
	 *
	 *
	 */
	export const setExpandedMultiSelection = factory<SetExpandedMultiSelectionPayload>("setExpandedMultiSelection");
	export interface SetExpandedMultiSelectionPayload {
		readonly expandedMultiSelection: boolean;
	}

	/**
	 * @internal
	 */
	export const setLatestSelectedDocumentId = factory<SetLatestSelectedDocumentIdPayload>("setLatestSelectedDocumentId");
	export interface SetLatestSelectedDocumentIdPayload {
		readonly latestSelectedDocumentId: string | null;
	}

	/**
	 * @internal
	 */
	export const setLatestSelectedDocumentIds =
		factory<SetLatestSelectedDocumentIdsPayload>("setLatestSelectedDocumentIds");
	export interface SetLatestSelectedDocumentIdsPayload {
		readonly latestSelectedDocumentIds: string[] | null;
	}

	/**
	 *
	 *
	 */
	export const setDialog = factory<SetDialogPayload>("setDialog");
	export interface SetDialogPayload {
		readonly dialog: OverviewEngineApi.Dialog | null;
	}

	/**
	 *
	 *
	 */
	export const setDisabled = factory<SetDisabledPayload>("setDisabled");
	export interface SetDisabledPayload {
		readonly disabled: boolean;
	}

	/** @internal */
	export const setQueryParametersName = "setQueryParameters";
	/** @internal */
	export const setQueryParametersCommandName = ["COMMAND", setQueryParametersName].join("/");
	/**
	 *
	 *
	 */
	export const setQueryParameters = factory<SetQueryParametersPayload>(setQueryParametersName);
	export interface SetQueryParametersPayload {
		readonly searchString?: string;
		readonly pagination?: PaginationState;
		readonly scrolling?: Scrolling;
		readonly activeFilters?: OverviewEngineApi.FilterMap;
		readonly sorting?: Sorting[];
	}

	/**
	 * @internal
	 */
	export const setScrollToRow = factory<SetScrollToRowPayload>("setScrollToRow");
	export interface SetScrollToRowPayload {
		readonly scrollToRow?: ScrollToRowRequest;
	}
}

/**
 * Common Overview Engine event name constants.
 * They are used to prevent hard-coded event name strings.
 */
export namespace EventNames {
	export const MULTIPLE_DOCUMENTS_DELETE = "delete_selected";
}
