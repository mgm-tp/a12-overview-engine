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

test.describe("Enumerated string filter with Query Model", () => {
	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PERSON);
		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
	});

	// This test will fail if the constraint (which check salary > 2000) in PersonQM is removed
	test("should not display enumerated candidates outside of the listed query model", async ({ page }) => {
		await page
			.locator(Selector.FILTER_SELECTOR_CONTENT_PRIMARY)
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.LIST_ITEM_TEXT)
			.getByText("First Name", { exact: true })
			.click();

		await expect(
			page
				.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.CHECKBOX_CONTROL)
		).toHaveCount(3);

		await page.locator(Selector.INPUT_VALUE_SEARCH).fill("Ruby");
		await page.locator(Selector.INPUT_VALUE_SEARCH).press("Enter");

		await waitUntilLoaded(page);
		await expect(
			page
				.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.CHECKBOX_CONTROL)
		).toHaveCount(0);
		await expect(page.getByText("No option found")).toBeDefined();
	});
});
