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
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { OverviewModel } from "../../../overview-model.js";
import { formatRange } from "../../../services/filter-format-utils.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import { NumberFilterState, type SelectedRangeCriteriaEntry } from "../filter-state.js";
import { isNumberFilterModelItem, ListOptionConfigurationUtils } from "../../../models/filter-model-utils.js";

import { isInvalidRange } from "./resolvers/resolver.js";
import { RangeCriteria, PeriodCriteria } from "./criteria.js";
import { numberResolver } from "./resolvers/number-resolver.js";
import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

/** @internal */
export class NumberFilterController implements FilterController<
	OverviewModel.NewFilter.Number.Item,
	NumberFilterState.Options,
	NumberFilterState.EffectiveOptions
> {
	isConfigurable(model: OverviewModel.NewFilter.Number.Item): boolean {
		return (
			model.options.empty.enabled ||
			model.options.invert.enabled ||
			ListOptionConfigurationUtils.getAvailableOptions(model.options.ranges).length > 1
		);
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isNumberFilterModelItem(model);
	}

	toOperator(
		_model: OverviewModel.NewFilter.Number.Item,
		options: NumberFilterState.Options,
		{ fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { empty, invert, criteria, selectedRange } = options;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath)
				.not(invert.enabled && invert.value)
				.build();
		}

		const values = PeriodCriteria.resolve(criteria, "default", selectedRange)
			.asValues()
			.map((state) => (state as NumberFilterState.InputState | undefined)?.value ?? undefined);

		return QueryBuilder.doubleRange(fieldPath, ...values)
			.not(invert.enabled && invert.value)
			.build();
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.Number.Item,
		runtimeOptions: NumberFilterState.Options,
		defaultOptions: NumberFilterState.EffectiveOptions
	): NumberFilterState.Options {
		const lens = PeriodCriteria.rangeLens("default", defaultOptions.selectedRange);

		return {
			...runtimeOptions,
			empty: defaultOptions.empty,
			invert: defaultOptions.invert,
			selectedRange: defaultOptions.selectedRange,
			criteria: lens.set(defaultOptions.criteria as never)(runtimeOptions.criteria) as NumberFilterState.Criteria
		};
	}

	toEffectiveOptions(
		_model: OverviewModel.NewFilter.Number.Item,
		runtimeOptions: NumberFilterState.Options
	): NumberFilterState.EffectiveOptions {
		const periodCriteria = PeriodCriteria.requirePeriod(runtimeOptions.criteria, "default");

		return {
			empty: runtimeOptions.empty,
			invert: runtimeOptions.invert,
			...({
				selectedRange: runtimeOptions.selectedRange,
				criteria: RangeCriteria.selectCurrentCriteria({
					selectedRange: runtimeOptions.selectedRange,
					criteria: periodCriteria
				})
			} as SelectedRangeCriteriaEntry<NumberFilterState.InputState>)
		};
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.Number.Item): NumberFilterState.Options {
		return {
			criteria: createDefaultCriteria(filterItem.options),
			empty: filterItem.options.empty,
			invert: filterItem.options.invert,
			selectedRange: ListOptionConfigurationUtils.getDefaultOption(filterItem.options.ranges)
		};
	}

	hasErrors(model: OverviewModel.NewFilter.Number.Item, runtimeOptions: NumberFilterState.Options): boolean {
		return (
			!!this.toGeneralError(model, runtimeOptions) ||
			PeriodCriteria.resolve(runtimeOptions.criteria, "default", runtimeOptions.selectedRange)
				.asValues()
				.some((state) => !!(state as NumberFilterState.InputState | undefined)?.error)
		);
	}

	toGeneralError(_model: OverviewModel.NewFilter.Number.Item, options: NumberFilterState.Options): Localizable | null {
		if (options.selectedRange !== "fromTo") {
			return null;
		}

		const fromTo = PeriodCriteria.requireRange(options.criteria, "default", "fromTo") as {
			from: NumberFilterState.InputState;
			to: NumberFilterState.InputState;
		};

		if (isInvalidRange(numberResolver, fromTo.from, fromTo.to)) {
			return { key: RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd };
		}

		return null;
	}

	toLabel(
		model: OverviewModel.NewFilter.Number.Item,
		options: NumberFilterState.Options,
		{ formatValue, fieldPath }: FilterLabelContext
	): string | null {
		const [fromLabel, toLabel] = PeriodCriteria.resolve(options.criteria, "default", options.selectedRange)
			.asValues()
			.map((state) => {
				const value = (state as NumberFilterState.InputState | undefined)?.value ?? null;

				if (value === null) {
					return null;
				}

				return formatValue({ value, fieldPath, subModel: model.options.subModel });
			});

		return formatRange(fromLabel, toLabel);
	}
}

function createDefaultCriteria(dataType: OverviewModel.NewFilter.Number.Options): NumberFilterState.Criteria {
	const availableRanges = ListOptionConfigurationUtils.getAvailableOptions(dataType.ranges);

	return {
		default: RangeCriteria.create(
			NumberFilterState.DefaultInputState,
			({ range, segment }) => {
				const rangeConfig = dataType.ranges.find((r) => r.option === range);

				if (rangeConfig?.default && rangeConfig.criteria) {
					const segmentValue = rangeConfig.criteria[segment as keyof typeof rangeConfig.criteria] as number;

					return {
						input: "",
						value: segmentValue,
						error: null
					};
				}

				return undefined;
			},
			availableRanges
		)
	};
}
