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
import { it, expect, describe } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { FilterPage } from "./pages/base-filter-page.js";
import { renderFilter, queryAllByDataRole, type FilterRenderResult } from "./setup.js";

function getYearInputs(container: HTMLElement): HTMLInputElement[] {
	return queryAllByDataRole<HTMLInputElement>(container, "year-selector-input");
}

function getTextInputs(container: HTMLElement): HTMLInputElement[] {
	return queryAllByDataRole<HTMLInputElement>(container, DataRoles.TextField.Input);
}

function getMonthSelects(container: HTMLElement): HTMLSelectElement[] {
	return queryAllByDataRole<HTMLSelectElement>(container, "month-selector-input");
}

function getErrorMessages(container: HTMLElement): string[] {
	return queryAllByDataRole(container, DataRoles.Error.Text).map((el) => el.textContent || "");
}

function typeAndBlur(input: HTMLInputElement, value: string): void {
	fireEvent.change(input, { target: { value } });
	fireEvent.blur(input);
}

function typeOnly(input: HTMLInputElement, value: string): void {
	fireEvent.change(input, { target: { value } });
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.date-fragment-filter", () => {
	describe("Period: YEAR (year-only field)", () => {
		const yearFilterItem: OverviewModel.NewFilter.DateFragment.Item = {
			id: "releaseYear",
			type: "dateFragment",
			options: {
				fieldId: ProductFieldIds.releaseYear.id,
				ranges: [{ option: "fromTo", default: true, enabled: true }],
				periods: [{ option: "year", default: true, enabled: true }],
				empty: { enabled: false },
				invert: { enabled: false }
			}
		};

		async function render(): Promise<FilterRenderResult> {
			return renderFilter({ filterItem: yearFilterItem });
		}

		it("blur with 1-3 digit input shows invalidYear error", async () => {
			const { container } = await render();

			const [fromInput] = getYearInputs(container);
			assertCondition(!!fromInput, "From year input not found");

			typeAndBlur(fromInput, "1");

			expect(getErrorMessages(container)).toMatchInlineSnapshot(`
				[
				  "Year must be a 4-digit number.",
				]
			`);
		});

		it("blur with valid 4-digit year sets value and shows no error", async () => {
			const { container } = await render();

			const [fromInput] = getYearInputs(container);
			assertCondition(!!fromInput, "From year input not found");

			typeAndBlur(fromInput, "2024");

			expect(getErrorMessages(container)).toEqual([]);

			const [fromInputAfter] = getYearInputs(container);
			expect(fromInputAfter.value).toBe("2024");
		});

		it("typing a valid 4-digit year clears a prior invalidYear error", async () => {
			const { container } = await render();

			const [fromInput] = getYearInputs(container);
			assertCondition(!!fromInput, "From year input not found");

			typeAndBlur(fromInput, "1");
			expect(getErrorMessages(container)).toEqual(["Year must be a 4-digit number."]);

			const [fromInputAgain] = getYearInputs(container);
			typeOnly(fromInputAgain, "2024");

			expect(getErrorMessages(container)).toEqual([]);

			const [fromInputAfter] = getYearInputs(container);
			expect(fromInputAfter.value).toBe("2024");
		});
	});

	describe("Period: YEAR_MONTH (yyyy-MM field)", () => {
		const yearMonthFilterItem: OverviewModel.NewFilter.DateFragment.Item = {
			id: "releaseMonthYear",
			type: "dateFragment",
			options: {
				fieldId: ProductFieldIds.releaseMonthYear.id,
				ranges: [{ option: "fromTo", default: true, enabled: true }],
				periods: [{ option: "yearMonth", default: true, enabled: true }],
				empty: { enabled: false },
				invert: { enabled: false }
			}
		};

		async function render(): Promise<FilterRenderResult> {
			return renderFilter({ filterItem: yearMonthFilterItem });
		}

		it("blur on embedded year input with 1-3 digits shows invalidYear error", async () => {
			const { container } = await render();

			const [fromYearInput] = getYearInputs(container);
			assertCondition(!!fromYearInput, "From year input not found");

			typeAndBlur(fromYearInput, "12");

			expect(getErrorMessages(container)).toMatchInlineSnapshot(`
				[
				  "Year must be a 4-digit number.",
				]
			`);
		});

		it("blur on embedded year input with valid 4-digit year shows no invalidYear error", async () => {
			const { container } = await render();

			const [fromMonthSelect] = getMonthSelects(container);
			assertCondition(!!fromMonthSelect, "From month select not found");
			fireEvent.change(fromMonthSelect, { target: { value: "3" } });

			const [fromYearInput] = getYearInputs(container);
			assertCondition(!!fromYearInput, "From year input not found");

			typeAndBlur(fromYearInput, "2024");

			expect(getErrorMessages(container)).toEqual([]);

			const [fromYearInputAfter] = getYearInputs(container);
			expect(fromYearInputAfter.value).toBe("2024");
		});
	});

	// Regression: filling an input and clearing it back to empty must return the filter to its
	// pristine state, so both footer buttons (Reset All / Apply All) disable again.
	describe("Footer button enablement after clearing values", () => {
		describe("Period: MONTH_DAY (text input)", () => {
			const monthDayFilterItem: OverviewModel.NewFilter.DateFragment.Item = {
				id: "releaseMonthDay",
				type: "dateFragment",
				options: {
					fieldId: ProductFieldIds.releaseMonthDay.id,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					periods: [{ option: "monthDay", default: true, enabled: true }],
					empty: { enabled: false },
					invert: { enabled: false }
				}
			};

			it("disables Reset/Apply All again after a valid value is cleared back to empty", async () => {
				const result = await renderFilter({ filterItem: monthDayFilterItem });
				const page = new FilterPage(result);
				const { container } = result;

				// Pristine: nothing changed from the applied baseline.
				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);

				// Enter a valid month-day -> filter now differs from baseline.
				const [fromInput] = getTextInputs(container);
				assertCondition(!!fromInput, "From month-day input not found");
				typeAndBlur(fromInput, "03/15");

				expect(getErrorMessages(container)).toEqual([]);
				expect(page.isResetAllEnabled).toBe(true);
				expect(page.isApplyAllEnabled).toBe(true);

				// Clear back to empty -> back to the pristine state, both buttons disable again.
				const [fromInputAgain] = getTextInputs(container);
				typeAndBlur(fromInputAgain, "");

				expect(getErrorMessages(container)).toEqual([]);
				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);
			});

			it("disables Reset/Apply All again after invalid input is cleared back to empty", async () => {
				const result = await renderFilter({ filterItem: monthDayFilterItem });
				const page = new FilterPage(result);
				const { container } = result;

				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);

				// Invalid input -> error shown, Apply All stays disabled (error blocks apply).
				const [fromInput] = getTextInputs(container);
				assertCondition(!!fromInput, "From month-day input not found");
				typeAndBlur(fromInput, "invalid");

				expect(getErrorMessages(container).length).toBeGreaterThan(0);
				expect(page.isApplyAllEnabled).toBe(false);

				// Clear back to empty -> no error, pristine, both buttons disabled.
				const [fromInputAgain] = getTextInputs(container);
				typeAndBlur(fromInputAgain, "");

				expect(getErrorMessages(container)).toEqual([]);
				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);
			});
		});

		describe("Period: YEAR (selector input)", () => {
			const yearFilterItem: OverviewModel.NewFilter.DateFragment.Item = {
				id: "releaseYear",
				type: "dateFragment",
				options: {
					fieldId: ProductFieldIds.releaseYear.id,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					periods: [{ option: "year", default: true, enabled: true }],
					empty: { enabled: false },
					invert: { enabled: false }
				}
			};

			it("disables Reset/Apply All again after a year is selected and cleared", async () => {
				const result = await renderFilter({ filterItem: yearFilterItem });
				const page = new FilterPage(result);
				const { container } = result;

				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);

				// Enter a valid year.
				const [fromYearInput] = getYearInputs(container);
				assertCondition(!!fromYearInput, "From year input not found");
				typeAndBlur(fromYearInput, "2024");

				expect(getErrorMessages(container)).toEqual([]);
				expect(page.isResetAllEnabled).toBe(true);
				expect(page.isApplyAllEnabled).toBe(true);

				// Clear back to empty -> pristine, both buttons disable again.
				const [fromYearInputAgain] = getYearInputs(container);
				typeAndBlur(fromYearInputAgain, "");

				expect(getErrorMessages(container)).toEqual([]);
				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);
			});
		});
	});
});
