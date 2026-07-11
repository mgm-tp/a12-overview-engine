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
import { navigate, Selector, Showcase, inputByLabel } from "../utils.js";

test.describe("Date with timezone", () => {
	test.beforeAll(async ({ seed }) => {
		// Seeding data can be slow in CI
		test.slow();
		await seed("employee");
	});
	test.describe("Start date with timezone Europe/Berlin", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.EMPLOYEE_PRESET_FILTER);
		});
		test("start date in filter result should not decrease one day", async ({ page }) => {
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: "Date of birth" })
				.click();
			await inputByLabel(page, "Start Filter Value").fill("02/28/1989\n");
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(1);
			await expect(page.locator(Selector.TABLE_BODY_ROW).filter({ hasText: "02/27/1989" })).toHaveCount(0);
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 02/28/1989");
			await page.locator(Selector.FILTER_BAR).locator(Selector.FILTER_CONTENT, { hasText: "≥ 02/28/1989" }).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await inputByLabel(page, "Start Filter Value").fill("02/27/1989\n");
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(1);
			await expect(page.locator(Selector.TABLE_BODY_ROW, { hasText: "12/08/1994" })).toBeVisible();
		});
	});
});
