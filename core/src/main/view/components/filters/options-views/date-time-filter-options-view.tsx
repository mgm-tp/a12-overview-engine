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
import { endOfYear, endOfMonth, startOfYear, startOfMonth } from "date-fns";

import { TimeUtils, type YearRange, type TimePickerProps } from "@com.mgmtp.a12.widgets/widgets-core";

import { useIdGenerator } from "../../../utils.js";
import { UiStateSelector } from "../../../../store/index.js";
import { type FilterOptionsView } from "../filter-options-view.js";
import { LocalizerHooks } from "../../../../services/localization/index.js";
import { useValueFormatter, useLocalizedDateTimeFormatString } from "../utils.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { DateTimeUtils } from "./date-time-utils.js";
import { DateInputAdapter } from "./date-input-adapter.js";
import { TimePickerAdapter } from "./time-picker-adapter.js";
import { DateTimeInputAdapter } from "./date-time-input-adapter.js";
import { SectionType, SectionTemplate } from "./section-template.js";
import {
	type DateTimeViewValue,
	type DateTimeUiValueType,
	type DateTimeViewSelection
} from "./date-time-filter-view.api.js";
import {
	useSelectItems,
	useValueSelect,
	useLocalizedLabels,
	useClearHandlerRegistry,
	useOnYearMonthValueChange,
	useDateTimeCommonParameters
} from "./date-time-common-hooks.js";

export namespace DateTimeFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		readonly initialDate?: Date;
		readonly readonly?: boolean;
		readonly enableDatePicker?: boolean;
		readonly enableTimePicker?: boolean;
		readonly yearRange?: YearRange;
		readonly timeMode?: TimePickerProps.ClockMode;
		readonly uiValue: DateTimeUiValueType;
	}
}

/** @internal */
export const DateTimeFilterOptionsView: React.FC<DateTimeFilterOptionsView.Props> = React.memo(
	function DateTimeFilterOptionsView(props) {
		const { uiValue, viewName, ariaLevel, onChange, hideEmptyValueOption } = props;
		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);

		const triggerChange = React.useCallback(
			(dateTimeViewValue: DateTimeViewValue, selectedView = uiValue.selected) => {
				const newUiValue: DateTimeUiValueType = {
					selected: selectedView,
					valueMap: { ...uiValue.valueMap, [selectedView]: dateTimeViewValue },
					undefinedMatch: selectedView === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE
				};
				onChange?.(
					DateTimeUtils.convertToFilterOptions(dateTimeViewValue, "DateTime", undefined, selectedView, props.modelId),
					newUiValue
				);
			},
			[onChange, props.modelId, uiValue.selected, uiValue.valueMap]
		);

		const { isInputEmpty, headingElements, rangeErrorMessage, onClearButtonClick } = useDateTimeCommonParameters(
			uiValue.valueMap[uiValue.selected],
			triggerChange,
			viewName,
			wrapperRef.current,
			ariaLevel
		);
		const clearHandlerRegistry = useClearHandlerRegistry();

		const handleClearAll = React.useCallback(
			(event: React.MouseEvent<HTMLElement>) => {
				clearHandlerRegistry.clear();
				onClearButtonClick(event);
			},
			[clearHandlerRegistry, onClearButtonClick]
		);

		const sectionRenderer = React.useCallback(
			(sectionType: SectionType) => (
				<DateTimeFilterInput
					{...props}
					sectionType={sectionType}
					triggerChange={triggerChange}
					clearHandlerRef={clearHandlerRegistry.createRef(sectionType)}
				/>
			),
			[clearHandlerRegistry, props, triggerChange]
		);

		const isEmptySelection = uiValue.selected === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE;
		const isUndefinedMatch = !!uiValue.undefinedMatch;

		return (
			<FilterSelectorTemplateContent
				headingElements={headingElements}
				subActionBar={useSubActionBar(uiValue, isInputEmpty, handleClearAll, triggerChange, hideEmptyValueOption)}
				wrapperRef={(ref) => {
					wrapperRef.current = ref;
				}}
				padding={false}>
				{(!isEmptySelection || !isUndefinedMatch) && (
					<SectionTemplate errorMessage={rangeErrorMessage} sectionRenderer={sectionRenderer} />
				)}
			</FilterSelectorTemplateContent>
		);
	}
);

namespace DateTimeFilterInput {
	export interface Props extends DateTimeFilterOptionsView.Props {
		readonly sectionType: SectionType;
		readonly triggerChange: (dateTimeViewValue: DateTimeViewValue) => void;
		readonly clearHandlerRef: (clearHandler: () => void) => void;
	}
}

const DateTimeFilterInput: React.FC<DateTimeFilterInput.Props> = React.memo(function DateTimeFilterInput(props) {
	const {
		sectionType,
		clearHandlerRef,
		readonly,
		uiValue,
		initialDate,
		path,
		triggerChange,
		yearRange,
		enableDatePicker,
		modelId
	} = props;

	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const YearMonthSelector = useOverviewEngineContext((context) => context.widgetMap.YearMonthSelector);
	const YearSelector = useOverviewEngineContext((context) => context.widgetMap.YearSelector);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const engineTimeMode = useOverviewEngineContext((context) => context.timeMode);
	const getFieldStringFormat = useLocalizedDateTimeFormatString();
	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();

	const timeMode = React.useMemo(() => props.timeMode ?? engineTimeMode, [engineTimeMode, props.timeMode]);

	const { currentDate, currentView, currentViewValue } = React.useMemo(() => {
		const currentView = uiValue.selected;
		const currentViewValue = uiValue.valueMap[currentView];

		let date = currentViewValue[sectionType].value ?? initialDate;

		if (currentView === DateTimeUtils.SelectOptions.monthYear || currentView === DateTimeUtils.SelectOptions.year) {
			date = date ? TimeUtils.convertTimezoneDateToUTC(date, timezone) : new Date();
		}

		return { currentDate: date, currentView, currentViewValue };
	}, [uiValue.selected, uiValue.valueMap, sectionType, initialDate, timezone]);

	const onValueSelect = useValueSelect(triggerChange, path, currentView, currentViewValue, sectionType, true, modelId);
	const { onYearMonthValueChange } = useOnYearMonthValueChange(onValueSelect, currentDate);
	const { yearLabel, monthLabel } = useLocalizedLabels(sectionType);
	const generateId = useIdGenerator();
	const baseProps = React.useMemo(
		() => ({
			id: generateId({ id: "datetime-filter", suffix: sectionType }),
			readonly,
			disabled,
			error: DateTimeUtils.isNotValidRange(currentViewValue),
			errorMessage: currentViewValue[sectionType].errorMessage,
			sectionType
		}),
		[generateId, sectionType, readonly, disabled, currentViewValue]
	);

	const formatValue = useValueFormatter();
	const dateTimeFormatter = React.useCallback(
		(dateTime: Date | undefined) => (dateTime ? formatValue(path, dateTime, currentView, modelId) : ""),
		[formatValue, path, currentView, modelId]
	);

	const parseDateTime = DateTimeUtils.useDateTimeParser(modelId);
	const parseDate = DateTimeUtils.useDateParser();
	const parseTime = DateTimeUtils.useTimeParser();
	const parseValue = React.useCallback(
		(newText: string): DateTimeUiValueType.InputState => {
			switch (uiValue.selected) {
				case "date":
					return parseDate(path, newText, sectionType);
				case "time":
					return parseTime(path, newText);
				default:
					return parseDateTime(path, newText);
			}
		},
		[parseDate, parseDateTime, parseTime, path, sectionType, uiValue.selected]
	);
	const onValueSubmit = React.useCallback(
		(newText: string) => {
			triggerChange({ ...currentViewValue, [sectionType]: parseValue(newText) });
		},
		[triggerChange, currentViewValue, sectionType, parseValue]
	);

	const dateTimeInputAdapterProps: Omit<DateTimeInputAdapter.Props, "id"> = React.useMemo(() => {
		return {
			value: currentDate,
			sectionType,
			onValueSubmit,
			timeMode,
			getLocalizedDateString: (date?: Date) => DateTimeUtils.formatAsDate(converter, path, date, modelId),
			clearHandlerRef,
			dateTimeFormatter,
			fieldFormatString: localizedFieldFormat(path, props.modelId),
			dateTimeConverter: (input: string) => parseValue(input)?.value ?? undefined
		};
	}, [
		currentDate,
		sectionType,
		onValueSubmit,
		timeMode,
		clearHandlerRef,
		dateTimeFormatter,
		localizedFieldFormat,
		path,
		props.modelId,
		converter,
		modelId,
		parseValue
	]);

	const dateInputAdapterProps: Omit<DateInputAdapter.Props, "id" | "isDateRange" | "readonly"> = React.useMemo(() => {
		return {
			yearRange,
			sectionType,
			value: currentDate,
			onValueSelect,
			onValueSubmit,
			fieldFormatString:
				getFieldStringFormat(DateTimeUtils.SelectOptions.date) || localizedFieldFormat(path, props.modelId),
			dateFormatter: dateTimeFormatter,
			dateConverter: (input) => parseValue(input)?.value ?? undefined,
			clearHandlerRef
		};
	}, [
		yearRange,
		sectionType,
		currentDate,
		onValueSelect,
		onValueSubmit,
		getFieldStringFormat,
		localizedFieldFormat,
		path,
		props.modelId,
		dateTimeFormatter,
		clearHandlerRef,
		parseValue
	]);

	const timePickerAdapterProps: Pick<TimePickerAdapter.Props, "timeConverter" | "timeFormatter" | "onValidate"> =
		React.useMemo(() => {
			return {
				timeConverter: (input: string) => parseValue(input)?.value ?? undefined,
				timeFormatter: dateTimeFormatter,
				onValidate: onValueSubmit,
				fieldFormatString:
					getFieldStringFormat(DateTimeUtils.SelectOptions.time) || localizedFieldFormat(path, props.modelId)
			};
		}, [dateTimeFormatter, getFieldStringFormat, localizedFieldFormat, onValueSubmit, parseValue, path, props.modelId]);

	if (currentView === DateTimeUtils.SelectOptions.dateTime) {
		return <DateTimeInputAdapter {...baseProps} {...dateTimeInputAdapterProps} enableDatePicker={enableDatePicker} />;
	}

	if (currentView === DateTimeUtils.SelectOptions.date) {
		return <DateInputAdapter {...baseProps} {...dateInputAdapterProps} enableDatePicker={enableDatePicker} />;
	}

	if (currentView === DateTimeUtils.SelectOptions.time) {
		return (
			<TimePickerAdapter
				{...props}
				{...baseProps}
				{...dateTimeInputAdapterProps}
				{...timePickerAdapterProps}
				isDateTime
				value={dateTimeInputAdapterProps.value}
				uiValue={currentViewValue}
			/>
		);
	}

	if (currentView === DateTimeUtils.SelectOptions.monthYear) {
		return (
			<YearMonthSelector
				{...baseProps}
				label=""
				hiddenLabels={{ yearLabel, monthLabel }}
				month={currentDate?.getUTCMonth() ?? new Date().getUTCMonth()}
				year={currentDate?.getUTCFullYear() ?? new Date().getUTCFullYear()}
				yearRange={yearRange}
				onValueChange={onYearMonthValueChange}
			/>
		);
	}

	if (currentView === DateTimeUtils.SelectOptions.year) {
		return (
			<YearSelector
				{...baseProps}
				hideLabel
				year={currentDate?.getUTCFullYear()}
				yearRange={yearRange}
				onYearChange={(year) => onValueSelect(DateTimeUtils.padYearAndMonth(year, undefined, timezone))}
			/>
		);
	}

	return <></>;
});

namespace DateTimeModeSelector {
	export interface Props {
		readonly uiValue: DateTimeUiValueType;
		readonly triggerChange: (dateTimeViewValue: DateTimeViewValue, selectedView?: DateTimeViewSelection) => void;
		readonly hideEmptyValueOption?: boolean;
	}
}

const DateTimeModeSelector: React.FC<DateTimeModeSelector.Props> = React.memo(function DateTimeModeSelector(props) {
	const { uiValue, triggerChange, hideEmptyValueOption } = props;
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const Select = useOverviewEngineContext((context) => context.widgetMap.Select);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);

	const { selectLabel } = useLocalizedLabels();
	const selectableViews = React.useMemo(() => {
		const base: DateTimeViewSelection[] = [
			DateTimeUtils.SelectOptions.dateTime,
			DateTimeUtils.SelectOptions.date,
			DateTimeUtils.SelectOptions.time,
			DateTimeUtils.SelectOptions.monthYear,
			DateTimeUtils.SelectOptions.year
		];

		return hideEmptyValueOption ? base : [DateTimeUtils.EMPTY_SELECT_OPTION_VALUE, ...base];
	}, [hideEmptyValueOption]);
	const items = useSelectItems(selectableViews);

	const onViewChange = React.useCallback(
		(selectedView: string): void => {
			if (selectedView === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE && hideEmptyValueOption) {
				return;
			}

			if (!DateTimeUtils.isSelectOptionsInstance(selectedView)) {
				throw new Error("Invalid view selection. Got: " + selectedView);
			}

			if (selectedView === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE) {
				triggerChange(
					{
						...DateTimeUtils.convertToDateTimeViewValue(
							uiValue.valueMap[DateTimeUtils.SelectOptions.dateTime].start, // use date time values for empty selection
							uiValue.valueMap[DateTimeUtils.SelectOptions.dateTime].end // use date time values for empty selection
						),
						undefinedMatch: true
					},
					selectedView
				);

				return;
			}

			const [startValue, endValue] = [SectionType.START, SectionType.END].map((sectionType) => {
				let filterValue = uiValue.valueMap[selectedView][sectionType].value;

				if (selectedView === DateTimeUtils.SelectOptions.date || selectedView === DateTimeUtils.SelectOptions.time) {
					return DateTimeUtils.padValue(sectionType, selectedView, filterValue, true, timezone);
				}

				if (DateTimeUtils.isYearMonthSelect(selectedView)) {
					filterValue = filterValue ? TimeUtils.convertTimezoneDateToUTC(filterValue, timezone) : new Date();

					if (!filterValue) {
						return;
					}

					const isYear = DateTimeUtils.isYearSelect(selectedView);
					const dateUTC = DateTimeUtils.isStartSection(sectionType)
						? isYear
							? startOfYear(filterValue)
							: startOfMonth(filterValue)
						: isYear
							? endOfYear(filterValue)
							: endOfMonth(filterValue);

					return TimeUtils.convertUTCToTimezoneDate(dateUTC, timezone);
				}

				return filterValue;
			});
			// Keep UI value so all validation errors are not lost
			triggerChange(
				DateTimeUtils.convertToDateTimeViewValue(
					{ ...uiValue.valueMap[selectedView].start, value: startValue },
					{ ...uiValue.valueMap[selectedView].end, value: endValue }
				),
				selectedView
			);
		},
		[hideEmptyValueOption, timezone, triggerChange, uiValue.valueMap]
	);

	const generateId = useIdGenerator();
	const id = React.useMemo(() => generateId({ id: "filter-option-date-time-mode" }), [generateId]);

	return (
		<Select
			id={id}
			label={selectLabel}
			hideLabel={true}
			value={uiValue.selected}
			onValueChanged={onViewChange}
			disabled={disabled}
			items={items}
		/>
	);
});

function useSubActionBar(
	uiValue: DateTimeUiValueType,
	isInputEmpty: boolean,
	onClear: (event: React.MouseEvent<HTMLElement>) => void,
	triggerChange: (dateTimeViewValue: DateTimeViewValue, selectedView?: DateTimeViewSelection) => void,
	hideEmptyValueOption?: boolean
) {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const SubActionBar = useOverviewEngineContext((context) => context.widgetMap.SubActionBar);
	const FilterSelectorTemplateActionBar = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateActionBar
	);
	const FilterSelectorContentHeader = useOverviewEngineContext(
		(context) => context.componentMap.FilterSelectorContentHeader
	);

	const { clearAllLabel } = useLocalizedLabels();
	const dateTimeModeSelector = React.useMemo(
		() => (
			<DateTimeModeSelector
				uiValue={uiValue}
				triggerChange={triggerChange}
				hideEmptyValueOption={hideEmptyValueOption}
			/>
		),
		[hideEmptyValueOption, triggerChange, uiValue]
	);

	if (smallView) {
		return (
			<SubActionBar>
				<FilterSelectorTemplateActionBar>{dateTimeModeSelector}</FilterSelectorTemplateActionBar>
			</SubActionBar>
		);
	}

	return (
		<SubActionBar>
			<FilterSelectorContentHeader
				clearButtonLabel={clearAllLabel}
				onClear={onClear}
				actionBarElements={dateTimeModeSelector}
				clearButtonDisabled={disabled || isInputEmpty}
			/>
		</SubActionBar>
	);
}
