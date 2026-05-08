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

import { type ModelPath } from "@com.mgmtp.a12.base/base-model-api";

import { type OverviewEngineApi } from "../../../api.js";
import { UiStateSelector } from "../../../../store/index.js";
import { type FilterOptionsView } from "../filter-options-view.js";
import { useIdGenerator, focusNextElement } from "../../../utils.js";
import { LocalizerHooks } from "../../../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { EmptyLabel } from "./empty-label.js";
import { type ConfirmFilterOptionsView } from "./confirm-filter-options-view.js";
import { useHeadingElements, useLocalizedLabels } from "./date-time-common-hooks.js";

export namespace BooleanFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		uiValue: BooleanUiValueType;
	}

	export interface BooleanUiValueType extends FilterOptionsView.UiValueType {
		value?: boolean | null;
	}
}

const ORDERED_BOOLEAN_VALUES = [null, true, false] as const;
const ORDERED_CONFIRM_VALUES = [null, true] as const;

/** @internal */
export const BooleanFilterOptionsView: React.FC<BooleanFilterOptionsView.Props> = React.memo(
	function BooleanFilterOptionsView(props) {
		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const disabled = useOverviewEngineState(UiStateSelector.disabled());
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);
		const Radio = useOverviewEngineContext((context) => context.widgetMap.Radio);

		const { onChange, uiValue, viewName, ariaLevel, hideEmptyValueOption } = props;
		const { isInputEmpty, radioValue } = useBooleanFilterOptionsViewParameters(uiValue);

		const handleOptionValueChange = React.useCallback(
			(value?: boolean | null) => {
				if (onChange) {
					const newValue: OverviewEngineApi.Filter.BooleanOptions =
						value === undefined
							? { filterType: "Boolean", modelId: props.modelId }
							: { filterType: "Boolean", modelId: props.modelId, criteria: { value } };

					onChange(newValue);
				}
			},
			[onChange, props.modelId]
		);

		return (
			<FilterSelectorTemplateContent
				padding
				headingElements={useHeadingElements(viewName, ariaLevel)}
				subActionBar={useBooleanSubActionBar(wrapperRef.current, handleOptionValueChange, isInputEmpty)}
				wrapperRef={(ref) => {
					wrapperRef.current = ref;
				}}>
				<Radio value={radioValue} disabled={disabled}>
					{useRadioItems(props.path, handleOptionValueChange, "boolean", props.modelId, hideEmptyValueOption)}
				</Radio>
			</FilterSelectorTemplateContent>
		);
	}
);

/** @internal */
export function useBooleanSubActionBar(
	wrapperRef: HTMLElement | null,
	handleOptionValueChange: (value?: boolean | null) => void,
	isInputEmpty: boolean
): React.ReactNode {
	const smallView = useOverviewEngineContext((context) => context.smallView);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const SubActionBar = useOverviewEngineContext((context) => context.widgetMap.SubActionBar);
	const FilterSelectorContentHeader = useOverviewEngineContext(
		(context) => context.componentMap.FilterSelectorContentHeader
	);

	const { clearAllLabel } = useLocalizedLabels();

	const onClear = React.useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			event.stopPropagation();

			if (wrapperRef) {
				focusNextElement(event.currentTarget, wrapperRef);
			}

			handleOptionValueChange(undefined);
		},
		[handleOptionValueChange, wrapperRef]
	);

	return React.useMemo(
		() =>
			!smallView ? (
				<SubActionBar>
					<FilterSelectorContentHeader
						clearButtonLabel={clearAllLabel}
						clearButtonDisabled={disabled || isInputEmpty}
						onClear={onClear}
					/>
				</SubActionBar>
			) : undefined,
		[FilterSelectorContentHeader, SubActionBar, clearAllLabel, disabled, isInputEmpty, onClear, smallView]
	);
}

/** @internal */
export function useRadioItems(
	path: ModelPath,
	handleOptionValueChange: (value?: boolean | null) => void,
	type: "boolean" | "confirm" = "boolean",
	modelId?: string,
	hideEmptyValueOption?: boolean
) {
	const RadioItem = useOverviewEngineContext((context) => context.widgetMap.RadioItem);

	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue({ filterMode: true });

	const generateId = useIdGenerator();
	const renderRadioItem = React.useCallback(
		(fieldValue: boolean | null) => {
			const prefix = type + "-filter";
			const id = `${prefix}-${fieldValue}`;

			return (
				<RadioItem
					id={generateId({ id, suffix: String(fieldValue) })}
					key={id}
					value={String(fieldValue)}
					label={
						fieldValue === null ? (
							<EmptyLabel>{localizedFieldValue(path, fieldValue, modelId)}</EmptyLabel>
						) : (
							localizedFieldValue(path, fieldValue, modelId)
						)
					}
					name={`a12-${prefix}-option`}
					onChange={() => {
						handleOptionValueChange(fieldValue);
					}}
				/>
			);
		},
		[type, RadioItem, generateId, localizedFieldValue, path, modelId, handleOptionValueChange]
	);

	const radioItemValues = React.useMemo(() => {
		const base = type === "boolean" ? ORDERED_BOOLEAN_VALUES : ORDERED_CONFIRM_VALUES;

		return hideEmptyValueOption ? base.filter((value) => value !== null) : base;
	}, [hideEmptyValueOption, type]);

	return React.useMemo(() => radioItemValues.map(renderRadioItem), [radioItemValues, renderRadioItem]);
}

/** @internal */
export function useBooleanFilterOptionsViewParameters(
	uiValue: BooleanFilterOptionsView.BooleanUiValueType | ConfirmFilterOptionsView.ConfirmUiValueType
): { isInputEmpty: boolean; radioValue: string } {
	const isInputEmpty = React.useMemo<boolean>(() => uiValue.value === undefined, [uiValue]);
	const radioValue = React.useMemo<string>(() => String(uiValue ? uiValue.value : undefined), [uiValue]);

	return React.useMemo(() => ({ isInputEmpty, radioValue }), [isInputEmpty, radioValue]);
}
