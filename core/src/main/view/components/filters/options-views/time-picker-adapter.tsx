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

import {
	A11YLanguageContext,
	type TimePickerProps,
	provider as DeviceDetector
} from "@com.mgmtp.a12.widgets/widgets-core";

import { UiStateSelector } from "../../../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";

import { useLocalizedLabels } from "./date-time-common-hooks.js";
import type { DateTimeViewValue } from "./date-time-filter-view.api.js";
import { DateTimeUtils } from "./date-time-utils.js";
import type { SectionType } from "./section-template.js";

/** @internal */
export namespace TimePickerAdapter {
	export interface Props {
		readonly id: string;
		readonly sectionType: SectionType;
		readonly value: Date | undefined;
		readonly uiValue: DateTimeViewValue;

		readonly readonly?: boolean;
		readonly isDateTime?: boolean;
		readonly enableTimePicker?: boolean;
		readonly fieldFormatString?: string;

		timeFormatter: TimePickerProps.TimeFormatter;
		timeConverter: TimePickerProps.TimeConverter;
		onValidate: (value: string) => void;

		clearHandlerRef: (clearHandler: () => void) => void;
		triggerChange: (uiValue: DateTimeViewValue) => void;
	}
}

/** @internal */
export const TimePickerAdapter: React.FC<TimePickerAdapter.Props> = React.memo(function TimePickerAdapter(props) {
	const {
		sectionType,
		uiValue,
		triggerChange,
		clearHandlerRef,
		isDateTime,
		enableTimePicker,
		timeFormatter,
		timeConverter,
		onValidate,
		fieldFormatString
	} = props;

	const { placeholderLabel, okLabel, clearLabel, timePickerButtonTitle } = useLocalizedLabels(sectionType);

	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const TimePicker = useOverviewEngineContext((context) => context.widgetMap.TimePicker);
	const DateTimePickerHeader = useOverviewEngineContext((context) => context.widgetMap.DateTimePickerHeader);
	const PickerHeaderCloseButton = useOverviewEngineContext((context) => context.widgetMap.PickerHeaderCloseButton);

	const timezone = useOverviewEngineInternalContext((context) => context.timezone);

	const onValidateResult: TimePickerProps["onValidate"] = React.useCallback(
		(result: { value: string; valid: boolean }) => onValidate(result.value),
		[onValidate]
	);

	const error = React.useMemo(() => DateTimeUtils.isNotValidRange(uiValue, timezone), [timezone, uiValue]);
	const errorMessage = React.useMemo(() => uiValue[sectionType].errorMessage, [sectionType, uiValue]);

	const padValue = React.useCallback(
		(value: Date | undefined) => (isDateTime ? DateTimeUtils.padToday(value, timezone) : value),
		[isDateTime, timezone]
	);
	const onChange: TimePickerProps["onChange"] = React.useCallback(
		(value?: Date) => {
			const paddedValue = padValue(value);

			triggerChange({ ...uiValue, [sectionType]: { value: paddedValue, input: timeFormatter(paddedValue) } });
		},
		[padValue, timeFormatter, triggerChange, sectionType, uiValue]
	);

	const a11yContext = React.useContext(A11YLanguageContext);
	const customA11yContext = React.useMemo(() => {
		return { ...a11yContext, pickerTitles: { ...a11yContext.pickerTitles, timePickerTrigger: timePickerButtonTitle } };
	}, [a11yContext, timePickerButtonTitle]);

	const header: TimePickerProps.Renderer = React.useCallback(
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
				hidePickerButton={!enableTimePicker}
				error={error}
				errorMessage={errorMessage}
				onChange={onChange}
				onValidate={onValidateResult}
				timeConverter={timeConverter}
				timeFormatter={timeFormatter}
				timezone={timezone}
				placeholder={fieldFormatString || placeholderLabel}
				hideLabel
				label={fieldFormatString ? placeholderLabel : undefined}
				okLabel={okLabel}
				clearLabel={clearLabel}
				customHeaderElement={header}
				disabled={disabled}
				clearHandler={clearHandlerRef}
			/>
		</A11YLanguageContext.Provider>
	);
});
