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

import type { JSONDocument } from "../../../../models/index.js";
import type { OverviewModel } from "../../../../overview-model.js";
import { RESOURCE_KEYS, OverviewModelKeys } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";

export namespace RowActionConfirmDialog {
	export interface Props {
		readonly row: JSONDocument;
		readonly rowActionModel: OverviewModel.Button;
		readonly componentKey: string;
	}
}

const DELETE_EVENT = "delete";

/** @internal */
export const RowActionConfirmDialog: React.ComponentType<RowActionConfirmDialog.Props> = React.memo(
	function RowActionConfirmDialog(props) {
		const { row, rowActionModel, componentKey } = props;

		const onDialogConfirm = useOverviewEngineContext((context) => context.eventHandlers.onDialogConfirm);
		const onDialogClose = useOverviewEngineContext((context) => context.eventHandlers.onDialogClose);
		const onRowButtonClick = useOverviewEngineContext((context) => context.eventHandlers.onRowButtonClick);
		const ModalNotification = useOverviewEngineContext((context) => context.widgetMap.ModalNotification);
		const ButtonGroup = useOverviewEngineContext((context) => context.widgetMap.ButtonGroup);
		const Button = useOverviewEngineContext((context) => context.widgetMap.Button);

		const localizedConfirmDialog = LocalizerHooks.useLocalizedConfirmDialog();
		const { title, message } = React.useMemo(() => {
			const { event, confirmation } = rowActionModel;
			const keys = [...OverviewModelKeys.getActionKeys(componentKey, event), OverviewModelKeys.CONFIRMATION];

			return confirmation ? localizedConfirmDialog(confirmation, keys) : { title: "", message: "" };
		}, [componentKey, rowActionModel, localizedConfirmDialog]);

		const localizedResource = LocalizerHooks.useLocalizedResource();
		const confirmButtonLabel = React.useMemo(() => {
			if (rowActionModel.event === DELETE_EVENT) {
				return localizedResource(RESOURCE_KEYS.overviewEngine.rowAction.deleteConfirmation.delete);
			}

			return localizedResource(RESOURCE_KEYS.overviewEngine.rowAction.confirmation.ok);
		}, [localizedResource, rowActionModel.event]);
		const cancelButtonLabel = React.useMemo(() => {
			if (rowActionModel.event === DELETE_EVENT) {
				return localizedResource(RESOURCE_KEYS.overviewEngine.rowAction.deleteConfirmation.cancel);
			}

			return localizedResource(RESOURCE_KEYS.overviewEngine.rowAction.confirmation.cancel);
		}, [localizedResource, rowActionModel.event]);

		const onConfirm = React.useCallback(
			(event: React.MouseEvent<HTMLElement>) => {
				onDialogConfirm?.();
				onRowButtonClick?.({ documentId: row.id, linkId: row.linkId, rowActionModel });
				event.stopPropagation();
			},
			[onRowButtonClick, row, rowActionModel, onDialogConfirm]
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
