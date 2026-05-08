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

test.describe("Initial load - Without preset filter", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("person");
	});

	test.beforeEach(async ({ page }) => {
		// It has to navigate to the default showcase first, because Client deep linking's restore activities state feature cannot prevent the initial load.
		await navigate(page, Showcase.DEFAULT);
		await page.locator(Selector.MENU_ITEM, { hasText: "Person" }).click();
	});

	test("should work", async ({ page }) => {
		await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
		const noInitialLoadText = page.getByText("Please apply a filter or perform a search to see results");
		await expect(noInitialLoadText).toBeVisible();
		await expect(page.getByText("Total")).not.toBeVisible();
		await page.locator(Selector.BUTTON_SEARCH).click();
		await expect(page.locator(Selector.PAGINATION)).toBeVisible();
		await expect(noInitialLoadText).not.toBeVisible();
		await expect(page.getByText("Total")).toBeVisible();
	});
});
