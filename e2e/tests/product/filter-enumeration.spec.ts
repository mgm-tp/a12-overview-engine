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

import { Selector, Showcase, navigate } from "../utils.js";
import { test, expect, waitUntilLoaded } from "../commands.js";

test.describe("Filter by Enumeration field", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);
	});

	test("should filter by selecting a single enumeration value", async ({ page }) => {
		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();

		await page
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.LIST_ITEM_TEXT, { hasText: "Target Group" })
			.click();

		await page
			.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Women" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();

		await page.locator(Selector.BUTTON_APPLY).click();
		await waitUntilLoaded(page);

		const rows = page.locator(Selector.TABLE_BODY_ROW);
		const rowCount = await rows.count();
		expect(rows).toHaveCount(7);

		for (let i = 0; i < rowCount; i++) {
			await expect(rows.nth(i)).toContainText("Women");
		}
	});

	test("should filter by selecting multiple enumeration values", async ({ page }) => {
		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();

		await page
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.LIST_ITEM_TEXT, { hasText: "Target Group" })
			.click();

		const secondaryContent = page.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY);

		await secondaryContent
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Women" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();

		await secondaryContent
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Children" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();

		await page.locator(Selector.BUTTON_APPLY).click();
		await waitUntilLoaded(page);

		const rows = page.locator(Selector.TABLE_BODY_ROW);
		const rowCount = await rows.count();
		expect(rows).toHaveCount(10);

		for (let i = 0; i < rowCount; i++) {
			await expect(rows.nth(i)).toContainText(/Women|Children/);
		}
	});
});
