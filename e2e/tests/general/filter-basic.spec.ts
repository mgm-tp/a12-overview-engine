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

test.describe("Filtering Feature - Basic test", () => {
	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);
		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
	});

	const listFilterOptions = [
		"[O] Number (pinned)",
		"System Number",
		"External Number",
		"[O] Date",
		"[O] Date Time",
		"[O] Time",
		"[D] Name",
		"[D] Description",
		"[M] Meta",
		"Search Keyword",
		"Media Type",
		"Mime Type",
		"URL",
		"[D] Weight",
		"[D] Weight Unit",
		"Packaging: Multiplicator",
		"Packaging: Amount",
		"Packaging: Unit",
		"Target Group",
		"In Stock",
		"Limited Offer",
		"Seller email"
	];

	test("should show all fields from document model", async ({ page }) => {
		const items = page.locator(Selector.FILTER_SELECTOR_CONTENT_PRIMARY).locator(Selector.FILTER_SELECTOR_LIST_ITEM);
		await expect(items).toHaveCount(listFilterOptions.length);

		for (let i = 0; i < listFilterOptions.length; i++) {
			await expect(items.nth(i).locator(Selector.LIST_ITEM_TEXT)).toHaveText(listFilterOptions[i]);
		}
	});
});
