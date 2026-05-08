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

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { formatDate } from "@com.mgmtp.a12.kernel/kernel-md-facade/a12internal";
import { Locale, type LocalizedText } from "@com.mgmtp.a12.utils/utils-localization";

import { OverviewEngineApi } from "../../../view/api.js";
import { type ModelsState } from "../../../store/index.js";
import { toConditionalArray } from "../../../view/utils.js";
import { DocumentModelUtils, MultiSelectModelUtils } from "../../../models/internal/shared.js";
import { DateTimeUtils } from "../../../view/components/filters/options-views/date-time-utils.js";

import { assertCondition } from "./assertion.js";
import { getTargetDocumentModel } from "./document-model-utils.js";

/** @experimental */
export namespace FieldBasedFiltering {
	export function toOperators(
		fieldBasedFilters: OverviewEngineApi.FilterMap,
		modelsState: ModelsState,
		locale: Locale
	): Query.Operator[] {
		const filters: (Query.Operator | undefined)[] = [];

		for (const [key, filter] of Object.entries(fieldBasedFilters)) {
			if (filter === undefined) {
				continue;
			}

			const targetDocumentModel = getTargetDocumentModel(modelsState, filter.modelId);

			if (OverviewEngineApi.Filter.StringOptions.isInstance(filter)) {
				filters.push(convertStringFilterOptions(key, filter, targetDocumentModel));
			} else if (OverviewEngineApi.Filter.DateOptions.isInstance(filter)) {
				filters.push(convertDateFilterOptions(key, filter, targetDocumentModel));
			} else if (OverviewEngineApi.Filter.NumberOptions.isInstance(filter)) {
				filters.push(convertNumberFilterOptions(key, filter));
			} else if (OverviewEngineApi.Filter.EnumerationOptions.isInstance(filter)) {
				filters.push(convertEnumerationFilterOptions(key, filter, targetDocumentModel, locale));
			} else if (OverviewEngineApi.Filter.MultiSelectOptions.isInstance(filter)) {
				filters.push(convertMultiSelectFilterOptions(key, filter, targetDocumentModel, locale));
			} else if (OverviewEngineApi.Filter.BooleanOptions.isInstance(filter)) {
				filters.push(convertBooleanFilterOptions(key, filter));
			} else if (OverviewEngineApi.Filter.ConfirmOptions.isInstance(filter)) {
				filters.push(convertConfirmFilterOptions(key, filter));
			} else if (OverviewEngineApi.Filter.CustomFieldOptions.isInstance(filter)) {
				filters.push(convertCustomFieldFilterOptions(key, filter));
			}
		}

		return filters.filter(isNotNullOrUndefined);
	}

	function isNotNullOrUndefined<T>(x: T | null | undefined): x is T {
		return x !== undefined && x !== null;
	}

	function convertStringFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.StringOptions,
		documentModel: DocumentModel
	): Query.Operator | undefined {
		if (undefinedMatch) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key };
		}

		if (!criteria) {
			return undefined;
		}

		const field = DocumentModelUtils.findElementByFilterId(documentModel, key);

		const substringSearch =
			field?.annotations?.find(({ name }) => name === "enable_approximate_match_search")?.value === "true";
		const caseInsensitiveSearch =
			field?.annotations?.find(({ name }) => name === "enable_case_insensitive_search")?.value === "true";

		const caseSensitive = !caseInsensitiveSearch;

		if (substringSearch) {
			return {
				operator: Query.OPERATORS.AND_OPERATOR,
				operands: criteria.value.split(/\s+/).map((subValue) => {
					return {
						operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
						fields: [key],
						value: subValue
					} satisfies Query.SimpleSearchOperator;
				})
			};
		}

		return {
			operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
			field: key,
			value: criteria.value,
			caseSensitive
		} satisfies Query.ExactMatchOperator;
	}

	function getRange<T>({ start, end }: { readonly start?: T | null; readonly end?: T | null }): {
		from: T | undefined;
		to: T | undefined;
	} {
		return { from: start ?? undefined, to: end ?? undefined };
	}

	function convertDateFilterOptions(
		key: string,
		dateOptions: OverviewEngineApi.Filter.DateOptions,
		documentModel: DocumentModel
	): Query.DateRangeOperator | Query.DateFragmentRangeOperator | Query.UndefinedMatchOperator | undefined {
		const { criteria, undefinedMatch } = dateOptions;

		if (undefinedMatch) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key };
		}

		if (!criteria?.start && !criteria?.end) {
			return undefined;
		}

		const timeZone = documentModel.content.modelConfig.timeZone;
		const formatString = getFormatString(key, documentModel);
		const convertedStart = criteria?.start ? formatDate(criteria.start, formatString, timeZone) : undefined;
		const convertedEnd = criteria?.end ? formatDate(criteria.end, formatString, timeZone) : undefined;
		const operator =
			dateOptions.type === "DateFragment"
				? Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR
				: Query.OPERATORS.DATE_RANGE_OPERATOR;

		return { operator, field: key, ...getRange({ start: convertedStart, end: convertedEnd }) };
	}

	function convertNumberFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.NumberOptions
	): Query.Operator | undefined {
		if (undefinedMatch) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key };
		}

		return criteria !== undefined
			? { operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR, field: key, ...getRange(criteria) }
			: undefined;
	}

	function convertEnumerationFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.EnumerationOptions,
		documentModel: DocumentModel,
		locale: Locale
	): Query.Operator | undefined {
		if (criteria === undefined) {
			return undefinedMatch ? { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key } : undefined;
		}

		if (criteria.selectedValues.length === 1 && !undefinedMatch) {
			const value = criteria.selectedValues[0];
			const label = toLabel(documentModel, key, locale, value) ?? value;

			return {
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: key,
				value: label,
				caseSensitive: true
			} satisfies Query.ExactMatchOperator;
		}

		if (criteria.selectedValues.length === 0 && undefinedMatch) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key };
		}

		const selectedValuesOperands: Query.ExactMatchOperator[] = criteria.selectedValues.map((value) => {
			const label = toLabel(documentModel, key, locale, value) ?? value;

			return { operator: Query.OPERATORS.EXACT_MATCH_OPERATOR, field: key, value: label, caseSensitive: true };
		});

		return {
			operator: Query.OPERATORS.OR_OPERATOR,
			operands: [
				...selectedValuesOperands,
				...toConditionalArray(!!undefinedMatch, { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key })
			]
		};
	}

	function convertMultiSelectFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.MultiSelectOptions,
		documentModel: DocumentModel,
		locale: Locale
	): Query.Operator | undefined {
		const multiSelectGroup = DocumentModelUtils.findElementByFilterId(documentModel, key);
		assertCondition(MultiSelectModelUtils.isInstance(multiSelectGroup));

		const field = `${key}/${MultiSelectModelUtils.getField(multiSelectGroup).name}`;

		if (!criteria) {
			return undefinedMatch ? { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field } : undefined;
		}

		const selectedValuesOperands = criteria.selectedValues.map((value) => {
			return {
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field,
				value: toLabel(documentModel, field, locale, value) ?? value,
				caseSensitive: true
			};
		});

		if (selectedValuesOperands.length === 1 && !undefinedMatch) {
			return selectedValuesOperands[0];
		}

		if (selectedValuesOperands.length === 0 && undefinedMatch) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field };
		}

		return {
			operator: criteria.operation,
			operands: [
				...selectedValuesOperands,
				...toConditionalArray(!!undefinedMatch, { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field })
			]
		};
	}

	function convertBooleanFilterOptions(
		key: string,
		{ criteria }: OverviewEngineApi.Filter.BooleanOptions
	): Query.Operator | undefined {
		if (criteria === undefined) {
			return undefined;
		}

		const { value } = criteria;
		const [matchTrueOperator, matchFalseOperator]: Query.ExactMatchOperator[] = [true, false].map((value) => {
			return {
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: key,
				value: String(value),
				caseSensitive: true
			};
		});

		if (value === null) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key };
		}

		return value ? matchTrueOperator : matchFalseOperator;
	}

	function convertConfirmFilterOptions(
		key: string,
		{ criteria }: OverviewEngineApi.Filter.ConfirmOptions
	): Query.Operator | undefined {
		if (criteria === undefined) {
			return undefined;
		}

		const matchTrueOperator: Query.ExactMatchOperator = {
			operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
			field: key,
			value: "true",
			caseSensitive: true
		};

		if (criteria.value === null) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key };
		}

		if (criteria.value) {
			return matchTrueOperator;
		}

		throw new Error(`Confirm filter value is not supported for "${key}". Got: ${criteria.value}`);
	}

	function convertCustomFieldFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.CustomFieldOptions
	): Query.Operator | undefined {
		if (undefinedMatch) {
			return { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: key };
		}

		if (!criteria) {
			return undefined;
		}

		return { operator: Query.OPERATORS.EXACT_MATCH_OPERATOR, field: key, value: criteria.value, caseSensitive: true };
	}

	/**
	 * Convert the value into localized filterable text
	 */
	function toLabel(documentModel: DocumentModel, fieldKey: string, locale: Locale, value: string): string | undefined {
		const enumeratedField = DocumentModelUtils.findElementByFilterId(documentModel, fieldKey);

		if (enumeratedField.type === "Field" && enumeratedField.fieldType.type === "EnumerationType") {
			const values = enumeratedField.fieldType.values;
			const label = values.find((candidate) => candidate.value === value)?.label;

			return label?.find(localizedTextMatcher(locale))?.text;
		}

		return value;
	}

	/**
	 * Checks if the given `locale` matches the `localizedText`,
	 * it also performs additional check against the `PartialLocale`
	 */
	function localizedTextMatcher(locale: Locale) {
		return (localizedText: LocalizedText) => {
			return locale.language === localizedText.locale || Locale.toString(locale) === localizedText.locale;
		};
	}

	function getFormatString(filterId: string, documentModel: DocumentModel) {
		const field = DocumentModelUtils.findElementByFilterId(documentModel, filterId);

		if (field.type !== "Field") {
			throw new Error(`Cannot get formatString, element ${filterId} is not a field.`);
		}

		return DateTimeUtils.getDateTimeFormat(field.fieldType);
	}
}
