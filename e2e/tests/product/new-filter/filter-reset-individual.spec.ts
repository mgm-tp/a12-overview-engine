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

test.describe.serial("Filter reset (individual)", () => {
	useModelOverride((model) => setFilterItems(model, [makeNumberFilter()]));

	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	function chip(page: Page) {
		return page.locator(`${Selector.FILTER_CONTENT}[title="Number"]`);
	}

	function dropdown(page: Page) {
		return page.locator('[role="dialog"]').first();
	}

	test("Reset on a single chip clears only that filter and restores the count", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

		await chip(page).click();
		await dropdown(page).getByPlaceholder("Filter Value").fill("100");
		await dropdown(page).getByPlaceholder("Filter Value").blur();
		await dropdown(page).getByRole("button", { name: "Apply" }).click();

		await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();

		await chip(page).click();
		await dropdown(page).getByRole("button", { name: "Reset" }).click();
		await dropdown(page).getByRole("button", { name: "Apply" }).click();

		await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();
	});
});
