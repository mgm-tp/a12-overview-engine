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
import { noop, TextField, BufferedInput, HTMLInputAdapter } from "@com.mgmtp.a12.widgets/widgets-core";

import { EmptyFilter } from "../utilities/empty-filter.js";
import { useTargetModelId } from "../filter-label-resolvers.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import type { OverviewModel } from "../../../../../overview-model.js";
import { getYearBlurError } from "../utilities/year-input-validation.js";
import { useFilterSelectors } from "../../hooks/use-filter-selectors.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { SectionType } from "../../../filters/options-views/section-template.js";
import { DateTimeUtils } from "../../../filters/options-views/date-time-utils.js";
import { DateInputAdapter } from "../../../filters/options-views/date-input-adapter.js";
import { RangeFilterEditorTemplate } from "../utilities/range-filter-editor-template.js";
import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";
import { PeriodCriteria } from "../../../../../store/internal/filter-controllers/criteria.js";
import { useOverviewEngineInternalContext } from "../../../../context/overview-engine-internal-context.js";
import { DateFilterState, type SegmentOption, type DateRangeFilterState } from "../../../../../store/index.js";

const MonthDayInput = BufferedInput(HTMLInputAdapter(TextField));

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface DateRangeFilterEditorProps {
	readonly state: DateRangeFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DateRangeFilterEditor: FC<DateRangeFilterEditorProps> = memo(function DateRangeFilterEditor({ state }) {
	const { criteria, selectedRange, selectedPeriod, empty } = state.options;
	const range = selectedRange;
	const period = selectedPeriod;
	const modelId = useTargetModelId(state);
	const path = useMemo(() => ModelPath.fromString(state.fieldPath ?? ""), [state.fieldPath]);

	const onFilterOptionsChange = useDispatchFilterOptions<DateRangeFilterState>(state.model.id);
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const filterStateSelectors = useFilterSelectors();
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const generalError = useMemo(() => filterStateSelectors.toGeneralError(state), [filterStateSelectors, state]);
	const errorMessage = useMemo(
		() => (generalError ? localizedResource(generalError.key, generalError.args) : undefined),
		[generalError, localizedResource]
	);

	const YearSelector = useOverviewEngineContext((c) => c.widgetMap.YearSelector);
	const YearMonthSelector = useOverviewEngineContext((c) => c.widgetMap.YearMonthSelector);
	const MonthSelector = useOverviewEngineContext((c) => c.widgetMap.MonthSelector);

	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();
	const parseDateTime = DateTimeUtils.useDateTimeParser(modelId);

	const renderDateInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateRange.PeriodOption,
				DateRangeFilterState.PeriodInputMap,
				"date"
			>("date", range, segment);
			const inputState = lens.get(criteria);

			const onDateChange = (newState: DateFilterState.DateViewInputState) =>
				onFilterOptionsChange({ criteria: lens.set(newState)(criteria) });

			const handleDateChange = (value?: Date) => {
				if (value === undefined) {
					onDateChange(DateFilterState.DefaultDateViewInputState);
				} else {
					onDateChange({ input: DateTimeUtils.format(converter, path, value, modelId), value, error: null });
				}
			};

			const submit = (input?: string) => {
				const parsed = parseDateTime(path, input);
				onDateChange({
					input: parsed.input,
					value: parsed.value instanceof Date ? parsed.value : null,
					error: parsed.errorMessage ?? null
				});
			};

			return (
				<DateInputAdapter
					id={`${state.model.id}-date-${segment}`}
					clearHandlerRef={noop}
					error={!!inputState.error}
					errorMessage={inputState.error}
					fieldFormatString={localizedFieldFormat(path, modelId)}
					dateConverter={(input) => {
						const parsed = parseDateTime(path, input);

						return parsed.value instanceof Date ? parsed.value : undefined;
					}}
					dateFormatter={(date) => DateTimeUtils.format(converter, path, date ?? undefined, modelId)}
					enableDatePicker
					onValueSelect={(newDate) => handleDateChange(newDate ?? undefined)}
					onValueSubmit={submit}
					sectionType={segment === "to" ? SectionType.END : SectionType.START}
					value={inputState.value ?? undefined}
					key={state.resetCounter}
				/>
			);
		},
		[
			converter,
			criteria,
			localizedFieldFormat,
			modelId,
			onFilterOptionsChange,
			parseDateTime,
			path,
			range,
			state.model.id,
			state.resetCounter
		]
	);

	const renderYearInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateRange.PeriodOption,
				DateRangeFilterState.PeriodInputMap,
				"year"
			>("year", range, segment);
			const inputState = lens.get(criteria);

			return (
				<YearSelector
					year={inputState.value ?? undefined}
					error={!!inputState.error}
					errorMessage={inputState.error}
					placeholder={localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.year)}
					onYearChange={(newYear) =>
						onFilterOptionsChange({ criteria: lens.set({ value: newYear ?? null, error: null })(criteria) })
					}
					onBlur={(event) => {
						const error =
							getYearBlurError(
								event,
								localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.error.invalidYear)
							) ?? null;

						onFilterOptionsChange({
							criteria: lens.set({ value: error ? null : inputState.value, error })(criteria)
						});
					}}
				/>
			);
		},
		[YearSelector, criteria, localizedResource, onFilterOptionsChange, range]
	);

	const renderMonthInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateRange.PeriodOption,
				DateRangeFilterState.PeriodInputMap,
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
		[MonthSelector, criteria, localizedResource, onFilterOptionsChange, range]
	);

	const renderYearMonthInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateRange.PeriodOption,
				DateRangeFilterState.PeriodInputMap,
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

	const renderMonthDayInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.DateRange.PeriodOption,
				DateRangeFilterState.PeriodInputMap,
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
					id={`${state.model.id}-month-day-${segment}`}
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
		[
			criteria,
			localizedFieldFormat,
			localizedResource,
			modelId,
			onFilterOptionsChange,
			parseDateTime,
			path,
			range,
			state.model.id
		]
	);

	const renderInput = useMemo(
		() =>
			({
				date: renderDateInput,
				year: renderYearInput,
				yearMonth: renderYearMonthInput,
				month: renderMonthInput,
				monthDay: renderMonthDayInput
			})[period],
		[period, renderDateInput, renderYearInput, renderYearMonthInput, renderMonthInput, renderMonthDayInput]
	);

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	return <RangeFilterEditorTemplate overallErrorMessage={errorMessage} range={range} renderInput={renderInput} />;
});
