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

import * as React from "react";

import { type Locale, type DataFormats, defaultDataFormats } from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import type { DateTimeViewSelection } from "./options-views/date-time-filter-view.api.js";

/**
 * Returns a function that maps a {@link DateTimeViewSelection} to its date/time format string,
 * derived from the active {@link LocalizerContext}.
 *
 * @internal
 */
export function useDateTimeFormatString() {
	const { dataFormats, locale } = React.useContext(LocalizerContext);

	const { dateFragmentOrdering, dateSeparator, timeFormat } = React.useMemo(() => {
		return {
			...getDefaultDataFormats(locale),
			...dataFormats
		} satisfies Required<DataFormats>;
	}, [dataFormats, locale]);

	const dateFormat = React.useMemo(() => {
		return dateFragmentOrdering.split("_").map(replaceDayFragmentInFormatString).join(dateSeparator).trim();
	}, [dateFragmentOrdering, dateSeparator]);

	const monthYearFormat = React.useMemo(() => {
		return dateFragmentOrdering
			.split("_")
			.flatMap((value) => {
				if (value === "DAY") {
					return [];
				}

				return replaceDayFragmentInFormatString(value);
			})
			.join(dateSeparator)
			.trim();
	}, [dateFragmentOrdering, dateSeparator]);

	return React.useCallback(
		(selectedView: DateTimeViewSelection): string => {
			switch (selectedView) {
				case "date":
					return dateFormat;
				case "time":
					return timeFormat;
				case "year":
					return "y".repeat(4);
				case "monthYear":
					return monthYearFormat;
				default:
					throw new Error(`Invalid selectedView ${selectedView}`);
			}
		},
		[dateFormat, timeFormat, monthYearFormat]
	);
}

function getDefaultDataFormats(locale: Locale): Required<DataFormats> {
	return defaultDataFormats(
		["en", "de"].includes(locale.language) ? locale : { language: "en" }
	) as Required<DataFormats>;
}

function replaceDayFragmentInFormatString(value: string): string {
	switch (value) {
		case "DAY":
			return "d".repeat(2);
		case "MONTH":
			return "M".repeat(2);
		case "YEAR":
			return "y".repeat(4);
		default:
			return value;
	}
}
