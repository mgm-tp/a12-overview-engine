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

import { format } from "date-fns";

import type { OverviewModel } from "../../../../overview-model.js";
import { isDefined, formatRange, createDateFormatter } from "../../../../services/filter-format-utils.js";
import type { DateRangeFilterState } from "../../filter-state.js";
import { RangeCriteria } from "../criteria.js";
import { padYear, padMonthYear, padYearMonthTime } from "../date-period-utils.js";

import type { Resolver } from "./resolver.js";

type Period = OverviewModel.NewFilter.DateRange.PeriodOption;

export const dateRangeYearResolver: Resolver<DateRangeFilterState.YearInputState, Period, string> = {
	accept(key) {
		return key === "year";
	},

	toComparable(input) {
		return input.value;
	},

	toLabel(criteria, range) {
		const labels = RangeCriteria.resolve(criteria, range)
			.asValues()
			.map((state) => (isDefined(state?.value) ? String(state.value) : null));

		return formatRange(...labels);
	},

	toQueryValue(input, segment, { documentModel, fieldPath }) {
		if (!isDefined(input.value)) {
			return undefined;
		}

		const date = padYear(input.value, { timezone: documentModel.content.modelConfig.timeZone, segment });

		return createDateFormatter(documentModel, fieldPath).formatDate(date);
	}
};

export const dateRangeMonthResolver: Resolver<DateRangeFilterState.MonthInputState, Period, string> = {
	accept(key) {
		return key === "month";
	},

	toComparable(input) {
		return input.value;
	},

	toLabel(criteria, range, { locale }) {
		const labels = RangeCriteria.resolve(criteria, range)
			.asValues()
			.map((state) => (isDefined(state?.value) ? format(new Date(2000, state.value, 1), "MMMM", { locale }) : null));

		return formatRange(...labels);
	},

	toQueryValue(input, segment, { documentModel, fieldPath }) {
		if (!isDefined(input.value)) {
			return undefined;
		}

		const date = padMonthYear(new Date().getFullYear(), input.value, {
			timezone: documentModel.content.modelConfig.timeZone,
			segment
		});

		return createDateFormatter(documentModel, fieldPath).formatDate(date);
	}
};

export const dateRangeYearMonthResolver: Resolver<DateRangeFilterState.YearMonthInputState, Period, string> = {
	accept(key) {
		return key === "yearMonth";
	},

	toComparable(input) {
		const { value } = input;

		return isDefined(value.year) && isDefined(value.month) ? value.year * 12 + value.month : null;
	},

	toLabel(criteria, range, { locale }) {
		const labels = RangeCriteria.resolve(criteria, range)
			.asValues()
			.map((state) => {
				const value = state?.value;

				if (!isDefined(value) || !isDefined(value.year) || !isDefined(value.month)) {
					return null;
				}

				return format(new Date(value.year, value.month, 1), "MMMM yyyy", { locale });
			});

		return formatRange(...labels);
	},

	toQueryValue(input, segment, { documentModel, fieldPath }) {
		const { year, month } = input.value;

		if (!isDefined(year) || !isDefined(month)) {
			return undefined;
		}

		const date = padYearMonthTime({
			timezone: documentModel.content.modelConfig.timeZone,
			segment,
			year,
			month
		});

		return createDateFormatter(documentModel, fieldPath).formatDate(date);
	}
};

export const dateRangeDateResolver: Resolver<DateRangeFilterState.DateInputState, Period, string> = {
	accept(key) {
		return key === "date";
	},

	toComparable(input) {
		return isDefined(input.value) ? input.value.getTime() : null;
	},

	toLabel(criteria, range, { documentModel, getDateTimeFormat, fieldPath }) {
		const formatter = createDateFormatter(documentModel, fieldPath);
		const labels = RangeCriteria.resolve(criteria, range)
			.asValues()
			.map((state) => formatter.formatDate(state?.value, getDateTimeFormat({ kind: "date" })));

		return formatRange(...labels);
	},

	toQueryValue(input, _segment, { documentModel, fieldPath }) {
		return createDateFormatter(documentModel, fieldPath).formatDate(input.value);
	}
};

export const dateRangeMonthDayResolver: Resolver<DateRangeFilterState.MonthDayInputState, Period, string> = {
	accept(key) {
		return key === "monthDay";
	},

	toComparable(input) {
		return isDefined(input.value) ? input.value.month * 100 + input.value.day : null;
	},

	toLabel(criteria, range, { locale }) {
		const labels = RangeCriteria.resolve(criteria, range)
			.asValues()
			.map((state) => {
				const value = state?.value;

				if (!isDefined(value)) {
					return null;
				}

				return format(new Date(2000, value.month, value.day), "MMMM d", { locale });
			});

		return formatRange(...labels);
	},

	toQueryValue(input) {
		const { value } = input;

		if (!isDefined(value)) {
			return undefined;
		}

		return format(new Date(2000, value.month, value.day), "MM-dd");
	}
};

export const dateRangeResolvers: readonly Resolver<unknown, Period, string>[] = [
	dateRangeYearResolver,
	dateRangeMonthResolver,
	dateRangeYearMonthResolver,
	dateRangeDateResolver,
	dateRangeMonthDayResolver
] as readonly Resolver<unknown, Period, string>[];

export const PERIOD_ALLOWANCE_BY_FORMAT: Record<
	"yyyy" | "MM" | "yyyy-MM" | "yyyy-MM-dd" | "MM-dd",
	{ readonly allowed: readonly Period[]; readonly defaultOption: Period }
> = {
	yyyy: { allowed: ["year"], defaultOption: "year" },
	MM: { allowed: ["month"], defaultOption: "month" },
	"yyyy-MM": { allowed: ["year", "month", "yearMonth"], defaultOption: "yearMonth" },
	"yyyy-MM-dd": { allowed: ["date"], defaultOption: "date" },
	"MM-dd": { allowed: ["monthDay"], defaultOption: "monthDay" }
};
