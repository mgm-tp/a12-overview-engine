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

import { type A11yDefinition, type BaseColumnType, A11YLanguageContext } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../overview-model.js";
import type { JSONDocument } from "../../models/index.js";
import { MultiSelectModelUtils } from "../../models/internal/shared.js";
import { UiStateSelector, type ColumnWidths } from "../../store/index.js";
import { getModelIdFromColumn } from "../../services/relationship/index.js";
import { useOverviewEngineInternalContext } from "../context/overview-engine-internal-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

import { LocalizerHooks } from "./localizer-hooks.js";
import { useRelationshipModels } from "./use-relationship.js";

export interface OverviewColumn extends BaseColumnType<JSONDocument> {
	columnModel?: OverviewModel.Column;
}

/** @internal */
export function useTableColumns(): OverviewColumn[] {
	const columnWidths = useOverviewEngineState(UiStateSelector.columnWidths()) ?? {};
	const modelColumns = useModelColumns(columnWidths);
	const actionColumn = useActionColumn();
	const checkboxColumn = useCheckboxColumn();

	return React.useMemo(
		() => [checkboxColumn, ...modelColumns, actionColumn].filter((column): column is OverviewColumn => !!column),
		[actionColumn, checkboxColumn, modelColumns]
	);
}

function useModelColumns(columnWidths: ColumnWidths) {
	const modelColumns = useOverviewEngineContext((context) => context.overviewModel.content.columns);
	const onColumnClick = useOverviewEngineContext((context) => context.eventHandlers.onColumnClick);
	const TableBodyCell = useOverviewEngineContext((context) => context.componentMap.TableBodyCell);
	const TableHeadCell = useOverviewEngineContext((context) => context.componentMap.TableHeadCell);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const localizedColumnLabel = LocalizerHooks.useLocalizedColumnLabel();
	const relationshipModels = useRelationshipModels();

	return React.useMemo(
		(): OverviewColumn[] =>
			modelColumns.map((column) => {
				const baseColumnConfig: OverviewColumn = {
					label: <TableHeadCell columnModel={column} />,
					pinning: getPinning(column.pinDirection),
					specificHorizontalAlignment: {
						head: column.alignment?.header?.horizontal,
						body: column.alignment?.content?.horizontal
					},
					specificVerticalAlignment: {
						head: column.alignment?.header?.vertical || OverviewModel.VerticalAlignment.MIDDLE,
						body: column.alignment?.content?.vertical || OverviewModel.VerticalAlignment.TOP
					},
					width: columnWidths[column.id] ?? column.width,
					fixedWidth: column.fixedWidth,
					dataGetter: ({ row }) => <TableBodyCell row={row} columnModel={column} />,
					columnModel: column
				};

				const isDataColumn =
					OverviewModel.ReferenceColumn.isAssignableFrom(column) ||
					OverviewModel.LinkColumn.Reference.isAssignableFrom(column);

				if (!isDataColumn) {
					return baseColumnConfig;
				}

				const modelId = OverviewModel.LinkColumn.Reference.isAssignableFrom(column)
					? getModelIdFromColumn(column, relationshipModels)
					: undefined;
				const element = documentModelService.getByPath(
					documentModelService.getPathById(column.elementRef, modelId),
					modelId
				);
				const htmlAttributes: React.HTMLAttributes<HTMLElement> | undefined =
					column.sortable && column.labelHidden ? { title: localizedColumnLabel(column) } : undefined;

				return {
					...baseColumnConfig,
					htmlAttributes,
					sortable: !!onColumnClick && !!column.sortable && !MultiSelectModelUtils.isInstance(element) && !disabled,
					horizontalAlignment:
						element.type === "Field" && element.fieldType.type === "NumberType"
							? OverviewModel.HorizontalAlignment.RIGHT
							: OverviewModel.HorizontalAlignment.LEFT
				};
			}),
		[
			TableBodyCell,
			TableHeadCell,
			columnWidths,
			disabled,
			documentModelService,
			localizedColumnLabel,
			modelColumns,
			onColumnClick,
			relationshipModels
		]
	);
}

function useCheckboxColumn() {
	const expandedMultiSelection = useOverviewEngineState(UiStateSelector.expandedMultiSelection());
	const enableInfiniteScroll = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.enableInfiniteScroll
	);
	const OverallCheckbox = useOverviewEngineContext((context) => context.componentMap.OverallCheckbox);
	const RowCheckbox = useOverviewEngineContext((context) => context.componentMap.RowCheckbox);
	const cardView = useOverviewEngineContext((context) => context.cardView);

	return React.useMemo(() => {
		if (!expandedMultiSelection) {
			return undefined;
		}

		const checkboxColumn: BaseColumnType<JSONDocument> = {
			label: <OverallCheckbox />,
			hiddenText: "",
			specificVerticalAlignment: {
				head: OverviewModel.VerticalAlignment.MIDDLE,
				body: OverviewModel.VerticalAlignment.MIDDLE
			},
			specificHorizontalAlignment: {
				head: OverviewModel.HorizontalAlignment.LEFT,
				body: OverviewModel.HorizontalAlignment.LEFT
			},
			actionColumn: true,
			pinning: "left",
			sortable: false,
			dataGetter: ({ row }) => <RowCheckbox row={row} />
		};

		if (cardView) {
			return { ...checkboxColumn, label: null };
		}

		if (enableInfiniteScroll) {
			return { ...checkboxColumn, label: null, width: 0.3 };
		}

		return checkboxColumn;
	}, [OverallCheckbox, RowCheckbox, cardView, enableInfiniteScroll, expandedMultiSelection]);
}

function useActionColumn() {
	const rowActionGroup = useOverviewEngineContext((context) => context.overviewModel.content.rowActionGroup);
	const contextMenu = useOverviewEngineContext((context) => context.overviewModel.content.contextMenu);
	const actionColumnWidth = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.actionColumnWidth
	);
	const RowActionGroup = useOverviewEngineContext((context) => context.componentMap.RowActionGroup);
	const { tableTitles } = React.useContext<A11yDefinition>(A11YLanguageContext);
	const actionTitle = tableTitles?.actionTitle;

	return React.useMemo(() => {
		if (!rowActionGroup.actions?.length && !contextMenu?.groups.length) {
			return undefined;
		}

		let actionColumn: OverviewColumn = {
			label: "",
			actionColumn: true,
			pinning: "right",
			sortable: false,
			dataGetter: ({ row }) => (
				<RowActionGroup row={row} rowActionGroupModel={rowActionGroup} contextMenuModel={contextMenu} />
			)
		};

		if (actionColumnWidth) {
			actionColumn = {
				...actionColumn,
				hiddenText: actionTitle,
				width: actionColumnWidth
			};
		}

		return actionColumn;
	}, [RowActionGroup, actionTitle, actionColumnWidth, contextMenu, rowActionGroup]);
}

function getPinning(pinDirection?: "LEFT" | "RIGHT"): "left" | "right" | undefined {
	if (pinDirection === "LEFT") {
		return "left";
	}

	if (pinDirection === "RIGHT") {
		return "right";
	}

	return undefined;
}
