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

import { isEqual } from "lodash-es";

import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { FilterItemState } from "../filter-state.js";
import type { OverviewModel } from "../../../overview-model.js";
import type { FilterLabelContext } from "../filter-controllers/filter-controller.js";
import {
	requireController,
	type ControllerResolver,
	DefaultControllerResolver
} from "../filter-controllers/controller-map.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterStateSelectors {
	hasErrors(filterState: FilterItemState): boolean;

	toGeneralError(filterState: FilterItemState): Localizable | null;

	toOperator(filterState: FilterItemState, context: { documentModel: DocumentModel }): Query.Operator | undefined;

	isResettable(filterState: FilterItemState): boolean;

	createInitialOptions(filterModel: OverviewModel.NewFilter.Item, element: DocumentModel.Element | undefined): object;

	toEffectiveOptions(filterModel: OverviewModel.NewFilter.Item, options: object): object;

	toResetOptions(filterState: FilterItemState): object;

	toLabel(filterState: FilterItemState, context: FilterLabelContext): string | readonly string[] | null;

	hasAnySetFilter(filters: Record<string, FilterItemState>, context: { documentModel: DocumentModel }): boolean;

	isConfigurable(filterState: FilterItemState): boolean;
}

/** @internal */
export function createFilterStateSelectors(controllerResolver: ControllerResolver): FilterStateSelectors {
	function hasErrors(filterState: FilterItemState): boolean {
		const controller = requireController(controllerResolver, filterState.model);

		return controller.hasErrors(filterState.model, filterState.options);
	}

	function toGeneralError(filterState: FilterItemState): Localizable | null {
		const controller = requireController(controllerResolver, filterState.model);

		return controller.toGeneralError?.(filterState.model, filterState.options) ?? null;
	}

	function toOperator(filterState: FilterItemState, context: { documentModel: DocumentModel }) {
		const controller = requireController(controllerResolver, filterState.model);

		return controller.toOperator(filterState.model, filterState.options, {
			...context,
			fieldPath: filterState.fieldPath ?? ""
		});
	}

	function isResettable(filterState: FilterItemState): boolean {
		const controller = requireController(controllerResolver, filterState.model);
		const effective = controller.toEffectiveOptions
			? controller.toEffectiveOptions(filterState.model, filterState.options)
			: filterState.options;

		return !isEqual(effective, filterState.initialOptions);
	}

	function createInitialOptions(filterModel: OverviewModel.NewFilter.Item, element: DocumentModel.Element | undefined) {
		const controller = requireController(controllerResolver, filterModel);

		return controller.createInitialOptions(filterModel, element);
	}

	function toEffectiveOptions(filterModel: OverviewModel.NewFilter.Item, options: object): object {
		const controller = requireController(controllerResolver, filterModel);

		return controller.toEffectiveOptions ? controller.toEffectiveOptions(filterModel, options) : options;
	}

	function toResetOptions(filterState: FilterItemState): object {
		const controller = requireController(controllerResolver, filterState.model);

		return controller.toResetOptions(filterState.model, filterState.options, filterState.initialOptions);
	}

	function toLabel(filterState: FilterItemState, context: FilterLabelContext): string | readonly string[] | null {
		const controller = requireController(controllerResolver, filterState.model);

		return controller.toLabel(filterState.model, filterState.options, {
			...context,
			fieldPath: filterState.fieldPath ?? ""
		});
	}

	function hasAnySetFilter(
		filters: Record<string, FilterItemState>,
		context: { documentModel: DocumentModel }
	): boolean {
		return Object.values(filters).some(
			(filterState) => filterState.area === "filterSelector" && !!toOperator(filterState, context)
		);
	}

	function isConfigurable(filterState: FilterItemState): boolean {
		return requireController(controllerResolver, filterState.model).isConfigurable(filterState.model);
	}

	return {
		hasErrors,
		toGeneralError,
		toOperator,
		isResettable,
		createInitialOptions,
		toEffectiveOptions,
		toResetOptions,
		toLabel,
		hasAnySetFilter,
		isConfigurable
	};
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const DefaultFilterStateSelectors = createFilterStateSelectors(DefaultControllerResolver);
