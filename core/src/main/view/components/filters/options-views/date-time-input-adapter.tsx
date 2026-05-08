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

import { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import {
	type YearRange,
	type TimePickerProps,
	type DateTimePickerProps,
	provider as DeviceDetector,
	type DateTimePickerInputProps
} from "@com.mgmtp.a12.widgets/widgets-core";

import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";

import { type SectionType } from "./section-template.js";
import { useLocalizedLabels } from "./date-time-common-hooks.js";

/** @internal */
export namespace DateTimeInputAdapter {
	export interface Props
		extends Pick<
			DateTimePickerInputProps<DateTimePickerProps>,
			"readonly" | "disabled" | "error" | "dateTimeFormatter" | "dateTimeConverter"
		> {
		readonly id: string;
		readonly clearHandlerRef: (clearHandler: () => void) => void;
		readonly value?: Date;
		readonly sectionType: SectionType;
		readonly yearRange?: YearRange;
		readonly timeMode?: TimePickerProps.ClockMode;
		readonly enableDatePicker?: boolean;
		readonly errorMessage?: string;
		readonly fieldFormatString?: string;
		onValueSubmit(input: string): void;
		getLocalizedDateString(date?: Date): string;
	}
}

/** @internal */
export const DateTimeInputAdapter: React.FC<DateTimeInputAdapter.Props> = React.memo(
	function DateTimeInputAdapter(props) {
		const {
			id,
			value,
			onValueSubmit,
			timeMode,
			yearRange,
			enableDatePicker,
			getLocalizedDateString,
			clearHandlerRef,
			sectionType,
			errorMessage,
			fieldFormatString,
			...rest
		} = props;
		const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

		const DateTimePickerInput = useOverviewEngineContext((context) => context.widgetMap.DateTimePickerInput);
		const DateTimePickerHeader = useOverviewEngineContext((context) => context.widgetMap.DateTimePickerHeader);

		const { locale } = React.useContext(LocalizerContext);
		const mobileMode = React.useMemo(() => DeviceDetector.hasTouch(), []);
		const timezone = useOverviewEngineInternalContext((context) => context.timezone);

		const { okLabel, clearLabel, backLabel, editTimeLabel, placeholderLabel, dateTimePickerHeader } =
			useLocalizedLabels(sectionType);

		const pickerProps: DateTimePickerProps = React.useMemo(() => {
			const customHeaderTitle = getLocalizedDateString(selectedDate ?? value) || dateTimePickerHeader;
			const customHeaderElement = !mobileMode ? (
				<DateTimePickerHeader>{customHeaderTitle}</DateTimePickerHeader>
			) : undefined;

			return {
				id,
				mobileMode,
				backLabel,
				okLabel,
				clearLabel,
				value,
				timeRequired: true,
				locale: Locale.toString(locale),
				timeMode,
				timezone,
				customTimeEditLabel: editTimeLabel,
				yearRange,
				hidePickerButton: !enableDatePicker,
				customHeaderElement,
				customHeaderTitle,
				onChange(date?: Date, time?: Date) {
					setSelectedDate(date);
				}
			};
		}, [
			DateTimePickerHeader,
			backLabel,
			clearLabel,
			dateTimePickerHeader,
			editTimeLabel,
			enableDatePicker,
			getLocalizedDateString,
			id,
			locale,
			mobileMode,
			okLabel,
			selectedDate,
			timeMode,
			timezone,
			value,
			yearRange
		]);

		return (
			<DateTimePickerInput
				{...rest}
				placeholder={fieldFormatString || placeholderLabel}
				hideLabel
				inputLabel={fieldFormatString ? placeholderLabel : undefined}
				pickerProps={pickerProps}
				onInputChange={onValueSubmit}
				clearHandler={clearHandlerRef}
				inputErrorMessage={errorMessage}
			/>
		);
	}
);
