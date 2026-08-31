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

import { useMemo, useContext, useCallback, type ReactNode } from "react";

import { styled } from "styled-components";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { DateTimeContext } from "@com.mgmtp.a12.widgets/widgets-core";

import { isFieldBasedFilterModelItem } from "../../../../models/filter-model-utils.js";
import type { OverviewModel } from "../../../../overview-model.js";
import { defaultDateRangeConversionTransformer } from "../../../../services/index.js";
import { RESOURCE_KEYS, OverviewModelKeys } from "../../../../services/localization/index.js";
import type { FilterItemState } from "../../../../store/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useDateTimeFormatString } from "../../filters/use-date-time-format-string.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";

export function useFilterLabelResolver() {
	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const localizedFieldLabel = LocalizerHooks.useLocalizedFieldLabel();
	const documentModelService = useOverviewEngineInternalContext((c) => c.documentModelService);

	return useCallback(
		(filterItem: OverviewModel.NewFilter.Item) => {
			const explicitLabel = localizedOverviewElement(
				[OverviewModelKeys.FILTER_SELECTOR, OverviewModelKeys.TITLE],
				filterItem.label
			);

			if (explicitLabel) {
				return explicitLabel;
			}

			if (isFieldBasedFilterModelItem(filterItem)) {
				const path = documentModelService.getPathById(filterItem.options.fieldId, filterItem.options.subModel);

				return localizedFieldLabel(path, filterItem.options.subModel);
			}

			return "";
		},
		[documentModelService, localizedFieldLabel, localizedOverviewElement]
	);
}

export function useQueryFilterDescriptionResolver() {
	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();

	return useCallback(
		(filterItem: OverviewModel.NewFilter.Query.Item) => {
			return (
				localizedOverviewElement(
					[OverviewModelKeys.FILTER_SELECTOR, OverviewModelKeys.TITLE],
					filterItem.description
				) || ""
			);
		},
		[localizedOverviewElement]
	);
}

export function useFilterGroupLabelResolver() {
	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();

	return useCallback(
		(filterGroup: OverviewModel.NewFilter.Group) => {
			return (
				localizedOverviewElement([OverviewModelKeys.FILTER_SELECTOR, OverviewModelKeys.TITLE], filterGroup.label) || ""
			);
		},
		[localizedOverviewElement]
	);
}

export function useFilterDisplayValueResolver() {
	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue({ filterMode: true });
	const localizeResource = LocalizerHooks.useLocalizedResource();
	const { locale } = useContext(DateTimeContext);

	const filterStateSelectors = useFilterSelectors();
	const converter = useOverviewEngineInternalContext((c) => c.converter);
	const documentModel = useOverviewEngineContext((c) => c.documentModel);
	const documentModelService = useOverviewEngineInternalContext((c) => c.documentModelService);
	const getDateTimeFormatString = useDateTimeFormatString();

	return useCallback(
		(filterState: FilterItemState): ReactNode => {
			const options = filterState.options as { empty?: { enabled: boolean; value: boolean } };

			if (options.empty?.enabled && options.empty.value) {
				return <EmptyChipLabel>{localizeResource(RESOURCE_KEYS.overviewEngine.newFilter.emptyValue)}</EmptyChipLabel>;
			}

			return filterStateSelectors.toLabel(filterState, {
				documentModel,
				fieldPath: "",
				locale,
				getDateTimeFormat: ({ kind }) => getDateTimeFormatString(kind),
				formatValue: ({ value, fieldPath, subModel }) =>
					converter.formatValue(
						ModelPath.fromString(fieldPath),
						value,
						defaultDateRangeConversionTransformer,
						subModel
					),
				localizeValue: ({ value, fieldPath }) =>
					fieldPath ? localizedFieldValue(ModelPath.fromString(fieldPath), value) : String(value),
				localizeResource: ({ key, values }) => localizeResource(key, values),
				getElementByPath: ({ fieldPath, subModel }) =>
					documentModelService.getByPath(ModelPath.fromString(fieldPath), subModel)
			});
		},
		[
			filterStateSelectors,
			converter,
			documentModel,
			documentModelService,
			getDateTimeFormatString,
			locale,
			localizedFieldValue,
			localizeResource
		]
	);
}

export function useTargetModelId(filterState: FilterItemState): string {
	const documentModelId = useOverviewEngineContext((c) => c.documentModel.header.id);

	return useMemo(() => {
		const subModel = isFieldBasedFilterModelItem(filterState.model) ? filterState.model.options.subModel : undefined;

		return subModel ?? documentModelId;
	}, [documentModelId, filterState.model]);
}

const EmptyChipLabel = styled.span`
	font-style: italic;
`;
