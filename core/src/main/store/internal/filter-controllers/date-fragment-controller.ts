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

import { ListOptionConfigurationUtils, isDateFragmentFilterModelItem } from "../../../models/filter-model-utils.js";
import type { DocumentModelTypedField } from "../../../models/index.js";
import type { FormatTypedDateFragmentType } from "../../../models/internal/shared.js";
import type { OverviewModel } from "../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import type { DateFragmentFilterState } from "../filter-state.js";

import { RangeCriteria, PeriodCriteria } from "./criteria.js";
import type { FilterController, FilterLabelContext, FilterControllerContext } from "./filter-controller.js";
import { fragmentMonthDayResolver } from "./resolvers/fragment-month-day-resolver.js";
import { fragmentMonthResolver } from "./resolvers/fragment-month-resolver.js";
import { fragmentYearMonthResolver } from "./resolvers/fragment-year-month-resolver.js";
import { fragmentYearResolver } from "./resolvers/fragment-year-resolver.js";
import { type Resolver, isInvalidRange, selectResolver } from "./resolvers/resolver.js";

const resolvers: readonly Resolver<unknown, OverviewModel.NewFilter.DateFragment.PeriodOption, string>[] = [
	fragmentYearResolver,
	fragmentMonthResolver,
	fragmentYearMonthResolver,
	fragmentMonthDayResolver
] as readonly Resolver<unknown, OverviewModel.NewFilter.DateFragment.PeriodOption, string>[];

type PeriodAllowance = {
	readonly allowed: readonly OverviewModel.NewFilter.DateFragment.PeriodOption[];
	readonly defaultOption: OverviewModel.NewFilter.DateFragment.PeriodOption;
};

const PERIOD_ALLOWANCE_BY_FORMAT: Record<string, PeriodAllowance> = {
	yyyy: { allowed: ["year"], defaultOption: "year" },
	MM: { allowed: ["month"], defaultOption: "month" },
	"yyyy-MM": { allowed: ["year", "month", "yearMonth"], defaultOption: "yearMonth" },
	"MM-dd": { allowed: ["monthDay"], defaultOption: "monthDay" }
};

export function derivePeriodOptions(
	configuredPeriods: OverviewModel.NewFilter.DateFragment.Options["periods"] | undefined,
	formatOfFragment: string
): {
	availableOptions: OverviewModel.NewFilter.DateFragment.PeriodOption[];
	defaultOption: OverviewModel.NewFilter.DateFragment.PeriodOption;
} {
	const allowance = PERIOD_ALLOWANCE_BY_FORMAT[formatOfFragment];

	if (!allowance) {
		throw new Error(`Unsupported DateFragment format: ${formatOfFragment}`);
	}

	const configured =
		configuredPeriods?.filter((entry) => entry.enabled && allowance.allowed.includes(entry.option)) ?? [];
	const availableOptions = configured.length > 0 ? configured.map((entry) => entry.option) : [allowance.defaultOption];
	const defaultOption = configured.find((entry) => entry.default)?.option ?? availableOptions[0];

	return { availableOptions, defaultOption };
}

/** @internal */
export class DateFragmentFilterController implements FilterController<
	OverviewModel.NewFilter.DateFragment.Item,
	DateFragmentFilterState.Options,
	DateFragmentFilterState.Options,
	DocumentModelTypedField<FormatTypedDateFragmentType>
> {
	isConfigurable({ options }: OverviewModel.NewFilter.DateFragment.Item): boolean {
		return (
			options.empty.enabled ||
			options.invert.enabled ||
			ListOptionConfigurationUtils.getAvailableOptions(options.ranges).length > 1
		);
	}

	toOperator(
		_model: OverviewModel.NewFilter.DateFragment.Item,
		options: DateFragmentFilterState.Options,
		{ documentModel, fieldPath }: FilterControllerContext
	): Query.Operator | undefined {
		const { selectedRange, selectedPeriod, empty, invert, criteria } = options;
		const not = invert.enabled && invert.value;

		if (empty.enabled && empty.value) {
			return QueryBuilder.undefinedMatch(fieldPath).not(not).build();
		}

		const resolver = selectResolver(resolvers, selectedPeriod);
		const [from, to] = PeriodCriteria.resolve(criteria, selectedPeriod, selectedRange)
			.asValues()
			.map((state) =>
				state ? (resolver.toQueryValue?.(state, "from", { documentModel, fieldPath }) as string | undefined) : undefined
			);

		return QueryBuilder.dateFragmentRange(fieldPath, from, to).not(not).build();
	}

	accept(model: OverviewModel.NewFilter.Item): boolean {
		return isDateFragmentFilterModelItem(model);
	}

	toResetOptions(
		_model: OverviewModel.NewFilter.DateFragment.Item,
		_runtimeOptions: DateFragmentFilterState.Options,
		defaultOptions: DateFragmentFilterState.Options
	): DateFragmentFilterState.Options {
		return defaultOptions;
	}

	toEffectiveOptions(
		_model: OverviewModel.NewFilter.DateFragment.Item,
		options: DateFragmentFilterState.Options
	): DateFragmentFilterState.Options {
		return options;
	}

	createInitialOptions(
		model: OverviewModel.NewFilter.DateFragment.Item,
		element: DocumentModelTypedField<FormatTypedDateFragmentType>
	): DateFragmentFilterState.Options {
		const { defaultOption, availableOptions } = derivePeriodOptions(
			model.options.periods,
			element.fieldType.formatOfFragment
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
		_model: OverviewModel.NewFilter.DateFragment.Item,
		options: DateFragmentFilterState.Options
	): Localizable | null {
		const { selectedRange, selectedPeriod, criteria } = options;

		if (selectedRange !== "fromTo") {
			return null;
		}

		const resolver = selectResolver(resolvers, selectedPeriod);
		const { from, to } = PeriodCriteria.requireRange(criteria, selectedPeriod, "fromTo");

		if (isInvalidRange(resolver, from, to)) {
			return { key: RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd };
		}

		return null;
	}

	hasErrors(model: OverviewModel.NewFilter.DateFragment.Item, options: DateFragmentFilterState.Options): boolean {
		if (this.toGeneralError(model, options)) {
			return true;
		}

		return PeriodCriteria.resolve(options.criteria, options.selectedPeriod, options.selectedRange)
			.asValues()
			.some((s) => !!(s as { error?: string } | undefined)?.error);
	}

	toLabel(
		model: OverviewModel.NewFilter.DateFragment.Item,
		options: DateFragmentFilterState.Options,
		context: FilterLabelContext
	): string | null {
		const resolver = selectResolver(resolvers, options.selectedPeriod);
		const periodCriteria = PeriodCriteria.requirePeriod(options.criteria, options.selectedPeriod);

		return resolver.toLabel(periodCriteria, options.selectedRange, {
			...context,
			subModel: model.options.subModel
		});
	}
}

function defaultInputState<P extends OverviewModel.NewFilter.DateFragment.PeriodOption>(
	period: P
): DateFragmentFilterState.PeriodInputMap[P] {
	switch (period) {
		case "yearMonth":
			return { value: { year: null, month: null }, error: null } as DateFragmentFilterState.PeriodInputMap[P];
		case "year":
			return { value: null, error: null } as DateFragmentFilterState.PeriodInputMap[P];
		case "month":
			return { value: null } as DateFragmentFilterState.PeriodInputMap[P];
		case "monthDay":
			return { value: null, input: "", error: null } as DateFragmentFilterState.PeriodInputMap[P];
		default:
			throw new Error(`Unsupported period: ${period}`);
	}
}

function createDefaultCriteria(
	availablePeriods: readonly OverviewModel.NewFilter.DateFragment.PeriodOption[],
	availableRanges?: readonly OverviewModel.NewFilter.RangeOption[]
): DateFragmentFilterState.Criteria {
	const result: { -readonly [K in OverviewModel.NewFilter.DateFragment.PeriodOption]?: unknown } = {};

	for (const period of availablePeriods) {
		result[period] = RangeCriteria.create(defaultInputState(period), undefined, availableRanges);
	}

	return result as DateFragmentFilterState.Criteria;
}
