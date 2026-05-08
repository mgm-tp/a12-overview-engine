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

import { it, expect, describe } from "vitest";

import type { Activity } from "@com.mgmtp.a12.client/client-core";

import { type Scrolling } from "../../../main/store/index.js";
import { InfiniteScrollUtils } from "../../../main/client-extensions/internal/utils/infinite-scroll-utils.js";

describe("com.mgmtp.a12.overview-engine.client-extensions.utils.infinite-scroll-utils", () => {
	describe("InfiniteScrollUtils", () => {
		type ScrollingTestCase = {
			name: string;
			input: Omit<Parameters<typeof InfiniteScrollUtils.mergeDocuments>[number], "documents">;
			expected: { start: number; end: number };
		};
		const scrollingTestCases: ScrollingTestCase[] = [
			{
				name: "Basic initial load with empty existing data",
				input: {
					scrolling: { pageSize: 50, pageNumbers: [0, 1], visibleStart: 0, visibleEnd: 10 },
					cachePages: 2,
					fullSize: 100,
					existingDocuments: []
				},
				expected: { start: 0, end: 99 }
			},
			{
				name: "Basic merge with default cachePages",
				input: {
					scrolling: { pageSize: 50, pageNumbers: [3, 4], visibleStart: 150, visibleEnd: 160 },
					fullSize: Infinity,
					existingDocuments: Array(150).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 249 }
			},
			{
				name: "Partial merge with smaller fullSize",
				input: {
					scrolling: { pageSize: 50, pageNumbers: [0, 1], visibleStart: 45, visibleEnd: 55 },
					cachePages: 3,
					fullSize: 92,
					existingDocuments: [] as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 91 }
			},
			{
				name: "Merge with existing data and multiple pages",
				input: {
					scrolling: { pageSize: 50, pageNumbers: [1, 2, 3, 4], visibleStart: 10, visibleEnd: 20 },
					fullSize: Infinity,
					existingDocuments: Array(150).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 249 }
			},
			{
				name: "Scrolling at the end of dataset",
				input: {
					scrolling: { pageSize: 50, pageNumbers: [8, 9], visibleStart: 450, visibleEnd: 500 },
					cachePages: 3,
					fullSize: 500,
					existingDocuments: Array(50).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 400, end: 499 }
			},
			{
				name: "Very small dataset, all in view",
				input: {
					scrolling: { pageSize: 10, pageNumbers: [0], visibleStart: 0, visibleEnd: 10 },
					cachePages: 2,
					fullSize: 10,
					existingDocuments: Array(20).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 9 }
			},
			{
				name: "Scrolling in the middle of dataset",
				input: {
					scrolling: { pageSize: 20, pageNumbers: [2, 3], visibleStart: 40, visibleEnd: 50 },
					cachePages: 3,
					fullSize: 100,
					existingDocuments: [] as unknown as Activity.Data.Document[]
				},
				expected: { start: 40, end: 79 }
			},
			{
				name: "Empty visible range",
				input: {
					scrolling: { pageSize: 50, pageNumbers: [0], visibleStart: 0, visibleEnd: 0 },
					cachePages: 1,
					fullSize: 50,
					existingDocuments: Array(50).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 49 }
			},
			{
				name: "Overlapping cached and visible pages",
				input: {
					scrolling: { pageSize: 30, pageNumbers: [2, 3, 4], visibleStart: 85, visibleEnd: 95 },
					cachePages: 3,
					fullSize: 120,
					existingDocuments: Array(120).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 30, end: 119 }
			},
			{
				name: "No scroll yet, full dataset",
				input: {
					scrolling: { pageSize: 100, pageNumbers: [], visibleStart: 0, visibleEnd: 0 },
					cachePages: 5,
					fullSize: 100,
					existingDocuments: Array(100).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 99 }
			},
			{
				name: "Large dataset with sparse scroll",
				input: {
					scrolling: { pageSize: 100, pageNumbers: [1, 2, 3], visibleStart: 500, visibleEnd: 520 },
					cachePages: 5,
					fullSize: Infinity,
					existingDocuments: Array(1000).fill({}) as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 499 }
			},
			{
				name: "Scroll to the middle, data not loaded in the middle",
				input: {
					scrolling: { pageSize: 20, pageNumbers: [3], visibleStart: 85, visibleEnd: 95 },
					cachePages: 7,
					fullSize: Infinity,
					existingDocuments: [
						...Array(20).fill({}),
						...Array(100),
						...Array(40).fill({})
					] as unknown as Activity.Data.Document[]
				},
				expected: { start: 0, end: 139 }
			}
		];
		describe("mergeDocuments", () => {
			scrollingTestCases.forEach(({ name, input, expected }, index) => {
				it(`Test case ${index + 1}: should handle ${name} with cache pages ${input.cachePages} correctly`, () => {
					const result = InfiniteScrollUtils.mergeDocuments({
						...input,
						documents: mockGetDocuments(input.scrolling, { fullSize: input.fullSize })
					});

					const start = result.findIndex((doc) => doc !== undefined);
					const end = result.findLastIndex((doc) => doc !== undefined);

					expect({ start, end }).toEqual(expected);
				});
			});
		});
	});
});

function mockGetDocuments(
	scrolling: Scrolling,
	options: {
		fullSize?: number;
	}
): Activity.Data.Document[] {
	const { pageSize, pageNumbers } = scrolling;

	const expectedDocuments = Array(pageNumbers.length * pageSize).fill({}) as Activity.Data.Document[];

	if (options.fullSize && pageSize * Math.max(...pageNumbers) > options.fullSize) {
		return expectedDocuments.slice(0, options.fullSize);
	}

	return expectedDocuments;
}
