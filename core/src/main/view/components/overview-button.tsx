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

import { UiStateSelector } from "../../store/index.js";
import type { OverviewModel } from "../../overview-model.js";
import { LocalizerHooks, OverviewModelKeys } from "../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

/** @internal */
export const OverviewButton: React.ComponentType<OverviewButton.Props> = React.memo(function OverviewButton(props) {
	const { buttonModel, componentKey } = props;

	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const onEventButtonClickRequest = useOverviewEngineContext(
		(context) => context.eventHandlers.onEventButtonClickRequest
	);
	const Button = useOverviewEngineContext((context) => context.componentMap.Button);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);
	const onEventButtonClick = useOverviewEngineContext((context) => context.eventHandlers.onEventButtonClick);

	const handleOnClick = React.useCallback(() => {
		if (buttonModel.confirmation) {
			onEventButtonClickRequest?.({ buttonModel, componentKey });
		} else {
			onEventButtonClick?.(buttonModel.event, buttonModel);
		}
	}, [buttonModel, componentKey, onEventButtonClickRequest, onEventButtonClick]);

	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const [label, description] = React.useMemo<[string, string]>(() => {
		const buttonKeys = OverviewModelKeys.getActionKeys(componentKey, buttonModel.event);

		return [
			localizedOverviewElement([...buttonKeys, OverviewModelKeys.LABEL], buttonModel.label),
			localizedOverviewElement([...buttonKeys, OverviewModelKeys.TITLE], buttonModel.description)
		];
	}, [buttonModel.event, buttonModel.label, buttonModel.description, componentKey, localizedOverviewElement]);

	return (
		<Button
			label={label}
			description={description}
			className={buttonModel.styles ? buttonModel.styles.join(" ") : undefined}
			disabled={!!disabled || !!props.disabled}
			onClick={handleOnClick}
			icon={buttonModel.icon && <Icon iconTheme={buttonModel.icon.theme}>{buttonModel.icon.name}</Icon>}
			primary={buttonModel.primary}
			destructive={buttonModel.destructive}
			labelHidden={buttonModel.labelHidden}
		/>
	);
});

export namespace OverviewButton {
	export interface Props {
		readonly buttonModel: OverviewModel.Button;
		readonly disabled?: boolean;
		readonly componentKey: string;
	}
}
