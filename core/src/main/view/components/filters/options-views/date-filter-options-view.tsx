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

import { TimeUtils, type YearRange } from "@com.mgmtp.a12.widgets/widgets-core";

import { useIdGenerator } from "../../../utils.js";
import { UiStateSelector } from "../../../../store/index.js";
import { type FilterOptionsView } from "../filter-options-view.js";
import { LocalizerHooks } from "../../../../services/localization/index.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { DateTimeUtils } from "./date-time-utils.js";
import { DateInputAdapter } from "./date-input-adapter.js";
import { SectionType, SectionTemplate } from "./section-template.js";
import {
	type DateTimeViewValue,
	type DateTimeUiValueType,
	type DateTimeViewSelection
} from "./date-time-filter-view.api.js";
import {
	useSelectItems,
	useValueSelect,
	useDateFormatter,
	useLocalizedLabels,
	useClearHandlerRegistry,
	useOnYearMonthValueChange,
	useDateTimeCommonParameters
} from "./date-time-common-hooks.js";

export namespace DateFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		readonly initialDate?: Date;
		readonly readonly?: boolean;
		readonly yearRange?: YearRange;
		readonly enableDatePicker?: boolean;
		readonly uiValue: DateTimeUiValueType;
	}
}

/** @internal */
export const DateFilterOptionsView: React.FC<DateFilterOptionsView.Props> = React.memo(
	function DateFilterOptionsView(props) {
		const wrapperRef = React.useRef<HTMLElement | null>(null);
		const { uiValue, onChange, viewName, ariaLevel, hideEmptyValueOption } = props;
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);

		const triggerChange = React.useCallback(
			(dateTimeViewValue: DateTimeViewValue, selectedView: DateTimeViewSelection = uiValue.selected) => {
				const newUiValue: DateTimeUiValueType = {
					selected: selectedView,
					valueMap: { ...uiValue.valueMap, [selectedView]: dateTimeViewValue }
				};

				onChange?.(
					DateTimeUtils.convertToFilterOptions(dateTimeViewValue, "Date", undefined, selectedView, props.modelId),
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
				<DateFilterInput
					{...props}
					triggerChange={triggerChange}
					sectionType={sectionType}
					clearHandlerRef={clearHandlerRegistry.createRef(sectionType)}
				/>
			),
			[clearHandlerRegistry, props, triggerChange]
		);
		const isEmptySelection = uiValue.selected === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE;

		return (
			<FilterSelectorTemplateContent
				headingElements={headingElements}
				subActionBar={useSubActionBar(uiValue, triggerChange, handleClearAll, isInputEmpty, hideEmptyValueOption)}
				wrapperRef={(ref) => {
					wrapperRef.current = ref;
				}}
				padding={false}>
				{!isEmptySelection && <SectionTemplate errorMessage={rangeErrorMessage} sectionRenderer={sectionRenderer} />}
			</FilterSelectorTemplateContent>
		);
	}
);

function useSubActionBar(
	uiValue: DateTimeUiValueType,
	triggerChange: (dateTimeViewValue: DateTimeViewValue, selectedView?: DateTimeViewSelection) => void,
	onClear: (event: React.MouseEvent<HTMLElement>) => void,
	isInputEmpty: boolean,
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
	const dateModeSelector = React.useMemo(
		() => (
			<DateModeSelector triggerChange={triggerChange} uiValue={uiValue} hideEmptyValueOption={hideEmptyValueOption} />
		),
		[hideEmptyValueOption, triggerChange, uiValue]
	);

	if (smallView) {
		return (
			<SubActionBar>
				<FilterSelectorTemplateActionBar>{dateModeSelector}</FilterSelectorTemplateActionBar>
			</SubActionBar>
		);
	}

	return (
		<SubActionBar>
			<FilterSelectorContentHeader
				clearButtonLabel={clearAllLabel}
				onClear={onClear}
				clearButtonDisabled={disabled || isInputEmpty}
				actionBarElements={dateModeSelector}
			/>
		</SubActionBar>
	);
}

namespace DateModeSelector {
	export interface Props {
		readonly uiValue: DateTimeUiValueType;
		readonly triggerChange: (dateTimeViewValue: DateTimeViewValue, selectedView?: DateTimeViewSelection) => void;
		readonly hideEmptyValueOption?: boolean;
	}
}

const DateModeSelector: React.FC<DateModeSelector.Props> = React.memo(function DateModeSelector(props) {
	const { uiValue, triggerChange, hideEmptyValueOption } = props;
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const Select = useOverviewEngineContext((context) => context.widgetMap.Select);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);

	const onViewChange = React.useCallback(
		(selectedView: string): void => {
			if (selectedView === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE && hideEmptyValueOption) {
				return;
			}

			if (
				selectedView === DateTimeUtils.SelectOptions.date ||
				selectedView === DateTimeUtils.SelectOptions.monthYear ||
				selectedView === DateTimeUtils.SelectOptions.year
			) {
				const [startValue, endValue] = [SectionType.START, SectionType.END].map((sectionType) => {
					let filterValue = uiValue.valueMap[selectedView][sectionType].value;

					if (selectedView === DateTimeUtils.SelectOptions.date) {
						return filterValue;
					}

					filterValue = TimeUtils.convertTimezoneDateToUTC(
						filterValue ?? TimeUtils.getTimeWithTimezone(new Date(), timezone),
						timezone
					);

					return TimeUtils.convertUTCToTimezoneDate(
						DateTimeUtils.padValue(sectionType, selectedView, filterValue) || undefined,
						timezone
					);
				});

				triggerChange(
					DateTimeUtils.convertToDateTimeViewValue(
						{ ...uiValue.valueMap[selectedView].start, value: startValue },
						{ ...uiValue.valueMap[selectedView].end, value: endValue }
					),
					selectedView
				);
			}

			if (selectedView === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE) {
				triggerChange(
					{
						...DateTimeUtils.convertToDateTimeViewValue(
							uiValue.valueMap[DateTimeUtils.SelectOptions.date].start, // use date values for empty selection
							uiValue.valueMap[DateTimeUtils.SelectOptions.date].end // use date values for empty selection
						),
						undefinedMatch: true
					},
					selectedView
				);
			}
		},
		[hideEmptyValueOption, timezone, triggerChange, uiValue.valueMap]
	);

	const { selectLabel } = useLocalizedLabels();
	const generateId = useIdGenerator();
	const id = React.useMemo(() => generateId({ id: "filter-option-date-mode" }), [generateId]);
	const selectableViews = React.useMemo(() => {
		const base: DateTimeViewSelection[] = [
			DateTimeUtils.SelectOptions.date,
			DateTimeUtils.SelectOptions.monthYear,
			DateTimeUtils.SelectOptions.year
		];

		return hideEmptyValueOption ? base : [DateTimeUtils.EMPTY_SELECT_OPTION_VALUE, ...base];
	}, [hideEmptyValueOption]);
	const items = useSelectItems(selectableViews);

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

namespace DateFilterInput {
	export interface Props extends DateFilterOptionsView.Props {
		readonly sectionType: SectionType;
		readonly triggerChange: (dateTimeViewValue: DateTimeViewValue, selectedView?: DateTimeViewSelection) => void;
		readonly clearHandlerRef: (clearHandler: () => void) => void;
	}
}

const DateFilterInput: React.FC<DateFilterInput.Props> = React.memo(function DateFilterInput(props) {
	const {
		readonly,
		yearRange,
		sectionType,
		uiValue,
		initialDate,
		enableDatePicker,
		path,
		triggerChange,
		clearHandlerRef
	} = props;
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const YearMonthSelector = useOverviewEngineContext((context) => context.widgetMap.YearMonthSelector);
	const YearSelector = useOverviewEngineContext((context) => context.widgetMap.YearSelector);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);
	const { yearLabel, monthLabel } = useLocalizedLabels(sectionType);
	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();

	const { currentDate, currentView, currentViewValue } = React.useMemo(() => {
		const currentView = uiValue.selected;

		return {
			currentView,
			currentViewValue: uiValue.valueMap[currentView],
			currentDate: uiValue.valueMap[currentView][sectionType].value ?? initialDate
		};
	}, [initialDate, sectionType, uiValue.selected, uiValue.valueMap]);

	// Handlers
	const parseDateTime = DateTimeUtils.useDateTimeParser(props.modelId);
	const onValueSubmit = React.useCallback(
		(newText?: string) => triggerChange({ ...currentViewValue, [sectionType]: parseDateTime(path, newText) }),
		[currentViewValue, parseDateTime, path, triggerChange, sectionType]
	);

	const onValueSelect = useValueSelect(
		triggerChange,
		path,
		currentView,
		currentViewValue,
		sectionType,
		false,
		props.modelId
	);
	const { onYearMonthValueChange } = useOnYearMonthValueChange(onValueSelect, currentDate);

	// Props
	const generateId = useIdGenerator();
	const baseProps = React.useMemo(
		() => ({
			id: generateId({ id: "date-filter", suffix: sectionType }),
			disabled,
			readonly,
			error: DateTimeUtils.isNotValidRange(currentViewValue),
			errorMessage: currentViewValue[sectionType].errorMessage,
			yearRange,
			fieldFormatString: localizedFieldFormat(path, props.modelId)
		}),
		[
			currentViewValue,
			disabled,
			generateId,
			localizedFieldFormat,
			path,
			props.modelId,
			readonly,
			sectionType,
			yearRange
		]
	);

	const dateFormatter = useDateFormatter(path, currentView, sectionType, false, props.modelId);
	const dateParser = DateTimeUtils.useDateTimeParser(props.modelId);
	const dateInputAdapterProps: Omit<DateInputAdapter.Props, "id" | "yearRange" | "readonly"> = React.useMemo(() => {
		return {
			clearHandlerRef,
			dateConverter: (input) => dateParser(path, input)?.value ?? undefined,
			dateFormatter,
			enableDatePicker,
			onValueSelect,
			onValueSubmit,
			sectionType,
			value: currentDate
		};
	}, [
		clearHandlerRef,
		currentDate,
		dateFormatter,
		dateParser,
		enableDatePicker,
		onValueSelect,
		onValueSubmit,
		path,
		sectionType
	]);

	if (currentView === DateTimeUtils.SelectOptions.date) {
		return <DateInputAdapter {...baseProps} {...dateInputAdapterProps} />;
	}

	if (currentView === DateTimeUtils.SelectOptions.monthYear) {
		return (
			<YearMonthSelector
				{...baseProps}
				label=""
				month={DateTimeUtils.getTimezoneDateUnit(currentDate, timezone, "month")}
				year={DateTimeUtils.getTimezoneDateUnit(currentDate, timezone, "year")}
				hiddenLabels={{ yearLabel, monthLabel }}
				onValueChange={onYearMonthValueChange}
			/>
		);
	}

	if (currentView === DateTimeUtils.SelectOptions.year) {
		return (
			<YearSelector
				{...baseProps}
				year={DateTimeUtils.getTimezoneDateUnit(currentDate, timezone, "year")}
				onYearChange={(year) =>
					onValueSelect(
						DateTimeUtils.padYearAndMonth(year, DateTimeUtils.isStartSection(sectionType) ? 0 : 11, timezone)
					)
				}
			/>
		);
	}

	return <></>;
});
