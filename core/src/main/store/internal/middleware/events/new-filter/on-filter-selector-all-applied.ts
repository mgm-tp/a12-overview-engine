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
import { pipe } from "fp-ts/lib/function.js";

import type { UiState } from "../../../store.js";
import { Events, Commands } from "../../../actions.js";
import { resetPaginationAndScrolling } from "../utils.js";
import { UiStateSelector } from "../../../selectors/ui-state.js";
import { QueryOptions, FilterStateLens } from "../../../filter-state.js";
import type { FilterStateSelectors } from "../../../selectors/filter-selectors.js";

interface Options {
	readonly filterStateSelectors: FilterStateSelectors;
}

export function createOnSelectorApplyAll({ filterStateSelectors }: Options): Middleware<{}, UiState> {
	return (api) => (next) => (action) => {
		const result = next(action);

		if (Events.NewFilter.onFilterSelectorAllApplied.match(action)) {
			const state = api.getState().newFilter;

			if (!state) {
				return result;
			}

			const filtersWithApplied = { ...state.filters };

			for (const [id, filterState] of Object.entries(filtersWithApplied)) {
				if (filterState.area === "filterSelector") {
					filtersWithApplied[id] = { ...filterState, appliedOptions: filterState.options };
				}
			}

			const queryOptions = QueryOptions.commit(state.queryOptions);

			api.dispatch(
				Commands.setFilterState({
					state: pipe(
						{ ...state, filters: filtersWithApplied, queryOptions },
						FilterStateLens.snapshot.set(
							UiStateSelector.NewFilter.computeFiltersSnapshot(filtersWithApplied, queryOptions, filterStateSelectors)
						)
					)
				})
			);

			const currentQueryParameters = UiStateSelector.queryParameters()(api.getState());
			const nextQueryParameters = resetPaginationAndScrolling({ currentQueryParameters, payload: {} });
			api.dispatch(Commands.setQueryParameters(nextQueryParameters));
		}

		return result;
	};
}
