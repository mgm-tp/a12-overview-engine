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

import { test, expect } from "../commands.js";
import { Selector, Showcase, navigate, setLocale, inputByLabel } from "../utils.js";

test.describe("Filter Placeholder Format", () => {
	test.describe("When locale is set to en_US", () => {
		test.beforeEach(async ({ page }) => {
			await setLocale(page, "US");
			await navigate(page, Showcase.PRODUCT_PAGINATION);
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
		});
		test('should display the filter placeholder of date input as "MM/dd/yyyy"', async ({ page }) => {
			await page
				.locator(Selector.FILTER_SELECTOR_CONTENT_PRIMARY)
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT)
				.getByText("[O] Date", { exact: true })
				.click();
			await expect(inputByLabel(page, "Start Filter Value")).toHaveAttribute("placeholder", "MM/dd/yyyy");
			await expect(inputByLabel(page, "End Filter Value")).toHaveAttribute("placeholder", "MM/dd/yyyy");

			await page
				.locator(Selector.FILTER_SELECTOR_CONTENT_PRIMARY)
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT)
				.getByText("[O] Date Time", { exact: true })
				.click();

			await page
				.locator(Selector.PORTAL)
				.locator(Selector.FILTER_SELECTOR)
				.locator(Selector.SELECT_INPUT)
				.selectOption({ value: "date" });
			await expect(inputByLabel(page, "Start Filter Value")).toHaveAttribute("placeholder", "MM/dd/yyyy");
			await expect(inputByLabel(page, "End Filter Value")).toHaveAttribute("placeholder", "MM/dd/yyyy");

			await page
				.locator(Selector.PORTAL)
				.locator(Selector.FILTER_SELECTOR)
				.locator(Selector.SELECT_INPUT)
				.selectOption({ value: "time" });
			await expect(inputByLabel(page, "Start Filter Value")).toHaveAttribute("placeholder", "hh:mm AM/PM");
			await expect(inputByLabel(page, "End Filter Value")).toHaveAttribute("placeholder", "hh:mm AM/PM");
		});
	});

	test.describe("When locale is set to de_DE", () => {
		test.beforeEach(async ({ page }) => {
			await setLocale(page, "DE");
			await navigate(page, Showcase.PRODUCT_PAGINATION);
			await page.locator("button[aria-label = 'Filter öffnen']").click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
		});

		test('should display the filter placeholder of date time input as "TT.MM.JJJJ HH:mm"', async ({ page }) => {
			await page
				.locator(Selector.FILTER_SELECTOR_CONTENT_PRIMARY)
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT)
				.getByText("[O] Datum Zeit", { exact: true })
				.click();
			await expect(inputByLabel(page, "Startwert für Filter")).toHaveAttribute("placeholder", "TT.MM.JJJJ HH:mm");
			await expect(inputByLabel(page, "Endwert für Filter")).toHaveAttribute("placeholder", "TT.MM.JJJJ HH:mm");

			await page
				.locator(Selector.PORTAL)
				.locator(Selector.FILTER_SELECTOR)
				.locator(Selector.SELECT_INPUT)
				.selectOption({ value: "date" });

			await expect(inputByLabel(page, "Startwert für Filter")).toHaveAttribute("placeholder", "TT.MM.JJJJ");
			await expect(inputByLabel(page, "Endwert für Filter")).toHaveAttribute("placeholder", "TT.MM.JJJJ");

			await page
				.locator(Selector.PORTAL)
				.locator(Selector.FILTER_SELECTOR)
				.locator(Selector.SELECT_INPUT)
				.selectOption({ value: "time" });

			await expect(inputByLabel(page, "Startwert für Filter")).toHaveAttribute("placeholder", "HH:mm");
			await expect(inputByLabel(page, "Endwert für Filter")).toHaveAttribute("placeholder", "HH:mm");
		});
	});
});
