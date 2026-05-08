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

import { type SortOptions, type ColumnResizingOptions } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngineApi } from "../api.js";
import { UiStateSelector } from "../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

import { type OverviewColumn } from "./use-table-columns.js";

/** @internal */
export function useSortOptions(columns: OverviewColumn[]): SortOptions<OverviewColumn> {
	const overviewModel = useOverviewEngineContext((context) => context.overviewModel);
	const documentModel = useOverviewEngineContext((context) => context.documentModel);
	const storeSorting = useOverviewEngineState(UiStateSelector.sorting());
	const sorting = OverviewEngineApi.getSortingProps(storeSorting, documentModel, overviewModel);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const onColumnClick = useOverviewEngineContext((context) => context.eventHandlers.onColumnClick);
	const expandedMultiSelection = useOverviewEngineState(UiStateSelector.expandedMultiSelection());

	return React.useMemo(() => {
		const offset = expandedMultiSelection ? 1 : 0;

		return {
			sortState:
				sorting?.length && onColumnClick
					? { column: columns[sorting[0].columnIndex + offset], order: sorting[0].order }
					: undefined,
			onSort: disabled ? undefined : ({ column }) => onColumnClick?.(columns.indexOf(column) - offset)
		};
	}, [expandedMultiSelection, sorting, onColumnClick, columns, disabled]);
}

/** @internal */
export function useColumnResizingOptions(params: {
	columns: OverviewColumn[];
}): ColumnResizingOptions<OverviewColumn> | undefined {
	const { columns } = params;
	const oldWidthMapping = useOverviewEngineState(UiStateSelector.columnWidths());
	const onColumnWidthsChange = useOverviewEngineContext((context) => context.eventHandlers.onColumnWidthsChange);
	const enableColumnsResize = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.enableColumnsResize
	);

	return React.useMemo(() => {
		if (!enableColumnsResize) {
			return undefined;
		}

		return {
			onEndResize: ({ resizedWidthsGetter }) => {
				const columnWidths = columns.reduce((result, column) => {
					if (!column.columnModel) {
						return result;
					}

					return { ...result, [column.columnModel.id]: resizedWidthsGetter?.(column) ?? column.width };
				}, oldWidthMapping);

				if (columnWidths) {
					onColumnWidthsChange?.({ columnWidths });
				}
			}
		};
	}, [columns, enableColumnsResize, oldWidthMapping, onColumnWidthsChange]);
}
