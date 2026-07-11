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

import { DateFilterState } from "../filter-state.js";
import type { OverviewModel } from "../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import { isDateFilterModelItem, ListOptionConfigurationUtils } from "../../../models/filter-model-utils.js";

import { dateResolver } from "./resolvers/date-resolver.js";
import { yearResolver } from "./resolvers/year-resolver.js";
import { RangeCriteria, PeriodCriteria } from "./criteria.js";
import { monthResolver } from "./resolvers/month-resolver.js";
import { yearMonthResolver } from "./resolvers/year-month-resolver.js";
import { type Resolver, selectResolver, isInvalidRange } from "./resolvers/resolver.js";
import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

const resolvers: readonly Resolver<unknown, OverviewModel.NewFilter.Date.PeriodOption, string>[] = [
	dateResolver,
	yearResolver,
	yearMonthResolver,
	monthResolver
] as readonly Resolver<unknown, OverviewModel.NewFilter.Date.PeriodOption, string>[];

/** @internal */
export class DateFilterController implements FilterController<
	OverviewModel.NewFilter.Date.Item,
	DateFilterState.Options,
	DateFilterState.EffectiveOptions
> {
	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isDateFilterModelItem(model);
	}

	isConfigurable({ options }: OverviewModel.NewFilter.Date.Item): boolean {
		return (
			options.empty.enabled ||
			options.invert.enabled ||
			ListOptionConfigurationUtils.getAvailableOptions(options.periods).length > 1 ||
			ListOptionConfigurationUtils.getAvailableOptions(options.ranges).length > 1
		);
	}

	toOperator(
		_model: OverviewModel.NewFilter.Date.Item,
		options: DateFilterState.Options,
		{ documentModel, fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { empty, selectedPeriod, selectedRange, invert, criteria } = options;
		const not = invert.enabled && invert.value;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath).not(not).build();
		}

		const resolver = selectResolver(resolvers, selectedPeriod);

		const [from, to] = PeriodCriteria.resolve(criteria, selectedPeriod, selectedRange)
			.asMap()
			.map(({ segment, value }) =>
				value ? resolver.toQueryValue?.(value, segment, { documentModel, fieldPath }) : undefined
			);

		return QueryBuilder.dateRange(fieldPath, from, to).not(not).build();
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.Date.Item,
		runtimeOptions: DateFilterState.Options,
		defaultOptions: DateFilterState.EffectiveOptions
	): DateFilterState.Options {
		const lens = PeriodCriteria.rangeLens(defaultOptions.selectedPeriod, defaultOptions.selectedRange);

		return {
			...runtimeOptions,
			empty: defaultOptions.empty,
			invert: defaultOptions.invert,
			selectedRange: defaultOptions.selectedRange,
			selectedPeriod: defaultOptions.selectedPeriod,
			criteria: lens.set(defaultOptions.criteria)(runtimeOptions.criteria) as DateFilterState.Criteria
		};
	}

	toEffectiveOptions(
		_model: OverviewModel.NewFilter.Date.Item,
		options: DateFilterState.Options
	): DateFilterState.EffectiveOptions {
		const { selectedPeriod, empty, invert, selectedRange, criteria } = options;

		return {
			empty,
			invert,
			selectedPeriod,
			selectedRange,
			criteria: PeriodCriteria.requireRange(
				criteria,
				selectedPeriod,
				selectedRange
			) as DateFilterState.EffectiveOptions["criteria"]
		};
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.Date.Item): DateFilterState.Options {
		const defaultPeriod = ListOptionConfigurationUtils.getDefaultOption(filterItem.options.periods) ?? "date";

		return {
			empty: filterItem.options.empty,
			invert: filterItem.options.invert,
			selectedRange: ListOptionConfigurationUtils.getDefaultOption(filterItem.options.ranges),
			selectedPeriod: defaultPeriod,
			criteria: getDefaultCriteria(filterItem.options)
		};
	}

	toGeneralError(_model: OverviewModel.NewFilter.Date.Item, options: DateFilterState.Options): Localizable | null {
		if (options.selectedRange !== "fromTo") {
			return null;
		}

		const fromTo = PeriodCriteria.requireRange(options.criteria, options.selectedPeriod, "fromTo");

		if (!isInvalidRange(selectResolver(resolvers, options.selectedPeriod), fromTo.from, fromTo.to)) {
			return null;
		}

		return { key: RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd };
	}

	hasErrors(model: OverviewModel.NewFilter.Date.Item, options: DateFilterState.Options): boolean {
		if (this.toGeneralError(model, options)) {
			return true;
		}

		return PeriodCriteria.resolve(options.criteria, options.selectedPeriod, options.selectedRange)
			.asValues()
			.some((s) => !!(s as { error?: string } | undefined)?.error);
	}

	toLabel(
		_model: OverviewModel.NewFilter.Date.Item,
		options: DateFilterState.Options,
		context: FilterLabelContext
	): string | null {
		const resolver = selectResolver(resolvers, options.selectedPeriod);
		const periodCriteria = PeriodCriteria.requirePeriod(options.criteria, options.selectedPeriod);

		return resolver.toLabel(periodCriteria, options.selectedRange, context);
	}
}

function getDefaultCriteria(dataType: OverviewModel.NewFilter.Date.Options): DateFilterState.Criteria {
	const availableRanges = ListOptionConfigurationUtils.getAvailableOptions(dataType.ranges);
	const dateCriteria = RangeCriteria.create(
		DateFilterState.DefaultDateViewInputState,
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
	);

	return {
		date: dateCriteria,
		year: RangeCriteria.create(DateFilterState.DefaultYearViewInputState, undefined, availableRanges),
		yearMonth: RangeCriteria.create(DateFilterState.DefaultYearMonthViewInputState, undefined, availableRanges),
		month: RangeCriteria.create(DateFilterState.DefaultMonthViewInputState, undefined, availableRanges)
	};
}
