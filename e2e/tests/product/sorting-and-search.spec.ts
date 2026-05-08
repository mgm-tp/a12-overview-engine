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

test.describe("Sorting and searching features", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);
	});

	test("sorting order should be updated correctly", async ({ page }) => {
		const columnNameHeader = page.locator(Selector.TABLE_HEADER_CELL, { hasText: "[D] Name" }).first();
		await expect(columnNameHeader).toHaveAttribute("aria-sort", "descending");
		await expect(columnNameHeader).toHaveAttribute("title", "sortable");
		await columnNameHeader.click();
		await expect(columnNameHeader).toHaveAttribute("aria-sort", "ascending");
		await columnNameHeader.click();
		await expect(columnNameHeader).not.toHaveAttribute("aria-sort", /.+/);
	});

	test("should perform searching and show the notification", async ({ page }) => {
		await page.locator(Selector.INPUT_FULL_TEXT_SEARCH).fill("Wave");
		await page.locator(Selector.INPUT_FULL_TEXT_SEARCH).press("Enter");

		await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
			'Perform search event with keyword: "Wave"'
		);
		await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(1);
		await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
	});
});
