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
import * as KernelUtils from "@com.mgmtp.a12.kernel/kernel-md-facade/a12internal";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";

import { isTimeFilterModelItem, ListOptionConfigurationUtils } from "../../../models/filter-model-utils.js";
import type { OverviewModel } from "../../../overview-model.js";
import { formatRange } from "../../../services/filter-format-utils.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import { TimeFilterState, type SelectedRangeCriteriaEntry } from "../filter-state.js";

import { RangeCriteria, PeriodCriteria } from "./criteria.js";
import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";
import { standaloneTimeResolver } from "./resolvers/time-resolver.js";

/** @internal */
export class TimeFilterController implements FilterController<
	OverviewModel.NewFilter.Time.Item,
	TimeFilterState.Options,
	TimeFilterState.EffectiveOptions
> {
	isConfigurable(model: OverviewModel.NewFilter.Time.Item): boolean {
		return (
			model.options.empty.enabled ||
			model.options.invert.enabled ||
			ListOptionConfigurationUtils.getAvailableOptions(model.options.ranges).length > 1
		);
	}

	toOperator(
		_model: OverviewModel.NewFilter.Time.Item,
		options: TimeFilterState.Options,
		{ documentModel, fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { empty, invert, selectedRange, criteria } = options;
		const not = invert.enabled && invert.value;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath).not(not).build();
		}

		const [from, to] = PeriodCriteria.resolve(criteria, "default", selectedRange)
			.asMap()
			.map(({ segment, value: state }) =>
				state
					? standaloneTimeResolver.toQueryValue?.(state as TimeFilterState.InputState, segment, {
							documentModel,
							fieldPath
						})
					: undefined
			);

		return QueryBuilder.dateRange(fieldPath, from, to).not(not).build();
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isTimeFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.Time.Item,
		runtimeOptions: TimeFilterState.Options,
		defaultOptions: TimeFilterState.EffectiveOptions
	): TimeFilterState.Options {
		const lens = PeriodCriteria.rangeLens("default", defaultOptions.selectedRange);

		return {
			...runtimeOptions,
			empty: defaultOptions.empty,
			invert: defaultOptions.invert,
			selectedRange: defaultOptions.selectedRange,
			criteria: lens.set(defaultOptions.criteria as never)(runtimeOptions.criteria) as TimeFilterState.Criteria
		};
	}

	toEffectiveOptions(
		_model: OverviewModel.NewFilter.Time.Item,
		runtimeOptions: TimeFilterState.Options
	): TimeFilterState.EffectiveOptions {
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
			} as SelectedRangeCriteriaEntry<TimeFilterState.InputState>)
		};
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.Time.Item): TimeFilterState.Options {
		return {
			criteria: getDefaultCriteria(filterItem.options),
			empty: filterItem.options.empty,
			invert: filterItem.options.invert,
			selectedRange: ListOptionConfigurationUtils.getDefaultOption(filterItem.options.ranges)
		};
	}

	hasErrors(model: OverviewModel.NewFilter.Time.Item, runtimeOptions: TimeFilterState.Options): boolean {
		return (
			!!this.toGeneralError(model, runtimeOptions) ||
			Object.values(getCurrentInputState(runtimeOptions)).some((state) => !!state?.error)
		);
	}

	toGeneralError(_model: OverviewModel.NewFilter.Time.Item, options: TimeFilterState.Options): Localizable | null {
		if (options.selectedRange !== "fromTo") {
			return null;
		}

		const { from, to } = PeriodCriteria.requireRange(options.criteria, "default", "fromTo") as {
			from: TimeFilterState.InputState;
			to: TimeFilterState.InputState;
		};

		if (from.value !== null && to.value !== null && from.value > to.value) {
			return { key: RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd };
		}

		return null;
	}

	toLabel(
		_model: OverviewModel.NewFilter.Time.Item,
		options: TimeFilterState.Options,
		{ documentModel, getDateTimeFormat }: FilterLabelContext
	): string | null {
		const currentInputStates = getCurrentInputState(options);

		const formatString = getDateTimeFormat({ kind: "time" });
		const timezone = documentModel.content.modelConfig.timeZone;

		const [fromLabel, toLabel] = [
			(currentInputStates.from || currentInputStates.exact)?.value ?? null,
			(currentInputStates.to || currentInputStates.exact)?.value ?? null
		].map((v) => (v !== null ? KernelUtils.formatDate(v, formatString, timezone) : null));

		return formatRange(fromLabel, toLabel);
	}
}

function getDefaultCriteria(dataType: OverviewModel.NewFilter.Time.Options): TimeFilterState.Criteria {
	const availableRanges = ListOptionConfigurationUtils.getAvailableOptions(dataType.ranges);

	return {
		default: RangeCriteria.create(
			TimeFilterState.DefaultInputState,
			({ range, segment }) => {
				const rangeConfig = dataType.ranges.find((r) => r.option === range);

				if (rangeConfig?.default && rangeConfig.criteria) {
					const segmentValue = rangeConfig.criteria[segment as keyof typeof rangeConfig.criteria] as string;

					if (segmentValue) {
						return { input: segmentValue, value: new Date(segmentValue), error: null };
					}
				}

				return undefined;
			},
			availableRanges
		)
	};
}

function getCurrentInputState(
	options: TimeFilterState.Options
): Partial<Record<"from" | "to" | "exact", TimeFilterState.InputState>> {
	const periodCriteria = PeriodCriteria.requirePeriod(options.criteria, "default");

	return RangeCriteria.selectCurrentCriteria({
		selectedRange: options.selectedRange,
		criteria: periodCriteria
	}) as Partial<Record<"from" | "to" | "exact", TimeFilterState.InputState>>;
}
