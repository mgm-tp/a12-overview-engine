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

import { OverviewModel } from "../../../../main/overview-model.js";
import type { UiState } from "../../../../main/store/internal/store.js";
import { UiStateSelector } from "../../../../main/store/internal/selectors/ui-state.js";

function makeMultiSelection(
	collapseOption: OverviewModel.MultiSelection.CollapseOption,
	selectionArea?: OverviewModel.MultiSelection.SelectionArea
): OverviewModel.MultiSelection {
	return {
		collapseOption,
		counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
		selectionArea
	};
}

describe("UiStateSelector.isMultiSelectRowClickActive", () => {
	const subject = UiStateSelector.isMultiSelectRowClickActive;

	describe("when multiSelection is undefined (defaults to CHECKBOX_AND_ROW)", () => {
		it("returns false when expandedMultiSelection is false", () => {
			const state = { expandedMultiSelection: false } as UiState;

			expect(subject(undefined)(state)).toBe(false);
		});

		it("returns true when expandedMultiSelection is true", () => {
			const state = { expandedMultiSelection: true } as UiState;

			expect(subject(undefined)(state)).toBe(true);
		});
	});

	describe("when selectionArea is CHECKBOX", () => {
		it("returns false regardless of expandedMultiSelection", () => {
			const multiSelection = makeMultiSelection(
				OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED,
				OverviewModel.MultiSelection.SelectionArea.CHECKBOX
			);
			const state = { expandedMultiSelection: true } as UiState;

			expect(subject(multiSelection)(state)).toBe(false);
		});
	});

	describe("when selectionArea is CHECKBOX_AND_ROW (collapsible)", () => {
		it("returns true when expandedMultiSelection is true", () => {
			const multiSelection = makeMultiSelection(
				OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED,
				OverviewModel.MultiSelection.SelectionArea.CHECKBOX_AND_ROW
			);
			const state = { expandedMultiSelection: true } as UiState;

			expect(subject(multiSelection)(state)).toBe(true);
		});

		it("returns false when expandedMultiSelection is false", () => {
			const multiSelection = makeMultiSelection(
				OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED,
				OverviewModel.MultiSelection.SelectionArea.CHECKBOX_AND_ROW
			);
			const state = { expandedMultiSelection: false } as UiState;

			expect(subject(multiSelection)(state)).toBe(false);
		});
	});

	describe("when collapseOption is NON_COLLAPSIBLE", () => {
		it("returns true when a row is selected", () => {
			const multiSelection = makeMultiSelection(OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE);
			const state = { rowState: { "1": { selected: true } } } as unknown as UiState;

			expect(subject(multiSelection)(state)).toBe(true);
		});

		it("returns false when no rows are selected", () => {
			const multiSelection = makeMultiSelection(OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE);
			const state = { rowState: { "1": { selected: false } } } as unknown as UiState;

			expect(subject(multiSelection)(state)).toBe(false);
		});

		it("returns false when rowState is undefined", () => {
			const multiSelection = makeMultiSelection(OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE);
			const state = {} as UiState;

			expect(subject(multiSelection)(state)).toBe(false);
		});
	});
});
