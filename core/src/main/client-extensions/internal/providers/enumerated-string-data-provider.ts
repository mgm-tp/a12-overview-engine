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

import { put, call, select, type SagaGenerator } from "typed-redux-saga";

import { LocaleSelectors } from "@com.mgmtp.a12.client/client-core";
import type { DataProvider } from "@com.mgmtp.a12.client/client-core";
import { Query, Dispatcher, type QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";

import { OverviewEngineActions } from "../actions.js";
import { EnumeratedStringDataHolder } from "../data-holder.js";
import { DataOperation, maybeAsyncFnWrapper, type OverviewEngineDataLoader } from "../data-loader/data-loader.js";
import { OverviewEngineSelectors } from "../selectors.js";
import { type RequestSelectorMap, DefaultRequestSelectorMap } from "../utils/request-selector-map.js";

import { getModels } from "./overview-engine-data-provider.js";
import type { DataProvidersConfig } from "./types.js";

const NAME = "EnumeratedStringDataProvider";
let counter = 0;

/** @internal */
export class EnumeratedStringDataProvider implements DataProvider {
	public readonly name = NAME;
	private documentService = new DocumentServiceFactory().getDocumentService();
	private readonly requestSelectorMap: RequestSelectorMap;

	constructor(
		private dataLoader: OverviewEngineDataLoader,
		protected config?: DataProvidersConfig
	) {
		this.requestSelectorMap = config?.requestSelectorMap ?? DefaultRequestSelectorMap;
	}
	canHandle({ operation, dataHolder }: DataProvider.CanHandleConfig) {
		return operation === "load" && EnumeratedStringDataHolder.isInstance(dataHolder);
	}

	*provideData(config: DataProvider.ProvideDataConfig): SagaGenerator<void> {
		if (config.operation === "load") {
			yield* call(this.loadData.bind(this), config);

			return;
		}

		throw new Error(`Unsupported operation: ${config.operation}`);
	}

	private *loadData(config: DataProvider.LoadConfig): SagaGenerator<void> {
		const { overviewModel, documentModel, subDocumentModels, queryModel } = yield* call(getModels, config.activityId);
		const enumeratedStringData = config.dataHolders.find(EnumeratedStringDataHolder.isInstance)?.data;

		if (!enumeratedStringData) {
			throw new Error("Cannot find any enumerated string data");
		}

		const { keyword, fieldPath, candidates, reload, modelId } = enumeratedStringData;

		const requestId = `${NAME}-${counter++}`;

		const pageSize = overviewModel.content.configuration.filterConfiguration?.enumeratedStringFilter?.pagingSize ?? 10;

		const pageNumber = candidates.length / pageSize;

		if (!Number.isSafeInteger(pageNumber)) {
			const current = candidates.length;
			throw new Error(`Internal error, invalid pageNumber, current length: ${current}, default size: ${pageSize}.`);
		}

		const paging: DataOperation.Paging = {
			pageNumber: reload ? 0 : pageNumber,
			pageSize
		};
		const uiState = yield* select(
			OverviewEngineSelectors.uiState(config.activityId, {
				filterStateSelectors: this.config?.filterStateSelectors
			})
		);

		const constraint = QueryBuilder.and(
			queryModel?.content.constraint,
			QueryBuilder.simpleSearch(uiState.searchString),
			QueryBuilder.simpleSearch(keyword, [fieldPath])
		).build();

		const query: DataOperation.ListStringFilterOptions.Query = {
			id: requestId,
			type: "LIST_STRING_FILTER_OPTIONS",
			paging,
			constraint,
			aggregation: {
				aggregations: [{ function: Query.AGGREGATIONS.COUNT_FUNCTION, field: fieldPath }],
				group: [{ field: fieldPath, alias: "name" }]
			}
		};

		const targetDocumentModel = modelId
			? (subDocumentModels?.find((m) => m.header.id === modelId) ?? documentModel)
			: documentModel;

		const buildParams = {
			activityId: config.activityId,
			documentService: this.documentService,
			requestSelectorMap: this.requestSelectorMap,
			documentModel: targetDocumentModel,
			overviewModel,
			queries: [query]
		};

		const requests = yield* call(maybeAsyncFnWrapper(this.dataLoader.buildRequests.bind(this.dataLoader)), buildParams);
		const { language } = yield* select(LocaleSelectors.locale());
		const responses = yield* call(() => Dispatcher.rpc(language, requests));
		const responsesByQueryId: ReadonlyMap<string, QueryJsonRpc2Response> = new Map(
			requests.map((r, i) => [String(r.id), (responses as QueryJsonRpc2Response[])[i]])
		);
		const { queryResults } = yield* call(maybeAsyncFnWrapper(this.dataLoader.handleResponses.bind(this.dataLoader)), {
			...buildParams,
			responsesByQueryId
		});

		const [queryResult] = queryResults;

		if (!DataOperation.ListStringFilterOptions.Result.isAssignableFrom(queryResult)) {
			throw new Error(`Invalid ListTerm result. ${JSON.stringify(queryResult)}`);
		}

		yield* put(
			OverviewEngineActions.setEnumeratedStringCandidates({
				activityId: config.activityId,
				fieldPath,
				candidates: queryResult.entries,
				fullSize: queryResult.fullSize
			})
		);
	}
}
