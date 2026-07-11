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

import { isEqual } from "lodash-es";
import hashObject from "object-hash";
import { createSelector } from "reselect";

import { OverviewModel } from "../../../overview-model.js";
import type { OverviewEngineApi } from "../../../view/api.js";
import { normalizeFilterOptions } from "../filter-options-normalization.js";
import type { UiState, Sorting, Scrolling, ColumnWidths, PaginationState, ScrollToRowRequest } from "../store.js";
import {
	QueryOptions,
	type FilterArea,
	FilterStateLens,
	type FilterState,
	type FilterItemState
} from "../filter-state.js";

import type { Selector } from "./selector.js";
import { type FilterStateSelectors, DefaultFilterStateSelectors } from "./filter-selectors.js";

export namespace UiStateSelector {
	export function rowState(): Selector<OverviewEngineApi.RowState | undefined, UiState> {
		return (state) => state.rowState;
	}

	export function totalSelectedRows(): Selector<number, UiState> {
		return (state) => totalSelectedRowsSelector(state);
	}

	export function hasSelectedRow(): Selector<boolean, UiState> {
		return (state) => totalSelectedRowsSelector(state) > 0;
	}

	const totalSelectedRowsSelector = createSelector([(state: UiState) => state.rowState], (rowState) => {
		const entries = Object.values(rowState ?? {});
		const flatCount = entries.filter((entry) => entry.selected).length;
		const linkCount = entries.reduce(
			(sum, entry) => sum + Object.values(entry.byLink ?? {}).filter((linkEntry) => linkEntry.selected).length,
			0
		);

		return flatCount + linkCount;
	});

	export function columnWidths(): Selector<ColumnWidths | undefined, UiState> {
		return (state) => state.columnWidths;
	}

	export function expandedMultiSelection(): Selector<boolean, UiState> {
		return (state) => !!state.expandedMultiSelection;
	}

	/** @internal */
	export function latestSelectedDocumentId(): Selector<
		{ readonly documentId: string; readonly linkId?: string } | null,
		UiState
	> {
		return (state) => state.latestSelectedDocumentId ?? null;
	}

	/** @internal */
	export function latestSelectedDocumentIds(): Selector<
		readonly { readonly documentId: string; readonly linkId?: string }[] | null,
		UiState
	> {
		return (state) => state.latestSelectedDocumentIds ?? null;
	}

	export function dialog(): Selector<OverviewEngineApi.Dialog | null, UiState> {
		return (state) => state.dialog ?? null;
	}

	export function searchString(): Selector<string | undefined, UiState> {
		return (state) => state.searchString;
	}

	export function sorting(): Selector<Sorting[] | undefined, UiState> {
		return (state) => state.sorting;
	}

	export function scrolling(): Selector<Scrolling | undefined, UiState> {
		return (state) => state.scrolling;
	}

	export function activeFilters(): Selector<OverviewEngineApi.FilterMap | undefined, UiState> {
		return (state) => state.activeFilters;
	}

	export function enumeratedStringFilterMap(): Selector<
		OverviewEngineApi.EnumeratedStringFilterMap | undefined,
		UiState
	> {
		return (state) => state.enumeratedStringFilterMap;
	}

	export function pagination(): Selector<PaginationState | undefined, UiState> {
		return (state) => state.pagination;
	}

	/** @internal */
	export function queryParameters(): Selector<
		Pick<UiState, "searchString" | "sorting" | "scrolling" | "activeFilters" | "pagination">,
		UiState
	> {
		return (state) => {
			return {
				searchString: state.searchString,
				sorting: state.sorting,
				scrolling: state.scrolling,
				activeFilters: state.activeFilters,
				pagination: state.pagination
			};
		};
	}

	export function disabled(): Selector<boolean, UiState> {
		return (state) => !!state.disabled;
	}

	/** @internal */
	export function dataLoadTriggered(): Selector<boolean, UiState> {
		return (state) => !!state.dataLoadTriggered;
	}

	export function scrollToRow(): Selector<ScrollToRowRequest | undefined, UiState> {
		return (state) => state.scrollToRow;
	}

	/**
	 * Whether multi-selection row click is active based on the model configuration:
	 * - `CHECKBOX`: always returns `false` (only checkbox toggles selection).
	 * - `NON_COLLAPSIBLE`: returns `true` when at least one node is selected.
	 * - Otherwise: returns `true` when the multi-selection panel is expanded.
	 * @internal
	 */
	export function isMultiSelectRowClickActive(
		multiSelection: OverviewModel.MultiSelection | undefined
	): Selector<boolean, UiState> {
		return (state) => {
			const selectionArea =
				multiSelection?.selectionArea ?? OverviewModel.MultiSelection.SelectionArea.CHECKBOX_AND_ROW;

			if (selectionArea === OverviewModel.MultiSelection.SelectionArea.CHECKBOX) {
				return false;
			}

			if (multiSelection?.collapseOption === OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE) {
				return hasSelectedRow()(state);
			}

			return expandedMultiSelection()(state);
		};
	}

	/** @experimental until 40.0.0 - API may change without semver guarantees. */
	export namespace NewFilter {
		export function filterState(): Selector<FilterState | undefined, UiState> {
			return (state) => state.newFilter;
		}

		export function filterById(filterId: string): Selector<FilterItemState | undefined, UiState> {
			return (state) => {
				const slice = filterState()(state);

				return slice ? FilterStateLens.filterById(filterId).get(slice) : undefined;
			};
		}

		const filtersByAreaCache = new WeakMap<Record<string, FilterItemState>, Record<string, FilterItemState[]>>();

		function computeFiltersByArea(filters: Record<string, FilterItemState>, area: FilterArea): FilterItemState[] {
			const cached = filtersByAreaCache.get(filters);

			if (cached?.[area]) {
				return cached[area];
			}

			const result = Object.values(filters).filter((filterState) => filterState.area === area);

			filtersByAreaCache.set(filters, { ...cached, [area]: result });

			return result;
		}

		export function filtersByArea(area: FilterArea): Selector<FilterItemState[], UiState> {
			return (state) => {
				const filters = filterState()(state)?.filters;

				if (!filters) {
					return [];
				}

				return computeFiltersByArea(filters, area);
			};
		}

		export function computeFiltersSnapshot(
			filters: Record<string, FilterItemState>,
			queryOptions: QueryOptions | undefined,
			selectors: FilterStateSelectors
		): string {
			const fsFilters = Object.fromEntries(
				computeFiltersByArea(filters, "filterSelector").map((filter) => {
					return [filter.model.id, normalizeFilterOptions(selectors.toEffectiveOptions(filter.model, filter.options))];
				})
			);

			// The snapshot tracks the live (current) query options; applied/default are excluded.
			const invert = queryOptions?.invert.current;
			const joinOperator = queryOptions?.joinOperator.current;

			return hashObject({ filters: fsFilters, options: { joinOperator, invert } });
		}

		export function filtersSnapshot(
			selectors: FilterStateSelectors = DefaultFilterStateSelectors
		): Selector<string, UiState> {
			return (state) => {
				const slice = filterState()(state);

				if (!slice) {
					return computeFiltersSnapshot({}, undefined, selectors);
				}

				return computeFiltersSnapshot(slice.filters, slice.queryOptions, selectors);
			};
		}

		export function isApplicable(selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return (state) => {
				if (!state.newFilter) {
					return false;
				}

				return (
					!hasFilterSelectorErrors(selectors)(state) && filtersSnapshot(selectors)(state) !== state.newFilter.snapshot
				);
			};
		}

		export function isEditingFilterApplicable(selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return (state) => {
				const filterState = NewFilter.filterState()(state);

				if (!filterState?.editingFilter) {
					return false;
				}

				const currentState = filterById(filterState.editingFilter.filterId)(state);
				const editingState = editingFilter()(state);

				if (!editingState || !currentState) {
					return false;
				}

				if (selectors.hasErrors(editingState)) {
					return false;
				}

				const currentEffective = selectors.toEffectiveOptions(currentState.model, currentState.options);
				const editingEffective = selectors.toEffectiveOptions(editingState.model, editingState.options);

				return !isEqual(editingEffective, currentEffective);
			};
		}

		export function isFilterSelectorResettable(selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return (state) => {
				const slice = filterState()(state);
				const allFilters = Object.values(slice?.filters ?? {});

				return (
					allFilters.some((f) => selectors.isResettable(f)) ||
					(!!slice && QueryOptions.isResettable(slice.queryOptions))
				);
			};
		}

		export function isFilterBarResettable(selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return (state) => filtersByArea("filterBar")(state).some((f) => selectors.isResettable(f));
		}

		function withFilter(filterId: string, fn: (filter: FilterItemState) => boolean): Selector<boolean, UiState> {
			return (state) => {
				const filter = filterById(filterId)(state);

				return filter ? fn(filter) : false;
			};
		}

		export function isResettableById(filterId: string, selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return withFilter(filterId, (f) => selectors.isResettable(f));
		}

		const editingFilterMemoized = createSelector(
			[
				(state: UiState) => NewFilter.filterState()(state)?.editingFilter?.options ?? null,
				(state: UiState) => {
					const editing = NewFilter.filterState()(state)?.editingFilter;

					return editing ? filterById(editing.filterId)(state) : null;
				}
			],
			(options, baseFilter): FilterItemState | null => {
				if (!options || !baseFilter) {
					return null;
				}

				return { ...baseFilter, options };
			}
		);

		export function editingFilter(): Selector<FilterItemState | null, UiState> {
			return editingFilterMemoized;
		}

		export function editingFilterSettings(): Selector<FilterItemState | null, UiState> {
			return (state: UiState) => {
				const id = NewFilter.filterState()(state)?.editingFilterSettingsId;

				if (!id) {
					return null;
				}

				return filterById(id)(state) ?? null;
			};
		}

		export function hasErrorById(filterId: string, selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return withFilter(filterId, (f) => selectors.hasErrors(f));
		}

		export function hasFilterSelectorErrors(selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return (state) => filtersByArea("filterSelector")(state).some((f) => selectors.hasErrors(f));
		}

		export function isConfigurable(filterId: string, selectors: FilterStateSelectors): Selector<boolean, UiState> {
			return withFilter(filterId, (f) => selectors.isConfigurable(f));
		}
	}
}
