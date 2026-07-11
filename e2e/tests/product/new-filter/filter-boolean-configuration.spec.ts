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

import type { WritableDraft } from "immer";

import type { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { test, expect } from "../../commands.js";
import { Showcase, navigate } from "../../utils.js";
import { useModelOverride } from "../../model-override.js";
import { updateBooleanFilter } from "../../filter-utils.js";

function withInStock(modifier: (filter: WritableDraft<OverviewModel.NewFilter.Boolean.Item>) => void) {
	return (model: OverviewModel) => updateBooleanFilter(model, "inStock", modifier);
}

test.describe.skip("Boolean Filter Configuration", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("Criteria = [true]", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.criteria = [true];
			})
		);

		test("Criteria = [true]", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: /List of all products/ })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await expect(filterButton).toContainText("True");

			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "Yes" })).toBeChecked();
			await expect(dialog.getByRole("checkbox", { name: "No" })).not.toBeChecked();

			await expect(page.getByRole("heading", { name: /List of all products/ })).toContainText("(");
		});
	});

	test.describe("Criteria = [false]", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.criteria = [false];
			})
		);

		test("Criteria = [false]", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products" })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await expect(filterButton).toContainText("False");

			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "No" })).toBeChecked();
			await expect(dialog.getByRole("checkbox", { name: "Yes" })).not.toBeChecked();

			const table = page.getByRole("table");
			await expect(table.getByText("No results found")).toBeVisible();
		});
	});

	test.describe("Criteria = disabled", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.criteria = undefined;
			})
		);

		test("Criteria = disabled", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products" })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await expect(filterButton).not.toContainText("True");
			await expect(filterButton).not.toContainText("False");

			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "Yes" })).not.toBeChecked();
			await expect(dialog.getByRole("checkbox", { name: "No" })).not.toBeChecked();

			await expect(dialog.getByRole("button", { name: "Apply" })).toBeDisabled();

			await dialog.getByRole("button", { name: "Reset" }).click();
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
		});
	});

	test.describe("Criteria = [true, false]", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.criteria = [true, false];
			})
		);

		test("Criteria = [true, false]", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: /List of all products/ })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await expect(filterButton).toContainText("True");
			await expect(filterButton).toContainText("False");

			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "Yes" })).toBeChecked();
			await expect(dialog.getByRole("checkbox", { name: "No" })).toBeChecked();

			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
		});
	});

	test.describe("Criteria = []", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.criteria = [];
			})
		);

		test("Criteria = []", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products" })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await expect(filterButton).not.toContainText("True");
			await expect(filterButton).not.toContainText("False");

			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "Yes" })).not.toBeChecked();
			await expect(dialog.getByRole("checkbox", { name: "No" })).not.toBeChecked();

			await expect(dialog.getByRole("button", { name: "Apply" })).toBeDisabled();

			await dialog.getByRole("button", { name: "Reset" }).click();
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
		});
	});

	test.describe("empty = disabled", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.empty = { enabled: false };
			})
		);

		test("empty = disabled", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products" })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();

			await dialog.getByRole("button").filter({ hasText: "settings" }).click();

			await expect(page.getByText("No settings available")).toBeVisible();

			const settingsDialog = page.locator('[role="dialog"]').last();
			await settingsDialog.getByRole("button", { name: "Reset" }).click();
		});
	});

	test.describe("empty = false", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.empty = { enabled: true, value: false };
			})
		);

		test("empty = false", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products" })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();

			await expect(dialog.getByRole("checkbox", { name: "Yes" })).toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "No" })).toBeVisible();

			await dialog.getByRole("button").filter({ hasText: "settings" }).click();

			await expect(page.getByText("Empty")).toBeVisible();

			const settingsDialog = page.locator('[role="dialog"]').last();
			await settingsDialog.getByRole("button", { name: "Reset" }).click();
		});
	});

	test.describe("empty = true", () => {
		useModelOverride(
			withInStock((filter) => {
				filter.options.empty = { enabled: true, value: true };
			})
		);

		test("empty = true", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products" })).toBeVisible();

			const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
			await filterButton.click();
			const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
			await expect(dialog).toBeVisible();

			await expect(dialog.getByText("Empty")).toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "Yes" })).not.toBeVisible();
			await expect(dialog.getByRole("checkbox", { name: "No" })).not.toBeVisible();

			await dialog.getByRole("button").filter({ hasText: "settings" }).click();

			await expect(page.getByText("Empty")).toBeVisible();

			const settingsDialog = page.locator('[role="dialog"]').last();
			await settingsDialog.getByRole("button", { name: "Reset" }).click();
		});
	});
});
