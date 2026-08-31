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

import type {
	Query,
	QueryJsonRpc2Request,
	DocumentJsonRpc2Request,
	LoadThumbnailUrlsJsonRpc2
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";

let requestCounter = 0;

/** @internal */
export const RequestBuilder = {
	deleteDocument(id: string, docRef: string, locale: Locale): DocumentJsonRpc2Request.DeleteJsonRpc2Request {
		return {
			jsonrpc: "2.0",
			method: "DELETE_DOCUMENT",
			id,
			params: {
				docRef,
				// Data Services requires only the language
				locale: locale.language
			}
		};
	},

	deleteDocuments(id: string, docRefs: string[]): DocumentJsonRpc2Request.MultiDeleteJsonRpc2Request {
		return { jsonrpc: "2.0", method: "MULTI_DELETE_DOCUMENTS", id, params: { docRefs } };
	},

	loadThumbnailURLs(): LoadThumbnailUrlsJsonRpc2.Request {
		return {
			jsonrpc: "2.0",
			id: `ThumbnailUrls-${requestCounter++}`,
			method: "LOAD_THUMBNAIL_URLS_INTERNAL",
			params: {}
		};
	},

	query<QueryRoot extends Query.QueryRoot>(id: string, params: { query: QueryRoot }): QueryJsonRpc2Request<QueryRoot> {
		return { jsonrpc: "2.0", method: "QUERY", id, params };
	}
};
