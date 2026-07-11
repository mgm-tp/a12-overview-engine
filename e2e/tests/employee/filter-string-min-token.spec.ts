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

const MIN_TOKEN_ERROR = "Enter at least 3 characters";

test.describe("String filter min searchable token size", () => {
	test.beforeAll(async ({ seed }) => {
		// Seeding data can be slow in CI
		test.slow();
		await seed("employee");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.EMPLOYEE_PRESET_FILTER);
		await page.locator(Selector.BUTTON_OPEN_FILTER).click();
		await expect(page.locator(Selector.PORTAL).locator(Selector.FILTER_SELECTOR)).toBeVisible();
		await page
			.locator(Selector.FILTER_SELECTOR_LIST_ITEM)
			.locator(Selector.LIST_ITEM_TEXT, { hasText: "Full Name" })
			.click();
	});

	test("rejects a token below the minimum size and keeps the rejected text alongside the error", async ({ page }) => {
		const input = page.locator(Selector.INPUT_FILTER_VALUE);

		await input.fill("ab");
		await input.blur();

		// Rejected value stays visible next to its error (error must match the displayed value).
		await expect(page.locator(Selector.FILTER_SELECTOR)).toContainText(MIN_TOKEN_ERROR);
		await expect(input).toHaveValue("ab");

		// Apply is blocked while the option is errored: the selector stays open.
		await page.locator(Selector.BUTTON_APPLY).click();
		await expect(page.locator(Selector.FILTER_SELECTOR)).toBeVisible();
		await expect(page.locator(Selector.FILTER_SELECTOR)).toContainText(MIN_TOKEN_ERROR);
	});

	test("clears a lingering error when the value is reset externally", async ({ page }) => {
		const input = page.locator(Selector.INPUT_FILTER_VALUE);

		await input.fill("ab");
		await input.blur();
		await expect(page.locator(Selector.FILTER_SELECTOR)).toContainText(MIN_TOKEN_ERROR);

		// Clearing resets uiValue from the outside; the rejected value's error must not linger.
		await page.locator(Selector.FILTER_SELECTOR).locator(Selector.buttonContains("Clear all")).click();

		await expect(page.locator(Selector.FILTER_SELECTOR)).not.toContainText(MIN_TOKEN_ERROR);
		await expect(input).toHaveValue("");
	});

	test("accepts a value at or above the minimum size", async ({ page }) => {
		const input = page.locator(Selector.INPUT_FILTER_VALUE);

		await input.fill("abc");
		await input.blur();

		await expect(page.locator(Selector.FILTER_SELECTOR)).not.toContainText(MIN_TOKEN_ERROR);

		await page.locator(Selector.BUTTON_APPLY).click();
		await expect(page.locator(Selector.FILTER_SELECTOR)).not.toBeVisible();
		await expect(page.locator(Selector.FILTER_BAR)).toContainText("Full Name");
	});
});
