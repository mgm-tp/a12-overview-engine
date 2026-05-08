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

import { type ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { TextAffix, BufferedInput, HTMLInputAdapter, TextLineStateless } from "@com.mgmtp.a12.widgets/widgets-core";

import { useIsRangeInputEmpty } from "../utils.js";
import { OverviewEngineApi } from "../../../api.js";
import { UiStateSelector } from "../../../../store/index.js";
import { useIdGenerator, focusNextElement } from "../../../utils.js";
import { type Filter, type FilterOptionsView } from "../filter-options-view.js";
import { RESOURCE_KEYS, LocalizerHooks } from "../../../../services/localization/index.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { DateTimeUtils } from "./date-time-utils.js";
import { SectionTemplate, type SectionType } from "./section-template.js";
import { useHeadingElements, useLocalizedLabels, useRangeErrorMessage } from "./date-time-common-hooks.js";

const NumberInput = BufferedInput(HTMLInputAdapter(TextLineStateless));

export namespace NumberFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		readonly uiValue: NumberUiValueType;
		readonly suffix?: React.ReactNode;
		readonly suffixFilterData?: Filter.FilterData;
	}

	export interface NumberUiValueType extends FilterOptionsView.UiValueType {
		readonly start: NumberUiValueType.InputState;
		readonly end: NumberUiValueType.InputState;
	}

	export namespace NumberUiValueType {
		export interface InputState {
			readonly input: string;
			readonly value?: number | null;
			readonly errorMessage?: string;
		}
	}
}

/** @internal */
export const NumberFilterOptionsView: React.FC<NumberFilterOptionsView.Props> = React.memo(
	function NumberFilterOptionsView(props) {
		const { uiValue, suffixFilterData, suffix, path, viewName, ariaLevel, onChange, modelId, hideEmptyValueOption } =
			props;
		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);

		const triggerChange = React.useCallback(
			(uiValue: NumberFilterOptionsView.NumberUiValueType) => {
				onChange?.(convertToNumberFilterOptions(uiValue, props.modelId), uiValue);

				if (suffixFilterData?.filterOptions) {
					onChange?.(suffixFilterData.filterOptions, undefined, suffixFilterData.id);
				}
			},
			[onChange, props.modelId, suffixFilterData?.filterOptions, suffixFilterData?.id]
		);

		const rangeErrorMessage = useRangeErrorMessage(uiValue);
		const sectionRenderer = useSectionRenderer(uiValue, path, triggerChange, suffix, modelId);

		const onEmptySwitch = React.useCallback(
			(enabled: boolean): void => {
				const newUIValue = { ...uiValue, undefinedMatch: enabled };
				onChange?.(convertToNumberFilterOptions(newUIValue, modelId), newUIValue);
			},
			[modelId, onChange, uiValue]
		);
		const emptySwitchHandler = hideEmptyValueOption ? undefined : onEmptySwitch;
		const isUndefinedMatch = !!uiValue.undefinedMatch;

		return (
			<FilterSelectorTemplateContent
				headingElements={useHeadingElements(viewName, ariaLevel)}
				subActionBar={useSubActionBar(props, wrapperRef.current, triggerChange, emptySwitchHandler, isUndefinedMatch)}
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
	uiValue: NumberFilterOptionsView.NumberUiValueType,
	path: ModelPath,
	triggerChange: (uiValue: NumberFilterOptionsView.NumberUiValueType) => void,
	suffix?: React.ReactNode,
	modelId?: string
) {
	const rangeErrorMessage = useRangeErrorMessage(uiValue);
	const generateId = useIdGenerator();
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const referenceColumns = useOverviewEngineContext((context) => context.referenceColumns);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const localizedNumberSuffix = LocalizerHooks.useLocalizedNumberSuffix();

	const numberSuffix = React.useMemo(() => {
		const column = referenceColumns?.[documentModelService.getByPath(path, modelId).id];
		const localizedSuffix = localizedNumberSuffix(column);

		return localizedSuffix !== "" ? <TextAffix>{localizedSuffix}</TextAffix> : undefined;
	}, [referenceColumns, documentModelService, path, modelId, localizedNumberSuffix]);

	const { localizer } = React.useContext(LocalizerContext);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const convertAndFormat = React.useCallback(
		(value: string | undefined): NumberFilterOptionsView.NumberUiValueType.InputState => {
			if (!value) {
				return { input: "", value: null };
			}

			const parsedValue = converter.parseValue(path, value, undefined, modelId);

			if (parsedValue.error || parsedValue.value === null) {
				return {
					input: value,
					value: null,
					errorMessage: localizer(...(parsedValue.error ?? []))
				};
			}

			const trimmedValue = Number(String(parsedValue.value));
			const formattedValue = converter.formatValue(path, trimmedValue, undefined, modelId);

			return { input: formattedValue, value: trimmedValue, errorMessage: parsedValue.error };
		},
		[converter, localizer, path, modelId]
	);

	const handleValueSubmit = React.useCallback(
		(newValue: string | undefined, sectionType: SectionType): void => {
			triggerChange({ ...uiValue, [sectionType]: convertAndFormat(newValue) });
		},
		[convertAndFormat, triggerChange, uiValue]
	);

	return React.useCallback(
		(sectionType: SectionType) => {
			const id = generateId({ id: "filter-number", suffix: sectionType });

			return (
				<NumberInput
					id={id}
					disabled={disabled}
					value={uiValue[sectionType].input}
					errorMessage={uiValue[sectionType].errorMessage}
					error={rangeErrorMessage !== undefined}
					alwaysSubmit
					onValueSubmit={(newText) => handleValueSubmit(newText, sectionType)}
					placeholder={localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.placeholder[sectionType])}
					suffixes={suffix ?? numberSuffix}
				/>
			);
		},
		[generateId, disabled, uiValue, rangeErrorMessage, localizedResource, suffix, numberSuffix, handleValueSubmit]
	);
}

function useSubActionBar(
	props: NumberFilterOptionsView.Props,
	wrapperRef: HTMLElement | null,
	triggerChange: (uiValue: NumberFilterOptionsView.NumberUiValueType) => void,
	handleEmptySwitch: ((enabled: boolean) => void) | undefined,
	isUndefinedMatch: boolean
) {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const SubActionBar = useOverviewEngineContext((context) => context.widgetMap.SubActionBar);
	const FilterSelectorContentHeader = useOverviewEngineContext(
		(context) => context.componentMap.FilterSelectorContentHeader
	);

	const isNumberInputEmpty = useIsRangeInputEmpty(props.uiValue);
	const isSuffixEmpty = React.useMemo(() => {
		if (
			props.suffixFilterData?.filterOptions &&
			OverviewEngineApi.Filter.EnumerationOptions.isInstance(props.suffixFilterData.filterOptions)
		) {
			return props.suffixFilterData.filterOptions.criteria?.selectedValues.length === 0;
		}

		return true;
	}, [props.suffixFilterData?.filterOptions]);
	const { clearAllLabel } = useLocalizedLabels();

	const { suffixFilterData, onChange } = props;

	const onClear = React.useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			event.stopPropagation();

			if (wrapperRef) {
				focusNextElement(event.currentTarget, wrapperRef);
			}

			triggerChange({ start: { input: "" }, end: { input: "" } });

			if (suffixFilterData) {
				onChange?.(
					OverviewEngineApi.Filter.EnumeratedSuffixOptions.create(undefined, props.modelId),
					undefined,
					suffixFilterData.id
				);
			}
		},
		[wrapperRef, triggerChange, suffixFilterData, onChange, props.modelId]
	);

	if (smallView) {
		return undefined;
	}

	return (
		<SubActionBar>
			<FilterSelectorContentHeader
				clearButtonLabel={!isUndefinedMatch ? clearAllLabel : undefined}
				clearButtonDisabled={disabled || (isNumberInputEmpty && isSuffixEmpty)}
				onClear={onClear}
				enableEmptySwitch={!!handleEmptySwitch}
				onEmptySwitch={handleEmptySwitch}
				emptySwitchChecked={isUndefinedMatch}
			/>
		</SubActionBar>
	);
}

/** @internal */
export function convertToNumberFilterOptions(
	numberUiValue: NumberFilterOptionsView.NumberUiValueType,
	modelId?: string,
	alwaysHaveCriteria?: boolean
): OverviewEngineApi.Filter.NumberOptions {
	if (numberUiValue.undefinedMatch) {
		return { filterType: "Number", undefinedMatch: true };
	}

	if (numberUiValue.start.errorMessage || numberUiValue.end.errorMessage) {
		return { filterType: "Number", error: true, modelId };
	}

	if (
		(numberUiValue.start.value === null || numberUiValue.start.value === undefined) &&
		(numberUiValue.end.value === null || numberUiValue.end.value === undefined)
	) {
		return { filterType: "Number", modelId, criteria: alwaysHaveCriteria ? { start: null, end: null } : undefined };
	}

	if (DateTimeUtils.isNotValidRange(numberUiValue)) {
		return { filterType: "Number", modelId, error: true };
	} else {
		return {
			filterType: "Number",
			modelId,
			criteria: { start: numberUiValue.start.value, end: numberUiValue.end.value }
		};
	}
}
