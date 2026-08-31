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

import type { QueryOptions } from "../../../../main/store/internal/filter-state.js";
import type { FilterStateSelectors } from "../../../../main/store/internal/selectors/filter-selectors.js";
import { UiStateSelector } from "../../../../main/store/internal/selectors/ui-state.js";
import { makeUiState, makeFilterState, makeFilterItemState } from "../middleware/events/new-filter/helpers.js";

function makeSelectors(isResettable: boolean): FilterStateSelectors {
	return {
		hasErrors: vi.fn().mockReturnValue(false),
		toGeneralError: vi.fn().mockReturnValue(null),
		isEffectivelyEqual: vi.fn().mockReturnValue(false),
		toOperator: vi.fn(),
		isResettable: vi.fn().mockReturnValue(isResettable),
		createInitialOptions: vi.fn(),
		toEffectiveOptions: vi.fn(),
		toResetOptions: vi.fn(),
		toLabel: vi.fn(),
		hasAnySetFilter: vi.fn(),
		isConfigurable: vi.fn()
	} as FilterStateSelectors;
}

function withJoinOperatorCurrent(value: "and" | "or"): Partial<QueryOptions> {
	return {
		joinOperator: {
			default: { enabled: true, value: "and" },
			current: { enabled: true, value },
			applied: { enabled: true, value }
		}
	};
}

function withInvertCurrent(value: boolean): Partial<QueryOptions> {
	return {
		invert: {
			default: { enabled: true, value: false },
			current: { enabled: true, value },
			applied: { enabled: true, value }
		}
	};
}

describe("UiStateSelector.NewFilter.isFilterSelectorResettable", () => {
	const subject = UiStateSelector.NewFilter.isFilterSelectorResettable;

	it("returns false when no filter is resettable and query options are at their defaults", () => {
		const state = makeUiState(makeFilterState({ filters: { f1: makeFilterItemState({ filterId: "f1" }) } }));

		expect(subject(makeSelectors(false))(state)).toBe(false);
	});

	it("returns true when at least one filter is resettable", () => {
		const state = makeUiState(makeFilterState({ filters: { f1: makeFilterItemState({ filterId: "f1" }) } }));

		expect(subject(makeSelectors(true))(state)).toBe(true);
	});

	it("returns true when the overall join operator deviates from its default, even with no filter set", () => {
		const filterState = makeFilterState({ filters: { f1: makeFilterItemState({ filterId: "f1" }) } });
		const state = makeUiState({
			...filterState,
			queryOptions: { ...filterState.queryOptions, ...withJoinOperatorCurrent("or") }
		});

		expect(subject(makeSelectors(false))(state)).toBe(true);
	});

	it("returns true when invert deviates from its default, even with no filter set", () => {
		const filterState = makeFilterState({ filters: { f1: makeFilterItemState({ filterId: "f1" }) } });
		const state = makeUiState({
			...filterState,
			queryOptions: { ...filterState.queryOptions, ...withInvertCurrent(true) }
		});

		expect(subject(makeSelectors(false))(state)).toBe(true);
	});

	it("returns false when newFilter state is missing", () => {
		expect(subject(makeSelectors(true))(makeUiState(undefined))).toBe(false);
	});
});
