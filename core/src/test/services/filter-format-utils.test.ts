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

import {
	isDefined,
	formatRange,
	getFormatString,
	createDateFormatter
} from "../../main/services/filter-format-utils.js";
import { getDocumentModel } from "../setup/models.js";

describe("com.mgmtp.a12.overview-engine.services.filter-format-utils", () => {
	describe("formatRange", () => {
		it("returns null when both bounds undefined", () => {
			expect(formatRange(undefined, undefined)).toBeNull();
		});

		it("returns null when both bounds null", () => {
			expect(formatRange(null, null)).toBeNull();
		});

		it("returns ≥ start when only start defined", () => {
			expect(formatRange("10", undefined)).toBe("≥ 10");
			expect(formatRange("10", null)).toBe("≥ 10");
		});

		it("returns ≤ end when only end defined", () => {
			expect(formatRange(undefined, "20")).toBe("≤ 20");
			expect(formatRange(null, "20")).toBe("≤ 20");
		});

		it("returns 'start - end' when both defined and differ", () => {
			expect(formatRange("5", "20")).toBe("5 - 20");
		});

		it("returns single value when start equals end", () => {
			expect(formatRange("7", "7")).toBe("7");
		});

		it("treats empty string as defined", () => {
			expect(formatRange("", "20")).toBe(" - 20");
		});

		it("treats zero string as defined", () => {
			expect(formatRange("0", "0")).toBe("0");
		});
	});

	describe("isDefined", () => {
		it("returns false for null", () => {
			expect(isDefined(null)).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(isDefined(undefined)).toBe(false);
		});

		it("returns true for falsy non-nullish values", () => {
			expect(isDefined(0)).toBe(true);
			expect(isDefined("")).toBe(true);
			expect(isDefined(false)).toBe(true);
			expect(isDefined(NaN)).toBe(true);
		});

		it("returns true for objects and arrays", () => {
			expect(isDefined({})).toBe(true);
			expect(isDefined([])).toBe(true);
		});
	});

	describe("getFormatString", () => {
		it("returns DateType format for date field", async () => {
			const documentModel = await getDocumentModel("unit-test", "DomainTest");
			expect(getFormatString("/root/date", documentModel)).toBe("yyyy-MM-dd");
		});

		it("returns DateTimeType format for dateTime field", async () => {
			const documentModel = await getDocumentModel("unit-test", "DomainTest");
			expect(getFormatString("/root/dateTime", documentModel)).toBe("yyyy-MM-dd'T'HH:mm:ss");
		});

		it("throws when path resolves to non-Field element", async () => {
			const documentModel = await getDocumentModel("unit-test", "DomainTest");
			// "/root" resolves to a section container (not a Field), exercising the
			// "non-Field" branch directly. The previous fixture passed "" which
			// would throw earlier inside findElementByPath with a different message,
			// masking the actual contract under test.
			expect(() => getFormatString("/root", documentModel)).toThrow(/not a field/);
		});
	});

	describe("createDateFormatter", () => {
		it("returns undefined for null and undefined values", async () => {
			const documentModel = await getDocumentModel("unit-test", "DomainTest");
			const formatter = createDateFormatter(documentModel, "/root/date");

			expect(formatter.formatDate(null)).toBeUndefined();
			expect(formatter.formatDate(undefined)).toBeUndefined();
		});

		it("formats Date using field's resolved format", async () => {
			const documentModel = await getDocumentModel("unit-test", "DomainTest");
			const formatter = createDateFormatter(documentModel, "/root/date");

			const result = formatter.formatDate(new Date(Date.UTC(2024, 0, 15)));
			expect(result).toBe("2024-01-15");
		});

		it("respects explicit format override", async () => {
			const documentModel = await getDocumentModel("unit-test", "DomainTest");
			const formatter = createDateFormatter(documentModel, "/root/date");

			const result = formatter.formatDate(new Date(Date.UTC(2024, 0, 15)), "dd.MM.yyyy");
			expect(result).toBe("15.01.2024");
		});
	});
});
