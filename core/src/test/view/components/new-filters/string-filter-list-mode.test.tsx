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

import { it, expect, describe } from "vitest";

import type { OverviewModel } from "../../../../main/index.js";

import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderStringFilter } from "./pages/string-filter-page.js";

const FIELD_PATH = "/product/name";
const FILTER_ID = "name";

const listModeItem: OverviewModel.NewFilter.String.Item = {
	id: FILTER_ID,
	type: "string",
	options: {
		fieldId: ProductFieldIds.name.id,
		caseSensitive: { enabled: false },
		exactMatch: { enabled: false },
		empty: { enabled: false },
		invert: { enabled: false },
		viewMode: "list"
	}
};

function initialMap(candidates: readonly string[], keyword = "") {
	return {
		[FIELD_PATH]: { candidates: [...candidates], keyword, loading: false, fullSize: candidates.length }
	};
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.string-filter.list-mode", () => {
	describe("checkbox + search interaction", () => {
		it("tick visible items with no prior selections — selected values reflect ticks", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B", "C"])
			});

			expect(page.visibleLabels).toEqual(["A", "B", "C"]);

			await page.clickCheckbox("A");
			await page.clickCheckbox("B");

			expect(page.selectedValues).toEqual(["A", "B"]);
		});

		it("untick a visible item drops it from selection", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B", "C"])
			});

			await page.clickCheckbox("A");
			await page.clickCheckbox("B");
			expect(page.selectedValues).toEqual(["A", "B"]);

			await page.clickCheckbox("A");
			expect(page.selectedValues).toEqual(["B"]);
		});

		it("reviewer bug — tick after search narrowed candidates preserves prior pending selections", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B", "C"])
			});

			await page.clickCheckbox("A");
			await page.clickCheckbox("B");
			expect(page.selectedValues).toEqual(["A", "B"]);

			// user types + presses search → backend returns F-only results
			page.simulateSearchResults(FIELD_PATH, ["F1", "F2"], { keyword: "F" });

			expect(page.visibleLabels).toEqual(["F1", "F2"]);
			expect(page.isChecked("F1")).toBe(false);
			expect(page.isChecked("F2")).toBe(false);

			await page.clickCheckbox("F1");

			// A and B (hidden) must survive
			expect(page.selectedValues).toEqual(["A", "B", "F1"]);
		});

		it("untick visible row keeps hidden prior selections", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B", "C"])
			});

			await page.clickCheckbox("A");
			await page.clickCheckbox("B");

			page.simulateSearchResults(FIELD_PATH, ["F1"], { keyword: "F" });
			await page.clickCheckbox("F1");
			expect(page.selectedValues).toEqual(["A", "B", "F1"]);

			await page.clickCheckbox("F1"); // untick
			expect(page.selectedValues).toEqual(["A", "B"]);
		});

		it("clear search → hidden selections re-appear in candidates with applied-first ordering", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B", "C"])
			});

			await page.clickCheckbox("A");
			page.applyAll();
			expect(page.appliedSelectedValues).toEqual(["A"]);

			page.simulateSearchResults(FIELD_PATH, ["F1"], { keyword: "F" });
			expect(page.visibleLabels).toEqual(["F1"]);

			// clear search → backend returns full list, applied A must lead
			page.simulateSearchResults(FIELD_PATH, ["B", "A", "C"]);
			expect(page.visibleLabels).toEqual(["A", "B", "C"]);
			expect(page.isChecked("A")).toBe(true);
		});

		it("select-all on filtered candidates preserves hidden selections", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B"])
			});

			await page.clickCheckbox("A");
			await page.clickCheckbox("B");

			page.simulateSearchResults(FIELD_PATH, ["F1", "F2"], { keyword: "F" });
			await page.clickSelectAll();

			expect(page.selectedValues).toEqual(["A", "B", "F1", "F2"]);
		});

		it("deselect-all on filtered candidates preserves hidden selections", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B"])
			});

			await page.clickCheckbox("A");
			await page.clickCheckbox("B");

			page.simulateSearchResults(FIELD_PATH, ["F1", "F2"], { keyword: "F" });
			await page.clickSelectAll(); // selects all visible
			expect(page.selectedValues).toEqual(["A", "B", "F1", "F2"]);

			await page.clickSelectAll(); // deselect visible
			expect(page.selectedValues).toEqual(["A", "B"]);
		});

		it("hidden value re-appears in candidates and stays ticked when user does not untick it", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B", "C"])
			});

			await page.clickCheckbox("A");
			page.simulateSearchResults(FIELD_PATH, ["F1"], { keyword: "F" });
			expect(page.visibleLabels).toEqual(["F1"]);

			// search expanded to include A again
			page.simulateSearchResults(FIELD_PATH, ["A", "F1"], { keyword: "" });
			expect(page.isChecked("A")).toBe(true);
			expect(page.selectedValues).toEqual(["A"]);
		});

		it("no duplication when an applied value is visible and stays ticked", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B"])
			});

			await page.clickCheckbox("A");
			page.applyAll();
			expect(page.appliedSelectedValues).toEqual(["A"]);

			// tick B → A must not duplicate
			await page.clickCheckbox("B");
			expect(page.selectedValues).toEqual(["A", "B"]);
		});

		it("applied value not in current candidates is hidden but remains in store", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["A", "B", "C"])
			});

			await page.clickCheckbox("A");
			page.applyAll();

			page.simulateSearchResults(FIELD_PATH, ["F1"], { keyword: "F" });

			expect(page.visibleLabels).toEqual(["F1"]);
			expect(page.appliedSelectedValues).toEqual(["A"]);
			expect(page.selectedValues).toEqual(["A"]);
		});
	});

	describe("no-keyword pagination", () => {
		it("selected values not in the current candidates page are rendered as extras", async () => {
			// Page 1 of candidates = [B, C]. Seed prior selection of A (off page).
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["B", "C"])
			});

			page.setStoreSelectedValues(["A", "B"]);

			expect(page.visibleLabels).toEqual(["A", "B", "C"]);
			expect(page.isChecked("A")).toBe(true);
			expect(page.isChecked("B")).toBe(true);
			expect(page.isChecked("C")).toBe(false);
		});

		it("untick an off-page extra removes it from selection", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["B", "C"])
			});

			page.setStoreSelectedValues(["A", "B"]);
			expect(page.visibleLabels).toEqual(["A", "B", "C"]);

			await page.clickCheckbox("A");
			expect(page.selectedValues).toEqual(["B"]);
		});

		it("typing a keyword switches to hide-mode and off-page extras disappear", async () => {
			const { page } = await renderStringFilter({
				filterItem: listModeItem,
				initialEnumeratedStringFilterMap: initialMap(["B", "C"])
			});

			page.setStoreSelectedValues(["A", "B"]);
			expect(page.visibleLabels).toEqual(["A", "B", "C"]);

			// keyword set + backend returns matching subset only
			page.simulateSearchResults(FIELD_PATH, ["B"], { keyword: "B" });
			expect(page.visibleLabels).toEqual(["B"]);
			expect(page.selectedValues).toEqual(["A", "B"]);
		});
	});
});
