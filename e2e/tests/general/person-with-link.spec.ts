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

import { test, expect, waitUntilLoaded } from "../commands.js";
import { Selector, Showcase, navigate, getColumnIndex } from "../utils.js";

test.describe("Person with link columns", () => {
	test.beforeAll(async ({ seed }) => {
		await seed("person");
	});

	test.beforeEach(async ({ page }) => {
		await navigate(page, Showcase.PERSON_WITH_LINK);
	});

	test("should render all expected column headers", async ({ page }) => {
		const header = (name: string) => page.getByRole("columnheader", { name, exact: true });

		await expect(header("First Name")).toBeVisible();
		await expect(header("Weekly Working Hours")).toBeVisible();
		await expect(header("Expression")).toBeVisible();
		await expect(header("Expression: Person -> Contract")).toBeVisible();
		await expect(header("Department (Person -> Department)")).toBeVisible();
		await expect(header("Floor (Person -> Department)")).toBeVisible();
		await expect(header("Dept. Join Date (Additional Link Field)")).toBeVisible();
		await expect(header("Parent Dept. (Person -> Department -> Parent Department)")).toBeVisible();
		await expect(header("Child Dept. (Person -> Department -> Child Department)")).toBeVisible();
		await expect(header("Dept. Leader First Name  (Person -> Department -> Person)")).toBeVisible();
	});

	test("should display correct linked cell values", async ({ page }) => {
		const rows = page.locator(Selector.TABLE_BODY_ROW);
		const header = (name: string) => page.getByRole("columnheader", { name, exact: true });

		const weeklyHoursColIdx = await getColumnIndex(header("Weekly Working Hours"));
		const deptColIdx = await getColumnIndex(header("Department (Person -> Department)"));
		const floorColIdx = await getColumnIndex(header("Floor (Person -> Department)"));
		const joinDateColIdx = await getColumnIndex(header("Dept. Join Date (Additional Link Field)"));
		const expressionColIdx = await getColumnIndex(header("Expression: Person -> Contract"));
		const leaderFnColIdx = await getColumnIndex(header("Dept. Leader First Name  (Person -> Department -> Person)"));

		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(weeklyHoursColIdx)).toHaveText(/\d+ hours/);
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(deptColIdx)).toHaveText("Engineering");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(floorColIdx)).toHaveText("3");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(joinDateColIdx)).toHaveText("02/04/2015");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(expressionColIdx)).toHaveText(/\d+ hours/);
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(leaderFnColIdx)).toHaveText("Ruby");
	});

	test("should preserve correct linked cell values after sorting by First Name", async ({ page }) => {
		const rows = page.locator(Selector.TABLE_BODY_ROW);
		const header = (name: string) => page.getByRole("columnheader", { name, exact: true });
		const firstNameHeader = header("First Name");

		const weeklyHoursColIdx = await getColumnIndex(header("Weekly Working Hours"));
		const deptColIdx = await getColumnIndex(header("Department (Person -> Department)"));
		const joinDateColIdx = await getColumnIndex(header("Dept. Join Date (Additional Link Field)"));
		const expressionColIdx = await getColumnIndex(header("Expression: Person -> Contract"));
		const leaderFnColIdx = await getColumnIndex(header("Dept. Leader First Name  (Person -> Department -> Person)"));

		await firstNameHeader.click();
		await waitUntilLoaded(page);
		await expect(firstNameHeader).toHaveAttribute("aria-sort", "descending");

		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(weeklyHoursColIdx)).toHaveText("24 hours");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(deptColIdx)).toHaveText("Marketing");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(joinDateColIdx)).toHaveText("06/16/2022");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(expressionColIdx)).toHaveText("24 hours");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(leaderFnColIdx)).toHaveText("Jack");

		await firstNameHeader.click();
		await waitUntilLoaded(page);
		await expect(firstNameHeader).toHaveAttribute("aria-sort", "ascending");

		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(weeklyHoursColIdx)).toHaveText("20 hours");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(deptColIdx)).toHaveText("Sales");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(joinDateColIdx)).toHaveText("10/15/2016");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(expressionColIdx)).toHaveText("20 hours");
		await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(leaderFnColIdx)).toHaveText("Landon");
	});

	test.describe("Row click opens PersonEquipmentOM", () => {
		test("should open PersonEquipmentOM with correct headers when clicking a person row", async ({ page }) => {
			const rows = page.locator(Selector.TABLE_BODY_ROW);

			await rows.nth(0).click();
			await waitUntilLoaded(page);

			const equipmentTable = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);
			const header = (name: string) => equipmentTable.getByRole("columnheader", { name, exact: true });

			await expect(header("Equipment Name")).toBeVisible();
			await expect(header("Serial Number")).toBeVisible();
			await expect(header("Active")).toBeVisible();
			await expect(header("Category")).toBeVisible();
			await expect(header("Quantity")).toBeVisible();
			await expect(header("Purchase Price")).toBeVisible();
			await expect(header("Usage Rate (Additional Link Field)")).toBeVisible();
			await expect(header("Assigned Date")).toBeVisible();

			// All link document fields should be mapped correctly
			await expect(equipmentTable.getByText("Link not found.")).not.toBeVisible();
		});

		test("should not allow sorting on columns in exclude mode", async ({ page }) => {
			const rows = page.locator(Selector.TABLE_BODY_ROW);

			await rows.nth(0).click();
			await waitUntilLoaded(page);

			const equipmentTable = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);
			const equipmentNameHeader = equipmentTable.getByRole("columnheader", { name: "Equipment Name", exact: true });

			// Columns in exclude mode should not have aria-sort attribute
			await expect(equipmentNameHeader).not.toHaveAttribute("aria-sort");

			// Clicking should not trigger sorting (no aria-sort should appear)
			await equipmentNameHeader.click();
			await expect(equipmentNameHeader).not.toHaveAttribute("aria-sort");
		});

		// Flaky test due to non-deterministic ordering of linked documents returned by DS
		// Sorting of linked documents is required but currently not supported
		test.skip("should display equipment data with linked columns in PersonEquipmentOM", async ({ page }) => {
			const rows = page.locator(Selector.TABLE_BODY_ROW);

			await rows.nth(0).click();
			await waitUntilLoaded(page);

			const equipmentTable = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);
			const equipmentRows = equipmentTable.locator(Selector.TABLE_BODY_ROW);
			await expect(equipmentRows.first()).toBeVisible();

			const header = (name: string) => equipmentTable.getByRole("columnheader", { name, exact: true });
			const equipmentNameColIdx = await getColumnIndex(header("Equipment Name"));
			const categoryColIdx = await getColumnIndex(header("Category"));
			const usageRateColIdx = await getColumnIndex(header("Usage Rate (Additional Link Field)"));

			await expect(equipmentRows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(equipmentNameColIdx)).toHaveText(
				"Ford Motor Co"
			);
			await expect(equipmentRows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(categoryColIdx)).toHaveText("Phone");
			await expect(equipmentRows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(usageRateColIdx)).toHaveText("2");
		});

		test("should navigate back to PersonWithLinkOM when clicking Cancel", async ({ page }) => {
			const rows = page.locator(Selector.TABLE_BODY_ROW);

			await rows.nth(0).click();
			await waitUntilLoaded(page);

			const equipmentTable = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);
			await expect(equipmentTable.getByRole("columnheader", { name: "Equipment Name", exact: true })).toBeVisible();

			const detailFooter = page.locator(Selector.CONTENT_BOX_FOOTER).nth(1);
			const cancelButton = detailFooter.getByRole("button", { name: "Cancel" });
			await cancelButton.click();
			await waitUntilLoaded(page);

			await expect(page.locator(Selector.CONTENT_BOX_CONTENT)).toHaveCount(1);
			await expect(
				page.getByRole("columnheader", { name: "Department (Person -> Department)", exact: true })
			).toBeVisible();
		});
	});

	test.describe("Person with duplicated equipments", () => {
		test.beforeEach(async ({ page }) => {
			const rows = page.locator(Selector.TABLE_BODY_ROW);
			await rows.filter({ hasText: "Cordelia" }).click();
			await waitUntilLoaded(page);
		});

		test("should show The MONY Group Inc. has 2 duplicate rows", async ({ page }) => {
			const equipmentContent = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);

			const monyRows = equipmentContent.locator(Selector.TABLE_BODY_ROW).filter({ hasText: "The MONY Group Inc." });

			await expect(monyRows).toHaveCount(2);
		});

		test("should toggle row selection correctly between duplicate MONY Group rows", async ({ page }) => {
			const monyRows = page.getByRole("row").filter({ hasText: "The MONY Group Inc." });

			await expect(monyRows).toHaveCount(2);

			// Click first duplicate row — it becomes selected
			await monyRows.first().click();
			await waitUntilLoaded(page);

			await expect(monyRows.first()).toHaveAttribute("aria-selected", "true");

			// Click second duplicate row — selection transfers
			await monyRows.last().click();
			await waitUntilLoaded(page);

			await expect(monyRows.last()).toHaveAttribute("aria-selected", "true");
		});

		test("should open the equipment overview form when clicking Cordelia", async ({ page }) => {
			// The beforeEach already clicked Cordelia; verify the equipment overview "form"
			// (the second content box with the equipment table) is visible.
			const equipmentContent = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);

			await expect(equipmentContent.getByRole("columnheader", { name: "Equipment Name", exact: true })).toBeVisible();

			// No further assertions on form data — the duplicate equipment data is
			// dynamically generated, and form field values carry no meaningful info to verify.
		});

		test("should reflect correct multi-selection checkbox state on duplicate rows", async ({ page }) => {
			const equipmentContent = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);

			// Expand multi-selection in the equipment overview
			const equipmentHeader = page.locator(Selector.CONTENT_BOX_HEADER).nth(1);
			await equipmentHeader.locator(Selector.BUTTON_EXPAND_MULTI_SELECTION).click();

			const monyRows = equipmentContent.locator(Selector.TABLE_BODY_ROW).filter({ hasText: "The MONY Group Inc." });
			await expect(monyRows).toHaveCount(2);

			const firstCheckbox = monyRows.first().getByRole("checkbox", { name: "Select" });
			const secondCheckbox = monyRows.last().getByRole("checkbox", { name: "Select" });

			// Check first MONY Group row
			await firstCheckbox.check();
			await expect(firstCheckbox).toBeChecked();
			await expect(secondCheckbox).not.toBeChecked();

			// Check second MONY Group row
			await secondCheckbox.check();
			await expect(firstCheckbox).toBeChecked();
			await expect(secondCheckbox).toBeChecked();

			// Uncheck first
			await firstCheckbox.uncheck();
			await expect(firstCheckbox).not.toBeChecked();
			await expect(secondCheckbox).toBeChecked();
		});

		test("should delete both duplicate MONY Group rows when deleting the document", async ({ page }) => {
			const equipmentContent = page.locator(Selector.CONTENT_BOX_CONTENT).nth(1);
			const monyRows = equipmentContent.locator(Selector.TABLE_BODY_ROW).filter({ hasText: "The MONY Group Inc." });

			await expect(monyRows).toHaveCount(2);

			// Click the delete action button on the first MONY Group row
			await monyRows.first().locator(Selector.BUTTON_DELETE).click();
			await expect(page.locator(Selector.DIALOG)).toBeVisible();
			await page.getByRole("button", { name: "Delete" }).click();
			await waitUntilLoaded(page);

			// Both duplicate rows are removed because deleting the equipment document
			// cascades to remove all its link instances
			await expect(monyRows).toHaveCount(0);
		});
	});

	test.describe("Link column sorting", () => {
		test("should sort by Weekly Working Hours (single-link column) through ASC → DESC → cleared cycle", async ({
			page
		}) => {
			const header = page.getByRole("columnheader", { name: "Weekly Working Hours", exact: true });
			const rows = page.locator(Selector.TABLE_BODY_ROW);
			const weeklyHoursColIdx = await getColumnIndex(header);

			await expect(header).not.toHaveAttribute("aria-sort");

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).toHaveAttribute("aria-sort", "ascending");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(weeklyHoursColIdx)).toHaveText("20 hours");

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).toHaveAttribute("aria-sort", "descending");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(weeklyHoursColIdx)).toHaveText("40 hours");

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).not.toHaveAttribute("aria-sort");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(weeklyHoursColIdx)).toHaveText("27 hours");
		});

		test("should sort by Parent Dept. (2-level link) through ASC → DESC → cleared cycle", async ({ page }) => {
			const header = page.getByRole("columnheader", {
				name: "Parent Dept. (Person -> Department -> Parent Department)",
				exact: true
			});
			const rows = page.locator(Selector.TABLE_BODY_ROW);
			const parentDeptColIdx = await getColumnIndex(header);

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).toHaveAttribute("aria-sort", "ascending");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(parentDeptColIdx)).toHaveText("Engineering");

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).toHaveAttribute("aria-sort", "descending");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(parentDeptColIdx)).toHaveText("Sales");

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).not.toHaveAttribute("aria-sort");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(parentDeptColIdx)).toHaveText("Link not found.");
		});

		test("should sort by Dept. Leader First Name (2-level link) through ASC → DESC → cleared cycle", async ({
			page
		}) => {
			const header = page.getByRole("columnheader", {
				name: "Dept. Leader First Name  (Person -> Department -> Person)",
				exact: true
			});
			const rows = page.locator(Selector.TABLE_BODY_ROW);
			const leaderFnColIdx = await getColumnIndex(header);

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).toHaveAttribute("aria-sort", "ascending");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(leaderFnColIdx)).toHaveText("Cecelia");

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).toHaveAttribute("aria-sort", "descending");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(leaderFnColIdx)).toHaveText("Ruby");

			await header.click();
			await waitUntilLoaded(page);
			await expect(header).not.toHaveAttribute("aria-sort");
			await expect(rows.nth(0).locator(Selector.TABLE_BODY_CELL).nth(leaderFnColIdx)).toHaveText("Ruby");
		});
	});
});
