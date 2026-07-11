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

import { memo, useRef, type FC, useMemo, useCallback } from "react";

import { UiStateSelector } from "../../../../store/index.js";
import { useFilterState } from "../hooks/use-filter-state.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";
import { useFilterTriggerPlacement } from "../hooks/use-filter-trigger-placement.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterBarProps {}

/** @internal */
export const FilterBar: FC<FilterBarProps> = memo(function FilterBar() {
	const filterState = useFilterState();
	const FilterBarWidget = useOverviewEngineContext((context) => context.widgetMap.FilterBar);
	const FilterBarItem = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterBarItem);
	const FilterBarItemDropdown = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterBarItemDropdown);
	const FilterSelectorTriggerButton = useOverviewEngineContext(
		(c) => c.componentMap.newFilter.FilterSelectorTriggerButton
	);
	const onFilterBarItemsOverflowed = useOverviewEngineContext(
		(c) => c.eventHandlers.newFilter?.onFilterBarItemsOverflowed
	);
	const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const filterRefCallbacks = useRef<Record<string, (el: HTMLDivElement | null) => void>>({});
	const getFilterRefCallback = useCallback((id: string) => {
		const cached = filterRefCallbacks.current[id];

		if (cached) {
			return cached;
		}

		const fn = (el: HTMLDivElement | null) => {
			filterRefs.current[id] = el;
		};

		filterRefCallbacks.current[id] = fn;

		return fn;
	}, []);
	const placement = useFilterTriggerPlacement();
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const editingFilter = useOverviewEngineState(UiStateSelector.NewFilter.editingFilter());
	const filterGroups = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.newFilterConfiguration?.filterGroups
	);

	const filterBarFilters = useMemo(() => {
		return (
			filterGroups?.flatMap((group) =>
				group.filterItems.flatMap((filterModel) =>
					filterModel.preferFilterBar ? (filterState?.filters?.[filterModel.id] ?? []) : []
				)
			) ?? []
		);
	}, [filterGroups, filterState?.filters]);

	const onHiddenFiltersChange = useCallback(
		(hiddenFilterIndices: number[]) => {
			onFilterBarItemsOverflowed?.({
				filterIds: filterBarFilters.flatMap((filter, index) =>
					hiddenFilterIndices.includes(index) ? filter.model.id : []
				)
			});
		},
		[filterBarFilters, onFilterBarItemsOverflowed]
	);

	return (
		<>
			<FilterBarWidget
				compact
				disabled={disabled}
				onHiddenFiltersChange={onHiddenFiltersChange}
				actions={
					<>
						<FilterBarResetButton />
						{placement === "filter-bar" && <FilterSelectorTriggerButton />}
					</>
				}>
				{filterBarFilters.map((filter) => (
					<FilterBarItem key={filter.model.id} filter={filter} filterRef={getFilterRefCallback(filter.model.id)} />
				))}
			</FilterBarWidget>
			{editingFilter && (
				<FilterBarItemDropdown
					filterState={editingFilter}
					referenceElement={filterRefs.current[editingFilter.model.id] ?? undefined}
				/>
			)}
		</>
	);
});

const FilterBarResetButton: FC = memo(function FilterBarResetButton() {
	const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const onReset = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterBarReset);
	const filterStateSelectors = useFilterSelectors();
	const resettable = useOverviewEngineState(UiStateSelector.NewFilter.isFilterBarResettable(filterStateSelectors));

	return (
		<Button
			icon={<Icon iconTheme="outlined">replay</Icon>}
			disabled={!resettable}
			onClick={(e) => {
				e.stopPropagation();
				onReset?.();
			}}
		/>
	);
});
