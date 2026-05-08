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
import { type DocumentModel, type FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { UiStateSelector } from "../../../store/index.js";
import type { OverviewModel } from "../../../overview-model.js";
import { FilterOperation, OverviewEngineApi } from "../../api.js";
import { LocalizerHooks } from "../../../services/localization/index.js";
import { type Converter } from "../../../services/converter/internal/shared.js";
import { type MultiSelectGroup, MultiSelectModelUtils } from "../../../models/internal/shared.js";
import { useOverviewEngineInternalContext } from "../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";

import { FilterOptionsViews } from "./index.js";
import { useSuffixFilterDataGetter } from "./utils.js";
import { SectionType } from "./options-views/section-template.js";
import { DateTimeUtils } from "./options-views/date-time-utils.js";
import { Filter, type FilterOptionsView } from "./filter-options-view.js";
import { EmptyFilterOptionsView } from "./options-views/empty-filter-options-view.js";
import { EnumerationSuffixSelector } from "./options-views/enumeration-suffix-selector.js";
import { type NumberFilterOptionsView } from "./options-views/number-filter-options-view.js";
import { type StringFilterOptionsView } from "./options-views/string-filter-options-view.js";
import { type ConfirmFilterOptionsView } from "./options-views/confirm-filter-options-view.js";
import { type BooleanFilterOptionsView } from "./options-views/boolean-filter-options-view.js";
import { type EnumerationFilterOptionsView } from "./options-views/enumeration-filter-options-view.js";
import { type MultiSelectFilterOptionsView } from "./options-views/multi-select-filter-options-view.js";
import {
	type DateTimeViewValue,
	type DateTimeUiValueType,
	type DateTimeViewSelection
} from "./options-views/date-time-filter-view.api.js";

import FilterData = Filter.FilterData;

const ariaLevel = 2;

export namespace FilterOptionsViewRouter {
	export interface Props extends Filter.PropsType {
		readonly id: string;
		readonly filterData?: FilterData;
		onSetFilterState(
			id: string,
			options: OverviewEngineApi.Filter.Options | undefined,
			uiValue?: FilterOptionsView.UiValueType
		): void;
	}
}

/** @internal */
export const FilterOptionsViewRouter: React.FC<FilterOptionsViewRouter.Props> = React.memo(
	function FilterOptionsViewRouter(props) {
		const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

		if (props.filterData === undefined) {
			return <EmptyFilterOptionsView ariaLevel={ariaLevel} />;
		}

		const element = documentModelService.getByPath(props.filterData.path, props.filterData.modelId);

		if (!isSupportedElementType(element)) {
			throw new Error("Unknown FilterOption Type");
		}

		return <VisibleFilterOptionsViewRouter {...props} filterData={props.filterData} element={element} />;
	}
);

namespace VisibleFilterOptionsViewRouter {
	export type Props = Omit<FilterOptionsViewRouter.Props, "filterData"> & {
		readonly filterData: FilterData;
		readonly element: DocumentModel.Element;
	};
}

const VisibleFilterOptionsViewRouter: React.FC<VisibleFilterOptionsViewRouter.Props> = React.memo(
	function VisibleFilterOptionsViewRouter(props) {
		const { onSetFilterState, id, filterData, timeMode, element } = props;

		const converter = useOverviewEngineInternalContext((context) => context.converter);
		const FilterOptionsViews = useOverviewEngineContext((context) => context.componentMap.FilterOptionsViews);
		const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());
		const activeFilterOption = React.useMemo(
			() => (!activeFilters ? undefined : activeFilters[id]),
			[activeFilters, id]
		);
		const enumeratedStringFilterMap = useOverviewEngineState(UiStateSelector.enumeratedStringFilterMap());
		const enumeratedStringFilter = React.useMemo(
			() => (!enumeratedStringFilterMap ? undefined : enumeratedStringFilterMap[id]),
			[enumeratedStringFilterMap, id]
		);

		const onChange = React.useCallback(
			(
				filterOptions: OverviewEngineApi.Filter.Options,
				uiValue?: FilterOptionsView.UiValueType,
				overrideId?: string
			) => {
				onSetFilterState(
					overrideId ?? id,
					{
						...filterOptions,
						nonRemovable: filterData?.nonRemovable // to keep nonRemovable without handling undefined criteria and error
					},
					uiValue
				);
			},
			[filterData?.nonRemovable, id, onSetFilterState]
		);

		const baseProps: FilterOptionsView.PropsType = React.useMemo(
			() => ({
				viewName: filterData.label,
				path: filterData.path,
				modelId: filterData.modelId,
				ariaLevel,
				onChange
			}),
			[filterData.label, filterData.modelId, filterData.path, onChange]
		);

		const suffixFilterDataGetter = useSuffixFilterDataGetter();
		const initialMultiSelectUiValuesGetter = useInitialMultiSelectUiValuesGetter(activeFilterOption);
		const enumValuesGetter = useEnumValuesGetter(activeFilterOption);
		const enumeratedStringFilterConfiguration = useOverviewEngineContext(
			(context) => context.overviewModel.content.configuration.filterConfiguration?.enumeratedStringFilter
		);

		return React.useMemo(() => {
			if (MultiSelectModelUtils.isInstance(element)) {
				const View = getView(FilterOptionsViews, "MultiSelectFilterOptionsView");

				return <View {...baseProps} uiValue={initialMultiSelectUiValuesGetter(filterData, element, filterData.path)} />;
			}

			if (element.type === "Field") {
				const fieldType = element.fieldType.type;

				if (fieldType === "StringType") {
					if (isEnumeratedStringField(element.id, enumeratedStringFilterConfiguration)) {
						const View = getView(FilterOptionsViews, "EnumeratedStringFilterOptionsView");

						return (
							<View
								{...baseProps}
								selectedValues={getSelectedValues(filterData.filterOptions)}
								activeValues={getSelectedValues(activeFilterOption)}
								keyword={enumeratedStringFilter?.keyword ?? ""}
								{...enumeratedStringFilter}
								uiValue={{ undefinedMatch: filterData.filterOptions?.undefinedMatch }}
							/>
						);
					}

					const View = getView(FilterOptionsViews, "StringFilterOptionsView");

					return <View {...baseProps} uiValue={getInitialStringValue(filterData.filterOptions)} />;
				}

				if (fieldType === "CustomFieldType") {
					const View = getView(FilterOptionsViews, "CustomFieldFilterOptionsView");

					return <View {...baseProps} uiValue={getInitialCustomFieldValue(filterData.filterOptions)} />;
				}

				if (fieldType === "BooleanType") {
					const View = getView(FilterOptionsViews, "BooleanFilterOptionsView");

					return <View {...baseProps} uiValue={getInitialBooleanValue(filterData.filterOptions)} />;
				}

				if (fieldType === "ConfirmType") {
					const View = getView(FilterOptionsViews, "ConfirmFilterOptionsView");

					return <View {...baseProps} uiValue={getInitialConfirmValue(filterData.filterOptions)} />;
				}

				if (fieldType === "DateTimeType") {
					const View = getView(FilterOptionsViews, "DateTimeFilterOptionsView");

					return (
						<View
							{...baseProps}
							enableTimePicker
							enableDatePicker
							uiValue={getInitialDateUiValues(filterData, converter, true)}
						/>
					);
				}

				if (fieldType === "TimeType") {
					const View = getView(FilterOptionsViews, "TimeFilterOptionsView");

					return (
						<View
							{...baseProps}
							timeMode={timeMode}
							enableTimePicker
							uiValue={getInitialDateTimeUiValues(filterData, converter)}
						/>
					);
				}

				if (fieldType === "DateType") {
					const View = getView(FilterOptionsViews, "DateFilterOptionsView");

					return (
						<View {...baseProps} enableDatePicker uiValue={getInitialDateUiValues(filterData, converter, false)} />
					);
				}

				if (fieldType === "DateFragmentType") {
					const View = getView(FilterOptionsViews, "DateFragmentFilterOptionsView");

					return <View {...baseProps} uiValue={getInitialDateTimeUiValues(filterData, converter)} />;
				}

				if (fieldType === "DateRangeType") {
					const View = getView(FilterOptionsViews, "DateRangeFilterOptionsView");

					return <View {...baseProps} uiValue={getInitialDateTimeUiValues(filterData, converter)} />;
				}

				if (fieldType === "EnumerationType") {
					const View = getView(FilterOptionsViews, "EnumerationFilterOptionsView");

					return (
						<View
							{...baseProps}
							enumerationOptions={enumValuesGetter(
								filterData.filterOptions,
								element.fieldType,
								filterData.path,
								baseProps.modelId
							)}
							uiValue={{ undefinedMatch: filterData.filterOptions?.undefinedMatch }}
						/>
					);
				}

				if (fieldType === "NumberType") {
					const uiValue = getInitialNumberUiValues(filterData, converter);
					let suffix: React.JSX.Element | undefined;
					const [suffixFilterData, suffixFieldType] = suffixFilterDataGetter(baseProps.path, baseProps.modelId);

					if (suffixFilterData && suffixFieldType) {
						const { filterOptions, path } = suffixFilterData;
						suffix = (
							<EnumerationSuffixSelector
								enumerationOptions={enumValuesGetter(filterOptions, suffixFieldType, path, baseProps.modelId)}
								numberUiValues={uiValue}
								filterData={suffixFilterData}
								onChange={baseProps.onChange}
								modelId={baseProps.modelId}
							/>
						);
					}

					const View = getView(FilterOptionsViews, "NumberFilterOptionsView");

					return <View {...baseProps} uiValue={uiValue} suffix={suffix} suffixFilterData={suffixFilterData} />;
				}
			}

			throw new Error("Unknown FilterOption Type");
		}, [
			element,
			FilterOptionsViews,
			baseProps,
			initialMultiSelectUiValuesGetter,
			filterData,
			enumeratedStringFilterConfiguration,
			activeFilterOption,
			enumeratedStringFilter,
			converter,
			timeMode,
			enumValuesGetter,
			suffixFilterDataGetter
		]);
	}
);

function isSupportedElementType(element: DocumentModel.Element): boolean {
	return MultiSelectModelUtils.isInstance(element) || element.type === "Field";
}

function getView<K extends keyof FilterOptionsViews>(
	filterOptionsView: Partial<FilterOptionsViews>,
	key: K
): FilterOptionsViews[K] {
	const resolvedView = filterOptionsView[key] as FilterOptionsViews[K] | undefined;

	return resolvedView || FilterOptionsViews.defaultInstance[key];
}

function getInitialConfirmValue(
	filterOptions?: OverviewEngineApi.Filter.Options
): ConfirmFilterOptionsView.ConfirmUiValueType {
	return filterOptions !== undefined &&
		OverviewEngineApi.Filter.ConfirmOptions.isInstance(filterOptions) &&
		filterOptions.criteria !== undefined &&
		!filterOptions.error
		? { value: filterOptions.criteria.value }
		: { value: undefined };
}

function getInitialStringValue(
	filterOptions?: OverviewEngineApi.Filter.Options
): StringFilterOptionsView.StringUiValueType {
	return filterOptions !== undefined &&
		OverviewEngineApi.Filter.StringOptions.isInstance(filterOptions) &&
		filterOptions.criteria !== undefined &&
		!filterOptions.error
		? { value: filterOptions.criteria.value }
		: filterOptions?.undefinedMatch
			? { value: undefined, undefinedMatch: true }
			: { value: "" };
}

function getInitialCustomFieldValue(
	filterOptions?: OverviewEngineApi.Filter.Options
): StringFilterOptionsView.StringUiValueType {
	return filterOptions !== undefined &&
		OverviewEngineApi.Filter.CustomFieldOptions.isInstance(filterOptions) &&
		filterOptions.criteria !== undefined &&
		!filterOptions.error
		? { value: filterOptions.criteria.value }
		: filterOptions?.undefinedMatch
			? { value: undefined, undefinedMatch: true }
			: { value: "" };
}

function getInitialBooleanValue(
	filterOptions?: OverviewEngineApi.Filter.Options
): BooleanFilterOptionsView.BooleanUiValueType {
	return filterOptions !== undefined &&
		OverviewEngineApi.Filter.BooleanOptions.isInstance(filterOptions) &&
		filterOptions.criteria !== undefined &&
		!filterOptions.error
		? { value: filterOptions.criteria.value }
		: { value: undefined };
}

function getInitialNumberUiValues(
	filterData: FilterData,
	converter: Converter
): NumberFilterOptionsView.NumberUiValueType {
	const filterOptions = filterData.filterOptions;

	if (filterOptions?.undefinedMatch) {
		return { start: { input: "" }, end: { input: "" }, undefinedMatch: true };
	}

	if (
		filterData.uiValue === undefined &&
		filterOptions !== undefined &&
		OverviewEngineApi.Filter.NumberOptions.isInstance(filterOptions) &&
		filterOptions.criteria !== undefined &&
		!filterOptions.error
	) {
		return {
			start: {
				input: format(converter, filterData.path, filterOptions.criteria.start, filterData.modelId),
				value: filterOptions.criteria.start
			},
			end: {
				input: format(converter, filterData.path, filterOptions.criteria.end, filterData.modelId),
				value: filterOptions.criteria.end
			}
		};
	}

	return (filterData.uiValue as NumberFilterOptionsView.NumberUiValueType) || DateTimeUtils.getEmptyDateTimeViewInput();
}

function getInitialDateTimeUiValues(filterData: FilterData, converter: Converter): DateTimeViewValue {
	const filterOptions = filterData.filterOptions;

	if (filterOptions?.undefinedMatch) {
		return { ...DateTimeUtils.getEmptyDateTimeViewInput(), undefinedMatch: true };
	}

	if (
		filterData.uiValue === undefined &&
		filterOptions !== undefined &&
		OverviewEngineApi.Filter.DateOptions.isInstance(filterOptions) &&
		filterOptions.criteria !== undefined &&
		!filterOptions.error
	) {
		return DateTimeUtils.convertToDateTimeViewValue(
			{
				input: format(converter, filterData.path, filterOptions.criteria.start, filterData.modelId),
				value: filterOptions.criteria.start
			},
			{
				input: format(converter, filterData.path, filterOptions.criteria.end, filterData.modelId),
				value: filterOptions.criteria.end
			}
		);
	}

	return (filterData.uiValue as DateTimeViewValue) || DateTimeUtils.getEmptyDateTimeViewInput();
}

function getInitialDateUiValues(
	filterData: FilterData,
	converter: Converter,
	includeTime: boolean
): DateTimeUiValueType {
	const { filterOptions } = filterData;
	const uiValue = filterData.uiValue as DateTimeUiValueType | undefined;

	if (filterOptions?.error && uiValue) {
		return uiValue;
	}

	if (filterOptions?.undefinedMatch) {
		return { ...createDefaultDateTimeValue(DateTimeUtils.EMPTY_SELECT_OPTION_VALUE), undefinedMatch: true };
	}

	const { DateTimeTypeOptions, DateTypeOptions } = OverviewEngineApi.Filter.DateOptions;
	let selectedView: DateTimeViewSelection = includeTime ? "dateTime" : "date";

	if (filterOptions && (DateTimeTypeOptions.isInstance(filterOptions) || DateTypeOptions.isInstance(filterOptions))) {
		selectedView = filterOptions.selectedView || (filterOptions.type === "DateTime" ? "dateTime" : "date");

		const { criteria } = filterOptions;

		if (criteria) {
			const initInputState = (sectionType: SectionType): DateTimeUiValueType.InputState => {
				return {
					input: format(converter, filterData.path, criteria[sectionType], filterData.modelId),
					value: criteria[sectionType],
					errorMessage: uiValue?.valueMap[uiValue.selected][sectionType].errorMessage
				};
			};

			const value: DateTimeViewValue = {
				start: initInputState(SectionType.START),
				end: initInputState(SectionType.END)
			};

			if (!uiValue) {
				return {
					selected: selectedView,
					valueMap: {
						date: value,
						monthYear: value,
						year: value,
						time: value,
						dateTime: value,
						[DateTimeUtils.EMPTY_SELECT_OPTION_VALUE]: value
					}
				};
			}

			return { ...uiValue, valueMap: { ...uiValue.valueMap, [uiValue.selected]: value } };
		}

		if (uiValue) {
			// No criteria but uiValue still there => changing view
			return uiValue;
		}
	}

	return createDefaultDateTimeValue(selectedView);
}

function createDefaultDateTimeValue(selectedView: DateTimeViewSelection): DateTimeUiValueType {
	const emptyValue = DateTimeUtils.getEmptyDateTimeViewInput();

	return {
		selected: selectedView,
		valueMap: {
			date: emptyValue,
			monthYear: emptyValue,
			year: emptyValue,
			time: emptyValue,
			dateTime: emptyValue,
			[DateTimeUtils.EMPTY_SELECT_OPTION_VALUE]: emptyValue
		}
	};
}

function format(converter: Converter, path: ModelPath, value?: FieldInstanceValue | object, modelId?: string): string {
	return value !== undefined
		? converter.formatValue(path, value, DateTimeUtils.defaultDateRangeConversionTransformer, modelId)
		: "";
}

function useEnumValuesGetter(filterOption?: OverviewEngineApi.Filter.Options) {
	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue();

	return React.useCallback(
		(
			filterOptions: OverviewEngineApi.Filter.Options | undefined,
			enumerationField: DocumentModel.EnumerationType,
			path: ModelPath,
			modelId?: string
		): EnumerationFilterOptionsView.EnumerationOption[] => {
			const selectedValues =
				filterOptions !== undefined &&
				OverviewEngineApi.Filter.EnumerationOptions.isInstance(filterOptions) &&
				filterOptions.criteria !== undefined
					? filterOptions.criteria.selectedValues
					: [];
			let activeValues: string[] = [];

			if (filterOption !== undefined && OverviewEngineApi.Filter.EnumerationOptions.isInstance(filterOption)) {
				activeValues = filterOption.criteria?.selectedValues ?? [];
			}

			return enumerationField.values.map(({ value }) => {
				return {
					value,
					label: localizedFieldValue(path, value, modelId),
					checked: selectedValues.includes(value),
					active: activeValues.includes(value)
				};
			});
		},
		[filterOption, localizedFieldValue]
	);
}

function isEnumeratedStringField(
	elementId: string,
	enumeratedStringFilterConfiguration: OverviewModel.EnumeratedStringFilterConfiguration | undefined
): boolean {
	return !!enumeratedStringFilterConfiguration?.fields.find(({ fieldId }) => fieldId === elementId);
}

function getSelectedValues(filterOptions: OverviewEngineApi.Filter.Options | undefined) {
	return filterOptions !== undefined &&
		OverviewEngineApi.Filter.EnumerationOptions.isInstance(filterOptions) &&
		filterOptions.criteria !== undefined
		? filterOptions.criteria.selectedValues
		: [];
}

function useInitialMultiSelectUiValuesGetter(activeOptions?: OverviewEngineApi.Filter.Options) {
	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue();
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

	return React.useCallback(
		(
			filterData: FilterData,
			multiSelectGroup: MultiSelectGroup,
			path: ModelPath
		): MultiSelectFilterOptionsView.MultiSelectUiValueType => {
			const filterOptions = filterData.filterOptions;

			const group = documentModelService.getByPath(path);

			if (!MultiSelectModelUtils.isInstance(group)) {
				throw new Error(`Invalid multi-selection group ${JSON.stringify(group)}`);
			}

			const field = MultiSelectModelUtils.getField(group);
			const valuePath: ModelPath = [...path, { elementName: field.name }];

			let activeValues: string[] = [];

			if (activeOptions !== undefined && OverviewEngineApi.Filter.MultiSelectOptions.isInstance(activeOptions)) {
				activeValues = activeOptions.criteria?.selectedValues ?? [];
			}

			const getOptions: (
				selectedValues: string[],
				activeValues: string[]
			) => MultiSelectFilterOptionsView.MultiSelectOption[] = (selectedValues) =>
				Object.values(multiSelectGroup.elements[0].fieldType.values).map(({ value }) => ({
					label: localizedFieldValue(valuePath, value, filterData.modelId),
					value,
					checked: selectedValues.includes(value),
					active: activeValues.includes(value)
				}));

			if (
				filterOptions !== undefined &&
				OverviewEngineApi.Filter.MultiSelectOptions.isInstance(filterOptions) &&
				filterOptions.criteria !== undefined
			) {
				const { selectedValues, operation } = filterOptions.criteria;

				return {
					options: getOptions(selectedValues, activeValues),
					operation,
					undefinedMatch: filterOptions.undefinedMatch
				};
			}

			if (filterData.uiValue) {
				return filterData.uiValue as MultiSelectFilterOptionsView.MultiSelectUiValueType;
			}

			return {
				options: getOptions([], []),
				operation: FilterOperation.AND,
				undefinedMatch: filterData.filterOptions?.undefinedMatch
			};
		},
		[activeOptions, documentModelService, localizedFieldValue]
	);
}
