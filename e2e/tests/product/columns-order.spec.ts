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

test.describe("Columns order", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.describe("When expand/collapse multi-selection column", () => {
		test.beforeEach(async ({ page }) => {
			await navigate(page, Showcase.PRODUCT_PAGINATION);
		});
		test("should keep column order", async ({ page }) => {
			const columnData = [
				{ headerText: "[O] Image", firstRowContent: "" },
				{ headerText: "[O] Date", firstRowContent: "03/07/2018" },
				{ headerText: "Custom Expression", firstRowContent: "03/07/2018" },
				{ headerText: "Expression", firstRowContent: "girl yes" },
				{ headerText: "[O] Date Time", firstRowContent: "03/07/2018 08:20 PM" },
				{ headerText: "[O] Time", firstRowContent: "09:15 PM" },
				{ headerText: "[D] Name", firstRowContent: "Wave XT9" },
				{ headerText: "[D] Description", firstRowContent: "Lorem ipsum dolor sit amet:" },
				{ headerText: "", firstRowContent: "Number Two, Number Three" },
				{ headerText: "Seller email", firstRowContent: "giafly@live.com" },
				{ headerText: "[D] Weight", firstRowContent: "1,500" },
				{ headerText: "[D] Weight Unit", firstRowContent: "g" },
				{ headerText: "In Stock", firstRowContent: "yes" },
				{ headerText: "Target Group", firstRowContent: "Women" },
				{ headerText: "Limited Offer", firstRowContent: "" },
				{ headerText: "[O] Number (pinned)", firstRowContent: "264" }
			];

			for (let index = 0; index < columnData.length; index++) {
				await expect(page.locator(Selector.TABLE_HEADER_CELL).nth(index)).toContainText(columnData[index].headerText);
				await expect(
					page.locator(Selector.TABLE_BODY_ROW).nth(0).locator(Selector.TABLE_BODY_CELL).nth(index)
				).toContainText(columnData[index].firstRowContent);
			}

			await page.locator(Selector.BUTTON_EXPAND_MULTI_SELECTION).click();
			await expect(page.locator(Selector.TABLE_HEADER_CELL).nth(0).locator(Selector.CHECKBOX_CONTROL)).toBeVisible();

			for (let index = 0; index < columnData.length; index++) {
				await expect(page.locator(Selector.TABLE_HEADER_CELL).nth(index + 1)).toContainText(
					columnData[index].headerText
				);
				await expect(
					page
						.locator(Selector.TABLE_BODY_ROW)
						.nth(0)
						.locator(Selector.TABLE_BODY_CELL)
						.nth(index + 1)
				).toContainText(columnData[index].firstRowContent);
			}
		});
	});
});
