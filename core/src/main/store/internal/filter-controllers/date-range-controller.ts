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
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";

import { isDateRangeFilterModelItem, ListOptionConfigurationUtils } from "../../../models/filter-model-utils.js";
import type { DocumentModelTypedField } from "../../../models/index.js";
import type { FormatTypedDateRangeType } from "../../../models/internal/shared.js";
import type { OverviewModel } from "../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import type { DateRangeFilterState } from "../filter-state.js";

import { RangeCriteria, PeriodCriteria } from "./criteria.js";
import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";
import { dateRangeResolvers, PERIOD_ALLOWANCE_BY_FORMAT } from "./resolvers/date-range-resolvers.js";
import { isInvalidRange, selectResolver } from "./resolvers/resolver.js";

/** @internal */
type Period = OverviewModel.NewFilter.DateRange.PeriodOption;
type Format = keyof typeof PERIOD_ALLOWANCE_BY_FORMAT;

export function deriveDateRangePeriodOptions(
	configuredPeriods: OverviewModel.NewFilter.DateRange.Options["periods"] | undefined,
	format: string
): {
	availableOptions: OverviewModel.NewFilter.DateRange.PeriodOption[];
	defaultOption: OverviewModel.NewFilter.DateRange.PeriodOption;
} {
	const allowance = PERIOD_ALLOWANCE_BY_FORMAT[format as Format];

	if (!allowance) {
		throw new Error(`Unsupported DateRange format: ${format}`);
	}

	const configured =
		configuredPeriods?.filter((entry) => entry.enabled && allowance.allowed.includes(entry.option)) ?? [];
	const availableOptions = configured.length > 0 ? configured.map((entry) => entry.option) : [allowance.defaultOption];
	const defaultOption = configured.find((entry) => entry.default)?.option ?? availableOptions[0];

	return { availableOptions, defaultOption };
}

/** @internal */
export class DateRangeFilterController implements FilterController<
	OverviewModel.NewFilter.DateRange.Item,
	DateRangeFilterState.Options,
	DateRangeFilterState.Options,
	DocumentModelTypedField<FormatTypedDateRangeType>
> {
	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isDateRangeFilterModelItem(model);
	}

	isConfigurable({ options }: OverviewModel.NewFilter.DateRange.Item): boolean {
		return (
			options.empty.enabled ||
			options.invert.enabled ||
			ListOptionConfigurationUtils.getAvailableOptions(options.ranges).length > 1
		);
	}

	toOperator(
		_model: OverviewModel.NewFilter.DateRange.Item,
		options: DateRangeFilterState.Options,
		{ documentModel, fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { selectedRange, selectedPeriod, empty, invert, criteria } = options;
		const not = invert.enabled && invert.value;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath).not(not).build();
		}

		const resolver = selectResolver(dateRangeResolvers, selectedPeriod);
		const [from, to] = PeriodCriteria.resolve(criteria, selectedPeriod, selectedRange)
			.asMap()
			.map(({ segment, value }) =>
				value ? resolver.toQueryValue?.(value, segment, { documentModel, fieldPath }) : undefined
			);

		return QueryBuilder.dateRange(fieldPath, from, to).not(not).build();
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.DateRange.Item,
		_runtimeOptions: DateRangeFilterState.Options,
		defaultOptions: DateRangeFilterState.Options
	): DateRangeFilterState.Options {
		return defaultOptions;
	}

	toEffectiveOptions(
		_model: OverviewModel.NewFilter.DateRange.Item,
		options: DateRangeFilterState.Options
	): DateRangeFilterState.Options {
		return options;
	}

	createInitialOptions(
		model: OverviewModel.NewFilter.DateRange.Item,
		element: DocumentModelTypedField<FormatTypedDateRangeType>
	): DateRangeFilterState.Options {
		const { defaultOption, availableOptions } = deriveDateRangePeriodOptions(
			model.options.periods,
			element.fieldType.format
		);
		const availableRanges = ListOptionConfigurationUtils.getAvailableOptions(model.options.ranges);

		return {
			empty: model.options.empty,
			invert: model.options.invert,
			selectedRange: ListOptionConfigurationUtils.getDefaultOption(model.options.ranges),
			selectedPeriod: defaultOption,
			criteria: createDefaultCriteria(availableOptions, availableRanges)
		};
	}

	toGeneralError(
		_model: OverviewModel.NewFilter.DateRange.Item,
		options: DateRangeFilterState.Options
	): Localizable | null {
		const { selectedRange, selectedPeriod, criteria } = options;

		if (selectedRange !== "fromTo") {
			return null;
		}

		const resolver = selectResolver(dateRangeResolvers, selectedPeriod);
		const { from, to } = PeriodCriteria.requireRange(criteria, selectedPeriod, "fromTo");

		if (isInvalidRange(resolver, from, to)) {
			return { key: RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd };
		}

		return null;
	}

	hasErrors(model: OverviewModel.NewFilter.DateRange.Item, options: DateRangeFilterState.Options): boolean {
		if (this.toGeneralError(model, options)) {
			return true;
		}

		return PeriodCriteria.resolve(options.criteria, options.selectedPeriod, options.selectedRange)
			.asValues()
			.some((s) => !!(s as { error?: string } | undefined)?.error);
	}

	toLabel(
		_model: OverviewModel.NewFilter.DateRange.Item,
		options: DateRangeFilterState.Options,
		context: FilterLabelContext
	): string | null {
		const resolver = selectResolver(dateRangeResolvers, options.selectedPeriod);
		const periodCriteria = PeriodCriteria.requirePeriod(options.criteria, options.selectedPeriod);

		return resolver.toLabel(periodCriteria, options.selectedRange, context);
	}
}

function defaultInputState<P extends Period>(period: P): DateRangeFilterState.PeriodInputMap[P] {
	switch (period) {
		case "yearMonth":
			return { value: { year: null, month: null }, error: null } as DateRangeFilterState.PeriodInputMap[P];
		case "year":
			return { value: null, error: null } as DateRangeFilterState.PeriodInputMap[P];
		case "month":
			return { value: null } as DateRangeFilterState.PeriodInputMap[P];
		case "date":
			return { input: "", value: null, error: null } as DateRangeFilterState.PeriodInputMap[P];
		case "monthDay":
			return { value: null, input: "", error: null } as DateRangeFilterState.PeriodInputMap[P];
		default:
			throw new Error(`Unsupported period: ${period}`);
	}
}

function createDefaultCriteria(
	availablePeriods: readonly Period[],
	availableRanges?: readonly OverviewModel.NewFilter.RangeOption[]
): DateRangeFilterState.Criteria {
	const result: { -readonly [K in Period]?: unknown } = {};

	for (const period of availablePeriods) {
		result[period] = RangeCriteria.create(defaultInputState(period), undefined, availableRanges);
	}

	return result as DateRangeFilterState.Criteria;
}
