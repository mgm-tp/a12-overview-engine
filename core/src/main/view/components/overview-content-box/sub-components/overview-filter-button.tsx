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
import { useOverviewContentBoxContext } from "../../../context/overview-content-box-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

/** @internal */
export const OverviewFilterButton: React.FC = React.memo(function OverviewFilterButton() {
	const filterConfiguration = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.filterConfiguration
	);
	const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const FilterButtonWidget = useOverviewEngineContext((context) => context.componentMap.FilterButton);

	const toggleMobileFilterBar = useOverviewContentBoxContext((context) => context.toggleMobileFilterBar);
	const onFilterSelectorVisibilityChange = useOverviewContentBoxContext(
		(context) => context.onFilterSelectorVisibilityChange
	);
	const showFilterSelector = useOverviewContentBoxContext((context) => context.showFilterSelector);
	const showMobileFilterBar = useOverviewContentBoxContext((context) => context.showMobileFilterBar);
	const getTriggerElementRef = useOverviewContentBoxContext((context) => context.getTriggerElementRef);

	const isAnyFilterChecked = React.useMemo<boolean>(() => Object.keys(activeFilters ?? {}).length > 0, [activeFilters]);
	const onFilterButtonClick = React.useCallback(() => {
		if (!!smallView && isAnyFilterChecked && filterConfiguration?.showFilterBar) {
			toggleMobileFilterBar();
		} else {
			onFilterSelectorVisibilityChange(!showFilterSelector);
		}
	}, [
		isAnyFilterChecked,
		onFilterSelectorVisibilityChange,
		filterConfiguration?.showFilterBar,
		smallView,
		showFilterSelector,
		toggleMobileFilterBar
	]);

	return (
		<FilterButtonWidget
			key={"filter"}
			buttonRef={getTriggerElementRef}
			onClick={onFilterButtonClick}
			active={filterConfiguration?.showFilterBar && showMobileFilterBar}
			showBadge={!showMobileFilterBar && isAnyFilterChecked}
			show={showFilterSelector}
		/>
	);
});
