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

test.describe("Filtering and sorting when the number of pages is changed", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("Filtering and sorting statuses should be kept", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_PAGINATION);
		});
		test("Should work", async ({ page }) => {
			// Apply filtering
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: "[O] Number (pinned)" })
				.click();
			await page.getByPlaceholder("Start Filter Value").fill("200");
			await page.locator(Selector.BUTTON_APPLY).click();
			waitUntilLoaded(page);
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 200");
			// Apply sorting
			const header = page.locator(Selector.TABLE_HEADER_CELL, { hasText: "[O] Number (pinned)" }).first();
			await expect(header).toHaveAttribute("title", "sortable");
			await header.click();
			waitUntilLoaded(page);
			await expect(page.locator(Selector.CONTENT_BOX_TITLE)).toContainText("List of all products (21)");
			await expect(page.locator(Selector.PAGINATION)).toContainText("1 / 3");
			await page.locator(Selector.BUTTON_GO_TO_LAST_PAGE).click();
			waitUntilLoaded(page);
			await expect(page.locator(Selector.PAGINATION)).toContainText("3 / 3");
			// Delete a product
			await page.locator(Selector.TABLE_BODY_ROW).nth(0).locator(Selector.BUTTON_DELETE_PRODUCT).click();
			await page
				.locator(Selector.PORTAL)
				.locator(Selector.MODAL_OVERLAY)
				.locator(Selector.buttonContains("Delete"))
				.click();
			waitUntilLoaded(page);
			await expect(page.locator(Selector.FILTER_BAR)).toContainText("≥ 200");
			await expect(header).toHaveAttribute("title", "sortable");
			await expect(header).toHaveAttribute("aria-sort", "descending");
			await expect(page.locator(Selector.CONTENT_BOX_TITLE)).toContainText("List of all products (20)");
			await expect(page.locator(Selector.PAGINATION)).toContainText("2 / 2");
		});
	});
});
