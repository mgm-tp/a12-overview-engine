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

import type { Page, Locator } from "@playwright/test";

import type { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { test, expect } from "../../commands.js";
import { setFilterItems } from "../../filter-utils.js";
import { useModelOverride } from "../../model-override.js";
import { ProductFieldIds } from "../../product-field-ids.js";
import { Showcase, Selector, navigate } from "../../utils.js";

function makeNumberFilter(): OverviewModel.NewFilter.Number.Item {
	return {
		id: "number",
		type: "number",
		preferFilterBar: true,
		options: {
			fieldId: ProductFieldIds.number.id,
			ranges: [
				{ option: "fromTo", enabled: true },
				{ option: "fromOnly", default: true, enabled: true },
				{ option: "toOnly", enabled: true },
				{ option: "exact", enabled: true }
			],
			empty: { enabled: true, value: false },
			invert: { enabled: true, value: false }
		}
	};
}

function makeInStockFilter(): OverviewModel.NewFilter.Boolean.Item {
	return {
		id: "inStock",
		type: "boolean",
		preferFilterBar: true,
		label: [{ locale: "en", text: "Available in stock" }],
		options: {
			fieldId: ProductFieldIds.inStock.id,
			empty: { enabled: false }
		}
	};
}

test.describe.serial("Filter Bar Reset", () => {
	useModelOverride((model) => setFilterItems(model, [makeNumberFilter(), makeInStockFilter()]));

	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	function filterBar(page: Page): Locator {
		return page.getByRole("region", { name: "Filter bar" });
	}

	function numberChip(page: Page): Locator {
		return page.locator(`${Selector.FILTER_CONTENT}[title="Number"]`);
	}

	function chipDropdown(page: Page): Locator {
		return page.locator('[role="dialog"]').first();
	}

	function barResetButton(page: Page): Locator {
		return filterBar(page)
			.getByRole("button")
			.filter({ has: page.locator("text=replay") });
	}

	async function applyNumberFilter(page: Page, value: string): Promise<void> {
		await numberChip(page).click();
		const dropdown = chipDropdown(page);
		await expect(dropdown).toBeVisible();
		await dropdown.getByPlaceholder("Filter Value").fill(value);
		await dropdown.getByPlaceholder("Filter Value").blur();
		await dropdown.getByRole("button", { name: "Apply" }).click();
		await expect(dropdown).not.toBeVisible();
	}

	test("Bar reset disabled before any filter is applied", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

		await expect(barResetButton(page)).toBeDisabled();
	});

	test("Bar reset is enabled after applying a filter via the bar chip", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await applyNumberFilter(page, "100");

		await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();
		await expect(barResetButton(page)).toBeEnabled();
	});
});
