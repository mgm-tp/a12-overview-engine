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
import type { FilterStateSelectors } from "../../../selectors/filter-selectors.js";
import { UiStateSelector } from "../../../selectors/ui-state.js";
import type { UiState } from "../../../store.js";
import { resetPaginationAndScrolling } from "../utils.js";

interface Options {
	readonly filterStateSelectors: FilterStateSelectors;
}

export function createOnFilterBarReset({ filterStateSelectors }: Options): Middleware<{}, UiState> {
	return (api) => (next) => (action) => {
		const result = next(action);

		if (Events.NewFilter.onFilterBarReset.match(action)) {
			const state = api.getState().newFilter;

			if (!state) {
				return result;
			}

			const newFilters = { ...state.filters };

			for (const [id, filterState] of Object.entries(state.filters)) {
				if (filterState.area === "filterBar") {
					const resetOptions = filterStateSelectors.toResetOptions(filterState);
					newFilters[id] = {
						...filterState,
						resetCounter: filterState.resetCounter + 1,
						options: resetOptions,
						appliedOptions: resetOptions
					};
				}
			}

			api.dispatch(Commands.setFilterState({ state: { ...state, filters: newFilters } }));

			const currentQueryParameters = UiStateSelector.queryParameters()(api.getState());
			api.dispatch(Commands.setQueryParameters(resetPaginationAndScrolling({ currentQueryParameters, payload: {} })));
		}

		return result;
	};
}
