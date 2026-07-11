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

import { memo, type FC, useMemo, useCallback } from "react";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import {
	TextField,
	YearSelector,
	BufferedInput,
	MonthSelector,
	HTMLInputAdapter
} from "@com.mgmtp.a12.widgets/widgets-core";

import { EmptyFilter } from "../utilities/empty-filter.js";
import { useTargetModelId } from "../filter-label-resolvers.js";
import type { SegmentOption } from "../../../../../store/index.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import type { OverviewModel } from "../../../../../overview-model.js";
import { getYearBlurError } from "../utilities/year-input-validation.js";
import { useFilterSelectors } from "../../hooks/use-filter-selectors.js";
import type { DateFragmentFilterState } from "../../../../../store/index.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { SectionType } from "../../../filters/options-views/section-template.js";
import { DateTimeUtils } from "../../../filters/options-views/date-time-utils.js";
import { RangeFilterEditorTemplate } from "../utilities/range-filter-editor-template.js";
import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";
import { PeriodCriteria } from "../../../../../store/internal/filter-controllers/criteria.js";

const MonthDayInput = BufferedInput(HTMLInputAdapter(TextField));

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface DateFragmentFilterEditorProps {
	readonly state: DateFragmentFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DateFragmentFilterEditor: FC<DateFragmentFilterEditorProps> = memo(function DateFragmentFilterEditor({
	state
}) {
	const { empty, selectedRange } = state.options;
	const range = selectedRange;
	const modelId = useTargetModelId(state);
	const path = useMemo(() => ModelPath.fromString(state.fieldPath ?? ""), [state.fieldPath]);

	const filterStateSelectors = useFilterSelectors();
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const generalError = useMemo(() => filterStateSelectors.toGeneralError(state), [filterStateSelectors, state]);
	const errorMessage = useMemo(
		() => (generalError ? localizedResource(generalError.key, generalError.args) : undefined),
		[generalError, localizedResource]
	);

	const YearMonthSelector = useOverviewEngineContext((context) => context.widgetMap.YearMonthSelector);
	const onFilterOptionsChange = useDispatchFilterOptions<DateFragmentFilterState>(state.model.id);

	const criteria = state.options.criteria;
	const selectedPeriod = state.options.selectedPeriod;

	const renderYearMonthInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateFragment.PeriodOption,
				DateFragmentFilterState.PeriodInputMap,
				"yearMonth"
			>("yearMonth", range, segment);
			const { value, error } = lens.get(criteria);

			return (
				<YearMonthSelector
					year={value.year ?? undefined}
					month={value.month ?? undefined}
					error={!!error}
					errorMessage={error}
					optionalMonthItem={{ label: localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.month) }}
					yearPlaceholder={localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.year)}
					onValueChange={(month, year) => {
						onFilterOptionsChange({
							criteria: lens.set({
								value: { month: month ?? null, year: year ?? null },
								error:
									(month === undefined) !== (year === undefined)
										? localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.error.partialYearMonth)
										: null
							})(criteria)
						});
					}}
					onYearSelectorBlur={(event) => {
						const error = getYearBlurError(
							event,
							localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.error.invalidYear)
						);

						if (!error) {
							return;
						}

						onFilterOptionsChange({
							criteria: lens.set({ value: { ...value, year: null }, error })(criteria)
						});
					}}
				/>
			);
		},
		[YearMonthSelector, criteria, localizedResource, onFilterOptionsChange, range]
	);

	const renderYearInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateFragment.PeriodOption,
				DateFragmentFilterState.PeriodInputMap,
				"year"
			>("year", range, segment);
			const { value, error } = lens.get(criteria);

			return (
				<YearSelector
					year={value ?? undefined}
					error={!!error}
					errorMessage={error}
					placeholder={localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.year)}
					onYearChange={(year) =>
						onFilterOptionsChange({
							criteria: lens.set({ value: year ?? null, error: null })(criteria)
						})
					}
					onBlur={(event) => {
						const error =
							getYearBlurError(
								event,
								localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.error.invalidYear)
							) ?? null;

						onFilterOptionsChange({
							criteria: lens.set({ value: error ? null : value, error })(criteria)
						});
					}}
				/>
			);
		},
		[criteria, localizedResource, onFilterOptionsChange, range]
	);

	const renderMonthInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateFragment.PeriodOption,
				DateFragmentFilterState.PeriodInputMap,
				"month"
			>("month", range, segment);
			const { value } = lens.get(criteria);

			return (
				<MonthSelector
					month={value ?? undefined}
					optionalItem={{ label: localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.month) }}
					onMonthChange={(month) => onFilterOptionsChange({ criteria: lens.set({ value: month ?? null })(criteria) })}
				/>
			);
		},
		[criteria, localizedResource, onFilterOptionsChange, range]
	);

	const parseDateTime = DateTimeUtils.useDateTimeParser(modelId);
	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();

	const renderMonthDayInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateFragment.PeriodOption,
				DateFragmentFilterState.PeriodInputMap,
				"monthDay"
			>("monthDay", range, segment);
			const { input, error } = lens.get(criteria);
			const sectionType = segment === "to" ? SectionType.END : SectionType.START;

			const fieldFormatString = localizedFieldFormat(path, modelId);
			const placeholderLabel = localizedResource(
				RESOURCE_KEYS.overviewEngine.filterOptionView.placeholder[sectionType]
			);

			return (
				<MonthDayInput
					id={"filter-date-fragment"}
					onValueSubmit={(newText) => {
						const { input, value, errorMessage } = parseDateTime(path, newText);
						const monthDay = value instanceof Date ? { month: value.getMonth(), day: value.getDate() } : null;

						onFilterOptionsChange({
							criteria: lens.set({ value: monthDay, error: errorMessage ?? null, input })(criteria)
						});
					}}
					value={input}
					errorMessage={error}
					placeholder={fieldFormatString ?? placeholderLabel}
					hideLabel
					label={fieldFormatString ? placeholderLabel : undefined}
				/>
			);
		},
		[criteria, localizedFieldFormat, localizedResource, modelId, onFilterOptionsChange, parseDateTime, path, range]
	);

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	const renderInput =
		selectedPeriod === "yearMonth"
			? renderYearMonthInput
			: selectedPeriod === "year"
				? renderYearInput
				: selectedPeriod === "month"
					? renderMonthInput
					: selectedPeriod === "monthDay"
						? renderMonthDayInput
						: null;

	if (!renderInput) {
		return null;
	}

	return <RangeFilterEditorTemplate overallErrorMessage={errorMessage} renderInput={renderInput} range={range} />;
});
