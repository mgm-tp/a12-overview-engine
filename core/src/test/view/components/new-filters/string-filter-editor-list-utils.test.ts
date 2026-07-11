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

import {
	buildVisibleOptions,
	mergeHiddenSelections
} from "../../../../main/view/components/new-filters/components/editors/string-filter-editor-list-utils.js";

const WITH_KEYWORD = true;
const NO_KEYWORD = false;

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.string-filter-editor-list-utils", () => {
	describe("buildVisibleOptions — with active keyword (legacy hide behavior)", () => {
		it("renders only current candidates, applied values first then remaining in response order", () => {
			const result = buildVisibleOptions(["C", "A", "D", "B"], ["A", "B"], ["A", "B"], WITH_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["A", "B", "C", "D"]);
		});

		it("marks `selected` from selectedValues, not appliedSelectedValues", () => {
			const result = buildVisibleOptions(["A", "B", "C"], ["A"], ["A", "B"], WITH_KEYWORD);

			expect(result).toEqual([
				{ value: "A", label: "A", pinned: false, selected: true },
				{ value: "B", label: "B", pinned: false, selected: true },
				{ value: "C", label: "C", pinned: false, selected: false }
			]);
		});

		it("hides applied / selected values not present in current candidates", () => {
			const result = buildVisibleOptions(["X", "Y"], ["A", "B"], ["A", "B"], WITH_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["X", "Y"]);
		});

		it("returns empty when candidates is empty regardless of selections", () => {
			expect(buildVisibleOptions([], ["A"], ["A", "B"], WITH_KEYWORD)).toEqual([]);
		});

		it("preserves backend response order within the non-applied partition", () => {
			const result = buildVisibleOptions(["D", "A", "C", "B"], ["A"], [], WITH_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["A", "D", "C", "B"]);
		});

		it("after search-clear, previously-hidden selections re-surface with applied-first ordering", () => {
			// candidates now contain previously-hidden A (applied) + X (pending) + others
			const result = buildVisibleOptions(["C", "A", "X", "B"], ["A"], ["A", "X"], WITH_KEYWORD);

			expect(result).toEqual([
				{ value: "A", label: "A", pinned: false, selected: true },
				{ value: "C", label: "C", pinned: false, selected: false },
				{ value: "X", label: "X", pinned: false, selected: true },
				{ value: "B", label: "B", pinned: false, selected: false }
			]);
		});

		it("renders a pending-but-not-applied value in candidates within the non-applied partition", () => {
			// X is selected but not applied → goes into the second partition, not first
			const result = buildVisibleOptions(["A", "X", "B"], ["A"], ["A", "X"], WITH_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["A", "X", "B"]);
			expect(result.map((o) => o.selected)).toEqual([true, true, false]);
		});
	});

	describe("buildVisibleOptions — no active keyword (show-all-selected behavior)", () => {
		it("renders off-page selections on top, then candidates partitioned applied-first", () => {
			// Page 1 candidates = [B, C]. User has A, B selected (A is on page 2, not loaded).
			const result = buildVisibleOptions(["B", "C"], [], ["A", "B"], NO_KEYWORD);

			// A is the off-page extra → on top. Then candidates B, C in response order.
			expect(result.map((o) => o.value)).toEqual(["A", "B", "C"]);
			expect(result.map((o) => o.selected)).toEqual([true, true, false]);
		});

		it("off-page extras render on top regardless of applied state", () => {
			// Even if applied, an off-page value renders in the extras-on-top section.
			const result = buildVisibleOptions(["B", "C"], ["A"], ["A", "B"], NO_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["A", "B", "C"]);
		});

		it("multiple off-page extras keep their selectedValues order on top", () => {
			const result = buildVisibleOptions(["C"], ["A"], ["X", "A", "Y"], NO_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["X", "A", "Y", "C"]);
		});

		it("applied-first split still applies within candidates", () => {
			const result = buildVisibleOptions(["B", "C", "D"], ["C"], ["C"], NO_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["C", "B", "D"]);
		});

		it("returns candidates alone when no selections are out of page", () => {
			const result = buildVisibleOptions(["A", "B", "C"], ["A"], ["A"], NO_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["A", "B", "C"]);
		});

		it("renders only the selected values when candidates is empty (e.g. backend not yet loaded)", () => {
			const result = buildVisibleOptions([], ["A"], ["A", "B"], NO_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["A", "B"]);
		});

		it("does not duplicate when an extra value is both applied and pending", () => {
			const result = buildVisibleOptions(["B"], ["A"], ["A"], NO_KEYWORD);

			expect(result.map((o) => o.value)).toEqual(["A", "B"]);
		});
	});

	describe("mergeHiddenSelections — with active keyword", () => {
		it("prepends previously-selected values outside candidates to the visible selection", () => {
			// Prior pending: A, B. Search narrowed candidates to F1, F2. User ticks F1.
			const result = mergeHiddenSelections(["A", "B"], ["F1", "F2"], ["F1"], WITH_KEYWORD);

			expect(result).toEqual(["A", "B", "F1"]);
		});

		it("keeps hidden selections when user unticks every visible row", () => {
			const result = mergeHiddenSelections(["A", "B"], ["F1", "F2"], [], WITH_KEYWORD);

			expect(result).toEqual(["A", "B"]);
		});

		it("drops a previously-selected value once it becomes visible and is unticked", () => {
			const result = mergeHiddenSelections(["A", "B"], ["A", "F1"], ["F1"], WITH_KEYWORD);

			expect(result).toEqual(["B", "F1"]);
		});

		it("returns visible selection unchanged when no hidden selections exist", () => {
			const result = mergeHiddenSelections(["A"], ["A", "B"], ["A", "B"], WITH_KEYWORD);

			expect(result).toEqual(["A", "B"]);
		});

		it("supports select-all on filtered candidates without losing hidden selections", () => {
			const result = mergeHiddenSelections(["A", "B"], ["F1", "F2"], ["F1", "F2"], WITH_KEYWORD);

			expect(result).toEqual(["A", "B", "F1", "F2"]);
		});

		it("supports deselect-all on filtered candidates while keeping hidden selections", () => {
			const result = mergeHiddenSelections(["A", "B", "F1"], ["F1", "F2"], [], WITH_KEYWORD);

			expect(result).toEqual(["A", "B"]);
		});

		it("keeps a hidden value when it re-enters candidates and stays ticked", () => {
			const result = mergeHiddenSelections(["A", "B"], ["A", "F1"], ["A", "F1"], WITH_KEYWORD);

			expect(result).toEqual(["B", "A", "F1"]);
		});

		it("preserves all hidden selections when candidates is empty (no results)", () => {
			const result = mergeHiddenSelections(["A", "B", "C"], [], [], WITH_KEYWORD);

			expect(result).toEqual(["A", "B", "C"]);
		});

		it("merges mixed applied + pending hidden selections with a new visible tick", () => {
			const result = mergeHiddenSelections(["A", "X"], ["F1", "F2"], ["F1"], WITH_KEYWORD);

			expect(result).toEqual(["A", "X", "F1"]);
		});

		it("does not duplicate when an applied value is visible and stays ticked", () => {
			const result = mergeHiddenSelections(["A"], ["A", "B"], ["A"], WITH_KEYWORD);

			expect(result).toEqual(["A"]);
		});
	});

	describe("mergeHiddenSelections — no active keyword", () => {
		it("returns the visible selection as-is (extras are already rendered, nothing hidden)", () => {
			// Selected A is off-page but rendered as extra → user can untick it directly.
			// If visible drops it, the merge must respect that drop.
			const result = mergeHiddenSelections(["A", "B"], ["B", "C"], ["B"], NO_KEYWORD);

			expect(result).toEqual(["B"]);
		});

		it("keeps extras when the user does not toggle them", () => {
			const result = mergeHiddenSelections(["A", "B"], ["B", "C"], ["A", "B"], NO_KEYWORD);

			expect(result).toEqual(["A", "B"]);
		});

		it("supports ticking a new visible value while keeping extras", () => {
			const result = mergeHiddenSelections(["A", "B"], ["B", "C"], ["A", "B", "C"], NO_KEYWORD);

			expect(result).toEqual(["A", "B", "C"]);
		});

		it("supports select-all on candidates (extras already counted; selectAll over rendered)", () => {
			// Rendered = [B, C, A]. select-all = all rendered.
			const result = mergeHiddenSelections(["A", "B"], ["B", "C"], ["B", "C", "A"], NO_KEYWORD);

			expect(result).toEqual(["B", "C", "A"]);
		});

		it("supports deselect-all on rendered including extras", () => {
			const result = mergeHiddenSelections(["A", "B"], ["B", "C"], [], NO_KEYWORD);

			expect(result).toEqual([]);
		});
	});
});
