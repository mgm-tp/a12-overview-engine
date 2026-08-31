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

import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { YearRange, YearSelectorVariant } from "@com.mgmtp.a12.widgets/widgets-core";

import { UiStateSelector } from "../../../../store/index.js";
import type { OverviewEngineApi } from "../../../api.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useIdGenerator } from "../../../utils.js";
import type { FilterOptionsView } from "../filter-options-view.js";

import { DateInputAdapter } from "./date-input-adapter.js";
import {
	useClearHandlerRegistry,
	useDateTimeSubActionBar,
	useDateTimeCommonParameters
} from "./date-time-common-hooks.js";
import type { DateTimeViewValue } from "./date-time-filter-view.api.js";
import { DateTimeUtils } from "./date-time-utils.js";
import { SectionTemplate, type SectionType } from "./section-template.js";

export enum DateRangeFormat {
	YEAR = "yyyy",
	MONTH = "MM",
	YEAR_MONTH = "yyyy-MM",
	DATE = "yyyy-MM-dd",
	MONTH_DATE = "MM-dd"
}

export namespace DateRangeFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		readonly uiValue: DateTimeViewValue;
		readonly readonly?: boolean;
		readonly yearRange?: YearRange;
		readonly yearSelectorVariant?: YearSelectorVariant;
	}
}

/** @internal */
export const DateRangeFilterOptionsView: React.FC<DateRangeFilterOptionsView.Props> = React.memo(
	function DateRangeFilterOptionsView(props) {
		const { uiValue, ariaLevel, viewName, path, onChange, hideEmptyValueOption } = props;
		const wrapperRef = React.useRef<HTMLElement | null>(null);
		const timezone = useOverviewEngineInternalContext((context) => context.timezone);
		const dateRangeElement = useDateRangeElement(path);
		const enableDatePicker = React.useMemo(
			() => dateRangeElement.format === DateRangeFormat.DATE,
			[dateRangeElement.format]
		);
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);

		const triggerChange = React.useCallback(
			(uiValue: DateTimeViewValue) => {
				const convertToFilterOptions = (uiValue: DateTimeViewValue): OverviewEngineApi.Filter.DateOptions => {
					const base: OverviewEngineApi.Filter.DateOptions = {
						filterType: "Date",
						modelId: props.modelId,
						type: "DateRange"
					};

					if (uiValue.start.errorMessage || uiValue.end.errorMessage || DateTimeUtils.isNotValidRange(uiValue)) {
						return { ...base, error: true };
					}

					if (!uiValue.start.value && !uiValue.end.value) {
						return base;
					}

					return {
						...base,
						criteria: { start: uiValue.start.value, end: uiValue.end.value }
					};
				};

				onChange?.(convertToFilterOptions(uiValue), uiValue);
			},
			[onChange, props.modelId]
		);

		const { isInputEmpty, headingElements, rangeErrorMessage, onClearButtonClick } = useDateTimeCommonParameters(
			uiValue,
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
		const onEmptySwitch = React.useCallback(
			(enabled: boolean): void => {
				const newUIValue = { ...uiValue, undefinedMatch: enabled };
				onChange?.(DateTimeUtils.convertToFilterOptions(newUIValue, "DateRange", timezone), newUIValue);
			},
			[onChange, timezone, uiValue]
		);

		const sectionRenderer = React.useCallback(
			(sectionType: SectionType) => (
				<DateRangeInput
					{...props}
					uiValue={uiValue}
					sectionType={sectionType}
					triggerChange={triggerChange}
					enableDatePicker={enableDatePicker}
					clearHandlerRef={clearHandlerRegistry.createRef(sectionType)}
				/>
			),
			[clearHandlerRegistry, enableDatePicker, props, triggerChange, uiValue]
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

namespace DateRangeInput {
	export interface Props extends DateRangeFilterOptionsView.Props {
		readonly sectionType: SectionType;
		readonly triggerChange: (dateTimeViewValue: DateTimeViewValue) => void;
		readonly enableDatePicker: boolean;
		readonly clearHandlerRef: (clearHandler: () => void) => void;
	}
}

const DateRangeInput: React.FC<DateRangeInput.Props> = React.memo(function DateRangeInput(props) {
	const {
		readonly,
		yearRange,
		yearSelectorVariant,
		sectionType,
		uiValue,
		path,
		triggerChange,
		enableDatePicker,
		clearHandlerRef
	} = props;
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const fieldFormatString = LocalizerHooks.useLocalizedDateFieldFormat();

	// Handlers
	const dateTimeParser = DateTimeUtils.useDateTimeParser(props.modelId);
	const onValueSubmit = React.useCallback(
		(newText?: string) => triggerChange({ ...uiValue, [sectionType]: dateTimeParser(path, newText) }),
		[triggerChange, uiValue, sectionType, dateTimeParser, path]
	);

	const onValueSelect = React.useCallback(
		(date?: Date) => {
			const newUiValue = date
				? { value: date, input: DateTimeUtils.format(converter, path, date), errorMessage: undefined }
				: { input: "" };

			triggerChange({ ...uiValue, [sectionType]: newUiValue });
		},
		[converter, path, sectionType, triggerChange, uiValue]
	);

	// Props
	const generateId = useIdGenerator();
	const baseProps = React.useMemo(
		() => ({
			id: generateId({ id: "date-range", suffix: sectionType }),
			disabled,
			readonly,
			error: DateTimeUtils.isNotValidRange(uiValue),
			errorMessage: uiValue[sectionType].errorMessage,
			yearRange
		}),
		[yearRange, disabled, generateId, readonly, sectionType, uiValue]
	);

	const dateInputAdapterProps: Omit<DateInputAdapter.Props, "id" | "yearRange" | "readonly"> = React.useMemo(() => {
		return {
			clearHandlerRef,
			dateConverter: (input) => dateTimeParser(path, input).value ?? undefined,
			dateFormatter: (date) => DateTimeUtils.format(converter, path, date),
			enableDatePicker,
			onValueSelect,
			onValueSubmit,
			sectionType,
			fieldFormatString: fieldFormatString(path, props.modelId),
			value: uiValue[sectionType].value ?? undefined,
			yearSelectorVariant
		};
	}, [
		clearHandlerRef,
		converter,
		dateTimeParser,
		enableDatePicker,
		fieldFormatString,
		onValueSelect,
		onValueSubmit,
		path,
		props.modelId,
		sectionType,
		uiValue,
		yearSelectorVariant
	]);

	return <DateInputAdapter {...baseProps} {...dateInputAdapterProps} />;
});

function useDateRangeElement(path: ModelPath): DocumentModel.DateRangeType {
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const element = React.useMemo(() => documentModelService.getByPath(path), [documentModelService, path]);

	if (element.type === "Field" && element.fieldType.type === "DateRangeType") {
		return element.fieldType;
	}

	throw Error("Element is not a DateRange Field");
}
