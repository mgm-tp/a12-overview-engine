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

import type { SagaGenerator } from "typed-redux-saga";

import type { Activity } from "@com.mgmtp.a12.client/client-core";
import type { DocumentModel, DocumentService } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type {
	Query as DSQuery,
	SupportedRequest,
	QueryJsonRpc2Response
} from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { OverviewModel } from "../../../overview-model.js";
import type { Links, JSONDocument } from "../../../models/index.js";
import type { RequestSelectorMap } from "../utils/request-selector-map.js";

export interface OverviewEngineDataLoader {
	buildRequests(params: BuildRequestsParams): MaybeAsync<SupportedRequest[]>;
	handleResponses(params: HandleResponsesParams): MaybeAsync<DataOperation.ResultSet>;
}

export interface BuildRequestsParams {
	activityId: string;
	dataHolderDescriptor?: Activity.DataHolderDescriptor;
	documentService: DocumentService;
	overviewModel: OverviewModel;
	documentModel: DocumentModel;
	requestSelectorMap: RequestSelectorMap;
	queries: DataOperation.Query[];
}

export interface HandleResponsesParams {
	activityId: string;
	dataHolderDescriptor?: Activity.DataHolderDescriptor;
	documentService: DocumentService;
	overviewModel: OverviewModel;
	documentModel: DocumentModel;
	queries: DataOperation.Query[];
	responsesByQueryId: ReadonlyMap<string, QueryJsonRpc2Response>;
	thumbnails?: Record<string, string>;
}

/** @experimental */
export namespace DataOperation {
	export interface ResultSet {
		queryResults: QueryResult[];
	}

	export type Query = ListDocuments.Query | ListStringFilterOptions.Query | Export.Query | BaseQuery;
	export type QueryResult = ListDocuments.Result | ListStringFilterOptions.Result | Export.Result | BaseResult;

	export interface BaseQuery {
		id: string;
		type: string;
	}

	export namespace BaseQuery {
		export function isAssignableFrom(query: unknown): query is BaseQuery {
			return !!query && typeof query === "object" && "id" in query && "type" in query;
		}
	}

	export interface BaseResult {
		id: string;
	}

	export namespace BaseResult {
		export function isAssignableFrom(result: unknown): result is BaseResult {
			return !!result && typeof result === "object" && "id" in result;
		}
	}

	export namespace ListDocuments {
		export interface Paging {
			pageNumbers: number[];
			pageSize: number;
		}

		export interface Query<Operator extends DSQuery.Operator = DSQuery.Operator> extends BaseQuery {
			type: "LIST_DOCUMENTS";
			paging: Paging;
			constraint?: Operator;
			sort?: DSQuery.Order[];
			fields?: string[];
			aggregation?: DSQuery.AggregationProjector;
			links?: DSQuery.QueryLink[];
			exclude?: boolean;
			targetDocumentModel?: string;
		}
		export namespace Query {
			export function isAssignableFrom(query: unknown): query is Query {
				return BaseQuery.isAssignableFrom(query) && query.type === "LIST_DOCUMENTS";
			}
		}

		export interface Result extends BaseResult {
			documents: JSONDocument[];
			/** Resolved document links and their associated documents for reference columns. */
			links?: Links;
			fullSize: number;
			aggregationResult?: QueryJsonRpc2Response.AggregationEntry[];
			thumbnails?: Record<string, string>;
		}
		export namespace Result {
			export function isAssignableFrom(result: unknown): result is Result {
				return BaseResult.isAssignableFrom(result) && "documents" in result;
			}
		}
	}

	export namespace ListStringFilterOptions {
		export interface Query<Operator extends DSQuery.Operator = DSQuery.Operator> extends BaseQuery {
			type: "LIST_STRING_FILTER_OPTIONS";
			paging: DSQuery.Paging;
			constraint?: Operator;
			fields?: string[];
			aggregation?: DSQuery.AggregationProjector;
		}
		export namespace Query {
			export function isAssignableFrom(query: unknown): query is Query {
				return BaseQuery.isAssignableFrom(query) && query.type === "LIST_STRING_FILTER_OPTIONS";
			}
		}

		export interface Result extends BaseResult {
			entries: string[];
			fullSize: number;
		}
		export namespace Result {
			export function isAssignableFrom(result: unknown): result is Result {
				return BaseResult.isAssignableFrom(result) && "entries" in result;
			}
		}
	}

	export namespace Export {
		export interface Query<Operator extends DSQuery.Operator = DSQuery.Operator> extends BaseQuery {
			type: "EXPORT";
			constraint?: Operator;
			sort?: DSQuery.Order[];
		}
		export namespace Query {
			export function isAssignableFrom(query: unknown): query is Query {
				return BaseQuery.isAssignableFrom(query) && query.type === "EXPORT";
			}
		}

		export interface Result extends BaseResult {
			location: string;
		}
		export namespace Result {
			export function isAssignableFrom(result: unknown): result is Result {
				return BaseResult.isAssignableFrom(result) && "location" in result;
			}
		}
	}
	export interface Paging {
		pageNumber: number;
		pageSize: number;
	}
}

/** @experimental */
export type MaybeAsync<T> = T | Promise<T> | SagaGenerator<T>;

/**
 * @experimental
 * Turn the function that return a {@link MaybeAsync} into a type-safe & compatible version of typed-redux-saga
 */
export function maybeAsyncFnWrapper<ReturnType, Params extends unknown[]>(
	fn: (...params: Params) => MaybeAsync<ReturnType>
): (...params: Params) => SagaGenerator<ReturnType> {
	return (...params) => fn(...params) as SagaGenerator<ReturnType>;
}
