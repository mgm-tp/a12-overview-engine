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

import { RadioSetting } from "../utilities/radio-setting.js";
import { ToggleSetting } from "../utilities/typed-toggle.js";
import { BooleanToggleSetting } from "../utilities/typed-toggle.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import type { OverviewModel } from "../../../../../overview-model.js";
import type { DateTimeFilterState } from "../../../../../store/index.js";
import { useAvailableRanges } from "../../hooks/use-available-ranges.js";
import { useRangeToggleItems } from "../../hooks/use-range-toggle-items.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { useAvailableListPeriods } from "../../hooks/use-available-periods.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";

import { FilterSettingSection } from "./filter-setting-section.js";

const t = RESOURCE_KEYS.overviewEngine.newFilter.setting;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface DateTimeFilterSettingProps {
	readonly state: DateTimeFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DateTimeFilterSetting: FC<DateTimeFilterSettingProps> = memo(function DateTimeFilterSetting({ state }) {
	const { empty, selectedRange, selectedPeriod, invert } = state.options;
	const availableRanges = useAvailableRanges(state.model.options.ranges);
	const rangeItems = useRangeToggleItems(availableRanges);
	const availablePeriods = useAvailableListPeriods<OverviewModel.NewFilter.DateTime.PeriodOption>(
		state.model.options.periods
	);

	const onFilterOptionsChange = useDispatchFilterOptions<DateTimeFilterState>(state.model.id);
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
					{availableRanges.length > 1 && (
						<FilterSettingSection label={localizedResource(t.range)}>
							<ToggleSetting<OverviewModel.NewFilter.RangeOption>
								selectedValue={selectedRange}
								items={rangeItems}
								onChange={(value) => onFilterOptionsChange({ selectedRange: value })}
							/>
						</FilterSettingSection>
					)}
					{availablePeriods.length > 1 && (
						<FilterSettingSection label={localizedResource(t.period)}>
							<RadioSetting<OverviewModel.NewFilter.DateTime.PeriodOption>
								name="datetime-filter-period"
								selectedValue={selectedPeriod}
								items={(
									[
										{ value: "time", label: localizedResource(t.periodTime) },
										{ value: "date", label: localizedResource(t.periodDate) },
										{ value: "dateTime", label: localizedResource(t.periodDateTime) },
										{ value: "year", label: localizedResource(t.periodYear) },
										{ value: "yearMonth", label: localizedResource(t.periodYearMonth) },
										{ value: "month", label: localizedResource(t.periodMonth) }
									] as const
								).filter((option) => availablePeriods.includes(option.value))}
								onChange={(value) => onFilterOptionsChange({ selectedPeriod: value })}
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
