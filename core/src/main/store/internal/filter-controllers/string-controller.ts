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

import { StringFilterState } from "../filter-state.js";
import type { OverviewModel } from "../../../overview-model.js";
import { isStringFilterModelItem } from "../../../models/filter-model-utils.js";

import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

/** @internal */
export class StringFilterController implements FilterController<
	OverviewModel.NewFilter.String.Item,
	StringFilterState.Options,
	StringFilterState.EffectiveOptions
> {
	hasErrors(_model: OverviewModel.NewFilter.Item, runtimeOptions: StringFilterState.Options): boolean {
		const { empty, exactMatch, viewMode, criteria } = runtimeOptions;

		if (viewMode === "list" || (empty.enabled && empty.value)) {
			return false;
		}

		const searchBasedMatching = exactMatch.enabled ? !exactMatch.value : false;

		return searchBasedMatching && !!criteria.error;
	}

	toEffectiveOptions(
		_model: OverviewModel.NewFilter.String.Item,
		runtimeOptions: StringFilterState.Options
	): StringFilterState.EffectiveOptions {
		return { ...runtimeOptions, criteria: runtimeOptions.criteria.value };
	}

	isConfigurable(model: OverviewModel.NewFilter.String.Item): boolean {
		return (
			model.options.empty.enabled ||
			model.options.caseSensitive.enabled ||
			model.options.exactMatch.enabled ||
			model.options.invert.enabled
		);
	}

	toOperator(
		model: OverviewModel.NewFilter.String.Item,
		options: StringFilterState.Options,
		{ fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { criteria, empty, exactMatch, invert, viewMode, selectedValues } = options;
		const criteriaValue = criteria.value;

		if (this.hasErrors(model, options)) {
			return undefined;
		}

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath)
				.not(invert.enabled && invert.value)
				.build();
		}

		if (viewMode === "list") {
			if (selectedValues.length === 0) {
				return undefined;
			}

			const matchers = selectedValues.map((value) => QueryBuilder.exactMatch(fieldPath, value, true));

			return QueryBuilder.or(...matchers)
				.not(invert.enabled && invert.value)
				.build();
		}

		if (criteriaValue === undefined || criteriaValue === "") {
			return undefined;
		}

		const substringSearch = exactMatch.enabled ? !exactMatch.value : false;
		const caseSensitive = options.caseSensitive.enabled ? options.caseSensitive.value : false;

		if (!substringSearch) {
			return QueryBuilder.exactMatch(fieldPath, criteriaValue, caseSensitive)
				.not(invert.enabled && invert.value)
				.build();
		}

		const words = criteriaValue.split(/\s+/).filter((w) => w.length > 0);

		if (words.length === 0) {
			return undefined;
		}

		const searchBuilders = words.map((word) => QueryBuilder.simpleSearch(word, [fieldPath]));

		return QueryBuilder.and(...searchBuilders)
			.not(invert.enabled && invert.value)
			.build();
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isStringFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.String.Item,
		_runtimeOptions: StringFilterState.Options,
		defaultOptions: StringFilterState.EffectiveOptions
	): StringFilterState.Options {
		return { ...defaultOptions, criteria: { value: defaultOptions.criteria } };
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.String.Item): StringFilterState.Options {
		const viewMode: StringFilterState.ViewMode = filterItem.options.viewMode ?? StringFilterState.DefaultViewMode;
		const isTextField = viewMode === "textField";

		return {
			empty: filterItem.options.empty,
			invert: filterItem.options.invert,
			viewMode,
			caseSensitive: isTextField ? filterItem.options.caseSensitive : { enabled: false },
			exactMatch: isTextField ? filterItem.options.exactMatch : { enabled: false },
			criteria:
				isTextField && filterItem.options.criteria !== undefined
					? { value: filterItem.options.criteria }
					: StringFilterState.DefaultCriteria,
			selectedValues: []
		};
	}

	toLabel(
		model: OverviewModel.NewFilter.String.Item,
		options: StringFilterState.Options,
		_ctx: FilterLabelContext
	): string | null {
		if (options.viewMode === "list") {
			if (options.selectedValues.length === 0) {
				return null;
			}

			return options.selectedValues.length > 1 ? `${options.selectedValues[0]}, …` : options.selectedValues[0];
		}

		if (this.hasErrors(model, options)) {
			return null;
		}

		return options.criteria.value ?? null;
	}
}
