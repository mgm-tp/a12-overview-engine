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

import { useMemo } from "react";

import type { FilterItemState } from "../../../../store/index.js";
import type { OverviewModel } from "../../../../overview-model.js";
import { isFieldBasedFilterModelItem } from "../../../../models/filter-model-utils.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useFilterLabelResolver, useFilterGroupLabelResolver } from "../components/filter-label-resolvers.js";

import { useFilterSelectors } from "./use-filter-selectors.js";

export const OVERFLOW_GROUP_ID = "__overflow__";

export interface FilterGroup {
	readonly groupLabel: string;
	readonly groupId: string;
	readonly filterIds: string[];
	readonly isOverflow?: boolean;
}

export function useFilterGroups(options: {
	readonly filterStates: Record<string, FilterItemState> | undefined;
	readonly filterGroups: readonly OverviewModel.NewFilter.Group[];
	readonly searchText: string;
	readonly showSetFiltersOnly: boolean;
	readonly smallView: boolean;
}): readonly FilterGroup[] {
	const { filterStates, filterGroups, searchText, showSetFiltersOnly, smallView } = options;

	const filterStateSelectors = useFilterSelectors();
	const subDocumentModels = useOverviewEngineContext((c) => c.subDocumentModels);
	const documentModel = useOverviewEngineContext((c) => c.documentModel);
	const resolveFieldLabel = useFilterLabelResolver();
	const resolveGroupLabel = useFilterGroupLabelResolver();

	return useMemo(() => {
		const overflowFilterIds: string[] = [];
		const isSearchOrShowSetActive = !!searchText || showSetFiltersOnly;

		function matchesSearchAndShowSet(filterItem: OverviewModel.NewFilter.Item): boolean {
			const filterState = filterStates?.[filterItem.id];

			if (!filterState) {
				return true;
			}

			const subModel = isFieldBasedFilterModelItem(filterState.model) ? filterState.model.options.subModel : undefined;
			const targetDocumentModel = subModel
				? (subDocumentModels?.find((dm) => dm.header.id === subModel) ?? documentModel)
				: documentModel;

			if (showSetFiltersOnly && !filterStateSelectors.toOperator(filterState, { documentModel: targetDocumentModel })) {
				return false;
			}

			if (searchText && !resolveFieldLabel(filterItem).toLowerCase().includes(searchText.toLowerCase())) {
				return false;
			}

			return true;
		}

		function matchesFilter(filterItem: OverviewModel.NewFilter.Item): boolean {
			const filterState = filterStates?.[filterItem.id];

			if (!filterState) {
				return true;
			}

			if (filterItem.preferFilterBar === true) {
				const isOverflow = smallView || filterState.area === "filterSelector";

				if (isOverflow) {
					if (isSearchOrShowSetActive) {
						if (matchesSearchAndShowSet(filterItem)) {
							overflowFilterIds.push(filterItem.id);
						}
					} else {
						overflowFilterIds.push(filterItem.id);
					}
				}

				return false;
			}

			return matchesSearchAndShowSet(filterItem);
		}

		const normalGroups = filterGroups.flatMap((group) => {
			const filteredFilterItems = group.filterItems.flatMap((filterItem) => {
				if (!matchesFilter(filterItem)) {
					return [];
				}

				return filterItem.id;
			});

			if (filteredFilterItems.length === 0) {
				return [];
			}

			return { groupLabel: resolveGroupLabel(group), groupId: group.id, filterIds: filteredFilterItems };
		});

		if (overflowFilterIds.length > 0) {
			return [
				{ groupLabel: "", groupId: OVERFLOW_GROUP_ID, filterIds: overflowFilterIds, isOverflow: true },
				...normalGroups
			];
		}

		return normalGroups;
	}, [
		documentModel,
		filterGroups,
		filterStates,
		filterStateSelectors,
		resolveFieldLabel,
		resolveGroupLabel,
		searchText,
		showSetFiltersOnly,
		smallView,
		subDocumentModels
	]);
}
