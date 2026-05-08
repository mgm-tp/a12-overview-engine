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

import { vi, it, expect, describe, afterAll, beforeAll } from "vitest";

import { SectionType } from "../../../../../main/view/components/filters/options-views/section-template.js";
import { DateTimeUtils } from "../../../../../main/view/components/filters/options-views/date-time-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.date-time-utils", () => {
	function testFunction<F extends (...args: any[]) => any>(
		f: F,
		testCases: { params: Parameters<F>; expected: ReturnType<F> }[]
	) {
		testCases.forEach((testCase) => {
			expect(f(...testCase.params)).toEqual(testCase.expected);
		});
	}

	const FEB_20 = new Date("2020-02-15T20:45:00.000Z");
	const AUG_03 = new Date("2020-08-15T03:15:00.000Z");
	const AUG_20 = new Date("2020-08-15T20:45:00.000Z");

	const NEW_YORK_TZ = "America/New_York";

	beforeAll(() => {
		vi.useFakeTimers({ now: FEB_20.getTime() });
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	it("padYearAndMonth", () => {
		testFunction(DateTimeUtils.padYearAndMonth, [
			{ params: [2020, 1], expected: new Date("2020-02-01T00:00:00.000Z") },
			{ params: [2020, 1, NEW_YORK_TZ], expected: new Date("2020-02-01T05:00:00.000Z") },

			{ params: [2019, 9], expected: new Date("2019-10-01T00:00:00.000Z") },
			{ params: [2019, 9, NEW_YORK_TZ], expected: new Date("2019-10-01T04:00:00.000Z") },

			{ params: [2019], expected: new Date("2019-02-01T00:00:00.000Z") },
			{ params: [2019, undefined, NEW_YORK_TZ], expected: new Date("2019-02-01T05:00:00.000Z") },

			{ params: [undefined, 7], expected: new Date("2020-08-01T00:00:00.000Z") },
			{ params: [undefined, 7, NEW_YORK_TZ], expected: new Date("2020-08-01T04:00:00.000Z") },

			{ params: [undefined, undefined], expected: new Date("2020-02-01T00:00:00.000Z") },
			{ params: [undefined, undefined, NEW_YORK_TZ], expected: new Date("2020-02-01T05:00:00.000Z") }
		]);
	});

	it("padToday", () => {
		testFunction(DateTimeUtils.padToday, [
			{ params: [undefined], expected: undefined },
			{ params: [AUG_03], expected: new Date("2020-02-15T03:15:00.000Z") },
			{ params: [AUG_03, NEW_YORK_TZ], expected: new Date("2020-02-16T04:15:00.000Z") },
			{ params: [AUG_20], expected: new Date("2020-02-15T20:45:00.000Z") },
			{ params: [AUG_20, NEW_YORK_TZ], expected: new Date("2020-02-15T21:45:00.000Z") }
		]);
	});

	it("padDate", () => {
		testFunction(DateTimeUtils.padDate, [
			{ params: [undefined], expected: undefined },
			{ params: [null], expected: undefined },
			{ params: [AUG_03], expected: new Date("2020-08-15T00:00:00.000Z") },

			{ params: [AUG_03, { sectionType: SectionType.START }], expected: new Date("2020-08-15T00:00:00.000Z") },
			{
				params: [FEB_20, { sectionType: SectionType.START, unit: "month" }],
				expected: new Date("2020-02-01T00:00:00.000Z")
			},
			{
				params: [FEB_20, { sectionType: SectionType.START, unit: "month", strict: true }],
				expected: new Date("2020-02-01T00:00:00.000Z")
			},
			{
				params: [FEB_20, { sectionType: SectionType.START, unit: "month", strict: true, timezone: NEW_YORK_TZ }],
				expected: new Date("2020-02-01T05:00:00.000Z")
			},
			{
				params: [AUG_03, { sectionType: SectionType.START, unit: "year" }],
				expected: new Date("2020-01-01T00:00:00.000Z")
			},
			{
				params: [AUG_03, { sectionType: SectionType.START, unit: "year", strict: true }],
				expected: new Date("2020-01-01T00:00:00.000Z")
			},
			{
				params: [AUG_03, { sectionType: SectionType.START, unit: "year", strict: true, timezone: NEW_YORK_TZ }],
				expected: new Date("2020-01-01T05:00:00.000Z")
			},

			// dateTimeType = END
			{ params: [AUG_03, { sectionType: SectionType.END }], expected: new Date("2020-08-15T23:59:59.999Z") },
			{
				params: [FEB_20, { sectionType: SectionType.END, unit: "month" }],
				expected: new Date("2020-02-29T00:00:00.000Z")
			},
			{
				params: [FEB_20, { sectionType: SectionType.END, unit: "month", strict: true }],
				expected: new Date("2020-02-29T23:59:59.999Z")
			},
			{
				params: [FEB_20, { sectionType: SectionType.END, unit: "month", strict: true, timezone: NEW_YORK_TZ }],
				expected: new Date("2020-03-01T04:59:59.999Z")
			},
			{
				params: [AUG_03, { sectionType: SectionType.END, unit: "year" }],
				expected: new Date("2020-12-31T00:00:00.000Z")
			},
			{
				params: [AUG_03, { sectionType: SectionType.END, unit: "year", strict: true }],
				expected: new Date("2020-12-31T23:59:59.999Z")
			},
			{
				params: [AUG_03, { sectionType: SectionType.END, unit: "year", strict: true, timezone: NEW_YORK_TZ }],
				expected: new Date("2021-01-01T04:59:59.999Z")
			}
		]);
	});
});
