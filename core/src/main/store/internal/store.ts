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

import type { QueryModel } from "@com.mgmtp.a12.querymodel/querymodel-core";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { OverviewEngineApi } from "../../view/api.js";
import type { OverviewModel } from "../../overview-model.js";

import type { FilterState } from "./filter-state.js";

export type OverviewEngineState = UiState;

export interface UiState {
	readonly pagination?: PaginationState;
	readonly sorting?: Sorting[];
	readonly scrolling?: Scrolling; // This is for infinite scrolling case
	readonly scrollToRow?: ScrollToRowRequest;

	readonly searchString?: string;
	readonly activeFilters?: OverviewEngineApi.FilterMap;
	readonly rowState?: OverviewEngineApi.RowState;
	readonly enumeratedStringFilterMap?: OverviewEngineApi.EnumeratedStringFilterMap;
	readonly columnWidths?: ColumnWidths;
	readonly expandedMultiSelection?: boolean;
	/** @internal */
	readonly dataLoadTriggered?: boolean;
	/** @internal */
	readonly latestSelectedDocumentId?: { readonly documentId: string; readonly linkId?: string } | null;
	/** @internal */
	readonly latestSelectedDocumentIds?: readonly { readonly documentId: string; readonly linkId?: string }[] | null;
	readonly dialog?: OverviewEngineApi.Dialog | null;
	readonly disabled?: boolean;
	readonly showMobileSearchBar?: boolean;

	readonly newFilter?: FilterState;
}

export interface ScrollToRowRequest {
	readonly docRef?: string;
	readonly rowIndex?: number;
	readonly autoFocus?: boolean;
}

export interface RelationshipField {
	readonly relationshipModel: string;
	readonly targetRole: string;
	readonly sortBy: string | RelationshipField;
}

export interface Sorting {
	readonly path: string | RelationshipField;
	readonly order: SortingOrder;
}

export enum SortingOrder {
	ASC = "ASC",
	DESC = "DESC"
}

export interface PaginationState {
	readonly pageSize: number;
	readonly pageNumber: number;
	/**
	 * @internal. This property will be dropped when OverviewEngineApi.Pagination interface gets removed.
	 */
	readonly pageCount?: number;
	/**
	 * @internal. This property will be dropped when OverviewEngineApi.Pagination interface gets removed.
	 */
	readonly rowCount?: number;
}

export interface Scrolling {
	/**
	 * The number of documents to be per page.
	 */
	readonly pageSize: number;
	/**
	 * The list of page to be loaded.
	 * @example
	 * pageNumbers: [0, 1, 2] means that the documents of page 0, 1 and 2 will be loaded.
	 * // Total number of documents will be 3 * pageSize.
	 */
	readonly pageNumbers: number[];
	/**
	 * Range of visible rows - start point
	 */
	readonly visibleStart: number;
	/**
	 * Range of visible rows - end point
	 */
	readonly visibleEnd: number;
}

export interface ColumnWidths {
	readonly [columnId: string]: OverviewModel.Width | undefined;
}

/** @experimental */
export interface ModelsState {
	readonly overviewModel: OverviewModel;
	readonly documentModel: DocumentModel;
	readonly queryModel?: QueryModel;
	readonly subDocumentModels?: DocumentModel[];
	readonly modelGraph?: ModelGraph;
}
