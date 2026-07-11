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
import { isAfter, endOfDay, endOfYear, endOfMonth, startOfDay, startOfYear, startOfMonth } from "date-fns";

import { TimeUtils } from "@com.mgmtp.a12.widgets/widgets-core";
import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import type { OverviewEngineApi } from "../../../api.js";
import type { Converter } from "../../../../services/converter/internal/shared.js";
import { defaultDateRangeConversionTransformer } from "../../../../services/index.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";

import { SectionType } from "./section-template.js";
import type { NumberFilterOptionsView } from "./number-filter-options-view.js";
import type { DateTimeViewValue, DateTimeUiValueType, DateTimeViewSelection } from "./date-time-filter-view.api.js";

export namespace DateTimeUtils {
	/** @internal */
	export const EMPTY_SELECT_OPTION_VALUE = "empty" as unknown as DateTimeViewSelection;

	export const SelectOptions: Record<DateTimeViewSelection, DateTimeViewSelection> = {
		dateTime: "dateTime",
		date: "date",
		time: "time",
		monthYear: "monthYear",
		year: "year"
	};

	/** @internal */
	export function isStartSection(sectionType: SectionType): boolean {
		return sectionType === SectionType.START;
	}

	export function isSelectOptionsInstance(viewSelection: string): viewSelection is DateTimeViewSelection {
		return viewSelection === EMPTY_SELECT_OPTION_VALUE || Object.keys(SelectOptions).includes(viewSelection);
	}

	export function isYearMonthSelect(selectedView: string): selectedView is DateTimeViewSelection {
		return isYearSelect(selectedView) || isMonthSelect(selectedView);
	}

	export function isYearSelect(selectedView: string): boolean {
		return selectedView === SelectOptions.year;
	}

	export function isMonthSelect(selectedView: string): boolean {
		return selectedView === SelectOptions.monthYear;
	}

	export function getTimezoneDateUnit(date: Date | undefined, timezone: string, unit: "month" | "year"): number {
		const zonedDate = TimeUtils.getTimeWithTimezone(date ?? new Date(), timezone);

		return unit === "month" ? zonedDate.getMonth() : zonedDate.getFullYear();
	}

	/** @internal */
	export function format(converter: Converter, path: ModelPath, newDate?: Date, modelId?: string): string {
		return newDate !== undefined
			? converter.formatValue(path, newDate, defaultDateRangeConversionTransformer, modelId)
			: "";
	}

	/** @internal */
	export function formatAsDate(converter: Converter, path: ModelPath, newDate?: Date, modelId?: string): string {
		return format(converter, path, newDate, modelId).split(" ")[0];
	}

	export function convertToDateTimeViewValue(
		start: DateTimeUiValueType.InputState,
		end: DateTimeUiValueType.InputState
	): DateTimeViewValue {
		return { start, end };
	}

	export function getEmptyDateTimeViewInput(): DateTimeViewValue {
		const emptyInput = { input: "" };

		return convertToDateTimeViewValue(emptyInput, emptyInput);
	}

	export function useDateTimeParser(modelId?: string) {
		const { localizer } = React.useContext(LocalizerContext);
		const converter = useOverviewEngineInternalContext((context) => context.converter);

		return React.useCallback(
			(path: ModelPath, value?: string): DateTimeUiValueType.InputState => {
				if (!value) {
					return { input: "", value: null };
				}

				const convertedValue = converter.parseValue(path, value, defaultDateRangeConversionTransformer, modelId);

				if (convertedValue.error || convertedValue.value === null) {
					return {
						input: value,
						value: undefined,
						errorMessage: localizer(...(convertedValue.error ?? []))
					};
				}

				const formattedValue = converter.formatValue(
					path,
					convertedValue.value,
					defaultDateRangeConversionTransformer,
					modelId
				);

				return {
					input: formattedValue,
					value: convertedValue.value as Date,
					errorMessage: convertedValue.error
				};
			},
			[converter, localizer, modelId]
		);
	}

	export function isNotValidRange(
		uiValue: DateTimeViewValue | NumberFilterOptionsView.NumberUiValueType,
		timezone = "UTC"
	): boolean {
		const startValue = uiValue.start.value;
		const endValue = uiValue.end.value;

		if (startValue === null || startValue === undefined || endValue === null || endValue === undefined) {
			return false;
		}

		if (startValue instanceof Date && endValue instanceof Date && timezone) {
			return isAfter(
				TimeUtils.getTimeWithTimezone(startValue, timezone),
				TimeUtils.getTimeWithTimezone(endValue, timezone)
			);
		}

		return startValue > endValue;
	}

	export function padYearAndMonth(year?: number, month?: number, timezone = "UTC"): Date {
		const dateUTC = new Date(Date.UTC(year ?? new Date().getFullYear(), month ?? new Date().getMonth()));
		const dateTZ = TimeUtils.convertUTCToTimezoneDate(dateUTC, timezone);

		if (!dateTZ) {
			throw new Error(`Unexpected undefined date`);
		}

		return padDate(dateTZ, { unit: "month", timezone });
	}

	export function padToday(time?: Date | null, timezone = "UTC"): Date | undefined {
		if (!time) {
			return undefined;
		}

		const tzTime = TimeUtils.getTimeWithTimezone(time, timezone);
		const newDate = TimeUtils.getTimeWithTimezone(new Date(), timezone);
		newDate.setHours(tzTime.getHours());
		newDate.setMinutes(tzTime.getMinutes());
		newDate.setSeconds(tzTime.getSeconds());
		newDate.setMilliseconds(tzTime.getMilliseconds());

		return newDate;
	}

	export function padValue(
		dateTimeType: "start" | "end",
		selectedView: DateTimeViewSelection,
		value?: Date | null,
		isDateTime = false,
		timezone = "UTC"
	): Date | undefined {
		if (!value) {
			return undefined;
		}

		const sectionType = dateTimeType === "start" ? SectionType.START : SectionType.END;

		if (selectedView === SelectOptions.year) {
			return padDate(value, { unit: "year", strict: isDateTime, sectionType, timezone });
		}

		if (selectedView === SelectOptions.monthYear) {
			return padDate(value, { unit: "month", strict: isDateTime, sectionType, timezone });
		}

		if (selectedView === SelectOptions.date) {
			return padDate(value, { sectionType, timezone });
		}

		if (selectedView === SelectOptions.time) {
			return padToday(value, timezone);
		}

		return value;
	}

	export interface PadDateOptions {
		sectionType?: SectionType;
		unit?: "date" | "month" | "year";
		timezone?: string;
		strict?: boolean;
	}

	/** @internal */
	export function padDate(value: Date, options?: PadDateOptions): Date;

	/** @internal */
	export function padDate(value: Date | undefined | null, options?: PadDateOptions): Date | undefined;

	/** @internal */
	export function padDate(value: Date | undefined | null, options?: PadDateOptions): Date | undefined {
		if (!value) {
			return undefined;
		}

		const { sectionType = SectionType.START, unit = "date", timezone = "UTC", strict } = options ?? {};

		const date = TimeUtils.getTimeWithTimezone(value, timezone);

		const isStart = isStartSection(sectionType);
		let result: Date;

		switch (unit) {
			case "year":
				result = isStart ? startOfYear(date) : endOfYear(date);
				break;
			case "month":
				result = isStart ? startOfMonth(date) : endOfMonth(date);
				break;
			default:
				result = isStart ? startOfDay(date) : endOfDay(date);
		}

		if (strict || unit === "date") {
			return result;
		}

		if (!isStart) {
			return startOfDay(result);
		}

		return result;
	}

	export function convertToFilterOptions(
		uiValue: DateTimeViewValue,
		type: OverviewEngineApi.Filter.DateOptions["type"],
		timeZone?: string,
		selectedView?: DateTimeViewSelection,
		modelId?: string
	): OverviewEngineApi.Filter.DateOptions {
		const baseOptions: OverviewEngineApi.Filter.DateOptions = { filterType: "Date", modelId, type };
		const { start, end, undefinedMatch } = uiValue;

		if (undefinedMatch) {
			return { ...baseOptions, undefinedMatch };
		}

		if (start.errorMessage || end.errorMessage) {
			return { ...baseOptions, error: true };
		}

		if (isNotValidRange(uiValue, timeZone)) {
			return { ...baseOptions, error: true };
		}

		const hasCriteria = (start.value ?? end.value ?? undefined) !== undefined;
		const criteria = hasCriteria ? { start: start.value, end: end.value } : undefined;

		if (type === "Date") {
			if (selectedView === "dateTime" || selectedView === "time") {
				throw Error(`selectedView ${selectedView} is not valid for DateTypeOptions`);
			}

			return { ...baseOptions, type: "Date", criteria, selectedView };
		}

		if (type === "DateTime") {
			return { ...baseOptions, type: "DateTime", criteria, selectedView };
		}

		return { ...baseOptions, criteria };
	}
}
