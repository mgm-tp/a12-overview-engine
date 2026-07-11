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

import { produce, type WritableDraft } from "immer";

import type { OverviewModel } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import {
	isDateFilterModelItem,
	isTimeFilterModelItem,
	isQueryFilterModelItem,
	isNumberFilterModelItem,
	isStringFilterModelItem,
	isBooleanFilterModelItem,
	isConfirmFilterModelItem,
	isDateTimeFilterModelItem,
	isEnumerationFilterModelItem,
	isMultiSelectFilterModelItem,
	isDateFragmentFilterModelItem
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

export function updateFilter<T extends OverviewModel.NewFilter.Item>(
	model: OverviewModel,
	options: {
		filterId: string;
		isInstance: (filterItem: OverviewModel.NewFilter.Item) => filterItem is T;
		modifier: (filterItem: WritableDraft<T>) => void;
	}
): OverviewModel {
	const { filterId, isInstance, modifier } = options;

	return produce(model, (draft) => {
		for (const group of draft.content.configuration.newFilterConfiguration?.filterGroups ?? []) {
			const filterItem = group.filterItems.find((item) => item.id === filterId);

			if (!filterItem) {
				continue;
			}

			if (!isInstance(filterItem)) {
				throw new Error(`Filter with ID ${filterId} is not of the expected type.`);
			}

			modifier(filterItem as WritableDraft<T>);
			break;
		}
	});
}

type Modifier<T> = (filterItem: WritableDraft<T>) => void;

export function updateBooleanFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.Boolean.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isBooleanFilterModelItem, modifier });
}

export function updateStringFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.String.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isStringFilterModelItem, modifier });
}

export function updateNumberFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.Number.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isNumberFilterModelItem, modifier });
}

export function updateDateFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.Date.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isDateFilterModelItem, modifier });
}

export function updateDateTimeFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.DateTime.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isDateTimeFilterModelItem, modifier });
}

export function updateDateFragmentFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.DateFragment.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isDateFragmentFilterModelItem, modifier });
}

export function updateTimeFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.Time.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isTimeFilterModelItem, modifier });
}

export function updateEnumerationFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.Enumeration.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isEnumerationFilterModelItem, modifier });
}

export function updateMultiSelectFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.MultiSelect.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isMultiSelectFilterModelItem, modifier });
}

export function updateQueryFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.Query.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isQueryFilterModelItem, modifier });
}

export function updateConfirmFilter(
	model: OverviewModel,
	filterId: string,
	modifier: Modifier<OverviewModel.NewFilter.Confirm.Item>
): OverviewModel {
	return updateFilter(model, { filterId, isInstance: isConfirmFilterModelItem, modifier });
}

export function overrideFilterConfiguration(
	model: OverviewModel,
	overrides: Partial<OverviewModel.NewFilterConfiguration>
): OverviewModel {
	return produce(model, (draft) => {
		const config = draft.content.configuration.newFilterConfiguration;

		if (!config) {
			throw new Error("Model has no newFilterConfiguration to override.");
		}

		Object.assign(config, overrides);
	});
}

export function replaceFilterItem(
	model: OverviewModel,
	replacement: OverviewModel.NewFilter.Item,
	groupId?: string
): OverviewModel {
	return produce(model, (draft) => {
		const groups = draft.content.configuration.newFilterConfiguration?.filterGroups ?? [];

		const targetGroup = groupId
			? groups.find((group) => group.id === groupId)
			: (groups.find((group) => group.filterItems.some((item) => item.id === replacement.id)) ?? groups[0]);

		if (!targetGroup) {
			throw new Error(`No filter group available to host replacement filter '${replacement.id}'.`);
		}

		const existingIndex = targetGroup.filterItems.findIndex((item) => item.id === replacement.id);

		if (existingIndex === -1) {
			targetGroup.filterItems.push(replacement as WritableDraft<OverviewModel.NewFilter.Item>);
		} else {
			targetGroup.filterItems[existingIndex] = replacement as WritableDraft<OverviewModel.NewFilter.Item>;
		}
	});
}

export function setFilterItems(model: OverviewModel, items: readonly OverviewModel.NewFilter.Item[]): OverviewModel {
	return produce(model, (draft) => {
		const config = draft.content.configuration.newFilterConfiguration;

		if (!config) {
			throw new Error("Model has no newFilterConfiguration; cannot set isolated filter items.");
		}

		config.filterGroups = [
			{
				id: "test-group",
				name: "test-group",
				filterItems: items as WritableDraft<OverviewModel.NewFilter.Item[]>
			}
		];
	});
}
