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

import { UiStateSelector } from "../../../../store/index.js";
import type { OverviewEngineApi } from "../../../api.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import type { FilterOptionsView } from "../filter-options-view.js";

import {
	useRadioItems,
	useBooleanSubActionBar,
	useBooleanFilterOptionsViewParameters
} from "./boolean-filter-options-view.js";
import { useHeadingElements } from "./date-time-common-hooks.js";

export namespace ConfirmFilterOptionsView {
	export interface Props extends FilterOptionsView.PropsType {
		uiValue: ConfirmUiValueType;
	}

	export interface ConfirmUiValueType extends FilterOptionsView.UiValueType {
		value?: boolean | null;
	}
}

/** @internal */
export const ConfirmFilterOptionsView: React.FC<ConfirmFilterOptionsView.Props> = React.memo(
	function ConfirmFilterOptionsView(props) {
		const wrapperRef = React.useRef<HTMLElement | null>(null);

		const disabled = useOverviewEngineState(UiStateSelector.disabled());
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);
		const Radio = useOverviewEngineContext((context) => context.widgetMap.Radio);

		const { onChange, viewName, uiValue, ariaLevel, hideEmptyValueOption } = props;
		const { isInputEmpty, radioValue } = useBooleanFilterOptionsViewParameters(uiValue);

		const handleOptionValueChange = React.useCallback(
			(value?: boolean | null) => {
				if (onChange) {
					const newOption: OverviewEngineApi.Filter.ConfirmOptions =
						value === undefined || value === false
							? { filterType: "Confirm", modelId: props.modelId }
							: { filterType: "Confirm", modelId: props.modelId, criteria: { value } };

					onChange(newOption);
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
					{useRadioItems(props.path, handleOptionValueChange, "confirm", props.modelId, hideEmptyValueOption)}
				</Radio>
			</FilterSelectorTemplateContent>
		);
	}
);
