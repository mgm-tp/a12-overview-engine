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

import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { TextField, BufferedInput, HTMLInputAdapter } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { UiStateSelector } from "../../../../store/index.js";
import type { OverviewEngineApi } from "../../../api.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useIdGenerator } from "../../../utils.js";
import type { FilterOptionsView } from "../filter-options-view.js";

import { useDateTimeSubActionBar, useDateTimeCommonParameters } from "./date-time-common-hooks.js";
import type { DateTimeViewValue } from "./date-time-filter-view.api.js";
import { DateTimeUtils } from "./date-time-utils.js";
import { SectionTemplate, type SectionType } from "./section-template.js";

const DateInput = BufferedInput(HTMLInputAdapter(TextField));

export namespace DateFragmentFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		readonly uiValue: DateTimeViewValue;
	}
}

/** @internal */
export const DateFragmentFilterOptionsView: React.FC<DateFragmentFilterOptionsView.Props> = React.memo(
	function DateFragmentFilterOptionsView(props) {
		const { viewName, uiValue, ariaLevel, onChange, path, hideEmptyValueOption } = props;
		const timezone = useOverviewEngineInternalContext((context) => context.timezone);
		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);

		const triggerChange = React.useCallback(
			(uiValue: DateTimeViewValue) => {
				const convertToFilterOptions = (uiValue: DateTimeViewValue) => {
					const baseDateOptions: OverviewEngineApi.Filter.DateOptions = {
						filterType: "Date",
						modelId: props.modelId,
						type: "DateFragment"
					};

					if (uiValue.start.errorMessage || uiValue.end.errorMessage || DateTimeUtils.isNotValidRange(uiValue)) {
						return { ...baseDateOptions, error: true };
					}

					if (!uiValue.start.value && !uiValue.end.value) {
						return baseDateOptions;
					}

					return {
						...baseDateOptions,
						criteria: { start: uiValue.start.value, end: uiValue.end.value }
					};
				};

				onChange?.(convertToFilterOptions(uiValue), uiValue);
			},
			[onChange, props.modelId]
		);

		const { isInputEmpty, headingElements, rangeErrorMessage, onClearButtonClick } = useDateTimeCommonParameters(
			uiValue,
			triggerChange,
			viewName,
			wrapperRef.current,
			ariaLevel
		);
		const onEmptySwitch = React.useCallback(
			(enabled: boolean): void => {
				const newUIValue = { ...uiValue, undefinedMatch: enabled };
				onChange?.(DateTimeUtils.convertToFilterOptions(newUIValue, "DateFragment", timezone), newUIValue);
			},
			[onChange, timezone, uiValue]
		);

		const sectionRenderer = useSectionRenderer(uiValue, triggerChange, path, props.modelId);
		const emptySwitchHandler = hideEmptyValueOption ? undefined : onEmptySwitch;
		const isUndefinedMatch = !!uiValue.undefinedMatch;

		return (
			<FilterSelectorTemplateContent
				headingElements={headingElements}
				subActionBar={useDateTimeSubActionBar(
					wrapperRef.current,
					onClearButtonClick,
					isInputEmpty,
					emptySwitchHandler,
					isUndefinedMatch
				)}
				wrapperRef={(ref) => {
					wrapperRef.current = ref;
				}}
				padding={false}>
				{!uiValue.undefinedMatch && (
					<SectionTemplate errorMessage={rangeErrorMessage} sectionRenderer={sectionRenderer} />
				)}
			</FilterSelectorTemplateContent>
		);
	}
);

function useSectionRenderer(
	uiValue: DateTimeViewValue,
	triggerChange: (dateTimeViewValue: DateTimeViewValue) => void,
	path: ModelPath,
	modelId?: string
) {
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const generateId = useIdGenerator();
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const parseDateTime = DateTimeUtils.useDateTimeParser(modelId);
	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();

	const onValueSubmit = React.useCallback(
		(sectionType: SectionType, newValue: string | undefined): void => {
			const newState = parseDateTime(path, newValue);
			triggerChange({ ...uiValue, [sectionType]: newState });
		},
		[parseDateTime, path, triggerChange, uiValue]
	);

	const fieldFormatString = React.useMemo(
		() => localizedFieldFormat(path, modelId),
		[localizedFieldFormat, modelId, path]
	);

	return React.useCallback(
		(sectionType: SectionType) => {
			const placeholderLabel = localizedResource(
				RESOURCE_KEYS.overviewEngine.filterOptionView.placeholder[sectionType]
			);

			return (
				<DateInput
					id={generateId({ id: "filter-date-fragment", suffix: sectionType })}
					disabled={disabled}
					onValueSubmit={(newText) => onValueSubmit(sectionType, newText)}
					value={uiValue[sectionType].input}
					errorMessage={uiValue[sectionType].errorMessage}
					placeholder={fieldFormatString ?? placeholderLabel}
					hideLabel
					label={fieldFormatString ? placeholderLabel : undefined}
				/>
			);
		},
		[localizedResource, generateId, disabled, uiValue, fieldFormatString, onValueSubmit]
	);
}
