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

import type { Page } from "@playwright/test";

import { test, expect } from "../../commands.js";
import { Showcase, navigate } from "../../utils.js";
import { useModelOverride } from "../../model-override.js";
import { overrideFilterConfiguration } from "../../filter-utils.js";

test.describe.serial("Filter Selector (modal viewMode) — responsive sizing", () => {
	useModelOverride((model) =>
		overrideFilterConfiguration(model, {
			filterSelector: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				...model.content.configuration.newFilterConfiguration!.filterSelector,
				viewMode: "modal",
				initialVisibility: "hide",
				headerSubtitle: [
					{ locale: "en", text: "Filter products" },
					{ locale: "de", text: "Produkte filtern" }
				]
			}
		})
	);

	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.afterEach(async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 720 });
	});

	function modalDialog(page: Page) {
		return page.getByRole("dialog").filter({ hasText: "Filter products" });
	}

	function openTrigger(page: Page) {
		return page.getByRole("button", { name: "Open filter" });
	}

	test("lg viewport (1280×900): width within 360–420 cap, height ≈ 70% of viewport", async ({ page }) => {
		const viewport = { width: 1280, height: 900 };
		await page.setViewportSize(viewport);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		const box = await dialog.boundingBox();

		if (!box) {
			throw new Error("Modal dialog has no bounding box");
		}

		expect(box.width).toBeLessThanOrEqual(440);
		expect(box.width).toBeGreaterThanOrEqual(360);

		const expected = viewport.height * 0.7;
		const tolerance = viewport.height * 0.1;
		expect(box.height).toBeGreaterThanOrEqual(expected - tolerance);
		expect(box.height).toBeLessThanOrEqual(expected + tolerance);
	});

	test("md viewport (900×800): width within 360–420 cap, height ≈ 70% of viewport", async ({ page }) => {
		const viewport = { width: 900, height: 800 };
		await page.setViewportSize(viewport);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		const box = await dialog.boundingBox();

		if (!box) {
			throw new Error("Modal dialog has no bounding box");
		}

		expect(box.width).toBeLessThanOrEqual(440);
		expect(box.width).toBeGreaterThanOrEqual(360);

		const expected = viewport.height * 0.7;
		const tolerance = viewport.height * 0.1;
		expect(box.height).toBeGreaterThanOrEqual(expected - tolerance);
		expect(box.height).toBeLessThanOrEqual(expected + tolerance);
	});

	test("sm viewport (700×900): width capped near 420, height ≈ full viewport (minus gutter)", async ({ page }) => {
		const viewport = { width: 700, height: 900 };
		await page.setViewportSize(viewport);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		const box = await dialog.boundingBox();

		if (!box) {
			throw new Error("Modal dialog has no bounding box");
		}

		expect(box.width).toBeLessThanOrEqual(440);
		expect(box.width).toBeGreaterThanOrEqual(360);

		expect(box.height).toBeGreaterThan(viewport.height * 0.8);
		expect(box.height).toBeLessThanOrEqual(viewport.height);
	});

	test("xs viewport (400×900): width ≥ 360 (no max), height ≈ full viewport (minus gutter)", async ({ page }) => {
		const viewport = { width: 400, height: 900 };
		await page.setViewportSize(viewport);
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		const box = await dialog.boundingBox();

		if (!box) {
			throw new Error("Modal dialog has no bounding box");
		}

		expect(box.width).toBeGreaterThanOrEqual(350);
		expect(box.width).toBeLessThanOrEqual(viewport.width);

		expect(box.height).toBeGreaterThan(viewport.height * 0.8);
		expect(box.height).toBeLessThanOrEqual(viewport.height);
	});
});
