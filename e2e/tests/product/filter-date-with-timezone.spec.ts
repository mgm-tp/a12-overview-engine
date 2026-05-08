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
import { Selector, Showcase, navigate, inputByLabel } from "../utils.js";

test.describe("Date with timezone", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("End date with timezone America/New_York", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_PAGINATION);
		});
		test("end date in filter result should not increase one day", async ({ page }) => {
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: /Date$/ })
				.click();
			await inputByLabel(page, "End Filter Value").fill("03/06/2018");
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(0);
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≤ 03/06/2018");
			await page.locator(Selector.FILTER_BAR).locator(Selector.FILTER_CONTENT).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await inputByLabel(page, "Start Filter Value").fill("03/07/2018");
			await inputByLabel(page, "End Filter Value").fill("03/07/2018");
			await inputByLabel(page, "End Filter Value").blur();
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(10);
			await expect(page.locator(Selector.PAGINATION)).toContainText("1 / 3");
		});
	});

	test.describe("DateTime and Time", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_PAGINATION);
		});
		test("should work with timezone", async ({ page }) => {
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: /Date Time$/ })
				.click();
			await inputByLabel(page, "Start Filter Value").fill("03/07/2018 08:20 PM\n");
			await inputByLabel(page, "End Filter Value").fill("03/07/2018 08:21 PM\n");
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: /\[O] Time/ })
				.click();
			await inputByLabel(page, "Start Filter Value").fill("09:14 PM\n");
			await inputByLabel(page, "End Filter Value").fill("09:16 PM\n");
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("03/07/2018 08:20 PM - 03/07/2018 08:21 PM");
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("09:14 PM - 09:16 PM");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(1);
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toContainText("03/07/2018 08:20 PM");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toContainText("09:15 PM");
		});
	});

	test.describe("Filter empty target group", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_PAGINATION);
		});

		test("should filter empty date", async ({ page }) => {
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await page.locator('[id="/product/dateField-graphic-controls"] span').nth(1).click();
			await page.getByLabel("Selection Mode").selectOption("empty");
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.getByText("No search results. Try again")).toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(0);

			await page.getByRole("button", { name: "Filter name [O] Date Selected" }).click();
			await expect(page.getByLabel("Selection Mode")).toHaveValue("empty");
			await page.getByLabel("Selection Mode").selectOption("date");
			await expect(inputByLabel(page, "Start Filter Value")).toBeVisible();
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.CONTENT_BOX_TITLE)).toContainText("List of all products (30)");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(10);

			await page.getByRole("button", { name: "Filter name [O] Date Selected" }).click();
			await page.getByLabel("Selection Mode").selectOption("empty");
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.getByText("No search results. Try again")).toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(0);
		});
	});
});
