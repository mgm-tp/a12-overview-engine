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

import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";
import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { OverviewModel } from "../../../overview-model.js";
import type { MultiSelectFilterState } from "../filter-state.js";
import { isMultiSelectFilterModelItem } from "../../../models/filter-model-utils.js";
import { DocumentModelUtils, MultiSelectModelUtils } from "../../../models/internal/shared.js";

import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

/** @internal */
export class MultiSelectFilterController implements FilterController<
	OverviewModel.NewFilter.MultiSelect.Item,
	MultiSelectFilterState.Options,
	MultiSelectFilterState.Options
> {
	hasErrors(_model: OverviewModel.NewFilter.Item, _runtimeOptions: MultiSelectFilterState.Options): boolean {
		return false;
	}

	toOperator(
		_model: OverviewModel.NewFilter.MultiSelect.Item,
		options: MultiSelectFilterState.Options,
		{ documentModel, fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { empty, invert, criteria } = options;
		const multiSelectGroup = DocumentModelUtils.findElementByPath(documentModel, fieldPath);

		if (!multiSelectGroup || !MultiSelectModelUtils.isInstance(multiSelectGroup)) {
			return undefined;
		}

		const multiSelectField = MultiSelectModelUtils.getField(multiSelectGroup);
		const field = `${fieldPath}/${multiSelectField.name}`;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(field)
				.not(invert.enabled && invert.value)
				.build();
		}

		const matchOperator = options.matchOperator.enabled ? options.matchOperator.value : "and";
		const operands = criteria.map((value) => QueryBuilder.exactMatch(field, value));
		const builder = matchOperator === "and" ? QueryBuilder.and(...operands) : QueryBuilder.or(...operands);

		return builder.not(invert.enabled && invert.value).build();
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isMultiSelectFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.MultiSelect.Item,
		_runtimeOptions: MultiSelectFilterState.Options,
		defaultOptions: MultiSelectFilterState.Options
	): MultiSelectFilterState.Options {
		return defaultOptions;
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.MultiSelect.Item): MultiSelectFilterState.Options {
		return {
			empty: filterItem.options.empty,
			invert: filterItem.options.invert,
			matchOperator: filterItem.options.matchOperator,
			criteria: filterItem.options.criteria ?? []
		};
	}

	isConfigurable(model: OverviewModel.NewFilter.MultiSelect.Item): boolean {
		return model.options.empty.enabled || model.options.invert.enabled || model.options.matchOperator.enabled;
	}

	toLabel(
		model: OverviewModel.NewFilter.MultiSelect.Item,
		options: MultiSelectFilterState.Options,
		{ localizeValue, getElementByPath, fieldPath }: FilterLabelContext
	): string | readonly string[] | null {
		if (fieldPath === "") {
			return null;
		}

		const group = getElementByPath({ fieldPath, subModel: model.options.subModel });

		if (!group || !MultiSelectModelUtils.isInstance(group)) {
			return null;
		}

		const field = MultiSelectModelUtils.getField(group);
		const localizedOptions = options.criteria.map((value) =>
			localizeValue({ value, fieldPath: fieldPath + "/" + field.name })
		);

		if (localizedOptions.length === 0) {
			return null;
		}

		return localizedOptions;
	}
}
