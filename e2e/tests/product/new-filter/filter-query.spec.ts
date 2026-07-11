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
import { updateQueryFilter } from "../../filter-utils.js";
import { useModelOverride } from "../../model-override.js";
import { Showcase, Selector, navigate } from "../../utils.js";

function filterBarChip(page: Page) {
	return page.locator(`${Selector.FILTER_CONTENT}[title="Lightweight sports"]`);
}

function filterDropdown(page: Page) {
	return page.locator('[role="dialog"]').filter({ hasText: "Lightweight sports" }).first();
}

test.describe.serial("Query Filter", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("default config", () => {
		test("Selector lists query filter with description label", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await expect(filterBarChip(page)).toBeVisible();
		});

		test("Enabling query filter re-fetches table with filtered results", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await filterBarChip(page).click();

			const dropdown = filterDropdown(page);
			await expect(dropdown).toBeVisible();
			await expect(dropdown.getByRole("checkbox", { name: "Enable" })).not.toBeChecked();

			await dropdown.getByRole("checkbox", { name: "Enable" }).check();
			await dropdown.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: /List of all products \(\d+\)/ })).toBeVisible();
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();
		});

		test("Reset clears query filter", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await filterBarChip(page).click();
			const dropdown = filterDropdown(page);
			await dropdown.getByRole("checkbox", { name: "Enable" }).check();
			await dropdown.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

			await filterBarChip(page).click();
			const dropdown2 = filterDropdown(page);
			await expect(dropdown2.getByRole("checkbox", { name: "Enable" })).toBeChecked();
			await dropdown2.getByRole("button", { name: "Reset" }).click();
			await expect(dropdown2.getByRole("checkbox", { name: "Enable" })).not.toBeChecked();
			await dropdown2.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
		});

		test("Paginated results remain navigable after filtering", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await filterBarChip(page).click();

			const dropdown = filterDropdown(page);
			await dropdown.getByRole("checkbox", { name: "Enable" }).check();
			await dropdown.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: /List of all products \(\d+\)/ })).toBeVisible();
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

			await expect(page.locator(Selector.TABLE_BODY_ROW).first()).toBeVisible();
		});
	});

	test.describe("with enabled=true preset", () => {
		useModelOverride((model) =>
			updateQueryFilter(model, "lightweight-sports", (filter) => {
				filter.options.enabled = { enabled: true, value: true };
			})
		);

		test("Pre-configured enabled=true filters on load", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: /List of all products \(\d+\)/ })).toBeVisible();
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

			await filterBarChip(page).click();

			const dropdown = filterDropdown(page);
			await expect(dropdown.getByRole("checkbox", { name: "Enable" })).toBeChecked();
		});
	});

	test.describe("with enabled=false preset", () => {
		useModelOverride((model) =>
			updateQueryFilter(model, "lightweight-sports", (filter) => {
				filter.options.enabled = { enabled: true, value: false };
			})
		);

		test("Enabled toggle off does not filter", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await filterBarChip(page).click();

			const dropdown = filterDropdown(page);
			await expect(dropdown.getByRole("checkbox", { name: "Enable" })).not.toBeChecked();
		});
	});
});
