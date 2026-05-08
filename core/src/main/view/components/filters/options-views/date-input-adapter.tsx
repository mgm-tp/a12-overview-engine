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
import { type YearRange, type DateInputProps } from "@com.mgmtp.a12.widgets/widgets-core";

import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";

import { type SectionType } from "./section-template.js";
import { useLocalizedLabels } from "./date-time-common-hooks.js";

/** @internal */
export namespace DateInputAdapter {
	export interface Props
		extends Pick<
			DateInputProps,
			"disabled" | "readonly" | "error" | "errorMessage" | "dateConverter" | "dateFormatter"
		> {
		readonly id: string;
		readonly value?: Date;
		readonly sectionType: SectionType;
		readonly enableDatePicker?: boolean;
		readonly yearRange?: YearRange;
		readonly clearHandlerRef: (clearHandler: () => void) => void;
		readonly fieldFormatString?: string;
		onValueSelect(date: Date | undefined): void;
		onValueSubmit(input: string): void;
	}
}

/** @internal */
export const DateInputAdapter: React.FC<DateInputAdapter.Props> = React.memo(function DateInputAdapter(props) {
	const {
		sectionType,
		yearRange,
		clearHandlerRef,
		enableDatePicker,
		onValueSubmit,
		onValueSelect,
		value: defaultValue,
		fieldFormatString,
		...rest
	} = props;
	const DateInput = useOverviewEngineContext((context) => context.widgetMap.DateInput);
	const timezone = useOverviewEngineInternalContext((context) => context.timezone);
	const { locale } = React.useContext(LocalizerContext);

	const { okLabel, placeholderLabel, datePickerButtonTitle } = useLocalizedLabels(sectionType);

	const datePickerDialogProps: DateInputProps["datePickerDialogProps"] = React.useMemo(() => ({ okLabel }), [okLabel]);

	const datePickerProps: DateInputProps["datePickerProps"] = React.useMemo(
		() => ({ yearRange, timezone, locale: Locale.toString(locale) }),
		[locale, timezone, yearRange]
	);

	return (
		<DateInput
			{...rest}
			hidePickerButton={!enableDatePicker}
			clearHandler={clearHandlerRef}
			datePickerDialogProps={datePickerDialogProps}
			datePickerProps={datePickerProps}
			defaultValue={defaultValue}
			onInputValidationError={onValueSubmit}
			onSelectedDayChange={onValueSelect}
			pickerButtonTitle={datePickerButtonTitle}
			placeholder={fieldFormatString || placeholderLabel}
			hideLabel
			label={fieldFormatString ? placeholderLabel : undefined}
		/>
	);
});
