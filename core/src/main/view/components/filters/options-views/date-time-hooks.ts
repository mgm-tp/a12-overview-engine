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

import React from "react";

import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import * as KernelUtils from "@com.mgmtp.a12.kernel/kernel-md-facade/a12internal";
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import { useOverviewEngineContext, useOverviewEngineInternalContext } from "../../../context/index.js";
import { useDateTimeFormatString } from "../use-date-time-format-string.js";

import type { DateTimeUiValueType } from "./date-time-filter-view.api.js";
import { DateTimeUtils } from "./date-time-utils.js";
import type { SectionType } from "./section-template.js";

/** @internal */
export function useDateParser() {
	const getDateTimeFormatString = useDateTimeFormatString();
	const dateFormatString = getDateTimeFormatString(DateTimeUtils.SelectOptions.date);
	const parseDateTimeWithKernelUtils = useDateTimeParserWithKernelUtils(dateFormatString);

	return React.useCallback(
		(path: ModelPath, dateString: string, sectionType: SectionType): DateTimeUiValueType.InputState => {
			const padFunction = (dateValue: Date, timezone: string): Date | undefined => {
				return DateTimeUtils.padDate(dateValue, { sectionType, timezone });
			};

			return parseDateTimeWithKernelUtils(path, dateString, padFunction);
		},
		[parseDateTimeWithKernelUtils]
	);
}

/** @internal */
export function useTimeParser() {
	const getDateTimeFormatString = useDateTimeFormatString();
	const timeFormatString = getDateTimeFormatString(DateTimeUtils.SelectOptions.time);
	const parseDateTimeWithKernelUtils = useDateTimeParserWithKernelUtils(timeFormatString);

	return React.useCallback(
		(path: ModelPath, timeString: string): DateTimeUiValueType.InputState => {
			return parseDateTimeWithKernelUtils(path, timeString, DateTimeUtils.padToday);
		},
		[parseDateTimeWithKernelUtils]
	);
}

function useDateTimeParserWithKernelUtils(dateTimeFormatString: string) {
	const { localizer } = React.useContext(LocalizerContext);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);
	const baseYear = useOverviewEngineContext((context) => context.documentModel.content.modelInfo.baseYear ?? 2000);

	return React.useCallback(
		(
			path: ModelPath,
			dateTimeString: string,
			padFunction: (dateValue: Date, timezone: string) => Date | undefined
		): DateTimeUiValueType.InputState => {
			const emptyInputState = { input: "", value: null };

			if (!dateTimeString) {
				return emptyInputState;
			}

			let inputState: DateTimeUiValueType.InputState | undefined;
			const errorHandler = (localizableMessages: Localizable[]) => {
				inputState = {
					input: dateTimeString,
					value: undefined,
					errorMessage: localizer(...localizableMessages)
				};
			};

			const dateTimeValue = KernelUtils.parseDate(
				dateTimeString,
				dateTimeFormatString,
				baseYear,
				true,
				timezone,
				errorHandler
			);

			if (dateTimeValue && dateTimeValue instanceof Date) {
				const value = padFunction(dateTimeValue, timezone);
				const formattedValue = value ? KernelUtils.formatDate(value, dateTimeString, timezone) : "";
				inputState = {
					input: formattedValue,
					value
				};
			}

			if (!inputState) {
				inputState = emptyInputState;
			}

			return inputState;
		},
		[dateTimeFormatString, baseYear, timezone, localizer]
	);
}
