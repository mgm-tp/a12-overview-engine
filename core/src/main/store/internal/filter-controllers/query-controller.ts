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

import { isQueryFilterModelItem } from "../../../models/filter-model-utils.js";
import type { OverviewModel } from "../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import type { QueryFilterState } from "../filter-state.js";

import type { FilterController, FilterLabelContext } from "./filter-controller.js";

/** @internal */
export class QueryFilterController implements FilterController<
	OverviewModel.NewFilter.Query.Item,
	QueryFilterState.Options,
	QueryFilterState.Options
> {
	hasErrors(_model: OverviewModel.NewFilter.Item, _runtimeOptions: QueryFilterState.Options): boolean {
		return false;
	}

	isConfigurable(_model: OverviewModel.NewFilter.Query.Item): boolean {
		return false;
	}

	toOperator(model: OverviewModel.NewFilter.Query.Item, options: QueryFilterState.Options): Query.Operator | undefined {
		if (options.enabled.enabled && options.enabled.value) {
			return model.options.operator;
		}

		return undefined;
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isQueryFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.Query.Item,
		_runtimeOptions: QueryFilterState.Options,
		defaultOptions: QueryFilterState.Options
	): QueryFilterState.Options {
		return defaultOptions;
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.Query.Item): QueryFilterState.Options {
		return {
			enabled: filterItem.options.enabled
		};
	}

	toLabel(
		_model: OverviewModel.NewFilter.Query.Item,
		runtimeOptions: QueryFilterState.Options,
		{ localizeResource }: FilterLabelContext
	): string | null {
		if (runtimeOptions.enabled.enabled && runtimeOptions.enabled.value) {
			return localizeResource({ key: RESOURCE_KEYS.overviewEngine.newFilter.queryEnabledValue });
		}

		return null;
	}
}
