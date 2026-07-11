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
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import { DateFilterState, DateTimeFilterState } from "../filter-state.js";
import { isDateTimeFilterModelItem, ListOptionConfigurationUtils } from "../../../models/filter-model-utils.js";

import { timeResolver } from "./resolvers/time-resolver.js";
import { yearResolver } from "./resolvers/year-resolver.js";
import { RangeCriteria, PeriodCriteria } from "./criteria.js";
import { monthResolver } from "./resolvers/month-resolver.js";
import { dateTimeResolver } from "./resolvers/date-time-resolver.js";
import { yearMonthResolver } from "./resolvers/year-month-resolver.js";
import { dateTimeDateResolver } from "./resolvers/datetime-date-resolver.js";
import { type Resolver, selectResolver, isInvalidRange } from "./resolvers/resolver.js";
import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";

const resolvers: readonly Resolver<unknown, OverviewModel.NewFilter.DateTime.PeriodOption, string>[] = [
	dateTimeDateResolver,
	yearResolver,
	yearMonthResolver,
	monthResolver,
	timeResolver,
	dateTimeResolver
] as readonly Resolver<unknown, OverviewModel.NewFilter.DateTime.PeriodOption, string>[];

/** @internal */
export class DateTimeFilterController implements FilterController<
	OverviewModel.NewFilter.DateTime.Item,
	DateTimeFilterState.Options,
	DateTimeFilterState.EffectiveOptions
> {
	isConfigurable(model: OverviewModel.NewFilter.DateTime.Item): boolean {
		return (
			model.options.empty.enabled ||
			model.options.invert.enabled ||
			ListOptionConfigurationUtils.getAvailableOptions(model.options.ranges).length > 1 ||
			ListOptionConfigurationUtils.getAvailableOptions(model.options.periods).length > 1
		);
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isDateTimeFilterModelItem(model);
	}

	toGeneralError(
		_model: OverviewModel.NewFilter.DateTime.Item,
		options: DateTimeFilterState.Options
	): Localizable | null {
		const { selectedRange, selectedPeriod, criteria } = options;

		if (selectedRange !== "fromTo") {
			return null;
		}

		const { from, to } = PeriodCriteria.requireRange(criteria, selectedPeriod, "fromTo");

		if (isInvalidRange(selectResolver(resolvers, selectedPeriod), from, to)) {
			return { key: RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd };
		}

		return null;
	}

	hasErrors(model: OverviewModel.NewFilter.DateTime.Item, runtimeOptions: DateTimeFilterState.Options): boolean {
		if (this.toGeneralError(model, runtimeOptions)) {
			return true;
		}

		const { selectedRange, selectedPeriod, criteria } = runtimeOptions;

		return PeriodCriteria.resolve(criteria, selectedPeriod, selectedRange)
			.asValues()
			.some((s) => !!(s as { error?: string } | undefined)?.error);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.DateTime.Item,
		runtimeOptions: DateTimeFilterState.Options,
		defaultOptions: DateTimeFilterState.EffectiveOptions
	): DateTimeFilterState.Options {
		const lens = PeriodCriteria.rangeLens(defaultOptions.selectedPeriod, defaultOptions.selectedRange);

		return {
			...runtimeOptions,
			empty: defaultOptions.empty,
			invert: defaultOptions.invert,
			selectedRange: defaultOptions.selectedRange,
			selectedPeriod: defaultOptions.selectedPeriod,
			criteria: lens.set(defaultOptions.criteria as never)(runtimeOptions.criteria) as DateTimeFilterState.Criteria
		};
	}

	toEffectiveOptions(
		_model: OverviewModel.NewFilter.DateTime.Item,
		runtimeOptions: DateTimeFilterState.Options
	): DateTimeFilterState.EffectiveOptions {
		const { selectedPeriod, selectedRange, empty, invert, criteria } = runtimeOptions;

		return {
			empty,
			invert,
			selectedPeriod,
			selectedRange,
			criteria: PeriodCriteria.requireRange(
				criteria,
				selectedPeriod,
				selectedRange
			) as DateTimeFilterState.EffectiveOptions["criteria"]
		};
	}

	createInitialOptions(filterItem: OverviewModel.NewFilter.DateTime.Item): DateTimeFilterState.Options {
		const defaultPeriod = ListOptionConfigurationUtils.getDefaultOption(filterItem.options.periods) ?? "dateTime";
		const availableRanges = ListOptionConfigurationUtils.getAvailableOptions(filterItem.options.ranges);

		return {
			criteria: buildDefaultCriteria(availableRanges),
			empty: filterItem.options.empty,
			invert: filterItem.options.invert,
			selectedRange: ListOptionConfigurationUtils.getDefaultOption(filterItem.options.ranges),
			selectedPeriod: defaultPeriod
		};
	}

	toLabel(
		model: OverviewModel.NewFilter.DateTime.Item,
		options: DateTimeFilterState.Options,
		labelEnv: FilterLabelContext
	): string | null {
		const resolver = selectResolver(resolvers, options.selectedPeriod);
		const periodCriteria = PeriodCriteria.requirePeriod(
			options.criteria,
			options.selectedPeriod
		) as RangeCriteria<unknown>;

		return resolver.toLabel(periodCriteria, options.selectedRange, {
			...labelEnv,
			subModel: model.options.subModel
		});
	}

	toOperator(
		_model: OverviewModel.NewFilter.DateTime.Item,
		options: DateTimeFilterState.Options,
		{ documentModel, fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { empty, invert, selectedPeriod, selectedRange, criteria } = options;
		const not = invert.enabled && invert.value;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath).not(not).build();
		}

		const resolver = selectResolver(resolvers, selectedPeriod);

		const [from, to] = PeriodCriteria.resolve(criteria, selectedPeriod, selectedRange)
			.asMap()
			.map(({ segment, value: state }) =>
				state ? resolver.toQueryValue?.(state, segment, { documentModel, fieldPath }) : undefined
			);

		return QueryBuilder.dateRange(fieldPath, from, to).not(not).build();
	}
}

function buildDefaultCriteria(
	availableRanges: readonly OverviewModel.NewFilter.RangeOption[]
): DateTimeFilterState.Criteria {
	return {
		time: RangeCriteria.create(DateTimeFilterState.DefaultTimeViewInputState, undefined, availableRanges),
		date: RangeCriteria.create(DateTimeFilterState.DefaultDateViewInputState, undefined, availableRanges),
		dateTime: RangeCriteria.create(DateTimeFilterState.DefaultDateTimeViewInputState, undefined, availableRanges),
		year: RangeCriteria.create(DateTimeFilterState.DefaultYearViewInputState, undefined, availableRanges),
		yearMonth: RangeCriteria.create(DateTimeFilterState.DefaultYearMonthViewInputState, undefined, availableRanges),
		month: RangeCriteria.create(DateFilterState.DefaultMonthViewInputState, undefined, availableRanges)
	};
}
