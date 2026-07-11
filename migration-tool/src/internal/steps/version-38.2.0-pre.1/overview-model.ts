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

import type { Header, Annotation } from "@com.mgmtp.a12.base/base-model-api";
import type { LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";

export interface OverviewModel {
	readonly header: Header;
	readonly content: OverviewModel.Content;
}

export namespace OverviewModel {
	export interface Content {
		readonly configuration: Configuration;

		readonly subHeaderBox?: SubHeaderBox;
		readonly footerBox?: FooterBox;

		readonly columns: ReadonlyArray<Column>;

		readonly rowActionGroup: RowActionGroup;
		readonly defaultRowAction?: DefaultRowAction;

		readonly contextMenu?: ContextMenu;

		readonly styles?: Styles;
	}

	export interface Configuration {
		readonly pagingSize?: number;
		readonly initialSorting?: ColumnRef[];
		readonly showFullTextSearch?: boolean;
		readonly labelHidden?: true;
		readonly showRowCount?: true;

		readonly enableColumnsResize?: true;
		readonly enableFilter: boolean;
		readonly filterConfiguration?: FilterConfiguration;

		readonly multiSelection?: MultiSelection;

		readonly rowHeight?: number;
		readonly actionColumnWidth?: Width;
		readonly enableInfiniteScroll?: true;

		readonly subtitle?: LocalizedModelText;
		readonly rowTitle?: LocalizedModelText;
	}

	export interface ContextMenu {
		readonly groups: ActionGroup[];
	}

	export interface ActionGroup {
		readonly name: string;
		readonly title?: LocalizedModelText;
		readonly actions: ReadonlyArray<ContextMenuItem>;
	}

	export interface ColumnRef {
		readonly idref: string;
	}

	export type Styles = ReadonlyArray<string>;

	export type Width = number;

	export type PinDirection = "RIGHT" | "LEFT";

	export type Column = ReferenceColumn | ExpressionColumn;

	export interface ReferenceColumn extends BaseColumn {
		readonly elementRef: string;

		/**
		 * @default false
		 */
		readonly sortable?: boolean;

		/**
		 * @default ASC
		 */
		readonly preferredSorting?: "ASC" | "DESC";

		/**
		 * @default {@link OverviewModel.AttachmentDisplayMode.PREVIEW}
		 */
		readonly attachmentDisplayMode?: AttachmentDisplayMode;
		readonly multiSelectDisplayMode?: MultiSelectDisplayMode;

		// suffix of number field
		readonly suffix?: LocalizedModelText;

		readonly suffixRef?: string;

		readonly summary?: Summary[];
	}

	export interface Summary {
		readonly operation: Summary.Operation | never;
	}

	export namespace Summary {
		export enum Operation {
			SUM = "sum"
		}
	}

	export namespace ReferenceColumn {
		export function isAssignableFrom(column: object): column is ReferenceColumn {
			return "elementRef" in column;
		}
	}

	export interface ExpressionColumn extends BaseColumn {
		readonly name: string;
		readonly expression: string;
	}

	export namespace ExpressionColumn {
		export function isAssignableFrom(column: object): column is ExpressionColumn {
			return "expression" in column;
		}
	}

	export interface BaseColumn {
		readonly label?: LocalizedModelText;
		readonly icon?: Icon;
		readonly labelHidden?: true;
		readonly id: string;
		readonly width: Width;
		readonly fixedWidth?: true;
		readonly pinDirection?: PinDirection;
		readonly alignment?: ColumnAlignment;
		readonly styles?: ColumnStyles;
	}

	export interface SubHeaderBox {
		readonly minorElements?: ReadonlyArray<Element>;
		readonly majorElements?: ReadonlyArray<Element>;
	}

	export interface FooterBox {
		readonly minorElements?: ReadonlyArray<ButtonElement>;
		readonly majorElements?: ReadonlyArray<ButtonElement>;
	}

	export type Element = ButtonElement | MultiSelectionElement | SearchElement | FilterElement;

	export interface BaseElement {
		readonly type: ElementType;
	}

	export interface ButtonElement extends BaseElement, Button {
		readonly type: ElementType.BUTTON;
	}

	export namespace ButtonElement {
		export function isAssignableFrom(element: object): element is ButtonElement {
			return (element as ButtonElement).type === ElementType.BUTTON;
		}
	}

	export interface MultiSelectionElement extends BaseElement {
		readonly type: ElementType.MULTI_SELECTION;
	}

	export namespace MultiSelectionElement {
		export function isAssignableFrom(element: object): element is MultiSelectionElement {
			return (element as MultiSelectionElement).type === ElementType.MULTI_SELECTION;
		}
	}

	export interface SearchElement extends BaseElement {
		readonly type: ElementType.SEARCH;
	}

	export namespace SearchElement {
		export function isAssignableFrom(element: object): element is SearchElement {
			return (element as SearchElement).type === ElementType.SEARCH;
		}
	}

	export interface FilterElement extends BaseElement {
		readonly type: ElementType.FILTER;
	}

	export namespace FilterElement {
		export function isAssignableFrom(element: object): element is FilterElement {
			return (element as FilterElement).type === ElementType.FILTER;
		}
	}

	export enum ElementType {
		BUTTON = "button",
		MULTI_SELECTION = "multi_selection",
		SEARCH = "search",
		FILTER = "filter"
	}

	export interface SectionItem {
		readonly label: LocalizedModelText;
		readonly id: string;
		readonly fields: ReadonlyArray<FieldConfiguration>;
	}

	export interface FilterConfiguration {
		readonly showFilterButton: boolean;
		readonly showFilterBar: boolean;
		readonly filterMode: FilterMode;
		readonly fields?: ReadonlyArray<FieldConfiguration>;
		readonly sectionData?: ReadonlyArray<SectionItem>;
		readonly enumeratedStringFilter?: EnumeratedStringFilterConfiguration;
	}

	export enum FilterMode {
		ALL = "all",
		ALL_WITH_META = "all_with_meta",
		ALL_COLUMNS = "all_columns",
		CUSTOM_LIST = "custom_list"
	}

	export interface EnumeratedStringFilterConfiguration {
		readonly fields: ReadonlyArray<FieldConfiguration>;
		readonly pagingSize?: number;
	}

	export interface FieldConfiguration {
		readonly fieldId: string;
		readonly subModel?: string;
	}

	export interface RowActionGroup {
		readonly actions?: ReadonlyArray<Button>;
	}

	export interface ConfirmationText {
		readonly title?: LocalizedModelText;
		readonly message?: LocalizedModelText;
	}

	export interface DefaultRowAction {
		readonly custom: true;
		readonly event: string;
	}

	export interface Triggerable extends Annotated {
		readonly event: string;
		readonly label?: LocalizedModelText;
		readonly description?: LocalizedModelText;
		readonly confirmation?: ConfirmationText;
		readonly icon?: Icon;
		readonly styles?: Styles;
	}

	export type ContextMenuItem = Triggerable;

	export interface Button extends Triggerable {
		readonly destructive?: boolean;
		readonly primary?: boolean;
		readonly labelHidden?: true;
	}

	export interface Annotated {
		readonly annotations?: Annotation[];
	}

	export interface Icon {
		readonly name: string;
		readonly theme?: IconTheme;
	}

	export interface ColumnAlignment {
		readonly header?: Alignment;
		readonly content?: Alignment;
	}

	export interface ColumnStyles {
		readonly header?: Styles;
		readonly content?: Styles;
	}

	export interface Alignment {
		readonly horizontal?: HorizontalAlignment;
		readonly vertical?: VerticalAlignment;
	}

	export enum HorizontalAlignment {
		LEFT = "left",
		CENTER = "center",
		RIGHT = "right"
	}

	export enum VerticalAlignment {
		TOP = "top",
		MIDDLE = "middle",
		BOTTOM = "bottom"
	}

	export interface MultiSelection {
		readonly collapseOption: MultiSelection.CollapseOption;
		readonly counterOption: MultiSelection.CounterOption;
		readonly selectionArea?: MultiSelection.SelectionArea;

		readonly buttons?: ReadonlyArray<Button>;

		readonly clearConfirmation?: {
			readonly enabled: true;
			readonly confirmation?: ConfirmationText;
		};
	}

	export namespace MultiSelection {
		export enum CounterOption {
			SIMPLE = "simple",
			NONE = "none"
		}

		export enum CollapseOption {
			COLLAPSIBLE_COLLAPSED = "collapsible_collapsed",
			COLLAPSIBLE_EXPANDED = "collapsible_expanded",
			NON_COLLAPSIBLE = "non_collapsible"
		}

		export enum SelectionArea {
			CHECKBOX = "checkbox",
			CHECKBOX_AND_ROW = "checkbox_and_row"
		}
	}

	export enum AttachmentDisplayMode {
		PREVIEW = "preview",
		ICON = "icon",
		FILE_NAME = "file_name",
		ICON_WITH_FILE_NAME = "icon_with_file_name"
	}

	export enum MultiSelectDisplayMode {
		COMMA_SEPARATED = "comma_separated",
		DEFAULT = "default"
	}

	export type IconTheme = "filled" | "outlined" | "rounded" | "custom";
}

/** @deprecated Use {@link OverviewModel.Content} instead */
export type Content = OverviewModel.Content;

/** @deprecated Use {@link OverviewModel.Configuration} instead */
export type Configuration = OverviewModel.Configuration;

/** @deprecated Use {@link OverviewModel.ContextMenu} instead */
export type ContextMenu = OverviewModel.ContextMenu;

/** @deprecated Use {@link OverviewModel.ActionGroup} instead */
export type ActionGroup = OverviewModel.ActionGroup;

/** @deprecated Use {@link OverviewModel.ColumnRef} instead */
export type ColumnRef = OverviewModel.ColumnRef;

/** @deprecated Use {@link OverviewModel.Styles} instead */
export type Styles = OverviewModel.Styles;

/** @deprecated Use {@link OverviewModel.Width} instead */
export type Width = OverviewModel.Width;

/** @deprecated Use {@link OverviewModel.PinDirection} instead */
export type PinDirection = OverviewModel.PinDirection;

/** @deprecated Use {@link OverviewModel.Column} instead */
export type Column = OverviewModel.Column;

/** @deprecated Use {@link OverviewModel.ReferenceColumn} instead */
export import ReferenceColumn = OverviewModel.ReferenceColumn;

/** @deprecated Use {@link OverviewModel.Summary} instead */
export import Summary = OverviewModel.Summary;

/** @deprecated Use {@link OverviewModel.ExpressionColumn} instead */
export import ExpressionColumn = OverviewModel.ExpressionColumn;

/** @deprecated Use {@link OverviewModel.BaseColumn} instead */
export type BaseColumn = OverviewModel.BaseColumn;

/** @deprecated Use {@link OverviewModel.SubHeaderBox} instead */
export type SubHeaderBox = OverviewModel.SubHeaderBox;

/** @deprecated Use {@link OverviewModel.FooterBox} instead */
export type FooterBox = OverviewModel.FooterBox;

/** @deprecated Use {@link OverviewModel.Element} instead */
export type Element = OverviewModel.Element;

/** @deprecated Use {@link OverviewModel.BaseElement} instead */
export type BaseElement = OverviewModel.BaseElement;

/** @deprecated Use {@link OverviewModel.ButtonElement} instead */
export import ButtonElement = OverviewModel.ButtonElement;

/** @deprecated Use {@link OverviewModel.MultiSelectionElement} instead */
export import MultiSelectionElement = OverviewModel.MultiSelectionElement;

/** @deprecated Use {@link OverviewModel.SearchElement} instead */
export import SearchElement = OverviewModel.SearchElement;

/** @deprecated Use {@link OverviewModel.FilterElement} instead */
export import FilterElement = OverviewModel.FilterElement;

/** @deprecated Use {@link OverviewModel.ElementType} instead */
export const ElementType = OverviewModel.ElementType;
export type ElementType = OverviewModel.ElementType;

/** @deprecated Use {@link OverviewModel.SectionItem} instead */
export type SectionItem = OverviewModel.SectionItem;

/** @deprecated Use {@link OverviewModel.FilterConfiguration} instead */
export type FilterConfiguration = OverviewModel.FilterConfiguration;

/** @deprecated Use {@link OverviewModel.FilterMode} instead */
export const FilterMode = OverviewModel.FilterMode;
export type FilterMode = OverviewModel.FilterMode;

/** @deprecated Use {@link OverviewModel.EnumeratedStringFilterConfiguration} instead */
export type EnumeratedStringFilterConfiguration = OverviewModel.EnumeratedStringFilterConfiguration;

/** @deprecated Use {@link OverviewModel.FieldConfiguration} instead */
export type FieldConfiguration = OverviewModel.FieldConfiguration;

/** @deprecated Use {@link OverviewModel.RowActionGroup} instead */
export type RowActionGroup = OverviewModel.RowActionGroup;

/** @deprecated Use {@link OverviewModel.ConfirmationText} instead */
export type ConfirmationText = OverviewModel.ConfirmationText;

/** @deprecated Use {@link OverviewModel.DefaultRowAction} instead */
export type DefaultRowAction = OverviewModel.DefaultRowAction;

/** @deprecated Use {@link OverviewModel.Triggerable} instead */
export type Triggerable = OverviewModel.Triggerable;

/** @deprecated Use {@link OverviewModel.ContextMenuItem} instead */
export type ContextMenuItem = OverviewModel.ContextMenuItem;

/** @deprecated Use {@link OverviewModel.Button} instead */
export type Button = OverviewModel.Button;

/** @deprecated Use {@link OverviewModel.Annotated} instead */
export type Annotated = OverviewModel.Annotated;

/** @deprecated Use {@link OverviewModel.Icon} instead */
export type Icon = OverviewModel.Icon;

/** @deprecated Use {@link OverviewModel.ColumnAlignment} instead */
export type ColumnAlignment = OverviewModel.ColumnAlignment;

/** @deprecated Use {@link OverviewModel.ColumnStyles} instead */
export type ColumnStyles = OverviewModel.ColumnStyles;

/** @deprecated Use {@link OverviewModel.Alignment} instead */
export type Alignment = OverviewModel.Alignment;

/** @deprecated Use {@link OverviewModel.HorizontalAlignment} instead */
export const HorizontalAlignment = OverviewModel.HorizontalAlignment;

/** @deprecated Use {@link OverviewModel.VerticalAlignment} instead */
export const VerticalAlignment = OverviewModel.VerticalAlignment;
export type VerticalAlignment = OverviewModel.VerticalAlignment;

/** @deprecated Use {@link OverviewModel.MultiSelection} instead */
export import MultiSelection = OverviewModel.MultiSelection;

/** @deprecated Use {@link OverviewModel.AttachmentDisplayMode} instead */
export const AttachmentDisplayMode = OverviewModel.AttachmentDisplayMode;
export type AttachmentDisplayMode = OverviewModel.AttachmentDisplayMode;

/** @deprecated Use {@link OverviewModel.MultiSelectDisplayMode} instead */
export const MultiSelectDisplayMode = OverviewModel.MultiSelectDisplayMode;
export type MultiSelectDisplayMode = OverviewModel.MultiSelectDisplayMode;

/** @deprecated Use {@link OverviewModel.IconTheme} instead */
export type IconTheme = OverviewModel.IconTheme;
