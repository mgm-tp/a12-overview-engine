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

import { type Selector, LocaleSelectors } from "@com.mgmtp.a12.client/client-core";
import type {
	Query,
	QueryJsonRpc2Request,
	DocumentJsonRpc2Request
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OverviewModel } from "../../../overview-model.js";
import type { DataOperation } from "../data-loader/data-loader.js";

import { isCdm } from "./cdm-utils.js";
import { RequestBuilder } from "./request-builder.js";

/**
 * @experimental Be aware that the API might be changed even in a minor release.
 *
 * Map of request selector factories that can be customized.
 * When customizing, always spread the default factories.
 */
export interface RequestSelectorMap<Operator extends Query.Operator = Query.Operator> {
	/**
	 * Build one QUERY request per requested page for listing documents.
	 */
	loadListDocuments: (
		config: RequestSelectorMap.LoadListDocumentsConfig<Operator>
	) => Selector<QueryJsonRpc2Request<RequestSelectorMap.LoadDocumentEntries>[]>;
	/**
	 * Build a single QUERY request that computes aggregation for the current list context.
	 */
	loadSummary: (
		config: RequestSelectorMap.LoadSummaryConfig<Operator>
	) => Selector<QueryJsonRpc2Request<RequestSelectorMap.LoadAggregationEntries>>;
	/**
	 * Build a single QUERY request to retrieve filter options for a string field via aggregation.
	 */
	loadListStringFilterOptions: (
		config: RequestSelectorMap.LoadListStringFilterOptionsConfig<Operator>
	) => Selector<QueryJsonRpc2Request<RequestSelectorMap.LoadAggregationEntries>>;
	/**
	 * Build a single QUERY request to trigger the export.
	 */
	export: (
		config: RequestSelectorMap.ExportConfig<Operator>
	) => Selector<QueryJsonRpc2Request<RequestSelectorMap.ExportQueryRoot>>;
	/**
	 * Build a single request to delete a document by docRef.
	 */
	deleteDocument: (
		config: RequestSelectorMap.DeleteDocumentConfig
	) => Selector<DocumentJsonRpc2Request.DeleteJsonRpc2Request>;
	/**
	 * Build a single request to delete multiple documents by docRefs.
	 */
	deleteMultiDocuments: (
		config: RequestSelectorMap.DeleteMultiDocumentsConfig
	) => Selector<DocumentJsonRpc2Request.MultiDeleteJsonRpc2Request>;
}

export namespace RequestSelectorMap {
	/**
	 * @experimental
	 */
	export type ExportQueryRoot = Omit<Query.QueryRoot, "aggregation"> & {
		projectionName: "exportCddCsv";
	};

	/**
	 * @experimental
	 */
	export type LoadDocumentEntries = Omit<Query.QueryRoot, "aggregation"> & {
		projectionName: "cdd" | "document";
	};

	/**
	 * @experimental
	 */
	export type LoadAggregationEntries = Query.QueryRoot & {
		projectionName: "cdd" | "document";
		aggregation: NonNullable<Query.QueryRoot["aggregation"]>;
	};

	export interface BaseRequestConfig {
		activityId: string;
		documentModel: DocumentModel;
		overviewModel: OverviewModel;
	}
	export interface LoadListDocumentsConfig<Operator extends Query.Operator = Query.Operator> extends BaseRequestConfig {
		query: DataOperation.ListDocuments.Query<Operator>;
	}
	export interface LoadSummaryConfig<Operator extends Query.Operator = Query.Operator> extends BaseRequestConfig {
		query: DataOperation.ListDocuments.Query<Operator>;
	}
	export interface LoadListStringFilterOptionsConfig<
		Operator extends Query.Operator = Query.Operator
	> extends BaseRequestConfig {
		query: DataOperation.ListStringFilterOptions.Query<Operator>;
	}
	export interface ExportConfig<Operator extends Query.Operator = Query.Operator> extends BaseRequestConfig {
		query: DataOperation.Export.Query<Operator>;
	}
	export interface DeleteDocumentConfig extends BaseRequestConfig {
		docRef: string;
	}
	export interface DeleteMultiDocumentsConfig extends BaseRequestConfig {
		docRefs: string[];
	}
}

export const DefaultRequestSelectorMap: RequestSelectorMap = {
	loadListDocuments: (config) => () => {
		const { query, documentModel } = config;
		const projectionName = computeProjectionName(documentModel);
		const targetDocumentModel = query.targetDocumentModel ?? documentModel.header.id;

		return query.paging.pageNumbers.map((pageNumber) =>
			RequestBuilder.query(query.id, {
				query: {
					projectionName,
					targetDocumentModel,
					paging: { pageSize: query.paging.pageSize, pageNumber },
					constraint: query.constraint,
					sort: query.sort,
					fields: query.fields,
					links: query.links,
					exclude: query.exclude
				}
			})
		);
	},
	loadSummary: (config) => () => {
		const { query, documentModel } = config;
		const projectionName = computeProjectionName(documentModel);

		if (!query.aggregation) {
			throw new Error(`Invalid summary query, missing aggregation`);
		}

		return RequestBuilder.query(`${query.id}-aggregation`, {
			query: {
				projectionName,
				targetDocumentModel: documentModel.header.id,
				paging: { pageSize: 1, pageNumber: 0 },
				constraint: query.constraint,
				aggregation: query.aggregation
			}
		});
	},
	loadListStringFilterOptions: (config) => () => {
		const { query, documentModel } = config;
		const projectionName = computeProjectionName(documentModel);

		if (!query.aggregation) {
			throw new Error(`Invalid summary query, missing aggregation`);
		}

		return RequestBuilder.query(query.id, {
			query: {
				projectionName,
				targetDocumentModel: documentModel.header.id,
				paging: query.paging,
				constraint: query.constraint,
				aggregation: query.aggregation
			}
		});
	},
	export: (config) => () => {
		const { query, documentModel } = config;

		if (!isCdm(documentModel)) {
			throw new Error(`Invalid a CDM model, given: "${documentModel.header.id}".`);
		}

		return RequestBuilder.query(query.id, {
			query: {
				projectionName: "exportCddCsv",
				targetDocumentModel: documentModel.header.id,
				paging: { pageNumber: 0, pageSize: 1 },
				constraint: query.constraint,
				sort: query.sort
			}
		});
	},
	deleteDocument: (config) => (state) => {
		const { docRef } = config;
		const locale = LocaleSelectors.locale()(state);

		return RequestBuilder.deleteDocument("DeleteDocument-" + docRef, docRef, locale);
	},
	deleteMultiDocuments: (config) => () => {
		const { docRefs } = config;

		return RequestBuilder.deleteDocuments("DeleteMultiDocuments", docRefs);
	}
};

function computeProjectionName(documentModel: DocumentModel) {
	return isCdm(documentModel) ? "cdd" : "document";
}
