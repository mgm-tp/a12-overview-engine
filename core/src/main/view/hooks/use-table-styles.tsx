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

import type { RowStyles, RowStyleGetter, CellStyleGetter } from "@com.mgmtp.a12.widgets/widgets-core";

import { pickRowState } from "../utils.js";
import { UiStateSelector } from "../../store/index.js";
import type { JSONDocument } from "../../models/index.js";
import hooks from "../components/table/sub-components/hooks.js";
import { OverviewModelKeys } from "../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

import { LocalizerHooks } from "./localizer-hooks.js";
import type { OverviewColumn } from "./use-table-columns.js";

/** @internal */
export function useCellStyling(): CellStyleGetter<JSONDocument, OverviewColumn> {
	const rowState = useOverviewEngineState(UiStateSelector.rowState());

	return React.useCallback(
		({ row, column }) => ({
			useSecondaryColor: pickRowState(rowState, row)?.useSecondaryColor ?? undefined,
			className: column.columnModel?.styles?.content?.join(" ")
		}),
		[rowState]
	);
}

/** @internal */
export function useRowStyling(): RowStyleGetter<JSONDocument> {
	const rowState = useOverviewEngineState(UiStateSelector.rowState());
	const activeRowId = useOverviewEngineContext((context) => context.activeRowId);
	const enableInfiniteScroll = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.enableInfiniteScroll
	);
	const rowHeight = useOverviewEngineContext((context) => context.overviewModel.content.configuration.rowHeight);
	const menuItemsGetter = hooks.useMenuItemsGetter(hooks.useRightClickActionGroups());

	const rowDisabledGetter = hooks.useRowDisabilityGetter();

	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const rowTitle = useOverviewEngineContext((context) => {
		return (
			localizedOverviewElement(
				[OverviewModelKeys.ROWS, OverviewModelKeys.TITLE],
				context.overviewModel.content.configuration.rowTitle
			) || undefined
		);
	});
	const rowStyling = useOverviewEngineContext((context) => context.rowStyling);

	return React.useCallback(
		({ row, rowIndex }): RowStyles => {
			const disabled = rowDisabledGetter(row);

			return {
				disabled,
				selected: row.id === activeRowId,
				highlighted: !!pickRowState(rowState, row)?.selected,
				style: enableInfiniteScroll ? undefined : { height: rowHeight },
				disabledRightClickContextMenu: menuItemsGetter(row).menuItems.length === 0,
				title: disabled ? undefined : rowTitle,
				...rowStyling?.({ row, rowIndex })
			};
		},
		[activeRowId, enableInfiniteScroll, menuItemsGetter, rowDisabledGetter, rowHeight, rowState, rowStyling, rowTitle]
	);
}
