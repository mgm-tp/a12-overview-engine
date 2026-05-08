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

test.describe("Button group container responsiveness and element button on header and footer with hidden label", () => {
	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);
	});

	test.describe("With large screen size", () => {
		test("Should hide the label", async ({ page }) => {
			await expect(page.locator("button[aria-label='Second Footer Button']").locator(Selector.BUTTON_LABEL)).toHaveText(
				"Second Footer Button"
			);
			await expect(page.locator("button[aria-label='First Footer Button']").locator(Selector.BUTTON_LABEL)).toHaveCount(
				0
			);
			await expect(page.locator("button[aria-label='First header button']").locator(Selector.BUTTON_LABEL)).toHaveCount(
				0
			);
		});
	});

	test.describe("With small screen size", () => {
		test.beforeEach(async ({ page }) => {
			await page.setViewportSize({ width: 428, height: 926 });
		});
		test("Should show the label", async ({ page }) => {
			await page.locator(Selector.CONTENT_BOX_FOOTER).locator(Selector.POPUP).click();
			await expect(page.locator(Selector.POPUP_MENU)).toContainText("First Footer Button");
			await page.locator(Selector.CONTENT_BOX_HEADER).locator(Selector.POPUP).click();
			await expect(page.locator(Selector.POPUP_MENU)).toContainText("First header button");
		});
	});
});
