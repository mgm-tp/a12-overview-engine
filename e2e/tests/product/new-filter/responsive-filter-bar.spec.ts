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

import { test, expect } from "../../commands.js";
import { Showcase, navigate } from "../../utils.js";

const SIZE = {
	LG: { width: 1280, height: 720 },
	SM: { width: 700, height: 720 },
	XS: { width: 500, height: 720 }
} as const;

test.describe.serial("Filter Bar / Selector responsiveness", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.afterEach(async ({ page }) => {
		await page.setViewportSize(SIZE.LG);
	});

	test("Filter Bar is hidden at sm and xs", async ({ page }) => {
		await page.setViewportSize(SIZE.SM);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);

		await page.setViewportSize(SIZE.XS);
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);
	});

	test("At sm the Filter Selector trigger remains operable", async ({ page }) => {
		await page.setViewportSize(SIZE.SM);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		const trigger = page.getByRole("button", { name: /^(Open|Close) filter$/ });
		await expect(trigger).toBeVisible();
	});

	test("Resizing from lg to sm hides the Filter Bar", async ({ page }) => {
		await page.setViewportSize(SIZE.LG);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		const bar = page.getByRole("region", { name: "Filter bar" });
		await expect(bar).toBeVisible();

		await page.setViewportSize(SIZE.SM);
		await expect(bar).toHaveCount(0);
	});

	test("Resizing from sm back to lg restores the Filter Bar", async ({ page }) => {
		await page.setViewportSize(SIZE.SM);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);

		await page.setViewportSize(SIZE.LG);
		await expect(page.getByRole("region", { name: "Filter bar" })).toBeVisible();
	});
});
