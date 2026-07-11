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
import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";

import { useIsRangeInputEmpty } from "../utils.js";
import { focusNextElement } from "../../../utils.js";
import { UiStateSelector } from "../../../../store/index.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { SectionType } from "./section-template.js";
import { DateTimeUtils } from "./date-time-utils.js";
import type { NumberFilterOptionsView } from "./number-filter-options-view.js";
import type { DateTimeViewValue, DateTimeViewSelection } from "./date-time-filter-view.api.js";

/** @internal */
export function useHeadingElements(viewName: React.ReactNode, ariaLevel?: number): React.ReactNode {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const Title = useOverviewEngineContext((context) => context.widgetMap.Title);

	return React.useMemo(
		() => !smallView && <Title text={viewName} ariaLevel={ariaLevel} />,
		[Title, ariaLevel, smallView, viewName]
	);
}

/** @internal */
export function useSelectItems(dateTimeViewSelections: DateTimeViewSelection[]): SelectItem[] {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo(
		() =>
			dateTimeViewSelections.map(
				(selection) =>
					({
						label: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.select[selection]),
						isEmptyValue: selection === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE,
						value:
							selection === DateTimeUtils.EMPTY_SELECT_OPTION_VALUE
								? DateTimeUtils.EMPTY_SELECT_OPTION_VALUE
								: DateTimeUtils.SelectOptions[selection]
					}) satisfies SelectItem
			),
		[dateTimeViewSelections, localizedResource]
	);
}

/** @internal */
export function useRangeErrorMessage(
	uiValue: DateTimeViewValue | NumberFilterOptionsView.NumberUiValueType,
	timeZone?: string
): string | undefined {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo(
		() =>
			DateTimeUtils.isNotValidRange(uiValue, timeZone)
				? localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd)
				: undefined,
		[localizedResource, timeZone, uiValue]
	);
}

/** @internal */
export interface DateTimeCommonParams {
	readonly isInputEmpty: boolean;
	readonly headingElements: React.ReactNode;
	readonly rangeErrorMessage: string | undefined;
	readonly onClearButtonClick: (event: React.MouseEvent<HTMLElement>) => void;
}

/** @internal */
export function useDateTimeCommonParameters(
	uiValue: DateTimeViewValue,
	triggerChange: (dateTimeViewValue: DateTimeViewValue) => void,
	viewName: React.ReactNode,
	wrapperRef?: HTMLElement | null,
	ariaLevel?: number
): DateTimeCommonParams {
	const isInputEmpty = useIsRangeInputEmpty(uiValue);
	const headingElements = useHeadingElements(viewName, ariaLevel);
	const rangeErrorMessage = useRangeErrorMessage(uiValue);

	const onClearButtonClick = React.useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			event.stopPropagation();

			if (wrapperRef) {
				focusNextElement(event.currentTarget, wrapperRef);
			}

			triggerChange(DateTimeUtils.getEmptyDateTimeViewInput());
		},
		[triggerChange, wrapperRef]
	);

	return React.useMemo(
		() => ({ isInputEmpty, headingElements, rangeErrorMessage, onClearButtonClick }),
		[headingElements, isInputEmpty, onClearButtonClick, rangeErrorMessage]
	);
}

/** @internal */
export function useValueSelect(
	triggerChange: (dateTimeViewValue: DateTimeViewValue) => void,
	path: ModelPath,
	selectedView: DateTimeViewSelection,
	uiValue: DateTimeViewValue,
	sectionType: SectionType,
	isDateTime = false,
	modelId?: string
) {
	const padDate = useDatePadder(path, selectedView, sectionType, isDateTime);
	const formatDate = useDateFormatter(path, selectedView, sectionType, isDateTime, modelId);

	return React.useCallback(
		(newValue?: Date | null): void => {
			triggerChange({
				...uiValue,
				[sectionType]: { value: padDate(newValue), input: formatDate(newValue), modelId }
			});
		},
		[triggerChange, uiValue, sectionType, padDate, formatDate, modelId]
	);
}

function useDatePadder(
	path: ModelPath,
	selectedView: DateTimeViewSelection,
	sectionType: SectionType,
	isDateTime = false
) {
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);

	return React.useCallback(
		(date: Date | null | undefined) => DateTimeUtils.padValue(sectionType, selectedView, date, isDateTime, timezone),
		[isDateTime, sectionType, selectedView, timezone]
	);
}

/** @internal */
export function useDateFormatter(
	path: ModelPath,
	selectedView: DateTimeViewSelection,
	sectionType: SectionType,
	isDateTime = false,
	modelId?: string
) {
	const padDate = useDatePadder(path, selectedView, sectionType, isDateTime);
	const converter = useOverviewEngineInternalContext((context) => context.converter);

	return React.useCallback(
		(date: Date | null | undefined) => DateTimeUtils.format(converter, path, padDate(date), modelId),
		[converter, padDate, path, modelId]
	);
}

/** @internal */
export function useOnYearMonthValueChange(
	onValueSelect: (newValue: Date | undefined) => void,
	currentDate: Date | undefined
) {
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);

	const onYearMonthValueChange = React.useCallback(
		(month?: number, year?: number) => {
			if ((year === undefined || month === undefined) && currentDate !== undefined) {
				onValueSelect(undefined);

				return;
			}

			const paddedDate = DateTimeUtils.padYearAndMonth(
				year ?? currentDate?.getUTCFullYear(),
				month ?? currentDate?.getUTCMonth(),
				timezone
			);

			onValueSelect(paddedDate);
		},
		[currentDate, onValueSelect, timezone]
	);

	return React.useMemo(() => ({ onYearMonthValueChange }), [onYearMonthValueChange]);
}

/** @internal */
export function useLocalizedLabels(sectionType: SectionType = SectionType.START) {
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return React.useMemo(
		() => ({
			clearLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.picker.clear),
			backLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.picker.back),
			okLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.picker.ok),
			editTimeLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.picker.editTime),
			dateTimePickerHeader: localizedResource(
				RESOURCE_KEYS.overviewEngine.filterOptionView.picker.dateTimePickerHeader
			),
			timePickerButtonTitle: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.picker.timePickerButton),
			datePickerButtonTitle: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.picker.datePickerButton),
			singleInputLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.placeholder.singleInput),
			valueSearchLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.placeholder.valueSearch),
			yearLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.hidden.year[sectionType]),
			monthLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.hidden.month[sectionType]),
			selectLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.select.mode),
			placeholderLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.placeholder[sectionType]),
			sectionHeader: localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.sectionHeader[sectionType]),
			clearAllLabel: localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.clearAll)
		}),
		[localizedResource, sectionType]
	);
}

/** @internal */
export function useDateTimeSubActionBar(
	wrapperRef: HTMLElement | null,
	onClear: (event: React.MouseEvent<HTMLElement>) => void,
	isInputEmpty: boolean,
	handleEmptySwitch?: (enabled: boolean) => void,
	isUndefinedMatch?: boolean
): React.ReactNode {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const SubActionBar = useOverviewEngineContext((context) => context.widgetMap.SubActionBar);
	const FilterSelectorContentHeader = useOverviewEngineContext(
		(context) => context.componentMap.FilterSelectorContentHeader
	);

	const { clearAllLabel } = useLocalizedLabels();

	if (smallView) {
		return undefined;
	}

	const showEmptySwitch = typeof handleEmptySwitch === "function";
	const emptySwitchChecked = showEmptySwitch ? !!isUndefinedMatch : undefined;

	return (
		<SubActionBar>
			<FilterSelectorContentHeader
				clearButtonLabel={!isUndefinedMatch ? clearAllLabel : undefined}
				clearButtonDisabled={disabled || isInputEmpty}
				onClear={onClear}
				enableEmptySwitch={showEmptySwitch}
				onEmptySwitch={showEmptySwitch ? handleEmptySwitch : undefined}
				emptySwitchChecked={emptySwitchChecked}
			/>
		</SubActionBar>
	);
}

/** @internal */
export function useClearHandlerRegistry() {
	const handlers = React.useRef<Record<string, undefined | (() => void)>>(undefined);

	const createRef = React.useCallback(
		(sectionType: SectionType) => {
			return (handler: () => void) => {
				handlers.current = { ...handlers.current, [sectionType]: handler };
			};
		},
		[handlers]
	);

	const clear = React.useCallback(() => {
		Object.values(handlers.current ?? {}).forEach((handler) => handler?.());
	}, [handlers]);

	return React.useMemo(() => ({ createRef, clear }), [createRef, clear]);
}
