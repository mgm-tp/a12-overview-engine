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

import { mapValues } from "lodash-es";
import type { Middleware } from "redux";

import type { UiState } from "../../../store.js";
import { Events, Commands } from "../../../actions.js";
import { UiStateSelector } from "../../../selectors/ui-state.js";
import { FilterStateLens, type FilterItemState } from "../../../filter-state.js";
import type { FilterStateSelectors } from "../../../selectors/filter-selectors.js";

interface Options {
	readonly filterStateSelectors: FilterStateSelectors;
}

/**
 * Reconcile each `preferFilterBar` filter's `area` against the widget's overflow
 * report. Filters returning from FS → bar revert pending edits; the editing
 * copy is dropped if its filter overflows.
 */
export function createOnFilterBarItemsOverflowed({ filterStateSelectors }: Options): Middleware<{}, UiState> {
	return (api) => (next) => (action) => {
		const result = next(action);

		if (!Events.NewFilter.onFilterBarItemsOverflowed.match(action)) {
			return result;
		}

		const state = api.getState().newFilter;

		if (!state) {
			return result;
		}

		const hiddenIds = new Set(action.payload.filterIds);
		const editingFilter =
			state.editingFilter && hiddenIds.has(state.editingFilter.filterId) ? null : state.editingFilter;
		const filters = mapValues(state.filters, (filter) => reconcileArea(filter, hiddenIds));
		const nextState = { ...state, filters, editingFilter };

		api.dispatch(
			Commands.setFilterState({
				state: FilterStateLens.snapshot.set(
					UiStateSelector.NewFilter.computeFiltersSnapshot(
						nextState.filters,
						nextState.queryOptions,
						filterStateSelectors
					)
				)(nextState)
			})
		);

		return result;
	};
}

/**
 * Compute the next `FilterItemState` for a single filter given the widget's
 * hidden-id set. Only `preferFilterBar` filters participate in overflow;
 * selector-area filters pass through unchanged.
 *
 * - Hidden ⇒ `filterSelector`.
 * - Visible:
 *   - was in FS ⇒ returning to bar: revert options + bump `resetCounter` so
 *     date/time pickers remount and discard stale input state.
 *   - was in bar ⇒ stay (no edit-revert).
 */
function reconcileArea(filter: FilterItemState, hiddenIds: ReadonlySet<string>): FilterItemState {
	if (filter.model.preferFilterBar !== true) {
		return filter;
	}

	if (hiddenIds.has(filter.model.id)) {
		return { ...filter, area: "filterSelector" };
	}

	if (filter.area === "filterSelector") {
		return {
			...filter,
			area: "filterBar",
			options: filter.appliedOptions,
			resetCounter: filter.resetCounter + 1
		};
	}

	return { ...filter, area: "filterBar" };
}
