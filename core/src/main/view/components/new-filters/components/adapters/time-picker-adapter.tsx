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

import { memo, type FC, useMemo, useContext, useCallback } from "react";

import {
	A11YLanguageContext,
	type TimePickerProps,
	provider as DeviceDetector
} from "@com.mgmtp.a12.widgets/widgets-core";

import { UiStateSelector } from "../../../../../store/index.js";
import { useLocalizedLabels } from "../../../filters/options-views/date-time-common-hooks.js";
import { useOverviewEngineInternalContext } from "../../../../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../../context/overview-engine-context.js";

/** @internal */
export interface TimePickerAdapterProps {
	readonly value: Date | undefined;
	readonly errorMessage: string | undefined;

	readonly readonly?: boolean;
	readonly fieldFormatString?: string;

	readonly timeFormatter: TimePickerProps.TimeFormatter;
	readonly timeConverter: TimePickerProps.TimeConverter;
	readonly onValidate: (value: string) => void;

	readonly onDateChange: (newValue: Date | null) => void;
}

/** @internal */
export const TimePickerAdapter: FC<TimePickerAdapterProps> = memo(function TimePickerAdapter(props) {
	const { timeFormatter, onValidate, fieldFormatString, errorMessage, onDateChange } = props;

	const { okLabel, clearLabel, timePickerButtonTitle } = useLocalizedLabels();

	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const TimePicker = useOverviewEngineContext((context) => context.widgetMap.TimePicker);
	const DateTimePickerHeader = useOverviewEngineContext((context) => context.widgetMap.DateTimePickerHeader);
	const PickerHeaderCloseButton = useOverviewEngineContext((context) => context.widgetMap.PickerHeaderCloseButton);

	const timezone = useOverviewEngineInternalContext((context) => context.timezone);

	const onValidateResult: TimePickerProps["onValidate"] = useCallback(
		(result: { value: string; valid: boolean }) => onValidate(result.value),
		[onValidate]
	);

	const onChange: TimePickerProps["onChange"] = useCallback(
		(value?: Date) => {
			return onDateChange(value ?? null);
		},
		[onDateChange]
	);

	const a11yContext = useContext(A11YLanguageContext);
	const customA11yContext = useMemo(() => {
		return { ...a11yContext, pickerTitles: { ...a11yContext.pickerTitles, timePickerTrigger: timePickerButtonTitle } };
	}, [a11yContext, timePickerButtonTitle]);

	const header: TimePickerProps.Renderer = useCallback(
		(time, closeHandler) => {
			return (
				<DateTimePickerHeader
					actionButtons={DeviceDetector.hasTouch() ? <PickerHeaderCloseButton onClick={closeHandler} /> : undefined}>
					{timeFormatter(time)}
				</DateTimePickerHeader>
			);
		},
		[DateTimePickerHeader, PickerHeaderCloseButton, timeFormatter]
	);

	return (
		<A11YLanguageContext.Provider value={customA11yContext}>
			<TimePicker
				{...props}
				error={!!errorMessage}
				errorMessage={errorMessage}
				onChange={onChange}
				onValidate={onValidateResult}
				timeFormatter={timeFormatter}
				timezone={timezone}
				placeholder={fieldFormatString}
				hideLabel
				okLabel={okLabel}
				clearLabel={clearLabel}
				customHeaderElement={header}
				disabled={disabled}
			/>
		</A11YLanguageContext.Provider>
	);
});
