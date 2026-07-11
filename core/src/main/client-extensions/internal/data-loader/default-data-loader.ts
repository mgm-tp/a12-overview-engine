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

import { select, type SagaGenerator } from "typed-redux-saga";

import type { DocumentModel, DocumentService } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import {
	DataServicesSelectors,
	type SupportedRequest,
	type QueryJsonRpc2Response
} from "@com.mgmtp.a12.dataservices/dataservices-access";

import { OverviewEngineSelectors } from "../selectors.js";
import type { JSONDocument } from "../../../models/index.js";
import { Links, type JSONLink } from "../../../models/index.js";
import { isCdm, removeModelNameFromRef } from "../utils/cdm-utils.js";
import type { RequestSelectorMap } from "../utils/request-selector-map.js";
import { OverviewEngineInternalConstants } from "../../../shared/constants.js";

import {
	DataOperation,
	type BuildRequestsParams,
	type HandleResponsesParams,
	type OverviewEngineDataLoader
} from "./data-loader.js";
import {
	isSummaryResponse,
	isExportCsvResponse,
	isListDocumentsResponse,
	isStringFilterOptionsResponse
} from "./response-type-guards.js";

/** @internal */
export const defaultDataLoader: OverviewEngineDataLoader = {
	*buildRequests(params: BuildRequestsParams): SagaGenerator<SupportedRequest[]> {
		const state = yield* select();
		const requests: SupportedRequest[] = [];
		const { activityId, queries, documentModel, overviewModel, requestSelectorMap } = params;

		for (const query of queries) {
			const context: BuildRequestContext = { activityId, documentModel, overviewModel, requestSelectorMap, state };

			if (DataOperation.ListDocuments.Query.isAssignableFrom(query)) {
				requests.push(...buildListDocumentsRequests(query, context));
				continue;
			}

			if (DataOperation.ListStringFilterOptions.Query.isAssignableFrom(query)) {
				requests.push(buildListStringFilterOptionsRequest(query, context));
				continue;
			}

			if (DataOperation.Export.Query.isAssignableFrom(query)) {
				requests.push(buildExportRequest(query, context));
				continue;
			}
		}

		return requests;
	},

	*handleResponses(params: HandleResponsesParams): SagaGenerator<DataOperation.ResultSet> {
		const { queries, responsesByQueryId, thumbnails, documentService } = params;
		const modelsState = yield* select(
			OverviewEngineSelectors.modelsState(params.activityId, params.overviewModel.header.id)
		);

		if (!modelsState) {
			throw new Error("Document model not found in state");
		}

		const { documentModel, subDocumentModels } = modelsState;
		const queryResults: DataOperation.QueryResult[] = [];

		for (const query of queries) {
			if (DataOperation.ListDocuments.Query.isAssignableFrom(query)) {
				queryResults.push(
					buildListDocumentsResult(query, responsesByQueryId, {
						thumbnails,
						documentService,
						documentModel,
						subDocumentModels
					})
				);
				continue;
			}

			if (DataOperation.ListStringFilterOptions.Query.isAssignableFrom(query)) {
				queryResults.push(buildListStringFilterOptionsResult(query, responsesByQueryId));
				continue;
			}

			if (DataOperation.Export.Query.isAssignableFrom(query)) {
				queryResults.push(buildExportResult(query, responsesByQueryId));
				continue;
			}
		}

		return { queryResults };
	}
};

/** @internal */
export function* getMaxRequests(): SagaGenerator<number | undefined> {
	const maxRequests = yield* select(
		DataServicesSelectors.configurationByKey(OverviewEngineInternalConstants.MAX_METHOD_CALLS_PER_REQUEST_KEY)
	);

	return maxRequests !== undefined ? Number(maxRequests) : undefined;
}

interface BuildRequestContext {
	activityId: string;
	documentModel: DocumentModel;
	overviewModel: BuildRequestsParams["overviewModel"];
	requestSelectorMap: BuildRequestsParams["requestSelectorMap"];
	state: object;
}

/** @internal */
export interface BuildResultContext {
	thumbnails: HandleResponsesParams["thumbnails"];
	documentService: DocumentService;
	documentModel: DocumentModel;
	subDocumentModels: DocumentModel[] | undefined;
}

function createQueryId(baseId: string, suffix: string, nth = 0): string {
	return `${baseId}-${suffix}-${nth}`;
}

// ---------- ListDocuments ----------

function buildListDocumentsRequests(
	query: DataOperation.ListDocuments.Query,
	{ activityId, documentModel, overviewModel, requestSelectorMap, state }: BuildRequestContext
): SupportedRequest[] {
	const payload: RequestSelectorMap.LoadListDocumentsConfig = { activityId, query, documentModel, overviewModel };
	const listRequests = requestSelectorMap.loadListDocuments(payload)(state);
	const requests: SupportedRequest[] = listRequests.map((req, i) => ({
		...req,
		id: createQueryId(query.id, "page", i)
	}));

	if (query.aggregation) {
		const summaryReq = requestSelectorMap.loadSummary(payload)(state);
		requests.push({ ...summaryReq, id: createQueryId(query.id, "aggregation") });
	}

	return requests;
}

/** @internal */
export function buildListDocumentsResult(
	query: DataOperation.ListDocuments.Query,
	responsesByQueryId: HandleResponsesParams["responsesByQueryId"],
	{ thumbnails, documentService, documentModel, subDocumentModels }: BuildResultContext
): DataOperation.ListDocuments.Result {
	const listDocumentsResponses: QueryJsonRpc2Response[] = [];
	let i = 0;
	let response = responsesByQueryId.get(createQueryId(query.id, "page", i));

	while (response) {
		listDocumentsResponses.push(response);
		response = responsesByQueryId.get(createQueryId(query.id, "page", ++i));
	}

	const summaryResponse = query.aggregation
		? responsesByQueryId.get(createQueryId(query.id, "aggregation"))
		: undefined;

	const documents: JSONDocument[] = [];
	let links = Links.create();

	const toLink = (link: QueryJsonRpc2Response.Link): JSONLink => {
		const model = subDocumentModels?.find((md) => md.header.id === link.documentModelName) ?? documentModel;

		return { ...link, document: documentService.parseDates(link.document, model) as JSONDocument };
	};

	const typedResponses = listDocumentsResponses.map((res) => {
		if (!isListDocumentsResponse(res)) {
			throw new Error("Unexpected response shape for listDocuments");
		}

		return res;
	});

	for (const res of typedResponses) {
		const { entries, links: responseLinks } = res.result;

		if (query.exclude) {
			// When exclude is true, the response contains no entries.
			// Documents to display come from the links matching the query link spec.
			const queryLink = query.links?.[0];

			const excludeMapping = new Map<string, string>();
			const matchingLinks = responseLinks.filter(
				(link) =>
					link.type === "CHILD" &&
					link.targetRole === queryLink?.targetRole &&
					link.relationshipModel === queryLink?.relationshipModel
			);

			for (const link of matchingLinks) {
				excludeMapping.set(link.linkId, link.docRef);
				documents.push({
					...documentService.parseDates(link.document, documentModel),
					id: resolveDocumentId(link.docRef, documentModel),
					modelId: link.documentModelName,
					linkId: link.linkId
				});
			}

			for (const link of responseLinks) {
				const sourceDocRef = excludeMapping.get(link.linkId);

				if (!sourceDocRef) {
					links = Links.addLink({ ...toPointer(link), ...toLink(link) })(links);
				} else if (link.type === "LINK") {
					// In exclude-mode, rewrite the LINK's sourceDocRef to the promoted child's docRef
					// so that resolvePath can locate it directly from the row's document reference.
					const reparentedLink = { ...link, sourceDocRef };
					links = Links.addLink({ ...toPointer(reparentedLink), ...toLink(reparentedLink) })(links);
				}
			}

			continue;
		}

		for (const { docRef, document, documentModelName } of entries) {
			documents.push({
				...documentService.parseDates(document, documentModel),
				id: resolveDocumentId(docRef, documentModel),
				modelId: documentModelName
			});
		}

		links = responseLinks.reduce((acc, link) => Links.addLink({ ...toPointer(link), ...toLink(link) })(acc), links);
	}

	if (summaryResponse && !isSummaryResponse(summaryResponse)) {
		throw new Error("Unexpected response shape for summary");
	}

	return {
		id: query.id,
		documents,
		links,
		fullSize: listDocumentsResponses[0].result.fullSize,
		aggregationResult: summaryResponse?.result?.entries,
		thumbnails
	};
}

function toPointer(link: QueryJsonRpc2Response.Link): Links.EntryPointer {
	return { ...link, relationship: link.relationshipModel };
}

function resolveDocumentId(docRef: string, documentModel: DocumentModel): string {
	return isCdm(documentModel) ? removeModelNameFromRef(docRef) : docRef;
}

// ---------- ListStringFilterOptions ----------

function buildListStringFilterOptionsRequest(
	query: DataOperation.ListStringFilterOptions.Query,
	{ activityId, documentModel, overviewModel, requestSelectorMap, state }: BuildRequestContext
): SupportedRequest {
	const req = requestSelectorMap.loadListStringFilterOptions({ activityId, query, documentModel, overviewModel })(
		state
	);

	return { ...req, id: query.id };
}

function buildListStringFilterOptionsResult(
	query: DataOperation.ListStringFilterOptions.Query,
	responsesByQueryId: HandleResponsesParams["responsesByQueryId"]
): DataOperation.ListStringFilterOptions.Result {
	const response = responsesByQueryId.get(query.id);

	if (!response) {
		throw new Error("Missing response for loadListStringFilterOptions");
	}

	if (!isStringFilterOptionsResponse(response)) {
		throw new Error("Unexpected response shape for loadListStringFilterOptions");
	}

	return {
		id: query.id,
		fullSize: response.result.fullSize,
		entries: response.result.entries.map(({ document: [term] }) => term)
	};
}

// ---------- Export ----------

function buildExportRequest(
	query: DataOperation.Export.Query,
	{ activityId, documentModel, overviewModel, requestSelectorMap, state }: BuildRequestContext
): SupportedRequest {
	const req = requestSelectorMap.export({ activityId, query, documentModel, overviewModel })(state);

	return { ...req, id: query.id };
}

function buildExportResult(
	query: DataOperation.Export.Query,
	responsesByQueryId: HandleResponsesParams["responsesByQueryId"]
): DataOperation.Export.Result {
	const response = responsesByQueryId.get(query.id);

	if (!response) {
		throw new Error("Missing response for export");
	}

	if (!isExportCsvResponse(response)) {
		throw new Error("Unexpected response shape for export");
	}

	return {
		id: query.id,
		location: response.result.otherResults.downloadUrl
	};
}
