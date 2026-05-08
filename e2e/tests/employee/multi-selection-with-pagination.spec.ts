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
import { navigate, Selector, Showcase } from "../utils.js";
import { allRowsShouldBeCheck, overallCheckboxStatusShouldBe } from "../helper.js";

test.describe("Multi-Selection Feature - With pagination", () => {
	test.describe("Using Employee showcase", () => {
		test.beforeAll(async ({ seed }) => {
			await seed("employee");
		});
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.EMPLOYEE_PRESET_FILTER);
		});
		test("should work properly with preset filter", async ({ page }) => {
			await expect(page.locator(Selector.FILTER_BAR).locator(Selector.FILTER_NAME)).toContainText("Actual Salary");
			await expect(page.locator(Selector.FILTER_BAR).locator(Selector.FILTER_OPTIONS)).toContainText("≥ 20,000 EUR");
			await page.locator(Selector.BUTTON_SEARCH).click();
			await overallCheckboxStatusShouldBe(page, "false");
			await allRowsShouldBeCheck(page, false, 7);
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();

			await page.locator(Selector.TABLE_HEADER_CELL).first().locator(Selector.CHECKBOX_INPUT).click();
			await overallCheckboxStatusShouldBe(page, "true");
			await allRowsShouldBeCheck(page, true, 7);

			await page.locator(Selector.FILTER_BAR).locator(Selector.BUTTON_DELETE).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.MODAL_OVERLAY)).toContainText("Warning");
			await page
				.locator(Selector.PORTAL)
				.locator(Selector.MODAL_OVERLAY)
				.locator(Selector.buttonContains("Clear selection"))
				.click();
			await expect(page.locator(Selector.FILTER_BAR)).not.toBeVisible();
			await overallCheckboxStatusShouldBe(page, "false");
			await allRowsShouldBeCheck(page, false);
			await expect(page.locator(Selector.PAGINATION)).toContainText("1 / 3");
		});
	});
});
