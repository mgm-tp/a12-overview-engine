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
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { formatDate } from "@com.mgmtp.a12.kernel/kernel-md-facade/a12internal";

import { OverviewEngineApi } from "../../../view/api.js";
import type { ModelsState } from "../../../store/index.js";
import { getDateTimeFormat } from "../../../services/index.js";
import { DocumentModelUtils, MultiSelectModelUtils } from "../../../models/internal/shared.js";
import {
	ENABLE_CASE_INSENSITIVE_SEARCH_ANNOTATION,
	ENABLE_APPROXIMATE_MATCH_SEARCH_ANNOTATION
} from "../../../shared/constants.js";

import { assertCondition } from "./assertion.js";
import { getTargetDocumentModel } from "./document-model-utils.js";

/** @experimental */
export namespace FieldBasedFiltering {
	export function toOperators(
		fieldBasedFilters: OverviewEngineApi.FilterMap,
		modelsState: ModelsState
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
				filters.push(convertEnumerationFilterOptions(key, filter));
			} else if (OverviewEngineApi.Filter.MultiSelectOptions.isInstance(filter)) {
				filters.push(convertMultiSelectFilterOptions(key, filter, targetDocumentModel));
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
			return QueryBuilder.undefinedMatch(key).build();
		}

		if (!criteria) {
			return undefined;
		}

		const field = DocumentModelUtils.findElementByPath(documentModel, key);

		const substringSearch =
			field?.annotations?.find(({ name }) => name === ENABLE_APPROXIMATE_MATCH_SEARCH_ANNOTATION)?.value === "true";
		const caseInsensitiveSearch =
			field?.annotations?.find(({ name }) => name === ENABLE_CASE_INSENSITIVE_SEARCH_ANNOTATION)?.value === "true";

		if (substringSearch) {
			return QueryBuilder.and(
				...criteria.value.split(/\s+/).map((word) => QueryBuilder.simpleSearch(word, [key]))
			).build();
		}

		return QueryBuilder.exactMatch(key, criteria.value, !caseInsensitiveSearch).build();
	}

	function convertDateFilterOptions(
		key: string,
		dateOptions: OverviewEngineApi.Filter.DateOptions,
		documentModel: DocumentModel
	): Query.Operator | undefined {
		const { criteria, undefinedMatch } = dateOptions;

		if (undefinedMatch) {
			return QueryBuilder.undefinedMatch(key).build();
		}

		if (!criteria?.start && !criteria?.end) {
			return undefined;
		}

		const timeZone = documentModel.content.modelConfig.timeZone;
		const formatString = getFormatString(key, documentModel);
		const from = criteria?.start ? formatDate(criteria.start, formatString, timeZone) : undefined;
		const to = criteria?.end ? formatDate(criteria.end, formatString, timeZone) : undefined;

		return dateOptions.type === "DateFragment"
			? QueryBuilder.dateFragmentRange(key, from, to).build()
			: QueryBuilder.dateRange(key, from, to).build();
	}

	function convertNumberFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.NumberOptions
	): Query.Operator | undefined {
		if (undefinedMatch) {
			return QueryBuilder.undefinedMatch(key).build();
		}

		return criteria !== undefined
			? QueryBuilder.doubleRange(key, criteria.start ?? undefined, criteria.end ?? undefined).build()
			: undefined;
	}

	function convertEnumerationFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.EnumerationOptions
	): Query.Operator | undefined {
		if (criteria === undefined) {
			return undefinedMatch ? QueryBuilder.undefinedMatch(key).build() : undefined;
		}

		return QueryBuilder.or(
			...criteria.selectedValues.map((value) => QueryBuilder.exactMatch(key, value)),
			undefinedMatch ? QueryBuilder.undefinedMatch(key) : undefined
		).build();
	}

	function convertMultiSelectFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.MultiSelectOptions,
		documentModel: DocumentModel
	): Query.Operator | undefined {
		const multiSelectGroup = DocumentModelUtils.findElementByPath(documentModel, key);
		assertCondition(MultiSelectModelUtils.isInstance(multiSelectGroup));

		const field = `${key}/${MultiSelectModelUtils.getField(multiSelectGroup).name}`;

		if (!criteria || criteria.selectedValues.length === 0) {
			return undefinedMatch ? QueryBuilder.undefinedMatch(field).build() : undefined;
		}

		const selectedOperands = criteria.selectedValues.map((value) => QueryBuilder.exactMatch(field, value));
		const undefinedOperand = undefinedMatch ? QueryBuilder.undefinedMatch(field) : undefined;

		const combine = criteria.operation === Query.OPERATORS.AND_OPERATOR ? QueryBuilder.and : QueryBuilder.or;

		return combine(...selectedOperands, undefinedOperand).build();
	}

	function convertBooleanFilterOptions(
		key: string,
		{ criteria }: OverviewEngineApi.Filter.BooleanOptions
	): Query.Operator | undefined {
		if (criteria === undefined) {
			return undefined;
		}

		if (criteria.value === null) {
			return QueryBuilder.undefinedMatch(key).build();
		}

		return QueryBuilder.exactMatch(key, String(criteria.value)).build();
	}

	function convertConfirmFilterOptions(
		key: string,
		{ criteria }: OverviewEngineApi.Filter.ConfirmOptions
	): Query.Operator | undefined {
		if (criteria === undefined) {
			return undefined;
		}

		if (criteria.value === null) {
			return QueryBuilder.undefinedMatch(key).build();
		}

		if (criteria.value) {
			return QueryBuilder.exactMatch(key, "true").build();
		}

		throw new Error(`Confirm filter value is not supported for "${key}". Got: ${criteria.value}`);
	}

	function convertCustomFieldFilterOptions(
		key: string,
		{ criteria, undefinedMatch }: OverviewEngineApi.Filter.CustomFieldOptions
	): Query.Operator | undefined {
		if (undefinedMatch) {
			return QueryBuilder.undefinedMatch(key).build();
		}

		if (!criteria) {
			return undefined;
		}

		return QueryBuilder.exactMatch(key, criteria.value).build();
	}

	function getFormatString(filterId: string, documentModel: DocumentModel) {
		const field = DocumentModelUtils.findElementByPath(documentModel, filterId);

		if (field.type !== "Field") {
			throw new Error(`Cannot get formatString, element ${filterId} is not a field.`);
		}

		return getDateTimeFormat(field.fieldType);
	}
}
