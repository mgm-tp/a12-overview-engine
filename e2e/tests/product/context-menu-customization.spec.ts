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

test.describe("Context menu customization", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);
	});

	test("should display customized context menu via API", async ({ page }) => {
		const firstRow = page.locator(Selector.TABLE_BODY_ROW).first();
		await firstRow.click({ button: "right" });

		const portal = page.locator(Selector.PORTAL);
		const contextMenu = portal.locator('[role="dialog"]');
		await expect(contextMenu).toBeVisible();

		const menuGroupTitle = portal.locator('[data-role="list-sub-header"]');
		await expect(menuGroupTitle).toHaveCount(1);
		await expect(menuGroupTitle).toContainText("Customized via API");

		const menuItems = portal.locator(Selector.LIST_ITEM);
		await expect(menuItems).toHaveCount(2);
		await expect(menuItems.nth(0)).toContainText("Edit Row");
		await expect(menuItems.nth(1)).toContainText("Copy Row");
	});
});
