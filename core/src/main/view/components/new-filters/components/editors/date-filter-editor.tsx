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

import { memo, type FC, useMemo, useContext, useCallback } from "react";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { noop } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { DateFilterState } from "../../../../../store/index.js";
import type { SegmentOption } from "../../../../../store/index.js";
import { PeriodCriteria } from "../../../../../store/internal/filter-controllers/criteria.js";
import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { DateInputAdapter } from "../../../filters/options-views/date-input-adapter.js";
import { DateTimeUtils } from "../../../filters/options-views/date-time-utils.js";
import { SectionType } from "../../../filters/options-views/section-template.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { useFilterSelectors } from "../../hooks/use-filter-selectors.js";
import { EmptyFilter } from "../utilities/empty-filter.js";
import { RangeFilterEditorTemplate } from "../utilities/range-filter-editor-template.js";
import { getYearBlurError } from "../utilities/year-input-validation.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface DateFilterEditorProps {
	readonly state: DateFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DateFilterEditor: FC<DateFilterEditorProps> = memo(function DateFilterEditor({ state }) {
	const { criteria, selectedRange, selectedPeriod, empty } = state.options;
	const range = selectedRange;
	const period = selectedPeriod;

	const onFilterOptionsChange = useDispatchFilterOptions<DateFilterState>(state.model.id);
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const { localizer } = useContext(LocalizerContext);
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
	const path = useMemo(() => ModelPath.fromString(state.fieldPath ?? ""), [state.fieldPath]);

	const parseInput = useCallback(
		(input: string): DateFilterState.DateViewInputState => {
			if (!input) {
				return DateFilterState.DefaultDateViewInputState;
			}

			const parsedValue = converter.parseValue(path, input, undefined, state.model.options.subModel);

			if (parsedValue.error) {
				return { input, value: null, error: localizer(...parsedValue.error) ?? null };
			}

			const dateValue = parsedValue.value as Date;
			const formattedInput = converter.formatValue(path, dateValue, undefined, state.model.options.subModel);

			return { input: formattedInput, value: dateValue, error: null };
		},
		[converter, localizer, path, state.model.options.subModel]
	);

	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();

	const renderDateInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.Date.PeriodOption,
				DateFilterState.DatePeriodInputMap,
				"date"
			>("date", range, segment);
			const inputState = lens.get(criteria);

			const onDateChange = (newState: DateFilterState.DateViewInputState) =>
				onFilterOptionsChange({ criteria: lens.set(newState)(criteria) });

			const handleDateChange = (value?: Date) => {
				if (value === undefined) {
					onDateChange(DateFilterState.DefaultDateViewInputState);
				} else {
					onDateChange({
						input: DateTimeUtils.format(converter, path, value, state.model.options.subModel),
						value,
						error: null
					});
				}
			};

			const baseProps = {
				id: `${state.model.id}-date-${segment}`,
				clearHandlerRef: noop,
				error: !!inputState.error,
				errorMessage: inputState.error,
				fieldFormatString: localizedFieldFormat(path, state.model.options.subModel),
				dateConverter: (input: string) => parseInput(input).value ?? undefined,
				dateFormatter: (date: Date | null | undefined) =>
					DateTimeUtils.format(converter, path, date ?? undefined, state.model.options.subModel),
				enableDatePicker: true,
				onValueSelect: (newDate: Date | undefined) => handleDateChange(newDate ?? undefined),
				onValueSubmit: (input: string) => onDateChange(parseInput(input)),
				sectionType: segment === "exact" ? SectionType.START : segment === "from" ? SectionType.START : SectionType.END,
				value: inputState.value ?? undefined
			};

			return <DateInputAdapter {...baseProps} key={state.resetCounter} />;
		},
		[
			converter,
			criteria,
			localizedFieldFormat,
			onFilterOptionsChange,
			parseInput,
			path,
			range,
			state.model.id,
			state.model.options.subModel,
			state.resetCounter
		]
	);

	const renderYearInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.Date.PeriodOption,
				DateFilterState.DatePeriodInputMap,
				"year"
			>("year", range, segment);
			const inputState = lens.get(criteria);

			return (
				<YearSelector
					year={inputState.value ?? undefined}
					error={!!inputState.error}
					errorMessage={inputState.error ?? undefined}
					placeholder={localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.fieldLabel.year)}
					onYearChange={(newYear) => {
						onFilterOptionsChange({ criteria: lens.set({ value: newYear ?? null, error: null })(criteria) });
					}}
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
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.Date.PeriodOption,
				DateFilterState.DatePeriodInputMap,
				"yearMonth"
			>("yearMonth", range, segment);
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
							criteria: lens.set({ value: { month: inputState.value.month, year: null }, error })(criteria)
						});
					}}
				/>
			);
		},
		[YearMonthSelector, criteria, localizedResource, onFilterOptionsChange, range]
	);

	const renderMonthInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<
				OverviewModel.NewFilter.Date.PeriodOption,
				DateFilterState.DatePeriodInputMap,
				"month"
			>("month", range, segment);
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

	const renderInput = useMemo(
		() =>
			({
				date: renderDateInput,
				year: renderYearInput,
				yearMonth: renderYearMonthInput,
				month: renderMonthInput
			})[period],
		[period, renderDateInput, renderYearInput, renderYearMonthInput, renderMonthInput]
	);

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	return <RangeFilterEditorTemplate overallErrorMessage={errorMessage} range={range} renderInput={renderInput} />;
});
