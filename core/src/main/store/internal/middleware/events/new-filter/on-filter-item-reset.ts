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

import type { Middleware } from "redux";

import { Events, Commands } from "../../../actions.js";
import { FilterStateLens } from "../../../filter-state.js";
import type { FilterStateSelectors } from "../../../selectors/filter-selectors.js";
import type { UiState } from "../../../store.js";

interface Options {
	readonly filterStateSelectors: FilterStateSelectors;
}

export function createOnSingleFilterReset({ filterStateSelectors }: Options): Middleware<{}, UiState> {
	return (api) => (next) => (action) => {
		const result = next(action);

		if (Events.NewFilter.onFilterItemReset.match(action)) {
			const state = api.getState().newFilter;

			if (!state) {
				return result;
			}

			const { filterId } = action.payload;

			if (state.editingFilter) {
				const filterState = FilterStateLens.filterById(state.editingFilter.filterId).get(state);

				api.dispatch(
					Commands.setFilterState({
						state: {
							...state,
							editingFilter: {
								...state.editingFilter,
								resetCounter: state.editingFilter.resetCounter + 1,
								options: filterStateSelectors.toResetOptions(filterState)
							}
						}
					})
				);

				return result;
			}

			api.dispatch(
				Commands.setFilterState({
					state: FilterStateLens.filterById(filterId).modify((filter) => ({
						...filter,
						resetCounter: filter.resetCounter + 1,
						options: filterStateSelectors.toResetOptions(filter)
					}))(state)
				})
			);
		}

		return result;
	};
}
