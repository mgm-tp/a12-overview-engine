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

import { it, vi, expect, describe } from "vitest";

import type { FilterStateSelectors } from "../../../../main/store/internal/selectors/filter-selectors.js";
import { UiStateSelector } from "../../../../main/store/internal/selectors/ui-state.js";
import type { UiState } from "../../../../main/store/internal/store.js";
import { makeUiState, makeFilterState, makeFilterItemState } from "../middleware/events/new-filter/helpers.js";

function makeSelectors(overrides: Partial<FilterStateSelectors> = {}): FilterStateSelectors {
	return {
		hasErrors: vi.fn().mockReturnValue(false),
		isEffectivelyEqual: vi.fn().mockReturnValue(false),
		toOperator: vi.fn(),
		isResettable: vi.fn(),
		createInitialOptions: vi.fn(),
		toEffectiveOptions: vi.fn(),
		toResetOptions: vi.fn(),
		toLabel: vi.fn(),
		hasAnySetFilter: vi.fn(),
		isConfigurable: vi.fn(),
		...overrides
	} as FilterStateSelectors;
}

function makeStateWithEditing(): UiState {
	const filter = makeFilterItemState({ filterId: "f1" });
	const filterState = makeFilterState({
		filters: { f1: filter },
		editingFilter: { filterId: "f1", options: {}, resetCounter: 0 }
	});

	return makeUiState(filterState);
}

describe("UiStateSelector.NewFilter.isEditingFilterApplicable", () => {
	const subject = UiStateSelector.NewFilter.isEditingFilterApplicable;

	it("returns false when newFilter state is missing", () => {
		expect(subject(makeSelectors())(makeUiState(undefined))).toBe(false);
	});

	it("returns false when editingFilter is null", () => {
		const filterState = makeFilterState({ editingFilter: null });
		expect(subject(makeSelectors())(makeUiState(filterState))).toBe(false);
	});

	it("returns false when previous filter state is missing for editing id", () => {
		const filterState = makeFilterState({
			filters: {},
			editingFilter: { filterId: "missing", options: {}, resetCounter: 0 }
		});

		expect(subject(makeSelectors())(makeUiState(filterState))).toBe(false);
	});

	it("returns false when filter has validation errors", () => {
		const selectors = makeSelectors({
			hasErrors: vi.fn().mockReturnValue(true),
			toEffectiveOptions: vi.fn((_m: object, opts: object) => opts)
		});

		expect(subject(selectors)(makeStateWithEditing())).toBe(false);
	});

	it("returns false when editing state equals stored state", () => {
		const selectors = makeSelectors({
			hasErrors: vi.fn().mockReturnValue(false),
			toEffectiveOptions: vi.fn().mockReturnValue({ same: true })
		});

		expect(subject(selectors)(makeStateWithEditing())).toBe(false);
	});

	it("returns true when editing differs from stored and no errors", () => {
		const selectors = makeSelectors({
			hasErrors: vi.fn().mockReturnValue(false),
			toEffectiveOptions: vi.fn().mockReturnValueOnce({ value: "editing" }).mockReturnValueOnce({ value: "current" })
		});

		expect(subject(selectors)(makeStateWithEditing())).toBe(true);
	});
});
