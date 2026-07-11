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
import { uniqBy } from "lodash-es";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import * as KernelUtils from "@com.mgmtp.a12.kernel/kernel-md-facade/a12internal";

import { OverviewEngineApi } from "../../api.js";
import { UiStateSelector } from "../../../store/index.js";
import { OverviewModel } from "../../../overview-model.js";
import { LocalizerHooks } from "../../hooks/localizer-hooks.js";
import { useFilterContext } from "../../context/filter-context.js";
import { defaultDateRangeConversionTransformer } from "../../../services/index.js";
import { DocumentModelUtils, MultiSelectModelUtils } from "../../../models/internal/shared.js";
import { useOverviewEngineInternalContext } from "../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";
import { RESOURCE_KEYS, OverviewModelKeys, LocalizableFactory } from "../../../services/localization/index.js";

import type { Filter } from "./filter-options-view.js";
import { EmptyLabel } from "./options-views/empty-label.js";
import { useDateTimeFormatString } from "./use-date-time-format-string.js";
import type { NumberFilterOptionsView } from "./options-views/number-filter-options-view.js";
import type { DateTimeViewValue, DateTimeViewSelection } from "./options-views/date-time-filter-view.api.js";

/** @internal */
export function toFilterMap(filters: Filter.FilterData[]): OverviewEngineApi.FilterMap {
	return filters.reduce<{
		[fieldPath: string]: OverviewEngineApi.Filter.Options | undefined;
	}>(
		(acc, filter) => ({
			...acc,
			[filter.id]: filter.filterOptions
		}),
		{}
	);
}

/** @internal */
export function toggleFilterInList(id: string, filters: Filter.FilterData[]): Filter.FilterData[] {
	return filters.map((filter) => (filter.id === id ? { ...filter, active: !filter.active } : filter));
}

/** @internal */
export function getFiltersInList<T extends Filter.FilterData>(
	filters: T[],
	filterIds: string[],
	excludedFilterIds?: string[]
): T[] {
	return filters.filter((f) => filterIds.includes(f.id) && !excludedFilterIds?.includes(f.id));
}

/** @internal */
export function getFiltersNotInList<T extends Filter.FilterData | Filter.SectionData>(
	filters: T[],
	filterIds: string[],
	excludedFilterIds?: string[]
): T[] {
	return filters.filter((f) => !filterIds.includes(f.id) && !excludedFilterIds?.includes(f.id));
}

/** @internal */
export function getFilterIds(filters: Filter.Filters): string[] {
	return filters.map((f) => f.id);
}

/** @internal */
export function getActiveFilters(filters: Filter.FilterData[], excludedFilterIds?: string[]): Filter.FilterData[] {
	return filters.filter((f) => f.active && !excludedFilterIds?.includes(f.id));
}

/** @internal */
export function useFilterOptionsTextBuilder(filters: Filter.FilterData[]) {
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue({ filterMode: true });
	const formatRangeOption = useRangeOptionFormatter();
	const referenceColumns = useOverviewEngineContext((context) => context.referenceColumns);

	const getReferencedSuffix = React.useCallback(
		(column?: OverviewModel.ReferenceColumn) => {
			if (column?.suffixRef) {
				const suffixRefModelPath = documentModelService.getPathById(column.suffixRef);
				const refFilterData = filters.find((f) => ModelPath.equal(f.path, suffixRefModelPath));

				if (
					refFilterData?.filterOptions &&
					OverviewEngineApi.Filter.EnumerationOptions.isInstance(refFilterData.filterOptions)
				) {
					const value = refFilterData.filterOptions.criteria?.selectedValues[0];

					return value && localizedFieldValue(suffixRefModelPath, value, refFilterData.modelId);
				}
			}

			return undefined;
		},
		[documentModelService, filters, localizedFieldValue]
	);

	const EmptyText = React.useCallback(
		({ undefinedMatch }: { undefinedMatch?: boolean }) => {
			return undefinedMatch ? (
				<EmptyLabel inline>{localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.null)}</EmptyLabel>
			) : null;
		},
		[localizedResource]
	);

	return React.useCallback(
		(filterData: Filter.FilterData): React.ReactNode | undefined => {
			const { filterOptions, path } = filterData;
			const column = referenceColumns?.[documentModelService.getByPath(path, filterData.modelId).id];
			const referencedSuffix = getReferencedSuffix(column);

			if (!filterOptions?.criteria && !filterOptions?.undefinedMatch) {
				if (referencedSuffix) {
					return referencedSuffix;
				} else {
					return localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.inactive);
				}
			}

			const element = documentModelService.getByPath(path, filterData.modelId);

			if (element.type === "Field") {
				const fieldType = element.fieldType.type;

				if (
					fieldType === "EnumerationType" &&
					OverviewEngineApi.Filter.EnumerationOptions.isInstance(filterOptions) &&
					filterOptions.criteria
				) {
					return (
						<>
							{filterOptions.undefinedMatch && <EmptyText undefinedMatch />}
							{filterOptions.undefinedMatch && filterOptions.criteria.selectedValues.length > 0 && ", "}
							{filterOptions.criteria.selectedValues
								.map((value) => localizedFieldValue(path, value, filterData.modelId) ?? value)
								.join(", ")}
						</>
					);
				} else if (
					fieldType === "StringType" &&
					OverviewEngineApi.Filter.EnumerationOptions.isInstance(filterOptions) &&
					OverviewEngineApi.Filter.EnumeratedStringOptions.isInstance(filterOptions) &&
					filterOptions.criteria
				) {
					return (
						<>
							{filterOptions.undefinedMatch && <EmptyText undefinedMatch />}
							{filterOptions.undefinedMatch && filterOptions.criteria.selectedValues.length > 0 && ", "}
							{filterOptions.criteria.selectedValues.join(", ")}
						</>
					);
				} else if (filterOptions.undefinedMatch) {
					return <EmptyLabel>{localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.null)}</EmptyLabel>;
				} else if (
					fieldType === "StringType" &&
					OverviewEngineApi.Filter.StringOptions.isInstance(filterOptions) &&
					filterOptions.criteria
				) {
					return filterOptions.criteria.value;
				} else if (
					fieldType === "CustomFieldType" &&
					OverviewEngineApi.Filter.CustomFieldOptions.isInstance(filterOptions) &&
					filterOptions.criteria
				) {
					return filterOptions.criteria.value;
				} else if (
					fieldType === "BooleanType" &&
					OverviewEngineApi.Filter.BooleanOptions.isInstance(filterOptions) &&
					filterOptions.criteria
				) {
					if (filterOptions.criteria.value === null) {
						return <EmptyText undefinedMatch />;
					}

					return localizedFieldValue(path, filterOptions.criteria.value, filterData.modelId);
				} else if (fieldType === "NumberType" && OverviewEngineApi.Filter.NumberOptions.isInstance(filterOptions)) {
					return formatRangeOption(path, filterOptions, column, referencedSuffix, filterData.modelId);
				} else if (
					(fieldType === "DateType" ||
						fieldType === "DateTimeType" ||
						fieldType === "TimeType" ||
						fieldType === "DateRangeType" ||
						fieldType === "DateFragmentType") &&
					OverviewEngineApi.Filter.DateOptions.isInstance(filterOptions)
				) {
					return formatRangeOption(path, filterOptions, column, undefined, filterData.modelId);
				} else if (
					fieldType === "ConfirmType" &&
					OverviewEngineApi.Filter.ConfirmOptions.isInstance(filterOptions) &&
					filterOptions.criteria
				) {
					if (filterOptions.criteria.value === null) {
						return <EmptyText undefinedMatch />;
					}

					return localizedFieldValue(path, filterOptions.criteria.value, filterData.modelId);
				}
			} else {
				const group = documentModelService.getByPath(path, filterData.modelId);

				if (
					OverviewEngineApi.Filter.MultiSelectOptions.isInstance(filterOptions) &&
					MultiSelectModelUtils.isInstance(group) &&
					filterOptions.criteria
				) {
					const field = MultiSelectModelUtils.getField(group);
					const localizedOptions = filterOptions.criteria.selectedValues.map(
						(value) => localizedFieldValue([...path, { elementName: field.name }], value, filterData.modelId) ?? value
					);

					return (
						<>
							{filterOptions.undefinedMatch && <EmptyText undefinedMatch />}
							{filterOptions.undefinedMatch && filterOptions.criteria.selectedValues.length > 0 && ", "}
							{localizedOptions.join(", ")}
						</>
					);
				}
			}

			return undefined;
		},
		[
			EmptyText,
			documentModelService,
			formatRangeOption,
			getReferencedSuffix,
			localizedFieldValue,
			localizedResource,
			referenceColumns
		]
	);
}

/** @internal */
export function hasFilterItemSelected(filters: Filter.FilterData[]): boolean {
	return filters.some((filter) => !filter.active);
}

/** @internal */
export function noFilterItemSelected(filters: Filter.FilterData[]): boolean {
	return filters.every((filter) => !filter.active);
}

function useRangeOptionFormatter() {
	const formatRange = useRangeFormatter();
	const localizedNumberSuffix = LocalizerHooks.useLocalizedNumberSuffix();

	return React.useCallback(
		(
			path: ModelPath,
			options: OverviewEngineApi.Filter.NumberOptions | OverviewEngineApi.Filter.DateOptions,
			column?: OverviewModel.ReferenceColumn,
			referencedSuffix?: string,
			modelId?: string
		): string => {
			if (!options.criteria) {
				throw new Error(`Expect options to be provided with criteria. Actual: ${JSON.stringify(options)}`);
			}

			const { start, end } = options.criteria;
			const { DateTimeTypeOptions, DateTypeOptions } = OverviewEngineApi.Filter.DateOptions;

			if (DateTimeTypeOptions.isInstance(options) || DateTypeOptions.isInstance(options)) {
				return formatRange(path, start, end, options.selectedView, modelId);
			}

			const suffix = localizedNumberSuffix(column, referencedSuffix, { withSpace: true });

			return formatRange(path, start, end, undefined, modelId) + suffix;
		},
		[formatRange, localizedNumberSuffix]
	);
}

function useRangeFormatter() {
	const formatValue = useValueFormatter();

	return React.useCallback(
		(path: ModelPath, start: RangeValue, end: RangeValue, selectedView?: DateTimeViewSelection, modelId?: string) => {
			const definedStart = start !== null && start !== undefined;
			const definedEnd = end !== null && end !== undefined;

			if (definedStart && !definedEnd) {
				return `≥ ${formatValue(path, start, selectedView, modelId)}`;
			}

			if (!definedStart && definedEnd) {
				return `≤ ${formatValue(path, end, selectedView, modelId)}`;
			}

			if (definedStart && definedEnd) {
				const startString = formatValue(path, start, selectedView, modelId);
				const endString = formatValue(path, end, selectedView, modelId);

				if (startString === endString) {
					return startString;
				}

				return `${startString} - ${endString}`;
			}

			return "";
		},
		[formatValue]
	);
}

/** @internal */
export function useLocalizedDateTimeFormatString() {
	const { localizer } = React.useContext(LocalizerContext);

	const getDateTimeFormatString = useDateTimeFormatString();

	return React.useCallback(
		(selectedView: DateTimeViewSelection): string | undefined => {
			const formatString = getDateTimeFormatString(selectedView);

			return localizer(...LocalizableFactory.createDateFormatLocalizables(formatString));
		},
		[getDateTimeFormatString, localizer]
	);
}

/** @internal */
export function useValueFormatter() {
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);
	const getDateTimeFormatString = useDateTimeFormatString();

	return React.useCallback(
		(
			path: ModelPath,
			rangeValue: Date | number,
			selectedView: DateTimeViewSelection | undefined,
			modelId?: string
		): string => {
			if (!selectedView || !(rangeValue instanceof Date)) {
				return converter.formatValue(path, rangeValue, defaultDateRangeConversionTransformer, modelId);
			}

			if (selectedView === "date") {
				const element = documentModelService.getByPath(path, modelId);

				if (element.type === "Field" && element.fieldType.type === "DateType") {
					return converter.formatValue(path, rangeValue, undefined, modelId);
				}
			}

			if (selectedView === "dateTime") {
				return converter.formatValue(path, rangeValue, undefined, modelId);
			}

			const formatString = getDateTimeFormatString(selectedView);

			return KernelUtils.formatDate(rangeValue, formatString, timezone);
		},
		[converter, documentModelService, getDateTimeFormatString, timezone]
	);
}

namespace FilterableElement {
	export function useElementsByFilterMode(): ElementPath[] {
		const filterConfiguration = useOverviewEngineContext(
			(context) => context.overviewModel.content.configuration.filterConfiguration
		);
		const referenceColumns = useOverviewEngineContext((context) => context.referenceColumns);
		const suffixElements = React.useMemo(() => {
			const result: OverviewModel.FieldConfiguration[] = [];

			for (const column of referenceColumns ? Object.values(referenceColumns) : []) {
				if (column?.suffixRef) {
					result.push({ fieldId: column.suffixRef });
				}
			}

			return result;
		}, [referenceColumns]);
		const allFilterableElements = useElementsFromDocumentModel();

		return React.useMemo(() => {
			switch (filterConfiguration?.filterMode) {
				case OverviewModel.FilterMode.ALL_COLUMNS:
					return getElementsFromList(allFilterableElements, [
						...Object.keys(referenceColumns ?? {}).map((item) => {
							return { fieldId: item };
						}),
						...suffixElements
					]);
				case OverviewModel.FilterMode.CUSTOM_LIST:
					if (!filterConfiguration.fields?.length) {
						throw new Error("Fields can not undefined or empty in CUSTOM_LIST mode");
					}

					return getElementsFromList(allFilterableElements, [...filterConfiguration.fields, ...suffixElements]);
				case OverviewModel.FilterMode.ALL:
					return excludeMetaGroupFromList(allFilterableElements);
				case OverviewModel.FilterMode.ALL_WITH_META:
				default:
					return allFilterableElements;
			}
		}, [
			filterConfiguration?.filterMode,
			filterConfiguration?.fields,
			allFilterableElements,
			referenceColumns,
			suffixElements
		]);
	}

	function getElementsFromList(elements: ElementPath[], idList: OverviewModel.FieldConfiguration[]): ElementPath[] {
		const uniqueIdList = new Set(idList);

		return Array.from(uniqueIdList).reduce<ElementPath[]>((result, { fieldId }) => {
			const match = elements.find(({ element }) => element.id === fieldId);

			return match ? [...result, match] : result;
		}, []);
	}

	function excludeMetaGroupFromList(elements: ElementPath[], metaGroupName = "__meta") {
		return elements.filter(({ path }) => {
			const [rootElement] = path;

			if (rootElement.elementName === metaGroupName) {
				return false;
			}

			return true;
		});
	}

	/** @internal */
	export function useElementsFromDocumentModel(): ElementPath[] {
		const documentModel = useOverviewEngineContext((context) => context.documentModel);
		const subDocumentModels = useOverviewEngineContext((context) => context.subDocumentModels);

		return React.useMemo(() => {
			const filterableElements: ElementPath[] = [];

			function collectElementsFromModel(model: DocumentModel) {
				const elementStack: ElementPath[] = [{ path: [], element: model.content.modelRoot, modelId: model.header.id }];

				while (elementStack.length > 0) {
					const topElement = elementStack.pop();

					if (!topElement) {
						break;
					}

					const { element, path, modelId } = topElement;

					if (isFilterableElement(element)) {
						filterableElements.push({ path, element, modelId });
					} else if (isExplorableGroup(element)) {
						const childrenElement = element.elements.map((childElement) => ({
							path: [...path, { elementName: childElement.name }],
							element: childElement,
							modelId
						}));
						childrenElement.reverse();
						elementStack.push(...childrenElement);
					}
				}
			}

			collectElementsFromModel(documentModel);

			if (subDocumentModels && Array.isArray(subDocumentModels)) {
				for (const subModel of subDocumentModels) {
					collectElementsFromModel(subModel);
				}
			}

			return uniqBy(filterableElements, ({ path }) => ModelPath.toString(path));
		}, [documentModel, subDocumentModels]);
	}

	function isFilterableElement(element: DocumentModel.Element) {
		return element.type === "Field" || (element.type === "Group" && MultiSelectModelUtils.isInstance(element));
	}

	function isExplorableGroup(element: DocumentModel.Element): element is DocumentModel.Group {
		return (
			element.type === "Group" &&
			!DocumentModelUtils.isAttachment(element) &&
			!MultiSelectModelUtils.isNotSupportedInstance(element)
		);
	}

	export interface ElementPath {
		readonly path: ModelPath;
		readonly element: DocumentModel.Element;
		/**
		 * The ID of the model this element belongs to.
		 * @description
		 *  If not specified, the element is assumed to belong to the document model reference.
		 */
		readonly modelId?: string;
	}
}

function useFilterDataConverter() {
	const referenceColumns = useOverviewEngineContext((context) => context.referenceColumns);
	const localizedFieldLabel = LocalizerHooks.useLocalizedFieldLabel();
	const localizedColumnLabel = LocalizerHooks.useLocalizedColumnLabel();
	const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());

	return React.useCallback(
		({ path, element, modelId }: FilterableElement.ElementPath): Filter.FilterData | undefined => {
			if (!activeFilters) {
				return;
			}

			const referenceColumn = referenceColumns?.[element.id];
			const columnLabel = referenceColumn ? localizedColumnLabel(referenceColumn) : "";
			const id = ModelPath.toString(path);

			return {
				id,
				path,
				modelId,
				label: columnLabel || localizedFieldLabel(path, modelId),
				active: Object.keys(activeFilters).includes(id),
				filterOptions: activeFilters[id],
				nonRemovable: activeFilters[id]?.nonRemovable
			} satisfies Filter.FilterData;
		},
		[activeFilters, localizedColumnLabel, localizedFieldLabel, referenceColumns]
	);
}

/** @internal */
export function useFlattenedFilters(): Filter.FilterData[] {
	const enableFilter = useOverviewEngineContext((context) => context.overviewModel.content.configuration.enableFilter);
	const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());
	const enumeratedStringFilterMap = useOverviewEngineState(UiStateSelector.enumeratedStringFilterMap());
	const convertFilterData = useFilterDataConverter();
	const elementsByFilterMode = FilterableElement.useElementsByFilterMode();

	return React.useMemo(() => {
		if (!enableFilter || (!activeFilters && !enumeratedStringFilterMap)) {
			return [];
		}

		const listFilterData: Filter.FilterData[] = [];

		for (const elementPath of elementsByFilterMode) {
			const filterData = convertFilterData(elementPath);

			if (filterData) {
				listFilterData.push(filterData);
			}
		}

		return listFilterData;
	}, [enableFilter, activeFilters, enumeratedStringFilterMap, elementsByFilterMode, convertFilterData]);
}

/**
 * @internal
 * Collect filters that are not supposed to be displayed in filter list because these filters shall be nested within other filters.
 * */
export function useExcludedFilterIds() {
	const overviewModel = useOverviewEngineContext((context) => context.overviewModel);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

	return React.useMemo(() => {
		const referencedFieldsViaSuffix: string[] = [];
		overviewModel.content.columns.forEach((column) => {
			if (OverviewModel.ReferenceColumn.isAssignableFrom(column) && column.suffixRef) {
				const suffixRefPath = documentModelService.getPathById(column.suffixRef);
				referencedFieldsViaSuffix.push(ModelPath.toString(suffixRefPath));
			}
		});

		return referencedFieldsViaSuffix;
	}, [documentModelService, overviewModel.content.columns]);
}

/** @internal */
export function useSectionData(): Filter.SectionData[] {
	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const sectionData = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.filterConfiguration?.sectionData
	);
	const convertFilterData = useFilterDataConverter();
	const elementPaths = FilterableElement.useElementsFromDocumentModel();

	return React.useMemo(() => {
		if (!sectionData) {
			return [];
		}

		return sectionData.map(({ id, label, fields }) => {
			const filters: Filter.FilterData[] = [];
			elementPaths
				.filter(({ element, modelId }) =>
					fields.some(({ fieldId, subModel }) => fieldId === element.id && (subModel ? subModel === modelId : true))
				)
				.forEach((elementPath) => {
					const filterData = convertFilterData(elementPath);

					if (filterData) {
						filters.push(filterData);
					}
				});

			const sectionLabel = localizedOverviewElement(
				[OverviewModelKeys.FILTER_SELECTOR, OverviewModelKeys.SECTION_DATA],
				label
			);

			return {
				id,
				label: sectionLabel,
				filters
			};
		});
	}, [elementPaths, convertFilterData, localizedOverviewElement, sectionData]);
}

type RangeValue = Date | number | null | undefined;

/** @internal */
export function useIsRangeInputEmpty(uiValue: DateTimeViewValue | NumberFilterOptionsView.NumberUiValueType) {
	return React.useMemo<boolean>(
		() => uiValue.start?.input === "" && uiValue.end?.input === "",
		[uiValue.end?.input, uiValue.start?.input]
	);
}

/** @internal */
export function useSuffixFilterDataGetter(filters?: Filter.FilterData[]) {
	const filtersContext = useFilterContext();
	const filtersData = filters ?? filtersContext;

	const referenceColumns = useOverviewEngineContext((context) => context.referenceColumns);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

	type ReturnedTuple = [Filter.FilterData | undefined, DocumentModel.EnumerationType | undefined];

	return React.useCallback(
		(path: ModelPath, modelId?: string): ReturnedTuple => {
			const element = documentModelService.getByPath(path, modelId);
			const columnModel = referenceColumns?.[element.id];
			let suffixFieldType: DocumentModel.EnumerationType | undefined;
			let refFilterData: Filter.FilterData | undefined;

			if (columnModel?.suffixRef) {
				const suffixRefModelPath = documentModelService.getPathById(columnModel.suffixRef, modelId);
				const element = documentModelService.getByPath(suffixRefModelPath, modelId);

				if (element.type === "Field" && element.fieldType.type === "EnumerationType") {
					suffixFieldType = element.fieldType;
					refFilterData = filtersData.find((f: Filter.FilterData) => ModelPath.equal(f.path, suffixRefModelPath));
				}
			}

			return [refFilterData, suffixFieldType];
		},
		[documentModelService, filtersData, referenceColumns]
	);
}
