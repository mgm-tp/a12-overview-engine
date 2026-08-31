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
import { overrideFilterConfiguration } from "../../filter-utils.js";
import { useModelOverride } from "../../model-override.js";
import { Showcase, navigate } from "../../utils.js";

test.describe.serial("Filter Selector search bar", () => {
	useModelOverride((model) =>
		overrideFilterConfiguration(model, {
			filterSelector: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				...model.content.configuration.newFilterConfiguration!.filterSelector,
				searchBar: { enabled: true, value: true }
			}
		})
	);

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

	test("Search bar filters the section list by label", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await ensureSelectorOpen(page);

		const searchBox = page.getByPlaceholder(/[Ss]earch/).last();
		await expect(searchBox).toBeVisible();

		await searchBox.fill("Date");

		await expect(page.getByRole("heading", { name: "[D] Date", exact: true })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Available in stock", level: 5 })).not.toBeVisible();
	});

	test("Clearing the search restores all sections", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);
		await ensureSelectorOpen(page);

		const searchBox = page.getByPlaceholder(/[Ss]earch/).last();
		await searchBox.fill("Date");
		await expect(page.getByRole("heading", { name: "Available in stock", level: 5 })).not.toBeVisible();

		await searchBox.fill("");
		await expect(page.getByRole("heading", { name: "Available in stock", level: 5 })).toBeVisible();
	});
});
