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

test.describe("Row settings with OverviewEngineFactories", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("OverviewEngineFactories", () => {
		test.describe("Row styling is interactive by default even with custom rowStyling", () => {
			test.beforeEach(async ({ page }) => {
				await navigate(page, Showcase.PRODUCT_PAGINATION);
			});

			test.describe("The second row is interactive by default", () => {
				test("Should be clickable", async ({ page }) => {
					await page.locator(Selector.TABLE_BODY_ROW).nth(1).click();
					await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
						"Performed click event on document"
					);
				});
			});

			test.describe("The other row is set as non-interactive intentionally", () => {
				test("Should not be clickable", async ({ page }) => {
					await page.locator(Selector.TABLE_BODY_ROW).nth(0).click();
					await expect(page.locator(Selector.PORTAL)).not.toBeVisible();
				});
			});
		});

		test.describe("Row action buttons work by dispatching default actions", () => {
			test.beforeEach(async ({ page }) => {
				await navigate(page, Showcase.PRODUCT_PAGINATION);
			});

			test.describe("Report bug action button", () => {
				test("Should work", async ({ page }) => {
					await page.locator(Selector.TABLE_BODY_ROW).nth(0).locator(Selector.BUTTON_REPORT_BUG_PRODUCT).click();
					await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
						'Performed "bug" event on document'
					);
				});
			});

			test.describe("Delete action button", () => {
				test("Should work", async ({ page }) => {
					await page.locator(Selector.TABLE_BODY_ROW).nth(0).locator(Selector.BUTTON_DELETE_PRODUCT).click();
					await page
						.locator(Selector.PORTAL)
						.locator(Selector.MODAL_OVERLAY)
						.locator(Selector.buttonContains("Delete"))
						.click();
					waitUntilLoaded(page);
					await expect(page.locator(Selector.CONTENT_BOX_TITLE)).toContainText("List of all products (29)");
				});
			});
		});
	});
});
