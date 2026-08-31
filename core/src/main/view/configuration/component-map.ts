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

import { ButtonPanel } from "../components/button-panel.js";
import { Button } from "../components/button.js";
import { OverviewButtonConfirmDialog } from "../components/dialogs/sub-components/overview-button-confirm-dialog.js";
import { RowActionConfirmDialog } from "../components/dialogs/sub-components/row-action-confirm-dialog.js";
import { FilterBar } from "../components/filters/filter-bar.js";
import { FilterButton } from "../components/filters/filter-button.js";
import { FilterSelectorContentHeader } from "../components/filters/filter-selector-content-header.js";
import { FilterSelector } from "../components/filters/filter-selector.js";
import { FilterOptionsViews } from "../components/filters/index.js";
import { ErrorMessageBox } from "../components/filters/options-views/error-message-box.js";
import { Footer } from "../components/footer.js";
import { Heading } from "../components/heading.js";
import { MobileActionBar } from "../components/mobile-action-bar.js";
import { ClearMultiSelectionDialog } from "../components/multi-selection/clear-multi-selection-dialog.js";
import { MultiSelectionActions } from "../components/multi-selection/multi-selection-actions.js";
import { MultiSelectionButton } from "../components/multi-selection/multi-selection-button.js";
import { MultiSelectionCounter } from "../components/multi-selection/multi-selection-counter.js";
import { MultiSelectionPanel } from "../components/multi-selection/multi-selection-panel.js";
import {
	BooleanFilterEditor,
	type BooleanFilterEditorProps
} from "../components/new-filters/components/editors/boolean-filter-editor.js";
import {
	ConfirmFilterEditor,
	type ConfirmFilterEditorProps
} from "../components/new-filters/components/editors/confirm-filter-editor.js";
import {
	DateFilterEditor,
	type DateFilterEditorProps
} from "../components/new-filters/components/editors/date-filter-editor.js";
import {
	DateFragmentFilterEditor,
	type DateFragmentFilterEditorProps
} from "../components/new-filters/components/editors/date-fragment-filter-editor.js";
import {
	DateRangeFilterEditor,
	type DateRangeFilterEditorProps
} from "../components/new-filters/components/editors/date-range-filter-editor.js";
import {
	DateTimeFilterEditor,
	type DateTimeFilterEditorProps
} from "../components/new-filters/components/editors/date-time-filter-editor.js";
import {
	EnumerationFilterEditor,
	type EnumerationFilterEditorProps
} from "../components/new-filters/components/editors/enumeration-filter-editor.js";
import { FilterEditor, type FilterEditorProps } from "../components/new-filters/components/editors/filter-editor.js";
import {
	MultiSelectFilterEditor,
	type MultiSelectFilterEditorProps
} from "../components/new-filters/components/editors/multi-select-filter-editor.js";
import {
	NumberFilterEditor,
	type NumberFilterEditorProps
} from "../components/new-filters/components/editors/number-filter-editor.js";
import {
	QueryFilterEditor,
	type QueryFilterEditorProps
} from "../components/new-filters/components/editors/query-filter-editor.js";
import {
	StringFilterEditor,
	type StringFilterEditorProps
} from "../components/new-filters/components/editors/string-filter-editor.js";
import {
	TimeFilterEditor,
	type TimeFilterEditorProps
} from "../components/new-filters/components/editors/time-filter-editor.js";
import {
	FilterBarItemDropdown,
	type FilterBarItemDropdownProps
} from "../components/new-filters/components/filter-bar-item-dropdown.js";
import { FilterBarItem, type FilterBarItemProps } from "../components/new-filters/components/filter-bar-item.js";
import {
	FilterBar as NewFilterBar,
	type FilterBarProps as NewFilterBarProps
} from "../components/new-filters/components/filter-bar.js";
import {
	FilterResetButton,
	type FilterResetButtonProps
} from "../components/new-filters/components/filter-reset-button.js";
import {
	FilterSelectorFooter,
	type FilterSelectorFooterProps
} from "../components/new-filters/components/filter-selector-footer.js";
import {
	FilterSelectorSearchBar,
	type FilterSelectorSearchBarProps
} from "../components/new-filters/components/filter-selector-search-bar.js";
import {
	FilterSelectorSetting,
	type FilterSelectorSettingProps
} from "../components/new-filters/components/filter-selector-setting.js";
import {
	FilterSelectorTriggerButton,
	type FilterSelectorTriggerButtonProps
} from "../components/new-filters/components/filter-selector-trigger-button.js";
import {
	FilterSelector as NewFilterSelector,
	type FilterSelectorProps as NewFilterSelectorProps
} from "../components/new-filters/components/filter-selector.js";
import {
	FilterSettingButton,
	type FilterSettingButtonProps
} from "../components/new-filters/components/filter-setting-button.js";
import {
	BooleanFilterSetting,
	type BooleanFilterSettingProps
} from "../components/new-filters/components/settings/boolean-filter-setting.js";
import {
	ConfirmFilterSetting,
	type ConfirmFilterSettingProps
} from "../components/new-filters/components/settings/confirm-filter-setting.js";
import {
	DateFilterSetting,
	type DateFilterSettingProps
} from "../components/new-filters/components/settings/date-filter-setting.js";
import {
	DateFragmentFilterSetting,
	type DateFragmentFilterSettingProps
} from "../components/new-filters/components/settings/date-fragment-filter-setting.js";
import {
	DateRangeFilterSetting,
	type DateRangeFilterSettingProps
} from "../components/new-filters/components/settings/date-range-filter-setting.js";
import {
	DateTimeFilterSetting,
	type DateTimeFilterSettingProps
} from "../components/new-filters/components/settings/date-time-filter-setting.js";
import {
	EnumerationFilterSetting,
	type EnumerationFilterSettingProps
} from "../components/new-filters/components/settings/enumeration-filter-setting.js";
import {
	FilterSetting,
	type FilterSettingProps
} from "../components/new-filters/components/settings/filter-setting.js";
import {
	MultiSelectFilterSetting,
	type MultiSelectFilterSettingProps
} from "../components/new-filters/components/settings/multi-select-filter-setting.js";
import {
	NumberFilterSetting,
	type NumberFilterSettingProps
} from "../components/new-filters/components/settings/number-filter-setting.js";
import {
	StringFilterSetting,
	type StringFilterSettingProps
} from "../components/new-filters/components/settings/string-filter-setting.js";
import {
	TimeFilterSetting,
	type TimeFilterSettingProps
} from "../components/new-filters/components/settings/time-filter-setting.js";
import { EmptyFilter, type EmptyFilterProps } from "../components/new-filters/components/utilities/empty-filter.js";
import {
	RangeFilterEditorTemplate,
	type RangeFilterEditorTemplateProps
} from "../components/new-filters/components/utilities/range-filter-editor-template.js";
import {
	OverviewHeading as NewOverviewHeading,
	type OverviewHeadingProps as NewOverviewHeadingProps
} from "../components/new-filters/overview-heading.js";
import { OverviewSubheaderBox as NewOverviewSubheaderBox } from "../components/new-filters/overview-subheader-box.js";
import type { OverviewSubheaderBoxProps as NewOverviewSubheaderBoxProps } from "../components/new-filters/overview-subheader-box.js";
import {
	SubHeader as NewSubHeader,
	type SubHeaderProps as NewSubHeaderProps
} from "../components/new-filters/sub-header.js";
import { OverviewButton } from "../components/overview-button.js";
import {
	OverviewHeading,
	OverviewFilterButton,
	OverviewSearchButton,
	OverviewSubheaderBox,
	type OverviewHeadingProps,
	type OverviewSubheaderBoxProps
} from "../components/overview-content-box/sub-components/index.js";
import { Pagination } from "../components/pagination.js";
import { SearchBar } from "../components/search-bar.js";
import { SearchButton } from "../components/search-button.js";
import { SubHeader } from "../components/sub-header.js";
import { AttachmentCell } from "../components/table/sub-components/attachment-cell.js";
import { ContextMenu } from "../components/table/sub-components/context-menu.js";
import { CustomFieldTypeCell } from "../components/table/sub-components/custom-field-type-cell.js";
import { ExpressionCell, LinkedExpressionCell } from "../components/table/sub-components/expression-cell.js";
import { InfiniteScrollTableBody } from "../components/table/sub-components/infinite-scroll-table-body.js";
import { MultiSelectCell } from "../components/table/sub-components/multi-select-cell.js";
import { OverallCheckbox } from "../components/table/sub-components/overall-checkbox.js";
import { ReferenceCell, LinkedReferenceCell } from "../components/table/sub-components/reference-cell.js";
import { RightClickContextMenu } from "../components/table/sub-components/right-click-context-menu.js";
import { RowActionGroup } from "../components/table/sub-components/row-action-group.js";
import { RowAction } from "../components/table/sub-components/row-action.js";
import { RowCheckbox } from "../components/table/sub-components/row-checkbox.js";
import { StringTypeCell } from "../components/table/sub-components/string-type-cell.js";
import { TableBodyCellContent } from "../components/table/sub-components/table-body-cell-content.js";
import { TableBodyCell } from "../components/table/sub-components/table-body-cell.js";
import { TableBody } from "../components/table/sub-components/table-body.js";
import { TableFootCellContent } from "../components/table/sub-components/table-foot-cell-content.js";
import { TableHeadCell } from "../components/table/sub-components/table-head-cell.js";

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
	readonly LinkedReferenceCell: React.ComponentType<LinkedReferenceCell.Props>;
	readonly LinkedExpressionCell: React.ComponentType<LinkedExpressionCell.Props>;
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

	/** @experimental until 40.0.0 - API may change without semver guarantees. */
	readonly newFilter: NewFilterComponentMap;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface NewFilterComponentMap {
	readonly FilterSelectorTriggerButton: React.ComponentType<FilterSelectorTriggerButtonProps>;
	readonly FilterSelector: React.ComponentType<NewFilterSelectorProps>;
	readonly FilterBar: React.ComponentType<NewFilterBarProps>;
	readonly FilterSelectorFooter: React.ComponentType<FilterSelectorFooterProps>;
	readonly FilterSelectorSetting: React.ComponentType<FilterSelectorSettingProps>;
	readonly FilterSelectorSearchBar: React.ComponentType<FilterSelectorSearchBarProps>;
	readonly FilterBarItem: React.ComponentType<FilterBarItemProps>;
	readonly FilterBarItemDropdown: React.ComponentType<FilterBarItemDropdownProps>;
	readonly FilterResetButton: React.ComponentType<FilterResetButtonProps>;
	readonly FilterSettingButton: React.ComponentType<FilterSettingButtonProps>;
	readonly FilterEditor: React.ComponentType<FilterEditorProps>;
	readonly FilterSetting: React.ComponentType<FilterSettingProps>;

	readonly BooleanFilterEditor: React.ComponentType<BooleanFilterEditorProps>;
	readonly ConfirmFilterEditor: React.ComponentType<ConfirmFilterEditorProps>;
	readonly StringFilterEditor: React.ComponentType<StringFilterEditorProps>;
	readonly NumberFilterEditor: React.ComponentType<NumberFilterEditorProps>;
	readonly EnumerationFilterEditor: React.ComponentType<EnumerationFilterEditorProps>;
	readonly MultiSelectFilterEditor: React.ComponentType<MultiSelectFilterEditorProps>;
	readonly TimeFilterEditor: React.ComponentType<TimeFilterEditorProps>;
	readonly DateFilterEditor: React.ComponentType<DateFilterEditorProps>;
	readonly DateTimeFilterEditor: React.ComponentType<DateTimeFilterEditorProps>;
	readonly DateFragmentFilterEditor: React.ComponentType<DateFragmentFilterEditorProps>;
	readonly DateRangeFilterEditor: React.ComponentType<DateRangeFilterEditorProps>;
	readonly QueryFilterEditor: React.ComponentType<QueryFilterEditorProps>;

	readonly BooleanFilterSetting: React.ComponentType<BooleanFilterSettingProps>;
	readonly ConfirmFilterSetting: React.ComponentType<ConfirmFilterSettingProps>;
	readonly StringFilterSetting: React.ComponentType<StringFilterSettingProps>;
	readonly NumberFilterSetting: React.ComponentType<NumberFilterSettingProps>;
	readonly EnumerationFilterSetting: React.ComponentType<EnumerationFilterSettingProps>;
	readonly MultiSelectFilterSetting: React.ComponentType<MultiSelectFilterSettingProps>;
	readonly TimeFilterSetting: React.ComponentType<TimeFilterSettingProps>;
	readonly DateFilterSetting: React.ComponentType<DateFilterSettingProps>;
	readonly DateTimeFilterSetting: React.ComponentType<DateTimeFilterSettingProps>;
	readonly DateFragmentFilterSetting: React.ComponentType<DateFragmentFilterSettingProps>;
	readonly DateRangeFilterSetting: React.ComponentType<DateRangeFilterSettingProps>;

	readonly RangeFilterEditorTemplate: React.ComponentType<RangeFilterEditorTemplateProps>;
	readonly EmptyFilter: React.ComponentType<EmptyFilterProps>;
	readonly OverviewHeading: React.ComponentType<NewOverviewHeadingProps>;
	readonly OverviewSubheaderBox: React.ComponentType<NewOverviewSubheaderBoxProps>;
	readonly SubHeader: React.ComponentType<NewSubHeaderProps>;
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
	LinkedReferenceCell,
	LinkedExpressionCell,
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
	OverviewSearchButton,

	newFilter: {
		FilterSelectorTriggerButton,
		FilterSelector: NewFilterSelector,
		FilterBar: NewFilterBar,
		FilterSelectorFooter,
		FilterSelectorSetting,
		FilterSelectorSearchBar,
		FilterBarItem,
		FilterBarItemDropdown,
		FilterResetButton,
		FilterSettingButton,
		FilterEditor,
		FilterSetting,
		BooleanFilterEditor,
		ConfirmFilterEditor,
		StringFilterEditor,
		NumberFilterEditor,
		EnumerationFilterEditor,
		MultiSelectFilterEditor,
		TimeFilterEditor,
		DateFilterEditor,
		DateTimeFilterEditor,
		DateFragmentFilterEditor,
		DateRangeFilterEditor,
		QueryFilterEditor,
		BooleanFilterSetting,
		ConfirmFilterSetting,
		StringFilterSetting,
		NumberFilterSetting,
		EnumerationFilterSetting,
		MultiSelectFilterSetting,
		TimeFilterSetting,
		DateFilterSetting,
		DateTimeFilterSetting,
		DateFragmentFilterSetting,
		DateRangeFilterSetting,
		RangeFilterEditorTemplate,
		EmptyFilter,
		OverviewHeading: NewOverviewHeading,
		OverviewSubheaderBox: NewOverviewSubheaderBox,
		SubHeader: NewSubHeader
	}
};
