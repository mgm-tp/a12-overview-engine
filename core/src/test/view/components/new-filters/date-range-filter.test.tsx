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

import { fireEvent } from "@testing-library/react";
import { it, vi, expect, afterAll, describe, beforeAll } from "vitest";

import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderDateRangeFilter } from "./pages/date-range-filter-page.js";

const FIXED_DATE = new Date("2026-04-15T00:00:00.000Z");

beforeAll(() => {
	vi.useFakeTimers({ now: FIXED_DATE.getTime(), shouldAdvanceTime: true });
});

afterAll(() => {
	vi.useRealTimers();
});

function rangeFilterItem(
	fieldId: string,
	period: OverviewModel.NewFilter.DateRange.PeriodOption
): OverviewModel.NewFilter.DateRange.Item {
	return {
		id: "saleRange",
		type: "dateRange",
		options: {
			fieldId,
			ranges: [{ option: "fromTo", default: true, enabled: true }],
			periods: [{ option: period, default: true, enabled: true }],
			empty: { enabled: false },
			invert: { enabled: false }
		}
	};
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.date-range-filter", () => {
	// Regression: filling an input and clearing it back to empty must return the filter to its
	// pristine state, so both footer buttons (Reset All / Apply All) disable again.
	describe("Footer button enablement after clearing values", () => {
		it("date period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateRangeFilter({
				filterItem: rangeFilterItem(ProductFieldIds.saleDateRange.id, "date")
			});

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.dateView.setFrom("01/15/2025");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.dateView.setFrom("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("monthDay period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateRangeFilter({
				filterItem: rangeFilterItem(ProductFieldIds.saleMonthDayRange.id, "monthDay")
			});

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.dateView.setFrom("03/15");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.dateView.setFrom("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("monthDay period: disables Reset/Apply All after invalid input is cleared", async () => {
			const { page } = await renderDateRangeFilter({
				filterItem: rangeFilterItem(ProductFieldIds.saleMonthDayRange.id, "monthDay")
			});

			expect(page.isApplyAllEnabled).toBe(false);

			await page.dateView.setFrom("invalid");
			expect(page.errorMessages.length).toBeGreaterThan(0);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.dateView.setFrom("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("year period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateRangeFilter({
				filterItem: rangeFilterItem(ProductFieldIds.saleYearRange.id, "year")
			});

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.yearView.selectFrom("2024");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.yearView.selectFrom("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("yearMonth period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateRangeFilter({
				filterItem: rangeFilterItem(ProductFieldIds.saleYearMonthRange.id, "yearMonth")
			});

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			const monthSelect = page.monthYearView.fromMonthSelect;
			assertCondition(!!monthSelect, "From month select not found");
			fireEvent.change(monthSelect, { target: { value: "3" } });
			await page.monthYearView.selectFromYear("2024");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.monthYearView.selectFromYear("");
			fireEvent.change(monthSelect, { target: { value: "" } });
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("month period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateRangeFilter({
				filterItem: rangeFilterItem(ProductFieldIds.saleMonthRange.id, "month")
			});

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			const monthSelect = page.monthView.fromSelect;
			assertCondition(!!monthSelect, "From month select not found");
			fireEvent.change(monthSelect, { target: { value: "3" } });
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			fireEvent.change(monthSelect, { target: { value: "" } });
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});
	});
});
