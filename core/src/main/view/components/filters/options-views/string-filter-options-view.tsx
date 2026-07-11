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
	TextField,
	BufferedInput,
	HTMLInputAdapter,
	type TextFieldProps,
	type BufferedInputProps,
	type ImmediateInputProps
} from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewEngineApi } from "../../../api.js";
import { UiStateSelector } from "../../../../store/index.js";
import type { FilterOptionsView } from "../filter-options-view.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useIdGenerator, focusNextElement } from "../../../utils.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useSubstringSearchField, useMinSearchTokenSizeValidator } from "../../../hooks/use-search-token-validation.js";

import { useHeadingElements, useLocalizedLabels } from "./date-time-common-hooks.js";

const WrappedTextLineStateless: React.ComponentType<BufferedTextLine.PropsType> = BufferedInput(
	HTMLInputAdapter(TextField)
);

namespace BufferedTextLine {
	export type PropsType = BufferedInputProps<string> & ImmediateInputProps<string> & TextFieldProps;
}

export namespace StringFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		uiValue: StringUiValueType;
	}

	export interface StringUiValueType extends FilterOptionsView.UiValueType {
		value?: string;
	}
}

/** @internal */
export const StringFilterOptionsView: React.FC<StringFilterOptionsView.Props> = React.memo(
	function StringFilterOptionsView(props) {
		const { viewName, ariaLevel, onChange, uiValue, hideEmptyValueOption } = props;
		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const disabled = useOverviewEngineState(UiStateSelector.disabled());
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);

		const substringSearchField = useSubstringSearchField(props.path, props.modelId);
		const getMinTokenSizeError = useMinSearchTokenSizeValidator(substringSearchField);
		const localizedResource = LocalizerHooks.useLocalizedResource();
		const value = uiValue.value ?? "";
		const [submittedValue, setSubmittedValue] = React.useState<string>(value);
		const [prevUiValue, setPrevUiValue] = React.useState<string>(value);

		// Resync on external uiValue change so a rejected value's error does not linger.
		if (value !== prevUiValue) {
			setPrevUiValue(value);
			setSubmittedValue(value);
		}

		const minTokenSizeErrorResource = getMinTokenSizeError(submittedValue);
		const minTokenSizeError = minTokenSizeErrorResource
			? localizedResource(minTokenSizeErrorResource.key, minTokenSizeErrorResource.args)
			: undefined;

		const handleOptionValueChange = React.useCallback(
			(value?: string): void => {
				setSubmittedValue(value ?? "");

				const newValue: StringFilterOptionsView.StringUiValueType = { ...uiValue, value };

				// Flag the option as errored so the filter list item shows the error icon and Apply is
				// blocked, mirroring the date filter; keep the rejected text via the carried uiValue.
				if (getMinTokenSizeError(value)) {
					onChange?.({ filterType: "String", error: true, modelId: props.modelId }, newValue);

					return;
				}

				const convertToFilterOption = (
					stringUiValue: StringFilterOptionsView.StringUiValueType
				): OverviewEngineApi.Filter.StringOptions => {
					if (stringUiValue.value === undefined || stringUiValue.value === "") {
						return { filterType: "String", modelId: props.modelId };
					}

					return { filterType: "String", criteria: { value: stringUiValue.value }, modelId: props.modelId };
				};

				onChange?.(convertToFilterOption(newValue));
			},
			[getMinTokenSizeError, onChange, props.modelId, uiValue]
		);

		const onEmptySwitch = React.useCallback(
			(enabled: boolean): void => {
				onChange?.({ filterType: "String", undefinedMatch: enabled });
			},
			[onChange]
		);
		const emptySwitchHandler = hideEmptyValueOption ? undefined : onEmptySwitch;
		const isUndefinedMatch = !!uiValue.undefinedMatch;

		const generateId = useIdGenerator();
		const id = React.useMemo(() => generateId({ id: "filter-string" }), [generateId]);
		const { singleInputLabel } = useLocalizedLabels();

		return (
			<FilterSelectorTemplateContent
				padding
				wrapperRef={(ref) => {
					wrapperRef.current = ref;
				}}
				headingElements={useHeadingElements(viewName, ariaLevel)}
				subActionBar={useSubActionBar(
					wrapperRef.current,
					handleOptionValueChange,
					emptySwitchHandler,
					uiValue.value === "",
					isUndefinedMatch
				)}>
				{!uiValue.undefinedMatch && (
					<WrappedTextLineStateless
						id={id}
						disabled={disabled}
						value={submittedValue}
						onValueSubmit={handleOptionValueChange}
						error={!!minTokenSizeError}
						errorMessage={minTokenSizeError}
						placeholder={singleInputLabel}
					/>
				)}
			</FilterSelectorTemplateContent>
		);
	}
);

function useSubActionBar(
	wrapperRef: HTMLElement | null,
	handleOptionValueChange: (value?: string) => void,
	handleEmptySwitch: ((enabled: boolean) => void) | undefined,
	isInputEmpty: boolean,
	isUndefinedMatch: boolean
): React.ReactNode {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const SubActionBar = useOverviewEngineContext((context) => context.widgetMap.SubActionBar);
	const FilterSelectorContentHeader = useOverviewEngineContext(
		(context) => context.componentMap.FilterSelectorContentHeader
	);

	const onClear = React.useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			event.stopPropagation();

			if (wrapperRef) {
				focusNextElement(event.currentTarget, wrapperRef);
			}

			handleOptionValueChange("");
		},
		[handleOptionValueChange, wrapperRef]
	);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	if (smallView) {
		return undefined;
	}

	return (
		<SubActionBar>
			<FilterSelectorContentHeader
				clearButtonLabel={
					!isUndefinedMatch ? localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.clearAll) : undefined
				}
				clearButtonDisabled={disabled || isInputEmpty}
				onClear={onClear}
				enableEmptySwitch={!!handleEmptySwitch}
				onEmptySwitch={handleEmptySwitch}
				emptySwitchChecked={isUndefinedMatch}
			/>
		</SubActionBar>
	);
}
