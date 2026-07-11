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

import { useShouldAllowSearch } from "../../utils.js";
import { useMultiSelectionPanel } from "../multi-selection/use-multi-selection-panel.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";

import { useShouldShowFilterBar } from "./hooks/use-should-show-filter-bar.js";
import { useFilterTriggerPlacement } from "./hooks/use-filter-trigger-placement.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface OverviewSubheaderBoxProps {}

/** @internal */
export const OverviewSubheaderBox: React.FC<OverviewSubheaderBoxProps> = React.memo(function OverviewSubheaderBox() {
	const shouldDisplayInSmallView = useOverviewEngineContext((context) => !!context.smallView);
	const embedded = useOverviewEngineContext((context) => !!context.embedded);
	const compactTriggerPlacement = shouldDisplayInSmallView || embedded;
	const SearchBar = useOverviewEngineContext((context) => context.componentMap.SearchBar);
	const SubHeader = useOverviewEngineContext((c) => c.componentMap.newFilter.SubHeader);
	const FilterBar = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterBar);
	const FilterSelectorTriggerButton = useOverviewEngineContext(
		(c) => c.componentMap.newFilter.FilterSelectorTriggerButton
	);
	const shouldShowFilterBar = useShouldShowFilterBar();
	const placement = useFilterTriggerPlacement();
	const showMobileSearchBar = useOverviewEngineState((s) => s.showMobileSearchBar ?? false);
	const shouldAllowSearch = useShouldAllowSearch();

	const multiSelectionPanel = useMultiSelectionPanel();

	const subHeaderPlacement = placement === "search-adjacent" || placement === "action-bar" ? placement : undefined;
	const filterTrigger = subHeaderPlacement ? <FilterSelectorTriggerButton key="autoFilterTrigger" /> : undefined;

	return (
		<SubHeader
			key="subHeader"
			searchBar={shouldAllowSearch && !compactTriggerPlacement && <SearchBar key="searchBar" />}
			mobileSearchBar={
				shouldAllowSearch && compactTriggerPlacement && <SearchBar key="searchBarMobile" fitToParent={true} />
			}
			showMobileSearchBar={showMobileSearchBar}
			filterBar={shouldShowFilterBar ? <FilterBar /> : undefined}
			filterTrigger={filterTrigger}
			filterTriggerPlacement={subHeaderPlacement}
			multiSelectionPanel={!compactTriggerPlacement && multiSelectionPanel}
		/>
	);
});
