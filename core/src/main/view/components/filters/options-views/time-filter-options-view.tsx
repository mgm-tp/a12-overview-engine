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

import { useIdGenerator } from "../../../utils.js";
import type { FilterOptionsView } from "../filter-options-view.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";

import { DateTimeUtils } from "./date-time-utils.js";
import { TimePickerAdapter } from "./time-picker-adapter.js";
import type { DateTimeViewValue } from "./date-time-filter-view.api.js";
import { SectionTemplate, type SectionType } from "./section-template.js";
import {
	useRangeErrorMessage,
	useClearHandlerRegistry,
	useDateTimeSubActionBar,
	useDateTimeCommonParameters
} from "./date-time-common-hooks.js";

export namespace TimeFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		readonly readonly?: boolean;
		readonly enableTimePicker?: boolean;
		readonly initialDate?: Date;
		readonly uiValue: DateTimeViewValue;
	}
}

/** @internal */
export const TimeFilterOptionsView: React.FC<TimeFilterOptionsView.Props> = React.memo(
	function TimeFilterOptionsView(props) {
		const { onChange, viewName, ariaLevel, uiValue, modelId, hideEmptyValueOption } = props;
		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const timezone = useOverviewEngineInternalContext((context) => context.timezone);
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);

		const triggerChange = React.useCallback(
			(uiValue: DateTimeViewValue) =>
				onChange?.(DateTimeUtils.convertToFilterOptions(uiValue, "Time", timezone, undefined, modelId), uiValue),
			[modelId, onChange, timezone]
		);

		const { isInputEmpty, headingElements, onClearButtonClick } = useDateTimeCommonParameters(
			uiValue,
			triggerChange,
			viewName,
			wrapperRef.current,
			ariaLevel
		);
		const clearHandlerRegistry = useClearHandlerRegistry();

		const handleClearAll = React.useCallback(
			(event: React.MouseEvent<HTMLElement>) => {
				onClearButtonClick(event);
				clearHandlerRegistry.clear();
			},
			[clearHandlerRegistry, onClearButtonClick]
		);

		const rangeErrorMessage = useRangeErrorMessage(uiValue, timezone);
		const sectionRenderer = useSectionRenderer(props, triggerChange);
		const onEmptySwitch = React.useCallback(
			(enabled: boolean): void => {
				const newUIValue = { ...uiValue, undefinedMatch: enabled };
				onChange?.(DateTimeUtils.convertToFilterOptions(newUIValue, "Time", timezone), newUIValue);
			},
			[onChange, timezone, uiValue]
		);
		const emptySwitchHandler = hideEmptyValueOption ? undefined : onEmptySwitch;
		const isUndefinedMatch = !!uiValue.undefinedMatch;

		return (
			<FilterSelectorTemplateContent
				headingElements={headingElements}
				subActionBar={useDateTimeSubActionBar(
					wrapperRef.current,
					handleClearAll,
					isInputEmpty,
					emptySwitchHandler,
					isUndefinedMatch
				)}
				wrapperRef={(ref) => {
					wrapperRef.current = ref;
				}}
				padding={false}>
				{!uiValue.undefinedMatch && (
					<SectionTemplate errorMessage={rangeErrorMessage} sectionRenderer={sectionRenderer} />
				)}
			</FilterSelectorTemplateContent>
		);
	}
);

function useSectionRenderer(
	filterProps: TimeFilterOptionsView.Props,
	triggerChange: (uiValue: DateTimeViewValue) => void
) {
	const { uiValue, initialDate, path } = filterProps;
	const generateId = useIdGenerator();
	const clearHandlerRegistry = useClearHandlerRegistry();

	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();

	const parseDateTime = DateTimeUtils.useDateTimeParser(filterProps.modelId);
	const parseValue = React.useCallback((timeInput: string) => parseDateTime(path, timeInput), [parseDateTime, path]);
	const timeFormatter = React.useCallback(
		(value: Date | undefined) => DateTimeUtils.format(converter, path, value, filterProps.modelId),
		[converter, path, filterProps.modelId]
	);
	const timeConverter = React.useCallback((input: string) => parseValue(input)?.value ?? undefined, [parseValue]);

	return React.useCallback(
		(sectionType: SectionType) => {
			const clearHandlerRef = clearHandlerRegistry.createRef(sectionType);
			const onValidateValue = (newText: string) => triggerChange({ ...uiValue, [sectionType]: parseValue(newText) });

			return (
				<TimePickerAdapter
					{...filterProps}
					id={generateId({ id: "filter-time", suffix: sectionType })}
					sectionType={sectionType}
					value={uiValue[sectionType].value ?? initialDate}
					triggerChange={triggerChange}
					clearHandlerRef={clearHandlerRef}
					timeConverter={timeConverter}
					timeFormatter={timeFormatter}
					onValidate={onValidateValue}
					fieldFormatString={localizedFieldFormat(path, filterProps.modelId)}
				/>
			);
		},
		[
			clearHandlerRegistry,
			filterProps,
			generateId,
			initialDate,
			localizedFieldFormat,
			parseValue,
			path,
			timeConverter,
			timeFormatter,
			triggerChange,
			uiValue
		]
	);
}
