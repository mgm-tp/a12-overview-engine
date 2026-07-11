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

import type { BooleanFilterState } from "../filter-state.js";
import type { OverviewModel } from "../../../overview-model.js";
import { isBooleanFilterModelItem } from "../../../models/filter-model-utils.js";

import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

/** @internal */
export class BooleanFilterController implements FilterController<
	OverviewModel.NewFilter.Boolean.Item,
	BooleanFilterState.Options,
	BooleanFilterState.Options
> {
	static readonly DefaultCriteria: BooleanFilterState.Criteria = { true: false, false: false };

	hasErrors(_model: OverviewModel.NewFilter.Item, _runtimeOptions: BooleanFilterState.Options): boolean {
		return false;
	}

	toOperator(
		_model: OverviewModel.NewFilter.Boolean.Item,
		options: BooleanFilterState.Options,
		{ fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { criteria, empty } = options;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath).build();
		}

		const operands = Object.entries(criteria).flatMap(([key, value]) => {
			return value ? QueryBuilder.exactMatch(fieldPath, key, true) : [];
		});

		return QueryBuilder.or(...operands).build();
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isBooleanFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.Boolean.Item,
		_runtimeOptions: BooleanFilterState.Options,
		defaultOptions: BooleanFilterState.Options
	): BooleanFilterState.Options {
		return defaultOptions;
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.Boolean.Item): BooleanFilterState.Options {
		return {
			empty: filterItem.options.empty,
			criteria: getDefaultCriteria(filterItem.options)
		};
	}

	toLabel(
		_model: OverviewModel.NewFilter.Boolean.Item,
		runtimeOptions: BooleanFilterState.Options,
		{ localizeValue, fieldPath }: FilterLabelContext
	): string | null {
		if (runtimeOptions.criteria.true && runtimeOptions.criteria.false) {
			return [true, false].map((value) => localizeValue({ value, fieldPath })).join(", ");
		}

		if (runtimeOptions.criteria.true) {
			return localizeValue({ value: true, fieldPath });
		}

		if (runtimeOptions.criteria.false) {
			return localizeValue({ value: false, fieldPath });
		}

		return null;
	}

	isConfigurable(model: OverviewModel.NewFilter.Boolean.Item): boolean {
		return model.options.empty.enabled;
	}
}

function getDefaultCriteria(dataType: OverviewModel.NewFilter.Boolean.Options): BooleanFilterState.Criteria {
	if (dataType.criteria?.length) {
		return { true: dataType.criteria.includes(true), false: dataType.criteria.includes(false) };
	}

	return BooleanFilterController.DefaultCriteria;
}
