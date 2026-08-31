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

import { Lens as L, type Lens } from "monocle-ts";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { noop } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import {
	type RangeCriteria,
	type SegmentOption,
	DateTimeFilterState,
	type DateFilterState
} from "../../../../../store/index.js";
import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { DateInputAdapter } from "../../../filters/options-views/date-input-adapter.js";
import { useDateParser, useTimeParser } from "../../../filters/options-views/date-time-hooks.js";
import { DateTimeInputAdapter } from "../../../filters/options-views/date-time-input-adapter.js";
import { DateTimeUtils } from "../../../filters/options-views/date-time-utils.js";
import { SectionType } from "../../../filters/options-views/section-template.js";
import { useValueFormatter, useLocalizedDateTimeFormatString } from "../../../filters/utils.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { useFilterSelectors } from "../../hooks/use-filter-selectors.js";
import { TimePickerAdapter } from "../adapters/time-picker-adapter.js";
import { useTargetModelId } from "../filter-label-resolvers.js";
import { EmptyFilter } from "../utilities/empty-filter.js";
import { RangeFilterEditorTemplate } from "../utilities/range-filter-editor-template.js";
import { getYearBlurError } from "../utilities/year-input-validation.js";

function inputStateLens<P extends keyof DateTimeFilterState.Criteria>(params: {
	period: P;
	range: OverviewModel.NewFilter.RangeOption;
	segment: SegmentOption;
}) {
	const { period, range, segment } = params;

	return L.fromPath<DateTimeFilterState.Criteria>()([period, range, segment as any]) as Lens<
		DateTimeFilterState.Criteria,
		DateTimeFilterState.Criteria[P] extends RangeCriteria<infer InputState> ? InputState : never
	>;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface DateTimeFilterEditorProps {
	readonly state: DateTimeFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DateTimeFilterEditor: FC<DateTimeFilterEditorProps> = memo(function DateTimeFilterEditor({ state }) {
	const modelId = useTargetModelId(state);
	const path = useMemo(() => ModelPath.fromString(state.fieldPath ?? ""), [state.fieldPath]);

	const { empty, criteria, selectedPeriod, selectedRange } = state.options;
	const period = selectedPeriod;
	const range = selectedRange;

	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);

	const filterStateSelectors = useFilterSelectors();
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const generalError = useMemo(() => filterStateSelectors.toGeneralError(state), [filterStateSelectors, state]);
	const errorMessage = useMemo(
		() => (generalError ? localizedResource(generalError.key, generalError.args) : undefined),
		[generalError, localizedResource]
	);

	const YearSelector = useOverviewEngineContext((context) => context.widgetMap.YearSelector);
	const YearMonthSelector = useOverviewEngineContext((context) => context.widgetMap.YearMonthSelector);
	const MonthSelector = useOverviewEngineContext((context) => context.widgetMap.MonthSelector);
	const onFilterOptionsChange = useDispatchFilterOptions<DateFilterState>(state.model.id);

	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();
	const getFieldStringFormat = useLocalizedDateTimeFormatString();
	const formatValue = useValueFormatter();
	const parseDateTime = DateTimeUtils.useDateTimeParser(modelId);
	const parseTime = useTimeParser();
	const parseDate = useDateParser();

	const renderYearInput = useCallback(
		(segment: SegmentOption) => {
			const lens = inputStateLens({ period: "year", range, segment });
			const inputState = lens.get(criteria);

			return (
				<YearSelector
					year={inputState.value ?? undefined}
					error={!!inputState.error}
					errorMessage={inputState.error}
					placeholder={localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.year)}
					onYearChange={(value) =>
						onFilterOptionsChange({ criteria: lens.set({ value: value ?? null, error: null })(criteria) })
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

	const renderYearMonthInput = useCallback(
		(segment: SegmentOption) => {
			const lens = inputStateLens({ period: "yearMonth", range, segment });
			const inputState = lens.get(criteria);

			return (
				<YearMonthSelector
					year={inputState.value.year ?? undefined}
					month={inputState.value.month ?? undefined}
					error={!!inputState.error}
					errorMessage={inputState.error}
					optionalMonthItem={{ label: localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.month) }}
					yearPlaceholder={localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.year)}
					hiddenLabels={{
						yearLabel: localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.year),
						monthLabel: localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.month)
					}}
					onValueChange={(month, year) =>
						onFilterOptionsChange({
							criteria: lens.set({
								value: { month: month ?? null, year: year ?? null },
								error:
									(month === undefined) !== (year === undefined)
										? localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.error.partialYearMonth)
										: null
							})(criteria)
						})
					}
					onYearSelectorBlur={(event) => {
						const error = getYearBlurError(
							event,
							localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.error.invalidYear)
						);

						if (!error) {
							return;
						}

						onFilterOptionsChange({
							criteria: lens.set({ value: { month: inputState.value.month, year: null }, error })(criteria)
						});
					}}
				/>
			);
		},
		[YearMonthSelector, criteria, localizedResource, onFilterOptionsChange, range]
	);

	const renderDateInput = useCallback(
		(segment: SegmentOption) => {
			const lens = inputStateLens({ period: "date", range, segment });
			const inputState = lens.get(criteria);
			const sectionType = segment === "to" ? SectionType.END : SectionType.START;

			const onStateChange = (newState: DateFilterState.DateViewInputState) => {
				onFilterOptionsChange({ criteria: lens.set(newState)(criteria) });
			};

			const dateFormatter = (date: Date | undefined) => (date ? formatValue(path, date, "date", modelId) : "");
			const dateConverter = (text: string): DateTimeFilterState.DateViewInputState => {
				const { input, value = null, errorMessage } = parseDate(path, text, sectionType);

				return { value, input, error: errorMessage ?? null };
			};

			const onDateChange = (date?: Date) => {
				onStateChange(
					date === undefined
						? DateTimeFilterState.DefaultDateViewInputState
						: { input: dateFormatter(date), value: date, error: null }
				);
			};

			const baseProps = {
				id: `${modelId}-date-${segment}`,
				clearHandlerRef: noop,
				error: !!inputState.error,
				errorMessage: inputState.error ?? undefined,
				fieldFormatString:
					getFieldStringFormat(DateTimeUtils.SelectOptions.date) || localizedFieldFormat(path, modelId),
				dateConverter: (text: string) => {
					return dateConverter(text).value ?? undefined;
				},
				dateFormatter,
				enableDatePicker: true,
				onValueSelect: onDateChange,
				onValueSubmit: (text: string) => {
					onStateChange(dateConverter(text));
				},
				sectionType,
				value: inputState.value ?? undefined
			};

			return <DateInputAdapter {...baseProps} key={state.resetCounter} />;
		},
		[
			criteria,
			formatValue,
			getFieldStringFormat,
			localizedFieldFormat,
			modelId,
			onFilterOptionsChange,
			parseDate,
			path,
			range,
			state.resetCounter
		]
	);

	const renderDateTimeInput = useCallback(
		(segment: SegmentOption) => {
			const lens = inputStateLens({ period: "dateTime", range, segment });
			const inputState = lens.get(criteria);
			const sectionType = segment === "to" ? SectionType.END : SectionType.START;

			const onStateChange = (newState: DateTimeFilterState.DateTimeViewInputState) => {
				onFilterOptionsChange({ criteria: lens.set(newState)(criteria) });
			};

			const baseProps = {
				id: "datetime-filter",
				error: !!inputState.error,
				errorMessage: inputState.error ?? undefined,
				sectionType
			};

			const dateTimeConverter = (text: string): DateTimeFilterState.DateTimeViewInputState => {
				const { input, value = null, errorMessage } = parseDateTime(path, text);

				return { value, input, error: errorMessage ?? null };
			};

			const dateTimeFormatter = (dateTime: Date | undefined) =>
				dateTime ? formatValue(path, dateTime, "dateTime", modelId) : "";

			const dateTimeInputAdapterProps: Omit<DateTimeInputAdapter.Props, "id"> = {
				value: inputState.value ?? undefined,
				sectionType,
				dateTimeFormatter,
				clearHandlerRef: noop,
				onValueSubmit: (newText) => onStateChange(dateTimeConverter(newText)),
				getLocalizedDateString: (date) => DateTimeUtils.formatAsDate(converter, path, date, modelId),
				fieldFormatString: localizedFieldFormat(path, modelId),
				dateTimeConverter: (text) => dateTimeConverter(text).value ?? undefined
			};

			return <DateTimeInputAdapter {...baseProps} {...dateTimeInputAdapterProps} key={state.resetCounter} />;
		},
		[
			converter,
			criteria,
			formatValue,
			localizedFieldFormat,
			modelId,
			onFilterOptionsChange,
			parseDateTime,
			path,
			range,
			state.resetCounter
		]
	);

	const padTime = useCallback((value: Date | undefined) => DateTimeUtils.padToday(value, timezone), [timezone]);
	const renderTimeInput = useCallback(
		(segment: SegmentOption) => {
			const lens = inputStateLens({ period: "time", range, segment });
			const inputState = lens.get(criteria);

			const onStateChange = (newState: DateTimeFilterState.TimeViewInputState) =>
				onFilterOptionsChange({ criteria: lens.set(newState)(criteria) });

			const timeFormatter = (time: Date | undefined) => (time ? formatValue(path, time, "time", modelId) : "");
			const timeConverter = (timeString: string): DateTimeFilterState.TimeViewInputState => {
				const { input, errorMessage, value = null } = parseTime(path, timeString);

				return { value, input, error: errorMessage ?? null };
			};

			return (
				<TimePickerAdapter
					key={state.resetCounter}
					value={inputState.value ?? undefined}
					errorMessage={inputState.error ?? undefined}
					onDateChange={(newValue) => {
						const paddedValue = padTime(newValue ?? undefined);

						onStateChange(
							paddedValue === undefined
								? DateTimeFilterState.DefaultTimeViewInputState
								: { value: paddedValue, input: timeFormatter(paddedValue), error: null }
						);
					}}
					onValidate={(text) => onStateChange(timeConverter(text))}
					timeFormatter={timeFormatter}
					timeConverter={(text) => timeConverter(text).value ?? undefined}
					fieldFormatString={
						getFieldStringFormat(DateTimeUtils.SelectOptions.time) || localizedFieldFormat(path, modelId)
					}
				/>
			);
		},
		[
			criteria,
			formatValue,
			getFieldStringFormat,
			localizedFieldFormat,
			modelId,
			onFilterOptionsChange,
			padTime,
			parseTime,
			path,
			range,
			state.resetCounter
		]
	);

	const renderMonthInput = useCallback(
		(segment: SegmentOption) => {
			const lens = inputStateLens({ period: "month", range, segment });
			const inputState = lens.get(criteria);

			return (
				<MonthSelector
					month={inputState.value ?? undefined}
					optionalItem={{ label: localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.month) }}
					onMonthChange={(month) => onFilterOptionsChange({ criteria: lens.set({ value: month ?? null })(criteria) })}
				/>
			);
		},
		[MonthSelector, criteria, localizedResource, onFilterOptionsChange, range]
	);

	const renderInput = {
		year: renderYearInput,
		yearMonth: renderYearMonthInput,
		month: renderMonthInput,
		date: renderDateInput,
		dateTime: renderDateTimeInput,
		time: renderTimeInput
	}[period];

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	return <RangeFilterEditorTemplate overallErrorMessage={errorMessage} renderInput={renderInput} range={range} />;
});
