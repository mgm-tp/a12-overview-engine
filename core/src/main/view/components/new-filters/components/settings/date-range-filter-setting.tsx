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

import type { OverviewModel } from "../../../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import type { DateRangeFilterState } from "../../../../../store/index.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { useAvailableDateRangePeriods } from "../../hooks/use-available-periods.js";
import { useAvailableRanges } from "../../hooks/use-available-ranges.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { useRangeToggleItems } from "../../hooks/use-range-toggle-items.js";
import { RadioSetting } from "../utilities/radio-setting.js";
import { ToggleSetting, BooleanToggleSetting } from "../utilities/typed-toggle.js";

import { FilterSettingSection } from "./filter-setting-section.js";

const t = RESOURCE_KEYS.overviewEngine.newFilter.setting;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface DateRangeFilterSettingProps {
	readonly state: DateRangeFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DateRangeFilterSetting: FC<DateRangeFilterSettingProps> = memo(function DateRangeFilterSetting({ state }) {
	const { empty, selectedRange, selectedPeriod, invert } = state.options;
	const availableRanges = useAvailableRanges(state.model.options.ranges);
	const rangeItems = useRangeToggleItems(availableRanges);
	const availablePeriods = useAvailableDateRangePeriods(state.model, state.element.fieldType.format);

	const onFilterOptionsChange = useDispatchFilterOptions<DateRangeFilterState>(state.model.id);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return (
		<>
			{empty.enabled && (
				<FilterSettingSection label={localizedResource(t.empty)}>
					<BooleanToggleSetting
						selectedValue={empty.value}
						onChange={(value) => onFilterOptionsChange({ empty: { ...empty, value } })}
					/>
				</FilterSettingSection>
			)}
			{!(empty.enabled && empty.value) && (
				<>
					{availablePeriods.length > 1 && (
						<FilterSettingSection label={localizedResource(t.period)}>
							<RadioSetting<OverviewModel.NewFilter.DateRange.PeriodOption>
								name="date-range-filter-period"
								selectedValue={selectedPeriod}
								items={(
									[
										{ value: "year", label: localizedResource(t.periodYear) },
										{ value: "month", label: localizedResource(t.periodMonth) },
										{ value: "yearMonth", label: localizedResource(t.periodYearMonth) }
									] as const
								).filter((option) => availablePeriods.includes(option.value))}
								onChange={(value) => {
									onFilterOptionsChange({ selectedPeriod: value });
								}}
							/>
						</FilterSettingSection>
					)}
					{availableRanges.length > 1 && (
						<FilterSettingSection label={localizedResource(t.range)}>
							<ToggleSetting<OverviewModel.NewFilter.RangeOption>
								selectedValue={selectedRange}
								items={rangeItems}
								onChange={(value) => onFilterOptionsChange({ selectedRange: value })}
							/>
						</FilterSettingSection>
					)}
				</>
			)}
			{invert.enabled && (
				<FilterSettingSection label={localizedResource(t.invertResult)}>
					<BooleanToggleSetting
						selectedValue={invert.value}
						onChange={(value) => onFilterOptionsChange({ invert: { ...invert, value } })}
					/>
				</FilterSettingSection>
			)}
		</>
	);
});
