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
import { Selector, Showcase, navigate } from "../../utils.js";

test.describe.serial("Embedded OE — compact trigger placement", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

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

	function contentBoxHeader(page: Page) {
		return page.locator(Selector.CONTENT_BOX_HEADER);
	}

	function filterTrigger(page: Page) {
		return page.getByRole("button", { name: "Open filter" });
	}

	function searchTrigger(page: Page) {
		return page.locator(Selector.BUTTON_SEARCH);
	}

	test.fixme("Filter trigger renders inside the Content Box Header (not the subheader / filter bar region)", async ({
		page
	}) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(contentBoxHeader(page)).toBeVisible();
		await expect(contentBoxHeader(page).locator(Selector.BUTTON_OPEN_FILTER)).toBeVisible();
		await expect(page.getByRole("region", { name: "Filter bar" })).toHaveCount(0);
	});

	test.fixme("Search icon button toggles a SubActionBar with the search field", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(contentBoxHeader(page).locator(Selector.BUTTON_SEARCH)).toBeVisible();
		await expect(page.getByPlaceholder("Search")).toHaveCount(0);

		await searchTrigger(page).click();
		await expect(page.getByPlaceholder("Search")).toBeVisible();
	});

	test.fixme("Filter trigger opens the configured Filter Selector when embedded", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await filterTrigger(page).click();
		const dialog = page.getByRole("dialog").filter({ hasText: "Filter products" });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole("heading", { name: "Filter products" })).toBeVisible();
	});
});
