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

import type { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { test, expect } from "../../commands.js";
import { Showcase, navigate } from "../../utils.js";
import { useModelOverride } from "../../model-override.js";
import { ProductFieldIds } from "../../product-field-ids.js";
import { setFilterItems, overrideFilterConfiguration } from "../../filter-utils.js";

function makeBooleanFilter(): OverviewModel.NewFilter.Boolean.Item {
	return {
		id: "inStock",
		type: "boolean",
		label: [{ locale: "en", text: "Available in stock" }],
		options: {
			fieldId: ProductFieldIds.inStock.id,
			empty: { enabled: true, value: false }
		}
	};
}

function makeBarFilter(): OverviewModel.NewFilter.Number.Item {
	return {
		id: "number",
		type: "number",
		preferFilterBar: true,
		options: {
			fieldId: ProductFieldIds.number.id,
			ranges: [
				{ option: "fromTo", enabled: true },
				{ option: "fromOnly", default: true, enabled: true },
				{ option: "exact", enabled: true }
			],
			empty: { enabled: true, value: false },
			invert: { enabled: true, value: false }
		}
	};
}

test.describe.serial("Filter Selector (modal viewMode)", () => {
	useModelOverride((model) => {
		const seeded = setFilterItems(model, [makeBarFilter(), makeBooleanFilter()]);

		return overrideFilterConfiguration(seeded, {
			filterSelector: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				...seeded.content.configuration.newFilterConfiguration!.filterSelector,
				viewMode: "modal",
				initialVisibility: "hide",
				headerSubtitle: [
					{ locale: "en", text: "Filter products" },
					{ locale: "de", text: "Produkte filtern" }
				]
			}
		});
	});

	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	function modalDialog(page: Page) {
		return page.getByRole("dialog");
	}

	function openTrigger(page: Page) {
		return page.getByRole("button", { name: "Open filter" });
	}

	test("Trigger opens the selector as a modal dialog", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(modalDialog(page)).toHaveCount(0);

		await openTrigger(page).click();
		await expect(modalDialog(page)).toBeVisible();
		await expect(modalDialog(page).getByRole("heading", { name: "Filter products" })).toBeVisible();
	});

	test("Modal Close button hides the dialog", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		await expect(modalDialog(page)).toBeVisible();

		await modalDialog(page).getByRole("button", { name: "Close" }).click();
		await expect(modalDialog(page)).toHaveCount(0);
	});

	test("Modal Apply All commits edits and closes the dialog", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		await dialog.getByRole("checkbox", { name: "Yes" }).first().check();
		await dialog.getByRole("button", { name: "Apply All" }).click();

		await expect(modalDialog(page)).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();
	});

	test("Modal Close discards pending edits", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

		await openTrigger(page).click();
		await expect(modalDialog(page)).toBeVisible();

		await modalDialog(page).getByRole("checkbox", { name: "Yes" }).first().check();
		await modalDialog(page).getByRole("button", { name: "Close" }).click();

		await expect(modalDialog(page)).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
	});

	test("Modal Reset All clears the checked state in the editing view", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		await dialog.getByRole("checkbox", { name: "Yes" }).first().check();
		await dialog.getByRole("button", { name: "Apply All" }).click();
		await expect(modalDialog(page)).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

		await openTrigger(page).click();
		await expect(modalDialog(page)).toBeVisible();
		await expect(modalDialog(page).getByRole("checkbox", { name: "Yes" }).first()).toBeChecked();

		await modalDialog(page).getByRole("button", { name: "Reset All" }).click();
		await expect(modalDialog(page).getByRole("checkbox", { name: "Yes" }).first()).not.toBeChecked();
	});

	test("Modal opens at sm viewport (mobile width)", async ({ page }) => {
		await page.setViewportSize({ width: 700, height: 720 });

		try {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);

			await openTrigger(page).click();
			await expect(modalDialog(page)).toBeVisible();
			await expect(modalDialog(page).getByRole("heading", { name: "Filter products" })).toBeVisible();
		} finally {
			await page.setViewportSize({ width: 1280, height: 720 });
		}
	});

	test("Pressing ESC closes the modal", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		await expect(modalDialog(page)).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(modalDialog(page)).toHaveCount(0);
	});

	test("Header renders the literal 'Filter' subtitle above the modeled title", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		await expect(dialog.getByText("Filter", { exact: true })).toBeVisible();
		await expect(dialog.getByRole("heading", { name: "Filter products" })).toBeVisible();
	});

	test("Opening filter settings replaces the modal content", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		const heading = dialog.getByRole("heading", { name: "Available in stock", level: 5 });
		await heading.hover();
		const settingsButton = heading.locator("button").filter({ hasText: /^build$/ });
		await settingsButton.click();

		await expect(dialog.getByText("Configurations", { exact: true })).toBeVisible();
		await expect(dialog.getByRole("heading", { name: "Available in stock", exact: true })).toBeVisible();
		await expect(
			dialog
				.locator("button")
				.filter({ hasText: /arrow_back/ })
				.first()
		).toBeVisible();
		await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();
		await expect(dialog.getByRole("button", { name: "Apply All" })).toBeVisible();
		await expect(dialog.getByRole("button", { name: "Reset All" })).toBeVisible();
	});

	test("Back arrow returns from configurations view to the filter list", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await openTrigger(page).click();
		const dialog = modalDialog(page);
		await expect(dialog).toBeVisible();

		const heading = dialog.getByRole("heading", { name: "Available in stock", level: 5 });
		await heading.hover();
		await heading
			.locator("button")
			.filter({ hasText: /^build$/ })
			.click();

		await expect(dialog.getByText("Configurations", { exact: true })).toBeVisible();

		await dialog
			.locator("button")
			.filter({ hasText: /arrow_back/ })
			.first()
			.click();

		await expect(dialog.getByRole("heading", { name: "Filter products" })).toBeVisible();
		await expect(dialog.getByText("Configurations", { exact: true })).not.toBeVisible();
	});

	test("Modal width is capped near 420px at lg viewport", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 720 });
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
	});
});
