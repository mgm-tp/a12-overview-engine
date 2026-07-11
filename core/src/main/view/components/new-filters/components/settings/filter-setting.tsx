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

import { memo, type FC } from "react";

import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";
import {
	DateFilterState,
	TimeFilterState,
	NumberFilterState,
	StringFilterState,
	BooleanFilterState,
	ConfirmFilterState,
	DateTimeFilterState,
	type FilterItemState,
	DateRangeFilterState,
	EnumerationFilterState,
	MultiSelectFilterState,
	DateFragmentFilterState
} from "../../../../../store/index.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSettingProps {
	readonly filterState: FilterItemState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSetting: FC<FilterSettingProps> = memo(function FilterSetting({ filterState }) {
	const BooleanFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.BooleanFilterSetting);
	const ConfirmFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.ConfirmFilterSetting);
	const StringFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.StringFilterSetting);
	const NumberFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.NumberFilterSetting);
	const EnumerationFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.EnumerationFilterSetting);
	const MultiSelectFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.MultiSelectFilterSetting);
	const TimeFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.TimeFilterSetting);
	const DateFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.DateFilterSetting);
	const DateTimeFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.DateTimeFilterSetting);
	const DateFragmentFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.DateFragmentFilterSetting);
	const DateRangeFilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.DateRangeFilterSetting);

	if (ConfirmFilterState.isInstance(filterState)) {
		return <ConfirmFilterSetting state={filterState} />;
	}

	if (BooleanFilterState.isInstance(filterState)) {
		return <BooleanFilterSetting state={filterState} />;
	}

	if (StringFilterState.isInstance(filterState)) {
		return <StringFilterSetting state={filterState} />;
	}

	if (NumberFilterState.isInstance(filterState)) {
		return <NumberFilterSetting state={filterState} />;
	}

	if (EnumerationFilterState.isInstance(filterState)) {
		return <EnumerationFilterSetting state={filterState} />;
	}

	if (MultiSelectFilterState.isInstance(filterState)) {
		return <MultiSelectFilterSetting state={filterState} />;
	}

	if (TimeFilterState.isInstance(filterState)) {
		return <TimeFilterSetting state={filterState} />;
	}

	if (DateFilterState.isInstance(filterState)) {
		return <DateFilterSetting state={filterState} />;
	}

	if (DateTimeFilterState.isInstance(filterState)) {
		return <DateTimeFilterSetting state={filterState} />;
	}

	if (DateFragmentFilterState.isInstance(filterState)) {
		return <DateFragmentFilterSetting state={filterState} />;
	}

	if (DateRangeFilterState.isInstance(filterState)) {
		return <DateRangeFilterSetting state={filterState} />;
	}

	throw new Error(`Unsupported filter state data: ${filterState.model.id}`);
});
