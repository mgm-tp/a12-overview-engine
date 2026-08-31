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

import { List } from "@com.mgmtp.a12.widgets/widgets-core";

import { JSONDocument } from "../../../../models/index.js";
import type { OverviewModel } from "../../../../overview-model.js";
import { OverviewModelKeys } from "../../../../services/localization/index.js";
import { UiStateSelector } from "../../../../store/index.js";
import type { OverviewEngineApi } from "../../../api.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { toCellId, pickRowState } from "../../../utils.js";

function useRowDisabilityGetter() {
	const contextDisabled = useOverviewEngineState(UiStateSelector.disabled());

	const rowStateGetter = useRowStateGetter("disabled");

	return React.useCallback(
		(row: JSONDocument) => !!contextDisabled || !!rowStateGetter(row),
		[contextDisabled, rowStateGetter]
	);
}

function useRowStateGetter<Property extends keyof OverviewEngineApi.RowState[string]>(property: Property) {
	const rowState = useOverviewEngineState(UiStateSelector.rowState());

	return React.useCallback((row: JSONDocument) => pickRowState(rowState, row)?.[property], [property, rowState]);
}

function useRowActionStateGetter<Property extends keyof OverviewEngineApi.RowActionState.IndividualRowActionState>(
	property: Property
) {
	const rowActionState = useOverviewEngineContext((context) => context.rowActionState);
	const rowActionStyling = useOverviewEngineContext((context) => context.rowActionStyling);

	return React.useCallback(
		(row: JSONDocument, button: OverviewModel.Button) => {
			const callbackState = rowActionStyling?.({ row, button });

			if (callbackState?.[property] !== undefined) {
				return callbackState[property];
			}

			const specificState = rowActionState?.rows?.[row.id]?.[button.event];
			const state = rowActionState?.rowActions?.[button.event];

			return specificState?.[property] ?? state?.[property];
		},
		[property, rowActionState, rowActionStyling]
	);
}

function useMenuItemsGetter(actionGroups: OverviewModel.ActionGroup[]) {
	const RowAction = useOverviewEngineContext((context) => context.componentMap.RowAction);

	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const isHidden = useRowActionStateGetter("hidden");

	return React.useCallback(
		(row: JSONDocument) => {
			const visibleGroups = actionGroups
				.map((group) => ({ ...group, actions: group.actions.filter((action) => !isHidden(row, action)) }))
				.filter(({ actions }) => actions.length > 0);

			const menuItems = visibleGroups.map((group, groupIndex, groups) => {
				const titleKeys = [OverviewModelKeys.CONTEXT_MENU, OverviewModelKeys.ACTION_GROUPS, group.name];

				return (
					<React.Fragment key={group.name}>
						{group.title && <List.SubHeader fill>{localizedOverviewElement(titleKeys, group.title)}</List.SubHeader>}
						{group.actions.map((action, actionIndex) => {
							let divider = false;

							if (actionIndex === group.actions.length - 1 && groups[groupIndex + 1] && !groups[groupIndex + 1].title) {
								divider = true;
							}

							return (
								<RowAction displayAsPopupEntry key={actionIndex} row={row} rowActionModel={action} divider={divider} />
							);
						})}
					</React.Fragment>
				);
			});

			const paddedLeft = visibleGroups.some((group) => group.actions.some((action) => action.icon));

			return { menuItems, paddedLeft };
		},
		[RowAction, actionGroups, isHidden, localizedOverviewElement]
	);
}

function useRightClickActionGroups(
	contextMenuModel?: OverviewModel.ContextMenu,
	rowActionGroupModel?: OverviewModel.RowActionGroup
): OverviewModel.ActionGroup[] {
	const contextMenuGroupContext = useOverviewEngineContext(
		(context) => context.overviewModel.content.contextMenu?.groups
	);
	const rowActionsContext = useOverviewEngineContext((context) => context.overviewModel.content.rowActionGroup.actions);

	return React.useMemo(() => {
		const contextMenuGroups = contextMenuModel?.groups ?? contextMenuGroupContext ?? [];
		const rowActions = rowActionGroupModel?.actions ?? rowActionsContext ?? [];

		const rowActionGroup: OverviewModel.ActionGroup = {
			name: "rowActions",
			actions: rowActions.map((action) => ({ ...action, label: action.label ?? action.description }))
		};

		return [rowActionGroup, ...contextMenuGroups];
	}, [contextMenuGroupContext, contextMenuModel?.groups, rowActionGroupModel?.actions, rowActionsContext]);
}

function useRowsSelect() {
	const rowState = useOverviewEngineState(UiStateSelector.rowState());
	const onRowsSelect = useOverviewEngineContext((context) => context.eventHandlers.onRowsSelect);

	const data = useOverviewEngineContext((context) => context.data);
	const rowDisabledGetter = useRowDisabilityGetter();

	const enableInfiniteScroll = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.enableInfiniteScroll
	);

	const latestSelectedDocumentId = useOverviewEngineState(UiStateSelector.latestSelectedDocumentId());
	const onLatestSelectedDocumentIdChange = useOverviewEngineContext(
		(context) => context.eventHandlers.onLatestSelectedDocumentIdChange
	);

	const latestSelectedDocumentIds = useOverviewEngineState(UiStateSelector.latestSelectedDocumentIds());
	const onLatestSelectedDocumentIdsChange = useOverviewEngineContext(
		(context) => context.eventHandlers.onLatestSelectedDocumentIdsChange
	);

	const clear = React.useCallback(() => {
		onLatestSelectedDocumentIdChange?.({ latestSelectedDocumentId: null });
		onLatestSelectedDocumentIdsChange?.({ latestSelectedDocumentIds: null });
	}, [onLatestSelectedDocumentIdChange, onLatestSelectedDocumentIdsChange]);

	return React.useCallback(
		(event: React.MouseEvent<HTMLElement>, documentId: string, linkId?: string) => {
			event.stopPropagation();
			window.getSelection()?.removeAllRanges();

			const selected = !!pickRowState(rowState, { id: documentId, linkId })?.selected;

			// Disable shift+click range selection for infinite scroll mode
			if (!event.shiftKey || !latestSelectedDocumentId || enableInfiniteScroll) {
				if (selected) {
					clear();
				} else {
					onLatestSelectedDocumentIdChange?.({ latestSelectedDocumentId: { documentId, linkId } });
				}

				onRowsSelect?.([{ documentId, linkId, selected: !selected }]);

				return;
			}

			const endpoints = [latestSelectedDocumentId, { documentId, linkId }];
			const endpointIndices = endpoints.map((endpoint) =>
				data.findIndex((row) => row?.id === endpoint.documentId && row?.linkId === endpoint.linkId)
			);

			if (endpointIndices.some((index) => index < 0)) {
				clear();

				return;
			}

			const startIndex = Math.min(...endpointIndices);
			const endIndex = Math.max(...endpointIndices) + 1;

			const targetRows = data.slice(startIndex, endIndex);

			if (!targetRows.every(JSONDocument.isInstance)) {
				return;
			}

			const enableRows = targetRows.filter((row) => !rowDisabledGetter(row));

			const selectedRows = enableRows
				.filter((row) => !pickRowState(rowState, row)?.selected)
				.map((row) => ({ documentId: row.id, linkId: row.linkId, selected: true }));

			const enabledEntries = enableRows.map((row) => ({ documentId: row.id, linkId: row.linkId }));
			onLatestSelectedDocumentIdsChange?.({ latestSelectedDocumentIds: enabledEntries });

			const hasOverlap = enabledEntries.some((entry) =>
				latestSelectedDocumentIds?.some((sel) => sel.documentId === entry.documentId && sel.linkId === entry.linkId)
			);

			const deselectedRows = hasOverlap
				? (latestSelectedDocumentIds
						?.filter(
							(entry) => !enabledEntries.some((id) => id.documentId === entry.documentId && id.linkId === entry.linkId)
						)
						.map((entry) => ({ documentId: entry.documentId, linkId: entry.linkId, selected: false })) ?? [])
				: [];

			onRowsSelect?.(selectedRows.concat(deselectedRows));
		},
		[
			clear,
			data,
			latestSelectedDocumentId,
			latestSelectedDocumentIds,
			onRowsSelect,
			onLatestSelectedDocumentIdChange,
			onLatestSelectedDocumentIdsChange,
			rowDisabledGetter,
			rowState,
			enableInfiniteScroll
		]
	);
}

function useScreenReaderCellId() {
	const screenReaderColumnRef = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.screenReaderColumn
	);

	return React.useCallback(
		(row: JSONDocument): string | undefined => {
			if (!screenReaderColumnRef) {
				return undefined;
			}

			return toCellId(row, screenReaderColumnRef.idref);
		},
		[screenReaderColumnRef]
	);
}

/**	@internal */
export default {
	useRowDisabilityGetter,
	useRowActionStateGetter,
	useMenuItemsGetter,
	useRightClickActionGroups,
	useRowsSelect,
	useScreenReaderCellId
};
