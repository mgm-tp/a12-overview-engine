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

import { test, expect } from "../../commands.js";
import { Showcase, navigate } from "../../utils.js";

test.describe.skip("Boolean Filter Dialog Interaction", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("product");
	});

	test("toggle Yes/No, apply, persist after reopen", async ({ page }) => {
		await navigate(page, Showcase.PRODUCT_NEW_FILTER);

		await expect(page.getByRole("heading", { name: "List of all products" })).toBeVisible();

		const filterButton = page.getByRole("button").filter({ hasText: "Available in stock" });
		await expect(filterButton).toBeVisible();
		await filterButton.click();

		const dialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText("Available in stock")).toBeVisible();

		const yesCheckbox = dialog.getByRole("checkbox", { name: "Yes" });
		const noCheckbox = dialog.getByRole("checkbox", { name: "No" });

		await expect(yesCheckbox).toBeChecked();
		await expect(noCheckbox).not.toBeChecked();

		await expect(dialog.getByRole("button").filter({ hasText: "settings" })).toBeVisible();

		await expect(dialog.getByRole("button", { name: "Apply" })).toBeDisabled();

		await yesCheckbox.click();
		await expect(yesCheckbox).not.toBeChecked();
		await expect(dialog.getByRole("button", { name: "Apply" })).toBeEnabled();

		await noCheckbox.click();
		await expect(noCheckbox).toBeChecked();

		await dialog.getByRole("button", { name: "Apply" }).click();

		await expect(
			page.getByRole("button", { name: "A Filter name Available in stock Selected option False" })
		).toBeVisible();

		await expect(page.getByText("No results found")).toBeVisible();

		await page.getByRole("button").filter({ hasText: "Available in stock" }).click();

		const reopenedDialog = page.locator('[role="dialog"]').filter({ hasText: "Available in stock" });
		await expect(reopenedDialog).toBeVisible();
		await expect(reopenedDialog.getByRole("checkbox", { name: "No" })).toBeChecked();
		await expect(reopenedDialog.getByRole("checkbox", { name: "Yes" })).not.toBeChecked();

		await reopenedDialog.getByRole("checkbox", { name: "Yes" }).click();
		await expect(reopenedDialog.getByRole("checkbox", { name: "Yes" })).toBeChecked();
		await expect(reopenedDialog.getByRole("checkbox", { name: "No" })).not.toBeChecked();

		await reopenedDialog.getByRole("button", { name: "Apply" }).click();

		await expect(
			page.getByRole("button", { name: "A Filter name Available in stock Selected option True" })
		).toBeVisible();

		await expect(page.getByRole("heading", { name: "List of all products (1)" })).toBeVisible();
		await expect(page.getByRole("table")).toBeVisible();
		await expect(page.getByRole("row")).toHaveCount(2);
	});
});
