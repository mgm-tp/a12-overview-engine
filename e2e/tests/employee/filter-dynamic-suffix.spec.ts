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
import { navigate, Selector, Showcase } from "../utils.js";

const FULLNAME = "Manuel Simon";
const SALARY = "80000";

test.describe("Dynamic suffix", () => {
	test.beforeAll(async ({ seed }) => {
		// Seeding data can be slow in CI
		test.slow();
		await seed("employee");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.EMPLOYEE_PRESET_FILTER);
	});

	test("should append the suffix to body cells even when no column refers to the suffix field", async ({ page }) => {
		await page.locator(Selector.BUTTON_SEARCH).click();
		await expect(page.locator(Selector.TABLE_HEADER_CELL).nth(4)).toContainText("Actual Salary");
		const cell = page.locator(Selector.TABLE_BODY_ROW).nth(0).locator(Selector.TABLE_BODY_CELL).nth(5);
		await expect(cell).toHaveText(/\d+(,\d+)? (EUR|USD|VND)/);
	});

	test.describe("Remove a filter", () => {
		test("should not affect dynamic suffix filtering", async ({ page }) => {
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 20,000 EUR");
			await page.locator(Selector.BUTTON_SEARCH).click();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(6);
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: "Full Name" })
				.click();
			await page.locator(Selector.INPUT_FILTER_VALUE).fill(`${FULLNAME}\n`);
			await page.locator(Selector.INPUT_FILTER_VALUE).blur();

			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_BAR)).toContainText(FULLNAME);
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 20,000 EUR");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(1);
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
			const fullNameFilterBar = page.locator(`${Selector.FILTER_BAR} >> ${Selector.FILTER}:has-text("Full Name")`);
			await fullNameFilterBar.locator(Selector.BUTTON_DELETE).click();
			await expect(fullNameFilterBar).not.toBeVisible();
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 20,000 EUR");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(6);
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
		});
	});

	test.describe("Filter without suffix and then filter again with added suffix", () => {
		test("should work", async ({ page }) => {
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 20,000 EUR");
			await page.locator(Selector.BUTTON_SEARCH).click();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(6);
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
			await page.locator(Selector.FILTER).locator(Selector.BUTTON_DELETE).click();
			await expect(page.locator(Selector.FILTER_BAR)).not.toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(8);
			await expect(page.locator(Selector.PAGINATION)).toContainText("1 / 3");
			// filter without suffix
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: "Actual Salary" })
				.click();
			await page.getByPlaceholder("Start Filter Value").fill(SALARY);
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 80,000");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(6);
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
			// filter again with added suffix
			await page.locator(Selector.FILTER).click();
			await page.locator(Selector.FILTER_SELECTOR).locator(Selector.POPUP).nth(0).click();
			await page.locator(Selector.LIST_ITEM, { hasText: "EUR" }).click();
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 80,000 EUR");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(2);
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
		});
	});
});
