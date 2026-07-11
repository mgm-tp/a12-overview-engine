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
import { setFilterItems } from "../../filter-utils.js";
import { useModelOverride } from "../../model-override.js";
import { ProductFieldIds } from "../../product-field-ids.js";
import { Showcase, Selector, navigate } from "../../utils.js";

function makeNameFilter(
	overrides: Partial<OverviewModel.NewFilter.String.Item["options"]> = {}
): OverviewModel.NewFilter.String.Item {
	return {
		id: "name",
		type: "string",
		preferFilterBar: true,
		label: [{ locale: "en", text: "Name" }],
		options: {
			fieldId: ProductFieldIds.name.id,
			empty: { enabled: false },
			invert: { enabled: false },
			caseSensitive: { enabled: false },
			exactMatch: { enabled: false },
			...overrides
		}
	};
}

function filterBarChip(page: Page) {
	return page.locator(`${Selector.FILTER_CONTENT}[title="Name"]`);
}

function filterDropdown(page: Page) {
	return page.locator('[role="dialog"]').first();
}

test.describe.serial("String Filter", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("default config", () => {
		useModelOverride((model) => setFilterItems(model, [makeNameFilter()]));

		test("Typing criteria and applying filters the table", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await filterBarChip(page).click();

			const dropdown = filterDropdown(page);
			await expect(dropdown).toBeVisible();

			await dropdown.getByRole("textbox").fill("Sport");
			await dropdown.getByRole("textbox").blur();
			await dropdown.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();
			await expect(page.getByText("No results found")).toBeVisible();
		});

		test("Reset clears string filter", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await filterBarChip(page).click();
			const dropdown = filterDropdown(page);
			await dropdown.getByRole("textbox").fill("Sport");
			await dropdown.getByRole("textbox").blur();
			await dropdown.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

			await filterBarChip(page).click();
			const dropdown2 = filterDropdown(page);
			await dropdown2.getByRole("button", { name: "Reset" }).click();
			await dropdown2.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
		});
	});

	test.describe("with pre-configured criteria", () => {
		useModelOverride((model) => setFilterItems(model, [makeNameFilter({ criteria: "Sport" })]));

		test("Pre-configured criteria filters on load", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

			await expect(filterBarChip(page)).toContainText("Sport");
		});
	});

	test.describe("with empty preselected", () => {
		useModelOverride((model) => setFilterItems(model, [makeNameFilter({ empty: { enabled: true, value: true } })]));

		test("Empty enabled shows empty filter label", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);

			await expect(filterBarChip(page)).toContainText("Empty");
		});
	});
});
