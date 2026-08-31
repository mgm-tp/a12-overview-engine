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
import { Selector, Showcase, navigate } from "../../utils.js";

const FILTER_ID = "timeField";

function makeTimeFilter(
	overrides: Partial<OverviewModel.NewFilter.Time.Item["options"]> = {}
): OverviewModel.NewFilter.Time.Item {
	return {
		id: FILTER_ID,
		type: "time",
		preferFilterBar: true,
		options: {
			fieldId: ProductFieldIds.timeField.id,
			ranges: [
				{ option: "fromTo", default: true, enabled: true },
				{ option: "fromOnly", enabled: true },
				{ option: "toOnly", enabled: true },
				{ option: "exact", enabled: true }
			],
			empty: { enabled: true, value: false },
			invert: { enabled: true, value: false },
			...overrides
		}
	};
}

function filterBarChip(page: Page) {
	return page.locator(`${Selector.FILTER_CONTENT}[title="[D] Time"]`);
}

function filterDropdown(page: Page) {
	return page.locator('[role="dialog"]').first();
}

test.describe.serial("Time Filter", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("default config", () => {
		useModelOverride((model) => setFilterItems(model, [makeTimeFilter()]));

		test("Entering a time range and applying narrows the table", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);
			await expect(page.getByRole("heading", { name: "List of all products (30)" })).toBeVisible();

			await filterBarChip(page).click();
			const dropdown = filterDropdown(page);
			await expect(dropdown).toBeVisible();

			const fromInput = dropdown.getByPlaceholder("hh:mm AM/PM").first();
			const toInput = dropdown.getByPlaceholder("hh:mm AM/PM").last();
			await fromInput.fill("08:00 AM");
			await fromInput.blur();
			await toInput.fill("06:00 PM");
			await toInput.blur();

			await dropdown.getByRole("button", { name: "Apply" }).click();

			await expect(page.getByRole("heading", { name: "List of all products (30)" })).not.toBeVisible();
		});
	});

	test.describe("with empty preselected", () => {
		useModelOverride((model) => setFilterItems(model, [makeTimeFilter({ empty: { enabled: true, value: true } })]));

		test("Empty enabled with preselected value renders Empty on the bar chip", async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_NEW_FILTER);

			await expect(filterBarChip(page)).toContainText("Empty");
		});
	});
});
