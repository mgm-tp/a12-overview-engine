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

import { test, expect } from "../commands.js";
import { Selector, Showcase, navigate } from "../utils.js";

test.describe("String with whitespace", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("enumerated string filter", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_PAGINATION);
			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await page
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.LIST_ITEM_TEXT, { hasText: "Name" })
				.click();
		});
		test.describe("search enumerated string filter by a keyword contains whitespace", () => {
			test("search enumerated string options should work properly", async ({ page }) => {
				const keyword = "Badmintonball MAVIS 350";
				await expect(
					page
						.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
						.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
						.locator(Selector.CHECKBOX_CONTROL)
				).toHaveCount(6);
				await page.locator(Selector.INPUT_VALUE_SEARCH).fill(keyword);
				await page.locator(Selector.INPUT_VALUE_SEARCH).press("Enter");
				await expect(
					page
						.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
						.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
						.locator(Selector.CHECKBOX_CONTROL)
				).toHaveCount(1);
				await expect(
					page.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY).locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				).toContainText(keyword);
				await page
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.locator(Selector.LIST_ITEM_CONTENT, { hasText: keyword })
					.locator(Selector.CHECKBOX_INPUT)
					.check();
				await page.locator(Selector.BUTTON_APPLY).click();
				await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
				await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(1);
				await expect(page.locator(Selector.TABLE_BODY_ROW)).toContainText(keyword);
			});
		});

		test.describe("filter with empty value", () => {
			test("should show none result in empty string filter", async ({ page }) => {
				await page.locator(Selector.INPUT_VALUE_SEARCH).fill("");
				await page
					.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.locator(Selector.CHECKBOX_CONTROL, { hasText: "Badmintonball MAVIS" })
					.locator(Selector.CHECKBOX_INPUT)
					.click();
				await page
					.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.locator(Selector.CHECKBOX_CONTROL, { hasText: "Badmintonschläger PRO" })
					.locator(Selector.CHECKBOX_INPUT)
					.click();
				await page.locator(Selector.BUTTON_APPLY).click();

				await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(2);
				await expect(page.locator(Selector.TABLE_BODY_ROW).nth(0)).toContainText("Badmintonschläger PRO");
				await expect(page.locator(Selector.TABLE_BODY_ROW).nth(1)).toContainText("Badmintonball MAVIS");

				await page.getByRole("button", { name: "Filter name [D] Name Selected" }).click();
				await page
					.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.locator(Selector.CHECKBOX_CONTROL, { hasText: "Empty" })
					.locator(Selector.CHECKBOX_INPUT)
					.click();
				await page
					.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.locator(Selector.CHECKBOX_CONTROL, { hasText: "Badmintonball MAVIS" })
					.locator(Selector.CHECKBOX_INPUT)
					.click();
				await page
					.locator(Selector.FILTER_SELECTOR_CONTENT_SECONDARY)
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.locator(Selector.CHECKBOX_CONTROL, { hasText: "Badmintonschläger PRO" })
					.locator(Selector.CHECKBOX_INPUT)
					.click();
				await page.locator(Selector.BUTTON_APPLY).click();
				await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(0);
			});
		});
	});
});
