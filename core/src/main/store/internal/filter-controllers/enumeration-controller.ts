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

import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";

import { isEnumerationFilterModelItem } from "../../../models/filter-model-utils.js";
import type { OverviewModel } from "../../../overview-model.js";
import type { EnumerationFilterState } from "../filter-state.js";

import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

/** @internal */
export class EnumerationFilterController implements FilterController<
	OverviewModel.NewFilter.Enumeration.Item,
	EnumerationFilterState.Options,
	EnumerationFilterState.Options
> {
	hasErrors(_model: OverviewModel.NewFilter.Item, _runtimeOptions: EnumerationFilterState.Options): boolean {
		return false;
	}

	toOperator(
		_model: OverviewModel.NewFilter.Enumeration.Item,
		options: EnumerationFilterState.Options,
		{ fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { empty, criteria, invert } = options;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath)
				.not(invert.enabled && invert.value)
				.build();
		}

		return QueryBuilder.or(...criteria.map((value) => QueryBuilder.exactMatch(fieldPath, value)))
			.not(invert.enabled && invert.value)
			.build();
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isEnumerationFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.Enumeration.Item,
		_runtimeOptions: EnumerationFilterState.Options,
		defaultOptions: EnumerationFilterState.Options
	): EnumerationFilterState.Options {
		return defaultOptions;
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.Enumeration.Item): EnumerationFilterState.Options {
		return {
			empty: filterItem.options.empty,
			invert: filterItem.options.invert,
			criteria: filterItem.options.criteria ?? []
		};
	}

	isConfigurable(model: OverviewModel.NewFilter.Enumeration.Item): boolean {
		return model.options.empty.enabled || model.options.invert.enabled;
	}

	toLabel(
		_model: OverviewModel.NewFilter.Enumeration.Item,
		options: EnumerationFilterState.Options,
		{ localizeValue, fieldPath }: FilterLabelContext
	): string | readonly string[] | null {
		if (options.criteria.length === 0) {
			return null;
		}

		return options.criteria.map((value) => localizeValue({ value, fieldPath }));
	}
}
