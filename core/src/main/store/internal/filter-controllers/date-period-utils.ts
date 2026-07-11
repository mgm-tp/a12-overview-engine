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

import { TZDate } from "@date-fns/tz";
import { endOfDay, endOfYear, endOfMonth, startOfDay, startOfYear, startOfMonth } from "date-fns";

import { TimeUtils } from "@com.mgmtp.a12.widgets/widgets-core";

import type { BoundarySegment } from "./criteria.js";

export function padYear(year: number, options: { timezone?: string; segment: BoundarySegment }): Date {
	const { timezone = "UTC", segment } = options;
	const date = new TZDate(year, 0, timezone);

	return padDate(date, { unit: "year", timezone, segment });
}

interface PadDateOptions {
	segment?: BoundarySegment;
	unit?: "date" | "month" | "year";
	timezone?: string;
	strict?: boolean;
}

function padDate(value: Date, options?: PadDateOptions): Date;
function padDate(value: Date | undefined | null, options?: PadDateOptions): Date | undefined;
function padDate(value: Date | undefined | null, options?: PadDateOptions): Date | undefined {
	if (!value) {
		return undefined;
	}

	const { segment = "from", unit = "date", timezone = "UTC", strict } = options ?? {};

	const date = TimeUtils.getTimeWithTimezone(value, timezone);

	const isStart = segment === "from";
	let result: Date;

	switch (unit) {
		case "year":
			result = isStart ? startOfYear(date) : endOfYear(date);
			break;
		case "month":
			result = isStart ? startOfMonth(date) : endOfMonth(date);
			break;
		case "date":
			result = isStart ? startOfDay(date) : endOfDay(date);
			break;
		default: {
			const exhaustive: never = unit;
			throw new Error(`padDate: unsupported unit "${exhaustive}"`);
		}
	}

	if (strict || unit === "date") {
		return result;
	}

	if (!isStart) {
		return startOfDay(result);
	}

	return result;
}

export function padMonthYear(
	year: number,
	month: number,
	options: { timezone?: string; segment: BoundarySegment }
): Date {
	const { timezone = "UTC", segment } = options;
	const date = new TZDate(year, month, timezone);

	return padDate(date, { unit: "month", timezone, segment });
}

export function padYearMonthDayTime(options: { segment: BoundarySegment; date: Date; timezone: string }): Date {
	const { segment, date, timezone } = options;
	const tzDate = new TZDate(date, timezone);

	if (segment === "from") {
		return startOfDay(tzDate);
	}

	return endOfDay(tzDate);
}

export function padYearTime(options: { timezone: string; segment: BoundarySegment; year: number }): Date {
	const { timezone, segment, year } = options;
	const date = new TZDate(year, segment === "from" ? 0 : 11, timezone);

	if (segment === "from") {
		return startOfYear(date);
	}

	return endOfYear(date);
}

export function padYearMonthTime(options: {
	timezone: string;
	segment: BoundarySegment;
	year: number;
	month: number;
}): Date {
	const { timezone, segment, year, month } = options;
	const date = new TZDate(year, month, timezone);

	if (segment === "from") {
		return startOfMonth(date);
	}

	return endOfMonth(date);
}
