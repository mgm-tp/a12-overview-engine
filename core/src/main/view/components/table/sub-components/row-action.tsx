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

import { type JSONDocument } from "../../../../models/index.js";
import type { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks, OverviewModelKeys } from "../../../../services/localization/index.js";

import hooks from "./hooks.js";
import { RightClickContextMenuContext } from "./right-click-context-menu.js";

export namespace RowAction {
	export interface PropsType {
		readonly row: JSONDocument;
		readonly rowActionModel: OverviewModel.Button;
		readonly displayAsPopupEntry?: boolean;
		readonly divider?: boolean;
	}
}

/** @internal */
export const RowAction: React.ComponentType<RowAction.PropsType> = React.memo(function RowAction(props) {
	const { row, rowActionModel, displayAsPopupEntry, divider } = props;

	const onRowButtonClick = useOverviewEngineContext((context) => context.eventHandlers.onRowButtonClick);
	const onRowButtonClickRequest = useOverviewEngineContext((context) => context.eventHandlers.onRowButtonClickRequest);
	const Button = useOverviewEngineContext((context) => context.componentMap.Button);
	const ListItem = useOverviewEngineContext((context) => context.widgetMap.ListItem);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);

	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();

	const componentKey = React.useMemo(() => {
		return displayAsPopupEntry ? OverviewModelKeys.CONTEXT_MENU : OverviewModelKeys.ROW_ACTION_GROUP;
	}, [displayAsPopupEntry]);

	const { primary, destructive, labelHidden } = rowActionModel;

	const screenReaderCellIdGetter = hooks.useScreenReaderCellId();
	const screenReaderCellId = React.useMemo(() => screenReaderCellIdGetter(row), [screenReaderCellIdGetter, row]);

	const [label, description] = React.useMemo<[string, string]>(() => {
		const actionKeys = OverviewModelKeys.getActionKeys(componentKey, rowActionModel.event);

		return [
			localizedOverviewElement([...actionKeys, OverviewModelKeys.LABEL], rowActionModel.label),
			localizedOverviewElement([...actionKeys, OverviewModelKeys.TITLE], rowActionModel.description)
		];
	}, [componentKey, rowActionModel.event, rowActionModel.label, rowActionModel.description, localizedOverviewElement]);

	const listItemTitle = React.useMemo(() => (!label && description ? description : undefined), [label, description]);

	const buttonId = React.useId();
	const ariaLabelledBy = React.useMemo(
		() => (screenReaderCellId ? `${buttonId} ${screenReaderCellId}` : undefined),
		[buttonId, screenReaderCellId]
	);

	const icon = React.useMemo<React.ReactNode | undefined>(
		() => rowActionModel.icon?.name && <Icon iconTheme={rowActionModel.icon.theme}>{rowActionModel.icon.name}</Icon>,
		[Icon, rowActionModel.icon]
	);

	const rowActionDisabledGetter = hooks.useRowActionStateGetter("disabled");
	const rowDisabledGetter = hooks.useRowDisabilityGetter();
	const disabled = React.useMemo(
		() => rowDisabledGetter(row) || !!rowActionDisabledGetter(row, rowActionModel),
		[rowDisabledGetter, rowActionDisabledGetter, row, rowActionModel]
	);

	const { closeHandler: closeRightClickContextMenu } = React.useContext(RightClickContextMenuContext);

	const onClick = React.useCallback(
		(event: React.MouseEvent<HTMLElement>) => {
			if (!props.displayAsPopupEntry) {
				// With normal button we should prevent event bubbling to the row. With popup menu we let it bubble so that menu can close
				event.stopPropagation();
			}

			closeRightClickContextMenu?.();

			if (rowActionModel.confirmation) {
				setTimeout(() => {
					onRowButtonClickRequest?.({ row, rowActionModel, componentKey });
				});
			} else {
				onRowButtonClick?.({ documentId: row.id, rowActionModel });
			}
		},
		[
			props.displayAsPopupEntry,
			closeRightClickContextMenu,
			rowActionModel,
			row,
			componentKey,
			onRowButtonClickRequest,
			onRowButtonClick
		]
	);

	const className = React.useMemo(() => rowActionModel.styles?.join(" ") ?? undefined, [rowActionModel.styles]);

	return props.displayAsPopupEntry ? (
		<ListItem
			text={label}
			disabled={disabled}
			graphic={icon}
			className={className}
			onClick={onClick}
			divider={divider}
			title={listItemTitle}
			ariaLabel={listItemTitle}
		/>
	) : (
		<Button
			id={ariaLabelledBy ? buttonId : undefined}
			label={label}
			description={description}
			primary={primary}
			destructive={destructive}
			disabled={disabled}
			icon={icon}
			className={className}
			onClick={onClick}
			labelHidden={labelHidden}
			ariaLabelledBy={ariaLabelledBy}
		/>
	);
});
