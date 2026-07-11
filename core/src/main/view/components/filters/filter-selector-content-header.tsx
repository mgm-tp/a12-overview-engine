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

import { Switch } from "@com.mgmtp.a12.widgets/widgets-core";

import { LocalizerHooks } from "../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../context/overview-engine-context.js";

import { EmptyLabel } from "./options-views/empty-label.js";

export namespace FilterSelectorContentHeader {
	export interface Props {
		readonly clearButtonLabel?: string;
		readonly clearButtonDisabled?: boolean;
		readonly actionBarElements?: React.ReactNode;
		readonly actionElement?: React.ReactNode;
		enableEmptySwitch?: boolean;

		onClear?(event: React.MouseEvent<HTMLElement>): void;
		onEmptySwitch?(enabled: boolean): void;
		emptySwitchChecked?: boolean;
	}
}

/** @internal */
export const FilterSelectorContentHeader: React.ComponentType<FilterSelectorContentHeader.Props> = React.memo(
	function FilterSelectorContentHeader(props) {
		const {
			clearButtonLabel,
			clearButtonDisabled,
			actionBarElements,
			actionElement,
			enableEmptySwitch,
			onClear,
			onEmptySwitch,
			emptySwitchChecked
		} = props;
		const Button = useOverviewEngineContext((context) => context.widgetMap.Button);
		const FilterSelectorTemplateActionElement = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateActionElement
		);
		const FilterSelectorTemplateActionBar = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateActionBar
		);
		const onEmpty = React.useCallback(
			(enabled: boolean) => {
				onEmptySwitch?.(enabled);
			},
			[onEmptySwitch]
		);
		const emptyLabel = LocalizerHooks.useLocalizedResource()(RESOURCE_KEYS.overviewEngine.filterOptionView.null);

		return (
			<>
				{actionBarElements && <FilterSelectorTemplateActionBar>{actionBarElements}</FilterSelectorTemplateActionBar>}
				{enableEmptySwitch && (
					<FilterSelectorTemplateActionBar className="-u-justify-between">
						<EmptyLabel>{emptyLabel}</EmptyLabel>
						<Switch checked={emptySwitchChecked} fitToParent={false} label={""} onChange={onEmpty}></Switch>
					</FilterSelectorTemplateActionBar>
				)}
				{(clearButtonLabel || actionElement) && (
					<FilterSelectorTemplateActionBar>
						{clearButtonLabel && (
							<FilterSelectorTemplateActionElement>
								<Button
									key="clear-all"
									destructive
									disabled={clearButtonDisabled}
									onClick={onClear}
									label={clearButtonLabel}
								/>
							</FilterSelectorTemplateActionElement>
						)}

						{actionElement !== undefined && (
							<FilterSelectorTemplateActionElement>{actionElement}</FilterSelectorTemplateActionElement>
						)}
					</FilterSelectorTemplateActionBar>
				)}
			</>
		);
	}
);
