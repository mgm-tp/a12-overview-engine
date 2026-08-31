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

import type { FilterItemData, FilterSectionData } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { STATEFUL_FILTER_TYPES } from "../components/editors/filter-editor.js";
import { useFilterLabelResolver } from "../components/filter-label-resolvers.js";

import type { FilterGroup } from "./use-filter-groups.js";
import { useFilterSelectors } from "./use-filter-selectors.js";
import { useFilterState } from "./use-filter-state.js";

export interface UseFilterItemsOptions {
	readonly groups: readonly FilterGroup[];
	readonly onCollapseChange: (filterId: string, collapsed: boolean) => void;
	readonly onFocusedFilterChange: (filterId: string) => void;
}

export function useFilterItems({
	groups,
	onCollapseChange,
	onFocusedFilterChange
}: UseFilterItemsOptions): (FilterItemData | FilterSectionData)[] {
	const filterStates = useFilterState((s) => s?.filters);
	const filterStateSelectors = useFilterSelectors();

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const appliedBadgeTitle = localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.section.appliedTitle);
	const errorBadgeTitle = localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.section.errorTitle);

	const resolveFilterLabel = useFilterLabelResolver();
	const FilterEditor = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterEditor);
	const FilterResetButton = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterResetButton);
	const FilterSettingButton = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSettingButton);

	return useMemo(() => {
		if (!filterStates) {
			return [];
		}

		function toFilterItemData(filterId: string): FilterItemData | undefined {
			const filterState = filterStates?.[filterId];

			if (!filterState) {
				return undefined;
			}

			const hasErrors = filterStateSelectors.hasErrors(filterState);
			const isResettable = filterStateSelectors.isResettable(filterState);
			const isConfigurable = filterStateSelectors.isConfigurable(filterState);

			const meta = (
				<>
					<FilterResetButton filterId={filterId} />
					{isConfigurable && <FilterSettingButton filterState={filterState} />}
				</>
			);

			const isStatefulType = STATEFUL_FILTER_TYPES.has(filterState.model.type);
			const shouldMountEditor = !filterState.collapsed || isStatefulType;

			return {
				id: filterId,
				label: resolveFilterLabel(filterState.model),
				content: shouldMountEditor ? <FilterEditor filterState={filterState} /> : null,
				active: isResettable,
				badgeVariant: hasErrors ? "error" : "info",
				badgeTitle: hasErrors ? errorBadgeTitle : appliedBadgeTitle,
				collapsed: filterState.collapsed,
				onCollapseChange: (collapsed) => onCollapseChange(filterId, collapsed),
				onFocus: () => onFocusedFilterChange(filterId),
				meta
			};
		}

		const result: (FilterItemData | FilterSectionData)[] = [];

		for (const group of groups) {
			const items = group.filterIds.map(toFilterItemData).filter((item): item is FilterItemData => item !== undefined);

			if (items.length === 0) {
				continue;
			}

			if (group.isOverflow || group.groupLabel === "") {
				const lastIndex = items.length - 1;
				const marked = items.map((item, index) =>
					index === lastIndex ? { ...item, lastHiddenItem: true as const } : item
				);
				result.push(...marked);
			} else {
				result.push({ id: group.groupId, label: group.groupLabel, items });
			}
		}

		return result;
	}, [
		filterStates,
		filterStateSelectors,
		appliedBadgeTitle,
		errorBadgeTitle,
		resolveFilterLabel,
		groups,
		onCollapseChange,
		onFocusedFilterChange,
		FilterEditor,
		FilterResetButton,
		FilterSettingButton
	]);
}
