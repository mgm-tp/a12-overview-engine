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

import { RESOURCE_KEYS, OverviewModelKeys } from "../../../services/localization/index.js";
import { UiStateSelector } from "../../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../hooks/localizer-hooks.js";

export namespace ClearMultiSelectionDialog {
	export interface Props {
		onConfirm(): void;
		onCancel(): void;
	}
}

/** @internal */
export const ClearMultiSelectionDialog: React.ComponentType<ClearMultiSelectionDialog.Props> = React.memo(
	function ClearMultiSelectionDialog(props) {
		const overviewModel = useOverviewEngineContext((context) => context.overviewModel);
		const ModalNotification = useOverviewEngineContext((context) => context.widgetMap.ModalNotification);
		const ButtonGroup = useOverviewEngineContext((context) => context.widgetMap.ButtonGroup);
		const Button = useOverviewEngineContext((context) => context.widgetMap.Button);

		const localizedResource = LocalizerHooks.useLocalizedResource();
		const localizedConfirmDialog = LocalizerHooks.useLocalizedConfirmDialog();

		const { title, message } = React.useMemo(() => {
			const confirmation = overviewModel.content.configuration.multiSelection?.clearConfirmation?.confirmation;

			if (confirmation) {
				const keys = [OverviewModelKeys.MULTI_SELECTION, OverviewModelKeys.CLEAR_CONFIRMATION];

				return localizedConfirmDialog(confirmation, keys);
			}

			return {
				title: localizedResource(RESOURCE_KEYS.overviewEngine.multiSelection.clearConfirmation.title),
				message: localizedResource(RESOURCE_KEYS.overviewEngine.multiSelection.clearConfirmation.message)
			};
		}, [
			overviewModel.content.configuration.multiSelection?.clearConfirmation?.confirmation,
			localizedConfirmDialog,
			localizedResource
		]);

		const confirmLabel = React.useMemo(
			() => localizedResource(RESOURCE_KEYS.overviewEngine.multiSelection.clearConfirmation.ok),
			[localizedResource]
		);
		const cancelLabel = React.useMemo(
			() => localizedResource(RESOURCE_KEYS.overviewEngine.multiSelection.clearConfirmation.cancel),
			[localizedResource]
		);

		const { onConfirm, onCancel } = props;

		return (
			<ModalNotification
				title={title}
				footer={
					<ButtonGroup alignment="right">
						<Button key="cancel-button" label={cancelLabel} onClick={onCancel} />
						<Button key="confirm-button" label={confirmLabel} primary destructive onClick={onConfirm} />
					</ButtonGroup>
				}
				variant="warning"
				key="dialog"
				closeOnEsc
				onClose={onCancel}>
				<p>{message}</p>
			</ModalNotification>
		);
	}
);

/** @internal */
export function useClearMultiSelectionDialogVisible(): boolean {
	const hasSelectedRow = useOverviewEngineState(UiStateSelector.hasSelectedRow());
	const enabledClearConfirmation = useOverviewEngineContext(
		(context) => context.overviewModel?.content.configuration.multiSelection?.clearConfirmation?.enabled
	);

	return React.useMemo(() => !!enabledClearConfirmation && hasSelectedRow, [enabledClearConfirmation, hasSelectedRow]);
}
