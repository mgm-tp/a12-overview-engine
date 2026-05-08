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

import type { Locator } from "@playwright/test";

import { test, expect } from "../commands.js";
import { navigate, Selector, Showcase } from "../utils.js";

const SMALL_VIEWPORT = { width: 1280, height: 500 } as const;

test.describe("Product overview - scroll to row", () => {
	// Force vertical overflow for scrolling tests
	test.use({ viewport: SMALL_VIEWPORT });

	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_PAGINATION);
	});

	test("scroll to top should work", async ({ page }) => {
		const scrollButton = page.getByText("Scroll to top");
		const tenthRow = page.locator(Selector.TABLE_BODY_ROW).nth(9);

		expect(await isRowFullyVisible(tenthRow)).toBe(false);

		await tenthRow.scrollIntoViewIfNeeded();

		expect(await isRowFullyVisible(tenthRow)).toBe(true);

		await scrollButton.click();

		expect(await isRowFullyVisible(tenthRow)).toBe(false);
	});
});

function isRowFullyVisible(row: Locator) {
	return row.evaluate((node) => {
		const rect = node.getBoundingClientRect();

		return rect.top >= 0 && rect.bottom <= window.innerHeight;
	});
}
