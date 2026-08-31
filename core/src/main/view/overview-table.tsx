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

import {
	type BaseTableProps,
	type RowEventHandlerGetter,
	type TableComponentRenderers,
	DefaultTableComponentRenderers,
	type InfiniteScrollOptions as WidgetInfiniteScrollOptions
} from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngineInternalConstants } from "../constants/overview-engine-internal-constants.js";
import type { JSONDocument } from "../models/index.js";
import { OverviewModel } from "../overview-model.js";
import { OverviewModelKeys } from "../services/localization/index.js";
import { UiStateSelector } from "../store/index.js";

import hooks from "./components/table/sub-components/hooks.js";
import {
	useOverviewEngineState,
	useOverviewEngineContext,
	OverviewEngineContextType
} from "./context/overview-engine-context.js";
import { LocalizerHooks } from "./hooks/localizer-hooks.js";
import { useTableColumns, type OverviewColumn } from "./hooks/use-table-columns.js";
import { useSortOptions, useColumnResizingOptions } from "./hooks/use-table-options.js";
import { useTableScrollController } from "./hooks/use-table-scroll-controller.js";
import { useRowStyling, useCellStyling } from "./hooks/use-table-styles.js";
import { toCellId, resolveRowActivation } from "./utils.js";

export namespace OverviewTable {
	export interface Props {}
}

export const OverviewTable: React.ComponentType<OverviewTable.Props> = React.memo(function OverviewTable() {
	const cardView = useOverviewEngineContext((context) => context.cardView);
	const Table = useOverviewEngineContext((context) => context.widgetMap.Table);

	const headerLabels = useOverviewEngineContext((context) => context.overviewModel.header.labels);
	const enableInfiniteScroll = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.enableInfiniteScroll
	);
	const rowHeight = useOverviewEngineContext((context) => context.overviewModel.content.configuration.rowHeight);
	const hasFootContentConfiguration = useOverviewEngineContext(
		(context) => context.accessibilityConfigurations?.hasFootContent
	);
	const summaryResult = useOverviewEngineContext((context) => context.summaryResult);
	const hasFootContent = React.useMemo(() => {
		return hasFootContentConfiguration ?? (summaryResult && Object.keys(summaryResult).length > 0);
	}, [hasFootContentConfiguration, summaryResult]);

	const columns = useTableColumns();
	const componentRenderers = useTableRenderers();
	const rowEventHandlers = useRowEventHandlers();

	const rowStyling = useRowStyling();
	const cellStyling = useCellStyling();
	const sortOptions = useSortOptions(columns);
	const columnResizingOptions = useColumnResizingOptions({ columns });
	const scrollToNode = useTableScrollController();

	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const ariaLabel = React.useMemo(
		() => localizedOverviewElement([OverviewModelKeys.HEADER, OverviewModelKeys.LABEL], headerLabels),
		[headerLabels, localizedOverviewElement]
	);

	const baseProps: BaseTableProps<JSONDocument> = {
		cardView,
		columns,
		rowStyling,
		cellStyling,
		sortOptions,
		componentRenderers,
		rowEventHandlers,
		ariaLabel,
		columnResizingOptions,
		hasFootContent
	};

	const paginatedData = useOverviewEngineContext((context) =>
		OverviewEngineContextType.Paginated.isInstance(context) ? context.data : undefined
	);

	if (paginatedData) {
		return <Table {...baseProps} data={paginatedData} scrollToNode={scrollToNode} />;
	}

	if (enableInfiniteScroll && rowHeight) {
		return <InfiniteScrollTable {...baseProps} rowHeight={rowHeight} scrollToNode={scrollToNode} />;
	}

	throw new Error("Can not determine table type");
});

const InfiniteScrollTable: React.FC<
	BaseTableProps<JSONDocument> & { rowHeight: number; scrollToNode?: BaseTableProps<JSONDocument>["scrollToNode"] }
> = React.memo(function InfiniteScrollTable(props) {
	const { rowHeight, scrollToNode, ...baseProps } = props;

	const Table = useOverviewEngineContext((context) => context.widgetMap.Table);
	const { infiniteScrollOptions, data, pageSize } = useOverviewEngineContext((context) => {
		if (!OverviewEngineContextType.InfiniteScroll.isInstance(context)) {
			throw new Error("Incorrect infinite scroll context type");
		}

		return {
			infiniteScrollOptions: context.infiniteScrollOptions,
			data: context.data,
			pageSize: context.uiState.scrolling?.pageSize ?? OverviewEngineInternalConstants.DEFAULT_INFINITE_SCROLL_PAGE_SIZE
		};
	});

	const widgetInfiniteScrollOptions: WidgetInfiniteScrollOptions = React.useMemo(() => {
		return {
			...infiniteScrollOptions,
			rowCount: infiniteScrollOptions.rowCount ?? OverviewEngineInternalConstants.DEFAULT_INFINITE_SCROLL_ROW_COUNT,
			rowHeight,
			loadData: ({ startIndex, stopIndex }) => {
				const startPage = Math.floor(startIndex / pageSize);
				const endPage = Math.floor(stopIndex / pageSize); // floor because endPage is inclusive

				return infiniteScrollOptions.loadData({ startPage, endPage });
			}
		};
	}, [infiniteScrollOptions, rowHeight, pageSize]);

	return (
		<Table {...baseProps} data={data} infiniteScrollOptions={widgetInfiniteScrollOptions} scrollToNode={scrollToNode} />
	);
});

function useRowEventHandlers(): RowEventHandlerGetter<JSONDocument> | undefined {
	const overviewModel = useOverviewEngineContext((context) => context.overviewModel);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const rowStyling = useOverviewEngineContext((context) => context.rowStyling);
	const onRowClick = useOverviewEngineContext((context) => context.eventHandlers.onRowClick);
	const expandedMultiSelection = useOverviewEngineState(UiStateSelector.expandedMultiSelection());
	const multiSelection = overviewModel.content.configuration.multiSelection;
	const rowClickSelects = useOverviewEngineState(UiStateSelector.isMultiSelectRowClickActive(multiSelection));

	const selectRows = hooks.useRowsSelect();

	return React.useMemo(() => {
		if (!onRowClick || disabled) {
			return undefined;
		}

		const { nonInteractive: isNonInteractive, customEvent } = resolveRowActivation(overviewModel.content);

		const selectionArea = multiSelection?.selectionArea ?? OverviewModel.MultiSelection.SelectionArea.CHECKBOX_AND_ROW;

		return ({ row, rowIndex }) => {
			const interactive = rowStyling?.({ row, rowIndex }).interactive ?? true;

			if (!interactive) {
				return {};
			}

			const documentId = row.id;
			const linkId = row.linkId;

			return {
				onClick: (event: React.MouseEvent<HTMLElement>) => {
					if (expandedMultiSelection && selectionArea === OverviewModel.MultiSelection.SelectionArea.CHECKBOX) {
						if (!isNonInteractive) {
							onRowClick({ documentId, linkId, customEvent });
						}

						return;
					}

					if (rowClickSelects) {
						selectRows(event, documentId, linkId);

						return;
					}

					if (!isNonInteractive) {
						onRowClick({ documentId, linkId, customEvent });
					}
				}
			};
		};
	}, [
		overviewModel.content,
		onRowClick,
		disabled,
		rowStyling,
		expandedMultiSelection,
		rowClickSelects,
		multiSelection,
		selectRows
	]);
}

function useTableRenderers(): Partial<TableComponentRenderers<JSONDocument, OverviewColumn>> {
	const TableBody = useOverviewEngineContext((context) => context.componentMap.TableBody);
	const InfiniteScrollTableBody = useOverviewEngineContext((context) => context.componentMap.InfiniteScrollTableBody);
	const RightClickContextMenu = useOverviewEngineContext((context) => context.componentMap.RightClickContextMenu);
	const TableFootCellContent = useOverviewEngineContext((context) => context.componentMap.TableFootCellContent);
	const contextMenu = useOverviewEngineContext((context) => context.overviewModel.content.contextMenu);
	const rowActionGroup = useOverviewEngineContext((context) => context.overviewModel.content.rowActionGroup);
	const screenReaderColumnRef = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.screenReaderColumn
	);

	return React.useMemo<Partial<TableComponentRenderers<JSONDocument, OverviewColumn>>>(() => {
		return {
			bodyRenderer: (props) => <TableBody {...props} />,
			infiniteScrollBodyRenderer: (props) => <InfiniteScrollTableBody {...props} />,
			contextMenuRenderer: (props) => (
				<RightClickContextMenu {...props} contextMenuModel={contextMenu} rowActionGroupModel={rowActionGroup} />
			),
			headCellRenderer: (props) =>
				DefaultTableComponentRenderers.headCellRenderer({
					...props,
					className: props.column.columnModel?.styles?.header?.join(" ")
				}),
			bodyCellRenderer: (props) => {
				const cellId =
					screenReaderColumnRef && props.column.columnModel?.id === screenReaderColumnRef.idref
						? toCellId(props.row, screenReaderColumnRef.idref)
						: undefined;

				return DefaultTableComponentRenderers.bodyCellRenderer({ ...props, id: cellId });
			},
			footContentRenderer: (props) => <TableFootCellContent {...props} />
		};
	}, [
		TableBody,
		InfiniteScrollTableBody,
		RightClickContextMenu,
		contextMenu,
		rowActionGroup,
		TableFootCellContent,
		screenReaderColumnRef
	]);
}
