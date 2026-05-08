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
import { Selector, Showcase, navigate } from "../utils.js";

test.describe("Filter by Multi-select group", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test("the selected value should be applied", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);

		await expect(page.locator(Selector.CONTENT_BOX_TITLE)).toContainText("List of all products (30)");

		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
		await page
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.LIST_ITEM_TEXT, { hasText: "Meta" })
			.click();

		await page
			.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Number Two" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();

		await page.locator(Selector.BUTTON_APPLY).click();

		await expect(page.locator(Selector.CONTENT_BOX_TITLE)).toContainText("List of all products (23)");
	});

	test("should show none result in empty multi-select group", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);

		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await page.locator('[id="/product/meta-graphic-controls"] span').nth(1).click();
		await page
			.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Empty" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();
		await page
			.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Number One" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();
		await page.locator(Selector.BUTTON_APPLY).click();
		await expect(page.getByText("No search results. Try again")).toBeVisible();
		await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(0);

		await page.getByRole("button", { name: "Filter name [M] Meta Selected" }).click();
		await page
			.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Number One" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();
		await page.locator(Selector.BUTTON_APPLY).click();
		await expect(page.getByText("Taschenlampe")).toBeVisible();
		await expect(page.getByText("FCS Sportboard Tasche")).toBeVisible();
		await expect(page.getByText("No search results. Try again")).not.toBeVisible();
		await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(2);
	});
});
