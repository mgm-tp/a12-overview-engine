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

import type { OverviewModel } from "../../../overview-model.js";

import { BooleanFilterController } from "./boolean-controller.js";
import { ConfirmFilterController } from "./confirm-controller.js";
import { DateFilterController } from "./date-controller.js";
import { DateFragmentFilterController } from "./date-fragment-controller.js";
import { DateRangeFilterController } from "./date-range-controller.js";
import { DateTimeFilterController } from "./date-time-controller.js";
import { EnumerationFilterController } from "./enumeration-controller.js";
import type { FilterController } from "./filter-controller.js";
import { MultiSelectFilterController } from "./multi-select-controller.js";
import { NumberFilterController } from "./number-controller.js";
import { QueryFilterController } from "./query-controller.js";
import { StringFilterController } from "./string-controller.js";
import { TimeFilterController } from "./time-controller.js";

/** @internal */
export type AnyFilterController = FilterController<OverviewModel.NewFilter.Item, object, object>;

/** @internal */
export interface ControllerResolver {
	resolve(model: OverviewModel.NewFilter.Item): AnyFilterController | undefined;
}

const defaultControllersByType: Record<string, AnyFilterController> = {
	boolean: new BooleanFilterController(),
	confirm: new ConfirmFilterController(),
	string: new StringFilterController(),
	number: new NumberFilterController(),
	enumeration: new EnumerationFilterController(),
	"multi-select": new MultiSelectFilterController(),
	time: new TimeFilterController(),
	date: new DateFilterController(),
	dateTime: new DateTimeFilterController(),
	dateFragment: new DateFragmentFilterController(),
	dateRange: new DateRangeFilterController(),
	query: new QueryFilterController()
};

/** @internal */
export const DefaultControllerResolver: ControllerResolver = {
	resolve(model: OverviewModel.NewFilter.Item): AnyFilterController | undefined {
		return defaultControllersByType[model.type];
	}
};

/** @internal */
export function requireController(
	resolver: ControllerResolver,
	model: OverviewModel.NewFilter.Item
): AnyFilterController {
	const controller = resolver.resolve(model);

	if (!controller) {
		throw new Error(`No controller defined for filter type "${model.type}" (id: ${model.id})`);
	}

	return controller;
}
