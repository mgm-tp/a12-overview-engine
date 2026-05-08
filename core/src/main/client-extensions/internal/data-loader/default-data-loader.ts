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

import { call, select, type SagaGenerator } from "typed-redux-saga";

import { LocaleSelectors } from "@com.mgmtp.a12.client/client-core";
import { Dispatcher, type SupportedRequest } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { DataServicesSelectors } from "@com.mgmtp.a12.dataservices/dataservices-access/lib/monitor/redux/selector.js";
import { convertThumbnailResponse } from "@com.mgmtp.a12.client/client-core/lib/core/activity/a12-internal/thumbnails/slice.js";

import { RequestBuilder } from "../utils/request-builder.js";
import { RequestValidator } from "../utils/request-validator.js";
import { isCdm, removeModelNameFromRef } from "../utils/cdm-utils.js";
import { type RequestSelectorMap } from "../utils/request-selector-map.js";
import { OverviewEngineInternalConstants } from "../../../shared/constants.js";

import {
	DataOperation,
	type ProvideDataParams,
	type ProvideDataResults,
	type OverviewEngineDataLoader
} from "./data-loader.js";

/** @internal */
export const defaultDataLoader: OverviewEngineDataLoader = {
	*provideData(params: ProvideDataParams): ProvideDataResults {
		const queryResults: DataOperation.QueryResult[] = [];

		for (const query of params.queries) {
			if (DataOperation.ListDocuments.Query.isAssignableFrom(query)) {
				queryResults.push(yield* call(handleListDocuments, query, params));
			}

			if (DataOperation.ListStringFilterOptions.Query.isAssignableFrom(query)) {
				queryResults.push(yield* call(handleListStringFilterOptions, query, params));
			}

			if (DataOperation.Export.Query.isAssignableFrom(query)) {
				queryResults.push(yield* call(handleExport, query, params));
			}
		}

		return { queryResults };
	}
};

function splitTail<A, B>(list: [...A[], B]): [A[], B] {
	const last = list[list.length - 1] as B;
	const rest = list.slice(0, -1) as A[];

	return [rest, last];
}

function* getMaxRequests(): SagaGenerator<number | undefined> {
	const maxRequests = yield* select(
		DataServicesSelectors.configurationByKey(OverviewEngineInternalConstants.MAX_METHOD_CALLS_PER_REQUEST_KEY)
	);

	return maxRequests !== undefined ? Number(maxRequests) : undefined;
}

type RpcRequest = SupportedRequest | undefined;

function dispatchWithRequestCheck<Requests extends RpcRequest[]>(
	language: string,
	requests: [...Requests],
	maxRequests: number | undefined
): ReturnType<typeof Dispatcher.rpc<Requests>> {
	if (maxRequests !== undefined) {
		RequestValidator.assertValidRequestCount(requests, maxRequests);
	}

	return Dispatcher.rpc(language, requests);
}

function* handleListDocuments(
	query: DataOperation.ListDocuments.Query,
	params: ProvideDataParams
): SagaGenerator<DataOperation.ListDocuments.Result> {
	const { documentService, documentModel, overviewModel, activityId, requestSelectorMap } = params;

	const { language } = yield* select(LocaleSelectors.locale());
	const state = yield* select();
	const maxRequests = yield* call(getMaxRequests);

	const payload: RequestSelectorMap.LoadListDocumentsConfig = { activityId, query, documentModel, overviewModel };
	const listDocumentsRequests = requestSelectorMap.loadListDocuments(payload)(state);
	const summaryRequest = query.aggregation ? requestSelectorMap.loadSummary(payload)(state) : undefined;

	const [summaryResponse, ...listDocumentsAndThumbnailsResponses] = yield* call(() =>
		dispatchWithRequestCheck(
			language,
			[summaryRequest, ...listDocumentsRequests, RequestBuilder.loadThumbnailURLs()],
			maxRequests
		)
	);
	const [listDocumentsResponses, thumbnailsResponse] = splitTail(listDocumentsAndThumbnailsResponses);

	const documents = listDocumentsResponses.flatMap((response) =>
		response.result.entries.map(({ document, docRef, documentModelName: modelId }) => {
			return {
				...documentService.parseDates(document, documentModel),
				id: isCdm(documentModel) ? removeModelNameFromRef(docRef) : docRef,
				modelId
			};
		})
	);

	return {
		id: query.id,
		documents,
		fullSize: listDocumentsResponses[0].result.fullSize,
		aggregationResult: summaryResponse?.result.entries,
		thumbnails: convertThumbnailResponse(thumbnailsResponse)
	};
}

function* handleListStringFilterOptions(
	query: DataOperation.ListStringFilterOptions.Query,
	params: ProvideDataParams
): SagaGenerator<DataOperation.ListStringFilterOptions.Result> {
	const { documentModel, requestSelectorMap, activityId, overviewModel } = params;
	const { language } = yield* select(LocaleSelectors.locale());
	const state = yield* select();

	const [response] = yield* call(() =>
		Dispatcher.rpc(language, [
			requestSelectorMap.loadListStringFilterOptions({ activityId, query, documentModel, overviewModel })(state)
		])
	);

	if (!response) {
		throw new Error("Missing response for loadListStringFilterOptions");
	}

	return {
		id: query.id,
		fullSize: response.result.fullSize,
		entries: response.result.entries.map(({ document: [term] }) => term as string)
	};
}

/** @internal */
export function* handleExport(
	query: DataOperation.Export.Query,
	params: ProvideDataParams
): SagaGenerator<DataOperation.Export.Result> {
	const { documentModel, requestSelectorMap, activityId, overviewModel } = params;

	const state = yield* select();
	const { language } = yield* select(LocaleSelectors.locale());

	const request = requestSelectorMap.export({ activityId, query, documentModel, overviewModel })(state);
	const [exportResponse] = yield* call(() => Dispatcher.rpc(language, [request]));

	return { id: query.id, location: exportResponse.result.otherResults.downloadUrl };
}
