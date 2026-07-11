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

import { ConfirmFilterState } from "../filter-state.js";
import type { OverviewModel } from "../../../overview-model.js";
import { isConfirmFilterModelItem } from "../../../models/filter-model-utils.js";

import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

/** @internal */
export class ConfirmFilterController implements FilterController<
	OverviewModel.NewFilter.Confirm.Item,
	ConfirmFilterState.Options,
	ConfirmFilterState.Options
> {
	hasErrors(_model: OverviewModel.NewFilter.Item, _runtimeOptions: ConfirmFilterState.Options): boolean {
		return false;
	}

	toOperator(
		_model: OverviewModel.NewFilter.Confirm.Item,
		options: ConfirmFilterState.Options,
		{ fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { empty, criteria } = options;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath).build();
		}

		if (criteria === true) {
			return QueryBuilder.exactMatch(fieldPath, "true", true).build();
		}

		return undefined;
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isConfirmFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.Confirm.Item,
		_runtimeOptions: ConfirmFilterState.Options,
		defaultOptions: ConfirmFilterState.Options
	): ConfirmFilterState.Options {
		return defaultOptions;
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.Confirm.Item): ConfirmFilterState.Options {
		return {
			empty: filterItem.options.empty,
			criteria: filterItem.options.criteria ?? ConfirmFilterState.DefaultCriteria
		};
	}

	isConfigurable(model: OverviewModel.NewFilter.Confirm.Item): boolean {
		return model.options.empty.enabled;
	}

	toLabel(
		_model: OverviewModel.NewFilter.Confirm.Item,
		runtimeOptions: ConfirmFilterState.Options,
		{ localizeValue, fieldPath }: FilterLabelContext
	): string | null {
		if (runtimeOptions.criteria) {
			return localizeValue({ value: true, fieldPath });
		}

		return null;
	}
}
