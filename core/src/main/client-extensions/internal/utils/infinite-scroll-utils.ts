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

import type { Activity, Modifier } from "@com.mgmtp.a12.client/client-core";

import { OverviewEngineInternalConstants } from "../../../constants/overview-engine-internal-constants.js";
import { Links } from "../../../models/index.js";
import type { Scrolling } from "../../../store/index.js";

/** @internal */
export namespace InfiniteScrollUtils {
	/**
	 * Merges loaded documents and existing documents together according
	 * to the data requested by the infinite scrolling setup.
	 *
	 * Note that the returned array of documents can have "holes" (undefined).
	 */
	export function mergeDocuments(params: {
		scrolling: Scrolling;
		documents: Activity.Data.Document[];
		fullSize: number;
		existingDocuments: (Activity.Data.Document | undefined)[];
		cachePages?: number;
	}): (Activity.Data.Document | undefined)[] {
		const {
			scrolling,
			documents,
			existingDocuments,
			cachePages = OverviewEngineInternalConstants.DEFAULT_INFINITE_SCROLL_CACHE_PAGES,
			fullSize
		} = params;
		const { pageSize, pageNumbers, visibleStart } = scrolling;

		if (pageNumbers.length === 0 || documents.length === 0) {
			return existingDocuments;
		}

		const requestStart = pageSize * Math.min(...pageNumbers);
		const requestEnd = pageSize + Math.max(...pageNumbers) * pageSize;

		// Merge old and new documents
		const mergedDocuments: (object | undefined)[] = [
			...Array.from({ length: requestStart }, (_, idx) => existingDocuments[idx]),
			...documents,
			...existingDocuments.slice(requestEnd)
		];

		const { start, end } = calculateCacheRange({
			visibleStart,
			cachePages,
			requestRange: { start: requestStart, end: requestEnd, fullSize, pageSize },
			existingRange: {
				start: existingDocuments.findIndex((doc) => doc !== undefined),
				end: existingDocuments.findLastIndex((doc) => doc !== undefined)
			}
		});

		return Array(start).concat(mergedDocuments.slice(start, end));
	}

	export function mergeLink(
		incomingLinks: Links | undefined,
		activeDocRefs: ReadonlySet<string> | undefined
	): (existing: Links | undefined) => Links {
		const newLinks = incomingLinks ?? Links.create();

		return (existingLinks) => {
			if (!existingLinks) {
				return newLinks;
			}

			const clean: Modifier<Links> = activeDocRefs?.size ? Links.retain(activeDocRefs) : (links) => links;

			return Links.merge(newLinks)(clean(existingLinks));
		};
	}

	function calculateCacheRange(params: {
		visibleStart: number;
		cachePages?: number;
		requestRange: Range & { fullSize: number; pageSize: number };
		existingRange: Range;
	}): Range {
		const {
			visibleStart,
			cachePages = OverviewEngineInternalConstants.DEFAULT_INFINITE_SCROLL_CACHE_PAGES,
			requestRange,
			existingRange
		} = params;
		const { start: requestStart, end: requestEnd, fullSize, pageSize } = requestRange;
		const cacheSize = cachePages * pageSize;

		if (requestStart < existingRange.start) {
			return {
				start: requestStart,
				end: Math.min(fullSize, requestStart + cacheSize)
			};
		}

		if (requestEnd > existingRange.end) {
			const end = Math.min(fullSize, requestEnd);

			return {
				start: Math.max(0, end - cacheSize),
				end: Math.min(fullSize, requestEnd)
			};
		}

		const minStart = Math.max(0, visibleStart - cacheSize / 2);
		const start = Math.min(existingRange.start, Math.floor(minStart / pageSize) * pageSize);

		return { start, end: Math.min(fullSize, start + cacheSize) };
	}
}

interface Range {
	start: number;
	end: number;
}
