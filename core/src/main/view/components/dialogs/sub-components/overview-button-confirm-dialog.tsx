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

import type { OverviewModel } from "../../../../overview-model.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { RESOURCE_KEYS, OverviewModelKeys } from "../../../../services/localization/index.js";

export namespace OverviewButtonConfirmDialog {
	export interface Props {
		readonly buttonModel: OverviewModel.Button;
		readonly componentKey: string;
	}
}

/** @internal */
export const OverviewButtonConfirmDialog: React.ComponentType<OverviewButtonConfirmDialog.Props> = React.memo(
	function OverviewButtonConfirmDialog(props) {
		const { buttonModel, componentKey } = props;
		const { confirmation } = buttonModel;

		const onEventButtonClick = useOverviewEngineContext((context) => context.eventHandlers.onEventButtonClick);
		const onDialogConfirm = useOverviewEngineContext((context) => context.eventHandlers.onDialogConfirm);
		const onDialogClose = useOverviewEngineContext((context) => context.eventHandlers.onDialogClose);
		const ModalNotification = useOverviewEngineContext((context) => context.widgetMap.ModalNotification);
		const ButtonGroup = useOverviewEngineContext((context) => context.widgetMap.ButtonGroup);
		const Button = useOverviewEngineContext((context) => context.widgetMap.Button);

		const localizedConfirmDialog = LocalizerHooks.useLocalizedConfirmDialog();
		const { title, message } = React.useMemo(() => {
			const keys = [
				...OverviewModelKeys.getActionKeys(componentKey, buttonModel.event),
				OverviewModelKeys.CONFIRMATION
			];

			return confirmation ? localizedConfirmDialog(confirmation, keys) : { title: "", message: "" };
		}, [buttonModel.event, componentKey, confirmation, localizedConfirmDialog]);

		const localizedResource = LocalizerHooks.useLocalizedResource();
		const confirmButtonLabel = React.useMemo(
			() => localizedResource(RESOURCE_KEYS.overviewEngine.button.confirmation.ok),
			[localizedResource]
		);
		const cancelButtonLabel = React.useMemo(
			() => localizedResource(RESOURCE_KEYS.overviewEngine.button.confirmation.cancel),
			[localizedResource]
		);

		const onConfirm = React.useCallback(
			(event: React.MouseEvent<HTMLElement>) => {
				onDialogConfirm?.();
				onEventButtonClick?.(buttonModel.event, buttonModel);
				event.stopPropagation();
			},
			[onEventButtonClick, buttonModel, onDialogConfirm]
		);

		const onClose = React.useCallback(() => {
			onDialogClose?.();
		}, [onDialogClose]);

		return (
			<ModalNotification
				title={title}
				footer={
					<ButtonGroup alignment="right">
						<Button key="cancel-button" label={cancelButtonLabel} onClick={onClose} />
						<Button key="confirm-button" label={confirmButtonLabel} primary destructive onClick={onConfirm} />
					</ButtonGroup>
				}
				variant="warning"
				key="dialog"
				closeOnEsc
				onClose={onClose}>
				<p>{message}</p>
			</ModalNotification>
		);
	}
);
