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

import type * as React from "react";

import { Footer } from "../components/footer.js";
import { Button } from "../components/button.js";
import { Heading } from "../components/heading.js";
import { SubHeader } from "../components/sub-header.js";
import { SearchBar } from "../components/search-bar.js";
import { Pagination } from "../components/pagination.js";
import { ButtonPanel } from "../components/button-panel.js";
import { SearchButton } from "../components/search-button.js";
import { FilterBar } from "../components/filters/filter-bar.js";
import { OverviewButton } from "../components/overview-button.js";
import { FilterOptionsViews } from "../components/filters/index.js";
import { MobileActionBar } from "../components/mobile-action-bar.js";
import { FilterButton } from "../components/filters/filter-button.js";
import { FilterSelector } from "../components/filters/filter-selector.js";
import { TableBody } from "../components/table/sub-components/table-body.js";
import { RowAction } from "../components/table/sub-components/row-action.js";
import { ContextMenu } from "../components/table/sub-components/context-menu.js";
import { RowCheckbox } from "../components/table/sub-components/row-checkbox.js";
import { ReferenceCell } from "../components/table/sub-components/reference-cell.js";
import { TableBodyCell } from "../components/table/sub-components/table-body-cell.js";
import { TableHeadCell } from "../components/table/sub-components/table-head-cell.js";
import { AttachmentCell } from "../components/table/sub-components/attachment-cell.js";
import { ExpressionCell } from "../components/table/sub-components/expression-cell.js";
import { StringTypeCell } from "../components/table/sub-components/string-type-cell.js";
import { RowActionGroup } from "../components/table/sub-components/row-action-group.js";
import { OverallCheckbox } from "../components/table/sub-components/overall-checkbox.js";
import { MultiSelectCell } from "../components/table/sub-components/multi-select-cell.js";
import { ErrorMessageBox } from "../components/filters/options-views/error-message-box.js";
import { MultiSelectionPanel } from "../components/multi-selection/multi-selection-panel.js";
import { MultiSelectionButton } from "../components/multi-selection/multi-selection-button.js";
import { MultiSelectionCounter } from "../components/multi-selection/multi-selection-counter.js";
import { MultiSelectionActions } from "../components/multi-selection/multi-selection-actions.js";
import { CustomFieldTypeCell } from "../components/table/sub-components/custom-field-type-cell.js";
import { TableBodyCellContent } from "../components/table/sub-components/table-body-cell-content.js";
import { TableFootCellContent } from "../components/table/sub-components/table-foot-cell-content.js";
import { FilterSelectorContentHeader } from "../components/filters/filter-selector-content-header.js";
import { RightClickContextMenu } from "../components/table/sub-components/right-click-context-menu.js";
import { ClearMultiSelectionDialog } from "../components/multi-selection/clear-multi-selection-dialog.js";
import { InfiniteScrollTableBody } from "../components/table/sub-components/infinite-scroll-table-body.js";
import { RowActionConfirmDialog } from "../components/dialogs/sub-components/row-action-confirm-dialog.js";
import { OverviewButtonConfirmDialog } from "../components/dialogs/sub-components/overview-button-confirm-dialog.js";
import {
	OverviewHeading,
	OverviewFilterButton,
	OverviewSearchButton,
	OverviewSubheaderBox,
	type OverviewHeadingProps,
	type OverviewSubheaderBoxProps
} from "../components/overview-content-box/sub-components/index.js";

export interface ComponentMap {
	readonly Heading: React.ComponentType<Heading.PropsType>;
	readonly MobileActionBar: React.ComponentType<MobileActionBar.PropsType>;
	readonly SubHeader: React.ComponentType<SubHeader.PropsType>;
	readonly Footer: React.ComponentType<Footer.PropsType>;
	readonly OverviewButton: React.ComponentType<OverviewButton.Props>;
	readonly Pagination: React.ComponentType<Pagination.PropsType>;
	readonly ButtonPanel: React.ComponentType<ButtonPanel.PropsType>;
	readonly Button: React.ComponentType<Button.PropsType>;
	readonly FilterSelector: React.ComponentType<FilterSelector.Props>;
	readonly FilterButton: React.ComponentType<FilterButton.PropsType>;
	readonly FilterBar: React.ComponentType<FilterBar.Props>;
	readonly FilterOptionsViews: FilterOptionsViews;
	readonly SearchBar: React.ComponentType<SearchBar.PropsType>;
	readonly SearchButton: React.ComponentType<SearchButton.PropsType>;
	readonly FilterSelectorContentHeader: React.ComponentType<FilterSelectorContentHeader.Props>;
	readonly ErrorMessageBox: React.ComponentType<ErrorMessageBox.Props>;

	readonly TableBody: React.ComponentType<TableBody.Props>;
	readonly InfiniteScrollTableBody: React.ComponentType<InfiniteScrollTableBody.Props>;
	readonly TableBodyCell: React.ComponentType<TableBodyCell.Props>;
	readonly TableBodyCellContent: React.ComponentType<TableBodyCellContent.Props>;
	readonly TableHeadCell: React.ComponentType<TableHeadCell.Props>;
	readonly TableFootCellContent: React.ComponentType<TableFootCellContent.Props>;
	readonly AttachmentCell: React.ComponentType<AttachmentCell.Props>;
	readonly MultiSelectCell: React.ComponentType<MultiSelectCell.Props>;
	readonly ExpressionCell: React.ComponentType<ExpressionCell.Props>;
	readonly ReferenceCell: React.ComponentType<ReferenceCell.Props>;
	readonly StringTypeCell: React.ComponentType<StringTypeCell.Props>;
	readonly CustomFieldTypeCell: React.ComponentType<CustomFieldTypeCell.Props>;
	readonly RowActionGroup: React.ComponentType<RowActionGroup.Props>;
	readonly ContextMenu: React.ComponentType<ContextMenu.Props>;
	readonly RightClickContextMenu: React.ComponentType<RightClickContextMenu.Props>;
	readonly RowAction: React.ComponentType<RowAction.PropsType>;
	readonly RowActionConfirmDialog: React.ComponentType<RowActionConfirmDialog.Props>;
	readonly OverviewButtonConfirmDialog: React.ComponentType<OverviewButtonConfirmDialog.Props>;
	readonly ClearMultiSelectionDialog: React.ComponentType<ClearMultiSelectionDialog.Props>;
	readonly OverallCheckbox: React.ComponentType<OverallCheckbox.Props>;
	readonly RowCheckbox: React.ComponentType<RowCheckbox.Props>;

	readonly MultiSelectionPanel: React.FC;
	readonly MultiSelectionCounter: React.FC;
	readonly MultiSelectionButton: React.FC;
	readonly MultiSelectionActions: React.FC;

	readonly OverviewFilterButton: React.FC;
	readonly OverviewHeading: React.ComponentType<OverviewHeadingProps>;
	readonly OverviewSubheaderBox: React.ComponentType<OverviewSubheaderBoxProps>;
	readonly OverviewSearchButton: React.FC;
}

export const DefaultComponentMap: ComponentMap = {
	Heading,
	MobileActionBar,
	SubHeader,
	Footer,
	OverviewButton,
	Pagination,
	ButtonPanel,
	Button,
	FilterSelector,
	FilterButton,
	FilterBar,
	FilterOptionsViews: FilterOptionsViews.defaultInstance,
	SearchBar,
	SearchButton,
	FilterSelectorContentHeader,
	ErrorMessageBox,

	TableBody,
	InfiniteScrollTableBody,
	TableBodyCell,
	TableBodyCellContent,
	TableHeadCell,
	TableFootCellContent,
	AttachmentCell,
	MultiSelectCell,
	StringTypeCell,
	ExpressionCell,
	ReferenceCell,
	CustomFieldTypeCell,
	RowActionGroup,
	RowAction,
	RowActionConfirmDialog,
	ContextMenu,
	RightClickContextMenu,

	OverviewButtonConfirmDialog,
	ClearMultiSelectionDialog,
	OverallCheckbox,
	RowCheckbox,

	MultiSelectionPanel,
	MultiSelectionCounter,
	MultiSelectionButton,
	MultiSelectionActions,

	OverviewFilterButton,
	OverviewHeading,
	OverviewSubheaderBox,
	OverviewSearchButton
};
