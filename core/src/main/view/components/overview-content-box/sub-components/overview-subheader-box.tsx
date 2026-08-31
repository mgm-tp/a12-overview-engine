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

import * as React from "react";

import { UiStateSelector } from "../../../../store/index.js";
import type { OverviewEngineApi } from "../../../api.js";
import { FilterContext } from "../../../context/filter-context.js";
import { useOverviewContentBoxContext } from "../../../context/overview-content-box-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useShouldAllowSearch } from "../../../utils.js";
import type { Filter } from "../../filters/filter-options-view.js";
import { getActiveFilters, useFlattenedFilters, useExcludedFilterIds } from "../../filters/utils.js";
import { useMultiSelectionPanel } from "../../multi-selection/use-multi-selection-panel.js";

export interface OverviewSubheaderBoxProps {
	readonly handleFilterChange: (filters: OverviewEngineApi.FilterMap) => void;
	readonly onCurrentFilterChange: (currentFilter: Filter.FilterData) => void;
}

/** @internal */
export const OverviewSubheaderBox: React.FC<OverviewSubheaderBoxProps> = React.memo(
	function OverviewSubheaderBox(props) {
		const { handleFilterChange, onCurrentFilterChange } = props;

		const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());
		const enumeratedStringFilterMap = useOverviewEngineState(UiStateSelector.enumeratedStringFilterMap());
		const shouldDisplayInSmallView = useOverviewEngineContext((context) => !!context.smallView);
		const SubHeader = useOverviewEngineContext((context) => context.componentMap.SubHeader);
		const FilterBar = useOverviewEngineContext((context) => context.componentMap.FilterBar);
		const SearchBar = useOverviewEngineContext((context) => context.componentMap.SearchBar);
		const OverviewFilterButton = useOverviewEngineContext((context) => context.componentMap.OverviewFilterButton);
		const enableFilter = useOverviewEngineContext(
			(context) => context.overviewModel.content.configuration.enableFilter
		);
		const showMobileSearchBar = useOverviewContentBoxContext((context) => context.showMobileSearchBar);
		const showMobileFilterBar = useOverviewContentBoxContext((context) => context.showMobileFilterBar);

		const shouldAllowSearch = useShouldAllowSearch();

		const filterConfiguration = useOverviewEngineContext(
			(context) => context.overviewModel.content.configuration.filterConfiguration
		);

		const onFilterSelectorVisibilityChange = useOverviewContentBoxContext(
			(context) => context.onFilterSelectorVisibilityChange
		);

		const filters = useFlattenedFilters();
		const excludedFilterIds = useExcludedFilterIds();

		const multiSelectionPanel = useMultiSelectionPanel();

		return (
			<SubHeader
				key="subHeader"
				filterSelector={
					enableFilter &&
					filterConfiguration?.showFilterButton &&
					(activeFilters || enumeratedStringFilterMap) &&
					!shouldDisplayInSmallView ? (
						<OverviewFilterButton key="SubHeaderFilterButton" />
					) : undefined
				}
				searchBar={shouldAllowSearch && !shouldDisplayInSmallView && <SearchBar key="searchBar" />}
				mobileSearchBar={
					shouldAllowSearch && shouldDisplayInSmallView && <SearchBar key="searchBarMobile" fitToParent={true} />
				}
				showMobileSearchBar={showMobileSearchBar}
				filterBar={
					(activeFilters || enumeratedStringFilterMap) &&
					enableFilter &&
					filterConfiguration?.showFilterBar && (
						<FilterContext.Provider value={{ filters }}>
							<FilterBar
								key="filterBar"
								activeFilters={getActiveFilters(filters, excludedFilterIds)}
								onFilterChange={handleFilterChange}
								onClickFilter={onCurrentFilterChange}
								onEditClick={() => onFilterSelectorVisibilityChange?.(true)}
							/>
						</FilterContext.Provider>
					)
				}
				multiSelectionPanel={!shouldDisplayInSmallView && multiSelectionPanel}
				showMobileFilterBar={showMobileFilterBar}
				mobile={shouldDisplayInSmallView}
			/>
		);
	}
);
