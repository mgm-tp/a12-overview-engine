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

import { QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

/** @internal */
export type ListDocumentsResponseType = QueryJsonRpc2Response<
	QueryJsonRpc2Response.DocumentEntry[],
	QueryJsonRpc2Response.Link[]
>;

/** @internal */
export function isListDocumentsResponse(r: QueryJsonRpc2Response): r is ListDocumentsResponseType {
	const { entries, links } = r.result;

	return (
		Array.isArray(entries) &&
		entries.every((entry) => entry.docRef && entry.document) &&
		!!links &&
		Array.isArray(links) &&
		links.every(QueryJsonRpc2Response.Link.isInstance)
	);
}

/** @internal */
export type SummaryResponseType = QueryJsonRpc2Response<QueryJsonRpc2Response.AggregationEntry[]>;

/** @internal */
export function isSummaryResponse(r: QueryJsonRpc2Response): r is SummaryResponseType {
	const { entries } = r.result;

	return (
		Array.isArray(entries) &&
		entries.every((entry): entry is QueryJsonRpc2Response.AggregationEntry => {
			return entry.document && Array.isArray(entry.document);
		})
	);
}

type StringFilterEntry = QueryJsonRpc2Response.BaseEntry<[string]>;
/** @internal */
export type StringFilterOptionsResponseType = QueryJsonRpc2Response<StringFilterEntry[]>;

/** @internal */
export function isStringFilterOptionsResponse(r: QueryJsonRpc2Response): r is StringFilterOptionsResponseType {
	const { entries } = r.result;

	return (
		Array.isArray(entries) &&
		entries.every(
			(entry): entry is StringFilterEntry =>
				entry.document &&
				Array.isArray(entry.document) &&
				(entry.document.length === 0 || typeof entry.document[0] === "string")
		)
	);
}

/** @internal */
export function isExportCsvResponse(r: QueryJsonRpc2Response): r is QueryJsonRpc2Response.ExportCddCsvProjection {
	const { otherResults } = r.result;

	return (
		typeof otherResults === "object" &&
		otherResults !== null &&
		"downloadUrl" in otherResults &&
		typeof otherResults.downloadUrl === "string"
	);
}
