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

import { isDefined, formatRange } from "../../../../services/filter-format-utils.js";
import { RangeCriteria } from "../criteria.js";

import type { Resolver } from "./resolver.js";

interface YearMonthFragmentInput {
	readonly value: { year: number | null; month: number | null };
	readonly error?: string;
}

export const fragmentYearMonthResolver: Resolver<YearMonthFragmentInput, string, string> = {
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

	toQueryValue(input) {
		const { value } = input;

		if (!isDefined(value.year) || !isDefined(value.month)) {
			return undefined;
		}

		return format(new Date(value.year, value.month, 1), "yyyy-MM");
	}
};
