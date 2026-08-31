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

import type { OverviewModel } from "../../../../overview-model.js";
import { isDefined, formatRange, createDateFormatter } from "../../../../services/filter-format-utils.js";
import type { DateFilterState } from "../../filter-state.js";
import { RangeCriteria } from "../criteria.js";
import { padMonthYear, padYearMonthTime } from "../date-period-utils.js";

import type { Resolver } from "./resolver.js";

export const yearMonthResolver: Resolver<
	DateFilterState.YearMonthViewInputState,
	OverviewModel.NewFilter.Date.PeriodOption,
	string
> = {
	accept(period) {
		return period === "yearMonth";
	},

	toComparable(input) {
		return isDefined(input.value.year) && isDefined(input.value.month)
			? input.value.year * 12 + input.value.month
			: null;
	},

	toLabel(criteria, range, { documentModel, getDateTimeFormat, fieldPath }) {
		const formatter = createDateFormatter(documentModel, fieldPath);
		const timezone = documentModel.content.modelConfig.timeZone;

		const labels = RangeCriteria.resolve(criteria, range)
			.asMap()
			.map(({ segment, value: state }) => {
				const value = state?.value;

				if (!isDefined(value) || !isDefined(value.year) || !isDefined(value.month)) {
					return null;
				}

				return formatter.formatDate(
					padMonthYear(value.year, value.month, { timezone, segment }),
					getDateTimeFormat({ kind: "monthYear" })
				);
			});

		return formatRange(...labels);
	},

	toQueryValue(input, segment, { documentModel, fieldPath }) {
		if (!isDefined(input.value.year) || !isDefined(input.value.month)) {
			return undefined;
		}

		const date = padYearMonthTime({
			year: input.value.year,
			month: input.value.month,
			timezone: documentModel.content.modelConfig.timeZone,
			segment
		});

		return createDateFormatter(documentModel, fieldPath).formatDate(date);
	}
};
