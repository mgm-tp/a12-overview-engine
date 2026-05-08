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

test.describe("Multi-Selection Feature - Shift+click range selection disabled for infinite scroll", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("bundle");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.BUNDLE);
		await page.locator(Selector.BUTTON_EXPAND_MULTI_SELECTION).click();
	});

	test("shift+click should NOT select a range of rows, only the clicked row", async ({ page }) => {
		const rows = page.locator(Selector.INFINITE_SCROLL_ROW);

		const startRowCheckbox = rows.nth(0).locator(Selector.CHECKBOX_INPUT);
		await startRowCheckbox.click();
		await expect(startRowCheckbox).toBeChecked();

		const endRowCheckbox = rows.nth(3).locator(Selector.CHECKBOX_INPUT);
		await endRowCheckbox.click({ modifiers: ["Shift"] });

		await expect(endRowCheckbox).toBeChecked();

		const middleRow1Checkbox = rows.nth(1).locator(Selector.CHECKBOX_INPUT);
		const middleRow2Checkbox = rows.nth(2).locator(Selector.CHECKBOX_INPUT);
		await expect(middleRow1Checkbox).not.toBeChecked();
		await expect(middleRow2Checkbox).not.toBeChecked();

		await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("2");
	});
});
