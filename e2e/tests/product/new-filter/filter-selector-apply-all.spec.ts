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
import { Showcase, navigate } from "../../utils.js";

function makeBooleanFilter(): OverviewModel.NewFilter.Boolean.Item {
	return {
		id: "inStock",
		type: "boolean",
		label: [{ locale: "en", text: "Available in stock" }],
		options: {
			fieldId: ProductFieldIds.inStock.id,
			empty: { enabled: false }
		}
	};
}

function makeDateFilter(): OverviewModel.NewFilter.Date.Item {
	return {
		id: "dateField",
		type: "date",
		options: {
			fieldId: ProductFieldIds.dateField.id,
			ranges: [
				{ option: "fromTo", default: true, enabled: true },
				{ option: "fromOnly", enabled: true },
				{ option: "toOnly", enabled: true },
				{ option: "exact", enabled: true }
			],
			periods: [{ option: "date", default: true, enabled: true }],
			empty: { enabled: true, value: false },
			invert: { enabled: true, value: false }
		}
	};
}

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
				{ option: "exact", enabled: true }
			],
			empty: { enabled: true, value: false },
			invert: { enabled: true, value: false }
		}
	};
}

test.describe.serial("Filter Selector Apply All (docked)", () => {
	useModelOverride((model) => setFilterItems(model, [makeNumberFilter(), makeBooleanFilter(), makeDateFilter()]));

	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	function trigger(page: Page) {
		return page.getByRole("button", { name: /^(Open|Close) filter$/ });
	}

	async function ensureSelectorOpen(page: Page) {
		await expect(trigger(page)).toBeVisible();

		if ((await trigger(page).getAttribute("aria-label")) === "Open filter") {
			await trigger(page).click();
		}

		await expect(page.getByRole("heading", { name: "[D] Date", exact: true })).toBeVisible();
	}

	test("Apply All commits both edits and updates the heading count", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

		await ensureSelectorOpen(page);

		const inStockSection = page
			.locator("[data-role='typography-section']")
			.filter({ has: page.getByRole("heading", { name: "Available in stock", level: 5 }) });
		await inStockSection.getByRole("checkbox", { name: "Yes" }).check();

		const dateSection = page
			.locator("[data-role='typography-section']")
			.filter({ has: page.getByRole("heading", { name: "[D] Date", exact: true, level: 5 }) });
		const fromInput = dateSection.getByPlaceholder("MM/dd/yyyy").first();
		await fromInput.fill("01/01/2019");
		await fromInput.blur();

		await page.getByRole("button", { name: "Apply All" }).click();

		await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();
	});

	test("Reopening the selector shows both committed edits", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

		await ensureSelectorOpen(page);

		const inStockSection = page
			.locator("[data-role='typography-section']")
			.filter({ has: page.getByRole("heading", { name: "Available in stock", level: 5 }) });
		await inStockSection.getByRole("checkbox", { name: "Yes" }).check();

		const dateSection = page
			.locator("[data-role='typography-section']")
			.filter({ has: page.getByRole("heading", { name: "[D] Date", exact: true, level: 5 }) });
		const fromInput = dateSection.getByPlaceholder("MM/dd/yyyy").first();
		await fromInput.fill("01/01/2019");
		await fromInput.blur();

		await page.getByRole("button", { name: "Apply All" }).click();

		await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

		await expect(inStockSection.getByRole("checkbox", { name: "Yes" })).toBeChecked();
		await expect(dateSection.getByPlaceholder("MM/dd/yyyy").first()).toHaveValue("01/01/2019");
	});
});
