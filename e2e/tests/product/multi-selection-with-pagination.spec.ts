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
import { allRowsShouldBeCheck, overallCheckboxStatusShouldBe } from "../helper.js";
import { Selector, Showcase, navigate } from "../utils.js";

test.describe("Multi-Selection Feature - With pagination", () => {
	test.describe("Using Product showcase", () => {
		test.beforeAll(async ({ seed }) => {
			await seed("product");
		});
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_PAGINATION);
		});

		test("selected document should be counted and performed correctly", async ({ page }) => {
			await expect(page.locator(Selector.CONTENT_BOX_TITLE)).toContainText("List of all products (30)");

			await page.locator(Selector.BUTTON_EXPAND_MULTI_SELECTION).click();
			await overallCheckboxStatusShouldBe(page, "false");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("0");
			await expect(page.locator(Selector.buttonContains("Add to cart"))).toBeDisabled();
			await expect(page.locator(Selector.buttonContains("Favorite"))).toBeDisabled();
			await allRowsShouldBeCheck(page, false);

			// Check all and perform action Add to cart in 1st page
			await page.locator(Selector.TABLE_HEADER_CELL).first().locator(Selector.CHECKBOX_INPUT).click();
			await overallCheckboxStatusShouldBe(page, "true");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("10");
			await allRowsShouldBeCheck(page, true);
			await page.locator(Selector.buttonContains("Add to cart")).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
				'Performed "add_to_cart_event" event on 10 document(s)'
			);

			// Go to next page, check all and perform action Favourite
			await page.locator(Selector.PAGINATION_BUTTON_NEXT).click();
			await page.locator(Selector.buttonContains("Favorite")).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
				'Performed "mark_as_favorite_event" event on 10 document(s)'
			);
			await overallCheckboxStatusShouldBe(page, "false");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("10");
			await allRowsShouldBeCheck(page, false);
			await page.locator(Selector.TABLE_HEADER_CELL).first().locator(Selector.CHECKBOX_CONTROL).click();
			await overallCheckboxStatusShouldBe(page, "true");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("20");
			await allRowsShouldBeCheck(page, true);
			await page.locator(Selector.buttonContains("Favorite")).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
				'Performed "mark_as_favorite_event" event on 20 document(s)'
			);

			// Go to next page, check 2 rows and perform action Favourite
			await page.locator(Selector.PAGINATION_BUTTON_NEXT).click();
			await page.locator(Selector.buttonContains("Add to cart")).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
				'Performed "add_to_cart_event" event on 20 document(s)'
			);
			await overallCheckboxStatusShouldBe(page, "false");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("20");
			await allRowsShouldBeCheck(page, false);
			await page.locator(Selector.TABLE_BODY_ROW).nth(3).locator(Selector.CHECKBOX_INPUT).check();
			await overallCheckboxStatusShouldBe(page, "mixed");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("21");
			await page.locator(Selector.TABLE_BODY_ROW).nth(7).locator(Selector.CHECKBOX_INPUT).check();
			await overallCheckboxStatusShouldBe(page, "mixed");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("22");
			await page.locator(Selector.buttonContains("Add to cart")).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
				'Performed "add_to_cart_event" event on 22 document(s)'
			);

			// Go to previous page and perform action
			await page.locator(Selector.PAGINATION_BUTTON_PREV).click();
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("22");
			await overallCheckboxStatusShouldBe(page, "true");
			await allRowsShouldBeCheck(page, true);
			await page.locator(Selector.TABLE_BODY_ROW).nth(4).locator('button[title="Delete this product"]').click();
			await page
				.locator(Selector.PORTAL)
				.locator(Selector.MODAL_OVERLAY)
				.locator(Selector.buttonContains("Delete"))
				.click();
			await overallCheckboxStatusShouldBe(page, "mixed");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("21");
			await page.locator(Selector.buttonContains("Favorite")).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.TOAST_GROUP)).toContainText(
				'Performed "mark_as_favorite_event" event on 21 document(s)'
			);
		});

		test("counter should be updated correctly when searching", async ({ page }) => {
			await page.locator(Selector.BUTTON_EXPAND_MULTI_SELECTION).click();
			await overallCheckboxStatusShouldBe(page, "false");
			await page.locator(Selector.TABLE_BODY_ROW).nth(0).locator(Selector.CHECKBOX_INPUT).check();
			await page.locator(Selector.TABLE_BODY_ROW).nth(5).locator(Selector.CHECKBOX_INPUT).check();
			await overallCheckboxStatusShouldBe(page, "mixed");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("2");
			await page.locator(Selector.PAGINATION_BUTTON_NEXT).click();
			await page.locator(Selector.TABLE_BODY_ROW).nth(6).locator(Selector.CHECKBOX_INPUT).check();
			await page.locator(Selector.TABLE_BODY_ROW).nth(9).locator(Selector.CHECKBOX_INPUT).check();
			await overallCheckboxStatusShouldBe(page, "mixed");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("4");

			await page.locator(Selector.INPUT_FULL_TEXT_SEARCH).fill("Wave");
			await page.keyboard.press("Enter");
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(1);
			await overallCheckboxStatusShouldBe(page, "false");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("0");
			await expect(page.locator(Selector.TABLE_BODY_ROW).nth(0).locator(Selector.CHECKBOX_INPUT)).not.toBeChecked();
			await expect(page.locator(Selector.PAGINATION)).not.toBeVisible();
		});

		test("counter should be updated correctly when filtering", async ({ page }) => {
			await page.locator(Selector.BUTTON_EXPAND_MULTI_SELECTION).click();
			await overallCheckboxStatusShouldBe(page, "false");

			await page.locator(Selector.BUTTON_OPEN_FILTER).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await page.locator(Selector.FILTER_SELECTOR_LIST_ITEM).locator(Selector.LIST_ITEM_TEXT).getByText("Name").click();

			const options = ["Wave XT9", "Badmintonball MAVIS 350", "Board Protection", "Sport-BH", "Brille 1XRT"];

			for (const option of options) {
				await page.locator(Selector.INPUT_VALUE_SEARCH).fill(option);
				await page.locator(Selector.INPUT_VALUE_SEARCH).press("Enter");
				await page
					.getByRole("region", { name: "Filter option container" })
					.getByRole("checkbox", { name: option, exact: true })
					.check();
			}

			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(5);

			await page.locator(Selector.TABLE_BODY_ROW).nth(1).locator(Selector.CHECKBOX_INPUT).check();
			await page.locator(Selector.TABLE_BODY_ROW).nth(3).locator(Selector.CHECKBOX_INPUT).check();
			await overallCheckboxStatusShouldBe(page, "mixed");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("2");

			await page.locator(Selector.FILTER_BAR).locator(Selector.FILTER_CONTENT).click();
			await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
			await page
				.locator(Selector.FILTER_SELECTOR)
				.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
				.locator(Selector.CHECKBOX_INPUT)
				.nth(3)
				.uncheck();
			await page.locator(Selector.BUTTON_APPLY).click();
			await expect(page.locator(Selector.TABLE_BODY_ROW)).toHaveCount(4);
			await overallCheckboxStatusShouldBe(page, "false");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("0");
			await page.getByRole("button", { name: "Filter name [D] Name Selected" }).click();

			await page.getByPlaceholder("Value Search").fill("Empty");
			await page.locator(Selector.INPUT_VALUE_SEARCH).press("Enter");
			await expect(page.locator(Selector.FILTER_SELECTOR).locator(Selector.FILTER_SELECTOR_LIST_ITEM)).toHaveCount(1);
			await expect(
				page
					.locator(Selector.FILTER_SELECTOR)
					.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
					.filter({ hasText: "Wave XT9" })
			).not.toBeVisible();
		});

		test("shift+click should select range of rows between last selected and current row", async ({ page }) => {
			await page.locator(Selector.BUTTON_EXPAND_MULTI_SELECTION).click();
			await overallCheckboxStatusShouldBe(page, "false");
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("0");

			const rows = page.locator(Selector.TABLE_BODY_ROW);

			const startRowCheckbox = rows.nth(1).locator(Selector.CHECKBOX_INPUT);
			await startRowCheckbox.click();
			await expect(startRowCheckbox).toBeChecked();
			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("1");

			const endRowCheckbox = rows.nth(4).locator(Selector.CHECKBOX_INPUT);
			await endRowCheckbox.click({ modifiers: ["Shift"] });

			await expect(startRowCheckbox).toBeChecked();
			await expect(rows.nth(2).locator(Selector.CHECKBOX_INPUT)).toBeChecked();
			await expect(rows.nth(3).locator(Selector.CHECKBOX_INPUT)).toBeChecked();
			await expect(endRowCheckbox).toBeChecked();

			await expect(rows.nth(0).locator(Selector.CHECKBOX_INPUT)).not.toBeChecked();

			await expect(page.locator(Selector.COUNTER_PRESENTATION)).toHaveText("4");
		});
	});
});
