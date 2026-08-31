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
import { Selector, Showcase, navigate, getColumnIndex } from "../utils.js";

test.describe("Bundle with link columns", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("bundle");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.BUNDLE_WITH_LINK);
	});

	test("should render all expected column headers", async ({ page }) => {
		const header = (name: string) => page.getByRole("columnheader", { name, exact: true });

		await expect(header("Name")).toBeVisible();
		await expect(header("Price")).toBeVisible();
		await expect(header("Description")).toBeVisible();
		await expect(header("Feature List")).toBeVisible();
		await expect(header("Release Date")).toBeVisible();
		await expect(header("On Sale Dates")).toBeVisible();
		await expect(header("Expression")).toBeVisible();
		await expect(header("Promotion Name")).toBeVisible();
	});

	test("should display Promotion Name for linked rows and 'Link not found.' for unlinked rows", async ({ page }) => {
		const rows = page.locator(Selector.TABLE_INFINITE_BODY_ROW);

		const promoColIdx = await getColumnIndex(page.getByRole("columnheader", { name: "Promotion Name", exact: true }));

		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(promoColIdx)).toBeVisible();
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(promoColIdx)).not.toHaveText("Link not found.");
		await expect(rows.nth(5).locator(Selector.TABLE_BODY_CELL).nth(promoColIdx)).toHaveText("Link not found.");
	});
});
