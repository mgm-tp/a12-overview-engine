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

import { Selector, Showcase, navigate } from "../utils.js";
import { test, expect, waitUntilLoaded } from "../commands.js";

test.describe("String with whitespace", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("bundle");
	});

	test.describe("normal string filter without enable_approximate_match_search", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.BUNDLE);
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
		});
		test.describe("filter a string field by a full value contains whitespace", () => {
			test("filtered result should contain filter value", async ({ page }) => {
				const fullKeyword = "Tel oplu tar giwerjuw ti mo fa nac kaicdar regitet kezula raj uwovu jo gamjo ura gohfih.";
				await page
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.locator(Selector.LIST_ITEM_TEXT, { hasText: "Description" })
					.click();
				await page.locator(Selector.INPUT_FILTER_VALUE).fill(`${fullKeyword}`);
				await page.locator(Selector.INPUT_FILTER_VALUE).blur();
				await page.locator(Selector.BUTTON_APPLY).click();
				await waitUntilLoaded(page);
				await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
				const rows = page.locator(Selector.INFINITE_SCROLL_ROW);
				await expect(rows).toHaveCount(1);
				await expect(rows).toContainText(fullKeyword);
			});
		});
	});
});
