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

import { test, expect, waitUntilLoaded } from "../commands.js";
import { Selector, Showcase, navigate } from "../utils.js";

test.describe("Filter by Enumeration field", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("bundle");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.BUNDLE);

		await expect(
			page.locator(Selector.TABLE_INFINITE_BODY_ROW).nth(0).locator(Selector.TABLE_BODY_CELL).first()
		).toContainText("Teresa Valdez");
	});

	test("should filter by selecting a single enumeration value", async ({ page }) => {
		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();

		await page
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.LIST_ITEM_TEXT, { hasText: "Feature List" })
			.click();

		await page
			.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Feature 1" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();

		await page.locator(Selector.BUTTON_APPLY).click();
		await waitUntilLoaded(page);

		const rows = page.locator(Selector.TABLE_INFINITE_BODY_ROW);
		const rowCount = await rows.count();
		expect(rowCount).toBeGreaterThan(0);

		await expect(rows.nth(0)).toContainText("Feature 1");
	});

	test("should filter by selecting multiple enumeration values", async ({ page }) => {
		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();

		await page
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.LIST_ITEM_TEXT, { hasText: "Feature List" })
			.click();

		const secondaryContent = page.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY);

		await secondaryContent
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Feature 1" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();

		await secondaryContent
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.CHECKBOX_CONTROL, { hasText: "Feature 2" })
			.locator(Selector.CHECKBOX_INPUT)
			.click();

		await page.locator(Selector.BUTTON_APPLY).click();
		await waitUntilLoaded(page);

		const rows = page.locator(Selector.TABLE_INFINITE_BODY_ROW);
		const rowCount = await rows.count();
		expect(rowCount).toBeGreaterThan(0);

		await expect(rows.nth(0)).toContainText("Feature 1");
		await expect(rows.nth(0)).toContainText("Feature 2");
	});
});
