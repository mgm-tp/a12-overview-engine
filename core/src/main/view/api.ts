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

import type { RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { InfiniteScrollOptions as WidgetInfiniteScrollOptions } from "@com.mgmtp.a12.widgets/widgets-core";

import { buildRelationshipField, relationshipFieldEquals } from "../client-extensions/internal/shared.js";
import type { JSONDocument } from "../models/index.js";
import { DocumentModelUtils } from "../models/internal/shared.js";
import { OverviewModel } from "../overview-model.js";
import { DialogTypes } from "../shared/dialog-types.js";
import {
	type Events,
	SortingOrder,
	type UiState,
	type Scrolling,
	type ColumnWidths,
	type Sorting as StoreSorting
} from "../store/index.js";

import type { OverviewButtonConfirmDialog } from "./components/dialogs/sub-components/overview-button-confirm-dialog.js";
import type { RowActionConfirmDialog } from "./components/dialogs/sub-components/row-action-confirm-dialog.js";
import type {
	DateViewSelection,
	DateTimeViewSelection
} from "./components/filters/options-views/date-time-filter-view.api.js";

export namespace OverviewEngineApi {
	export interface Sorting {
		/**
		 * The zero based index of the column to be sorted (left to right)
		 */
		readonly columnIndex: number;
		/**
		 * The sorting order
		 */
		readonly order: "asc" | "desc";
	}

	export namespace Sorting {
		/**
		 * Function to get initial properties for the rendered table based on the overview model
		 */
		export function getInitialValue(overviewModel: OverviewModel): Sorting[] | undefined {
			const { columns } = overviewModel.content;

			return overviewModel.content.configuration.initialSorting?.map(({ idref }) => {
				const columnIndex = columns.findIndex((column) => column.id === idref);
				const column = columns[columnIndex];

				if (
					!OverviewModel.ReferenceColumn.isAssignableFrom(column) &&
					!OverviewModel.LinkColumn.Reference.isAssignableFrom(column)
				) {
					throw new Error("Expect a reference or link reference column. Got: " + JSON.stringify(column));
				}

				return {
					columnIndex,
					order: column.preferredSorting === "DESC" ? "desc" : "asc"
				};
			});
		}
	}

	export interface Pagination {
		/**
		 * Number of documents per page
		 */
		readonly pageSize: number;
		/**
		 * Zero-based index of current page
		 */
		readonly pageNumber: number;
		/**
		 * Total number of pages
		 */
		readonly pageCount: number;
		/**
		 * Total number of rows
		 */
		readonly rowCount?: number;
	}

	export namespace Pagination {
		/**
		 * Function to get initial properties for the rendered content box based on the overview model
		 */
		export function getInitialValue(overviewModel: OverviewModel): Pagination | undefined {
			const { pagingSize } = overviewModel.content.configuration;

			if (pagingSize === undefined) {
				return undefined;
			}

			return {
				pageSize: pagingSize,
				pageNumber: 0,
				pageCount: 1
			};
		}
	}

	export interface EnumeratedStringFilterMap {
		readonly [fieldPath: string]: EnumeratedStringFilter;
	}

	export interface EnumeratedStringFilter {
		readonly keyword: string;
		readonly candidates: string[];
		readonly loading: boolean;
		readonly fullSize?: number;
	}

	/**
	 * An object which maps a fieldPath to {@link OverviewEngineApi.Filter.Options}
	 */
	export interface FilterMap {
		readonly [fieldPath: string]:
			| Filter.Options
			| Filter.StringOptions
			| Filter.BooleanOptions
			| Filter.ConfirmOptions
			| Filter.DateOptions
			| Filter.NumberOptions
			| Filter.EnumerationOptions
			| Filter.MultiSelectOptions
			| Filter.CustomFieldOptions
			| Filter.EnumeratedStringOptions
			| undefined;
	}

	export namespace Filter {
		export interface Options {
			filterType: string;
			error?: boolean;
			criteria?: unknown;
			nonRemovable?: boolean;
			undefinedMatch?: boolean;
			modelId?: string;
		}

		/**
		 * Specific filter options for String DataTypes
		 */
		export interface StringOptions extends Options {
			readonly filterType: "String";
			readonly criteria?: { readonly value: string };
		}

		export namespace StringOptions {
			/**
			 * Function to test if an object is of type StringOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: Options): obj is StringOptions {
				return obj.filterType === "String";
			}
		}

		export interface CustomFieldOptions extends Options {
			readonly filterType: "CustomField";
			readonly criteria?: { readonly value: string };
		}

		export namespace CustomFieldOptions {
			/**
			 * Function to test if an object is of type CustomFieldOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: Options): obj is CustomFieldOptions {
				return obj.filterType === "CustomField";
			}
		}

		/**
		 * Specific filter options for Number DataTypes
		 */
		export interface NumberOptions extends Options {
			readonly filterType: "Number";
			readonly criteria?: RangeOptions<number | null>;
		}

		export namespace NumberOptions {
			/**
			 * Function to test if an object is of type NumberOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: Options): obj is NumberOptions {
				return obj.filterType === "Number";
			}
		}

		/**
		 * Specific filter options for Boolean DataTypes
		 */
		export interface BooleanOptions extends Options {
			readonly filterType: "Boolean";
			readonly criteria?: { readonly value: boolean | null };
		}

		export namespace BooleanOptions {
			/**
			 * Function to test if an object is of type BooleanOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: Options): obj is BooleanOptions {
				return obj.filterType === "Boolean";
			}
		}

		interface BaseDateOptions extends Options {
			readonly filterType: "Date";
			readonly criteria?: RangeOptions<Date | null>;
		}

		export interface DateTimeTypeOptions extends BaseDateOptions {
			readonly type: "DateTime";
			readonly selectedView?: DateTimeViewSelection;
		}

		export interface DateTypeOptions extends BaseDateOptions {
			readonly type: "Date";
			readonly selectedView?: DateViewSelection;
		}

		export interface OtherDateOptions extends BaseDateOptions {
			readonly type: "Time" | "DateFragment" | "DateRange";
		}

		/**
		 * Specific filter options for Date DataTypes
		 * The start and end date options will be returned as a Date Object.
		 * Be careful about possible pitfalls with UTC.
		 */
		export type DateOptions = DateTimeTypeOptions | DateTypeOptions | OtherDateOptions;

		export namespace DateOptions {
			/**
			 * Function to test if an object is of type DateOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: Options): obj is DateOptions {
				return obj.filterType === "Date";
			}

			export namespace DateTimeTypeOptions {
				/**
				 * Function to test if an object is of type DateTimeTypeOptions
				 * @param obj Object to test
				 */
				export function isInstance(obj: Options): obj is DateTimeTypeOptions {
					return DateOptions.isInstance(obj) && obj.type === "DateTime";
				}
			}

			export namespace DateTypeOptions {
				/**
				 * Function to test if an object is of type DateTypeOptions
				 * @param obj Object to test
				 */
				export function isInstance(obj: Options): obj is DateTypeOptions {
					return DateOptions.isInstance(obj) && obj.type === "Date";
				}
			}
		}

		/**
		 * Specific filter options for Enumeration DataTypes
		 */
		export interface EnumerationOptions extends Options {
			readonly filterType: "Enumeration";
			readonly type?: string;
			readonly criteria?: { readonly selectedValues: string[] };
		}

		export namespace EnumerationOptions {
			/**
			 * Function to test if an object is of type EnumerationOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: Options): obj is EnumerationOptions {
				return obj.filterType === "Enumeration";
			}
		}

		/**
		 * Specific filter options for Enumerated String
		 */
		export interface EnumeratedStringOptions extends EnumerationOptions {
			readonly type: "EnumeratedString";
		}

		export namespace EnumeratedStringOptions {
			/**
			 * Function to test if an object is of type EnumeratedStringOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: EnumerationOptions): obj is EnumeratedStringOptions {
				return obj.type === "EnumeratedString";
			}
		}

		/**
		 * Specific filter options for Enumerated suffix
		 */
		export interface EnumeratedSuffixOptions extends EnumerationOptions {
			readonly type: "EnumeratedSuffix";
		}

		export namespace EnumeratedSuffixOptions {
			/**
			 * Function to test if an object is of type EnumeratedSuffixOptions
			 * @param obj Object to test
			 */
			export function isInstance(obj: EnumerationOptions): obj is EnumeratedSuffixOptions {
				return obj.type === "EnumeratedSuffix";
			}

			export function create(selectedValues?: string[], modelId?: string): EnumeratedSuffixOptions {
				return {
					filterType: "Enumeration",
					type: "EnumeratedSuffix",
					modelId,
					criteria: selectedValues ? { selectedValues } : undefined
				};
			}
		}

		export interface MultiSelectOptions extends Options {
			readonly filterType: "MultiSelect";
			readonly criteria?: {
				readonly selectedValues: string[];
				readonly operation: FilterOperation;
			};
		}

		export namespace MultiSelectOptions {
			export function isInstance(obj: Options): obj is MultiSelectOptions {
				return obj.filterType === "MultiSelect";
			}
		}

		/**
		 * Specific filter options for Confirm DataTypes
		 */
		export interface ConfirmOptions extends Options {
			readonly filterType: "Confirm";
			readonly criteria?: { readonly value: true | null };
		}
		export namespace ConfirmOptions {
			export function isInstance(obj: Options): obj is ConfirmOptions {
				return obj.filterType === "Confirm";
			}
		}

		/**
		 * Specific filter options for Range DataTypes
		 */
		export interface RangeOptions<T> {
			start?: T;
			end?: T;
		}
	}

	export interface EventHandlers {
		/**
		 * Handles an event button click.
		 *
		 * @param event - of the action, which is specified in the overview model
		 * @param button - the button, which is specified in the overview model
		 */
		onEventButtonClick?(event: string, button?: OverviewModel.Button): void;

		/**
		 * Handles a row click.
		 *
		 * @param params
		 * @param params.documentId - of the row
		 * @param params.linkId - exclude-mode rows only
		 * @param params.customEvent - of the action, which is specified in the overview model
		 */
		onRowClick?(params: { documentId: string; linkId?: string; customEvent?: string }): void;

		/**
		 * Handles a row button click.
		 *
		 * @param params
		 * @param params.documentId - the id of the document related to the row being clicked
		 * @param params.linkId - exclude-mode rows only
		 * @param params.rowActionModel - the action, which is specified in the overview model
		 */
		onRowButtonClick?(params: { documentId: string; linkId?: string; rowActionModel: OverviewModel.Button }): void;

		/**
		 * Handles a column click.
		 *
		 * @param columnIndex - that was clicked
		 */
		onColumnClick?(columnIndex: number): void;

		/**
		 * Handles overall checkbox click.
		 *
		 * @param params - array of per-row selection entries
		 * @param params[].documentId - the id of the document related to the row being affected
		 * @param params[].linkId - the link id for exclude-mode rows; `undefined` otherwise
		 * @param params[].selected - next expected selection state of this row
		 */
		onOverallMultiSelectionButtonClick?(params: { documentId: string; linkId?: string; selected: boolean }[]): void;

		/**
		 * Handles multiple rows selection.
		 *
		 * @param params
		 * @param params.documentId - the id of the document related to the row being affected
		 * @param params.selected - next expected selection state of this row
		 */
		onRowsSelect?(params: { documentId: string; linkId?: string; selected: boolean }[]): void;

		/**
		 * Handles clear selected document.
		 */
		onMultiSelectionClear?(): void;

		/**
		 * Handle a search box change
		 * @param searchString - The user entered search value
		 */
		onSearch?(searchString: string): void;

		/**
		 * Handle a filter change
		 * @param filters - the map of {@link OverviewEngineApi.Filter.Options}
		 */
		onFilterChange?(filters: FilterMap): void;

		/**
		 * Handles a page change.
		 *
		 * @param page - to switch to
		 */
		onPageChange?(page: number): void;

		/**
		 * Handle search enumerate string
		 * @param params.fieldPath - the path of currently filtering field
		 * @param params.keyword - the search value
		 * @param params.nextPage - true when loading more data. Otherwise, it's false
		 */
		onSearchEnumeratedStringField?(params: {
			fieldPath: string;
			modelId?: string;
			keyword?: string;
			nextPage?: boolean;
		}): void;

		/**
		 * Handle a multi-selection button click
		 */
		onMultiSelectionButtonClick?(): void;

		/**
		 * Handle an export action (e.g. export to Excel).
		 */
		onExport?(): void;

		/**
		 * @internal
		 * Handle the latest multi-selected document id change
		 * @param params.latestSelectedDocumentId - the id of the multi-selected document
		 */
		onLatestSelectedDocumentIdChange?(params: {
			latestSelectedDocumentId: { documentId: string; linkId?: string } | null;
		}): void;

		/**
		 * @internal
		 * Handle the range multi-selection document ids change
		 * @param params.latestSelectedDocumentIds - the ids of the multi-selected documents
		 */
		onLatestSelectedDocumentIdsChange?(params: {
			latestSelectedDocumentIds: { documentId: string; linkId?: string }[] | null;
		}): void;

		/**
		 * Handle clicking an Overview button with confirmation dialog
		 * @param params.buttonModel - the button type in Overview Model
		 * @param params.componentKey - the component key of the corresponding button
		 */
		onEventButtonClickRequest?(params: {
			readonly buttonModel: OverviewModel.Button;
			readonly componentKey: string;
		}): void;

		/**
		 * Handle clicking a row action button with confirmation dialog
		 * @param params.row - the JSONDocument representing the related row
		 * @param params.rowActionModel - the button properties
		 * @param params.componentKey - the component key of the corresponding button
		 */
		onRowButtonClickRequest?(params: {
			readonly row: JSONDocument;
			readonly rowActionModel: OverviewModel.Button;
			readonly componentKey: string;
		}): void;

		/**
		 * Handle setting the column widths
		 * @param params.overrideWidths - the column ids with their equivalent widths
		 */
		onColumnWidthsChange?(params: { columnWidths: ColumnWidths }): void;

		/**
		 * Handle querying for more rows to be loaded in infinite scrolling
		 * @param params.scrolling - the starting point, the number of rows need to be loaded and the visible range
		 */
		onInfiniteScroll?(params: { scrolling: Scrolling }): void;

		/**
		 * Handle acknowledging that a scroll-to-row request has been processed by the view.
		 * @internal
		 */
		onScrollToRowHandled?(): void;

		/**
		 * Handle sorting a field
		 * @param params.sorting - the array of field path and the corresponding sorting order
		 */
		onSort?(params: { sorting?: StoreSorting[] }): void;

		/**
		 * Handle clicking the next page button in pagination
		 */
		onNextPageClick?(): void;

		/**
		 * Handle clicking the previous page button in pagination
		 */
		onPreviousPageClick?(): void;

		/**
		 * Handle clicking the dialog confirm button
		 */
		onDialogConfirm?(): void;

		/**
		 * Handle clicking the dialog close button
		 */
		onDialogClose?(): void;

		/**
		 * Handle toggling the mobile search bar (small-view heading button).
		 *
		 * @experimental until 40.0.0 - API may change without semver guarantees.
		 */
		onMobileSearchBarToggle?(params: Events.MobileSearchBarTogglePayload): void;

		/**
		 * Filter 2.0 event handlers.
		 *
		 * @experimental until 40.0.0 - API may change without semver guarantees.
		 */
		readonly newFilter?: {
			/**
			 * Handle changing a Filter Selector option via the popup menu.
			 */
			readonly onFilterSelectorOptionsChanged?: (params: Events.NewFilter.FilterSelectorOptionsChangedPayload) => void;

			/**
			 * Handle toggling the shared global filter options (`invert`, `joinOperator`).
			 */
			readonly onFilterOptionsChanged?: (params: Events.NewFilter.FilterOptionsChangedPayload) => void;

			/**
			 * Handle clicking "Apply All" in the Filter Selector footer.
			 */
			readonly onFilterSelectorAllApplied?: () => void;

			/**
			 * Handle clicking "Apply" in a Filter Bar dropdown.
			 */
			readonly onFilterItemEditApplied?: () => void;

			/**
			 * Handle opening or closing the Filter Selector panel.
			 */
			readonly onFilterSelectorVisibilityChanged?: (
				params: Events.NewFilter.FilterSelectorVisibilityChangedPayload
			) => void;

			/**
			 * Handle collapsing or expanding a filter section. Pass `filterId: null` to toggle all.
			 */
			readonly onFilterCollapsedChanged?: (params: Events.NewFilter.FilterCollapsedChangedPayload) => void;

			/**
			 * Handle changing a filter's type-specific options (typing, checkbox, date pick).
			 */
			readonly onFilterItemOptionsChanged?: <Option = object>(
				params: Events.NewFilter.FilterItemOptionsChangedPayload<Option>
			) => void;

			/**
			 * Handle clicking a per-filter reset button.
			 */
			readonly onFilterItemReset?: (params: Events.NewFilter.FilterItemResetPayload) => void;

			/**
			 * Handle clicking "Reset All" in the Filter Selector. Resets the global query
			 * options to their modeled defaults
			 */
			readonly onFilterSelectorReset?: () => void;

			/**
			 * Handle clicking the reset icon in the Filter Bar.
			 */
			readonly onFilterBarReset?: () => void;

			/**
			 * Handle Filter Bar overflow change (which filters became hidden / visible).
			 */
			readonly onFilterBarItemsOverflowed?: (params: Events.NewFilter.FilterBarItemsOverflowedPayload) => void;

			/**
			 * Handle opening a Filter Bar dropdown to edit a filter.
			 */
			readonly onFilterItemEditStarted?: (params: Events.NewFilter.FilterItemEditStartedPayload) => void;

			/**
			 * Handle closing a Filter Bar dropdown without applying.
			 */
			readonly onFilterItemEditCanceled?: (params: Events.NewFilter.FilterItemEditCanceledPayload) => void;

			/**
			 * Handle opening the in-place filter settings view inside the Filter Selector.
			 */
			readonly onFilterItemSettingsOpened?: (params: Events.NewFilter.FilterItemSettingsOpenedPayload) => void;

			/**
			 * Handle closing the in-place filter settings view.
			 */
			readonly onFilterItemSettingsClosed?: () => void;
		};
	}

	/**
	 * The map that is used for specifying state of rows
	 */
	export interface RowState {
		readonly [docRef: string]: {
			readonly selected?: boolean;
			readonly useSecondaryColor?: boolean;
			readonly disabled?: boolean;
			/**
			 * Per-linkId flag overrides for exclude-mode duplicate rows.
			 * When present for a given `linkId`, these flags take precedence over the
			 * outer-level flags for that specific `(docRef, linkId)` row.
			 * Hosts that do not use exclude-mode duplicates can ignore this field.
			 */
			readonly byLink?: {
				readonly [linkId: string]: {
					readonly selected?: boolean;
					readonly useSecondaryColor?: boolean;
					readonly disabled?: boolean;
				};
			};
		};
	}

	/**
	 * The options for infinite-scroll. It is based on the options in Widget with a small difference.
	 */
	export interface InfiniteScrollOptions extends Omit<
		WidgetInfiniteScrollOptions,
		"rowCount" | "rowHeight" | "loadData"
	> {
		/**
		 * The total number of rows available for infinite scrolling.
		 * @default 100
		 */
		rowCount?: number;

		/**
		 * @description
		 * This function will trigger `Events.onInfiniteScrolled` when the user scrolls to the end of the list.
		 *
		 * @param params.startPage - The starting page to load (inclusive). **This is 0-based.**
		 * @param params.endPage - The ending page to load (inclusive). **This is 0-based.**
		 *
		 * @example
		 * loadData({ startPage: 4, endPage: 7 });
		 * // An Events.onInfiniteScrolled with be triggered with pageNumbers: [4, 5, 6, 7]
		 */
		loadData(params: { startPage: number; endPage: number }): Promise<void>;
	}

	/**
	 * This is used for specifying state of row actions
	 * @deprecated Use the {@link RowActionStyling} instead.
	 */
	export interface RowActionState {
		/**
		 * To specify row action state for all rows
		 * @deprecated Use the {@link RowActionStyling} instead.
		 */
		readonly rowActions?: {
			readonly [event: string]: RowActionStyling.IndividualRowActionState;
		};

		/**
		 * To specify row action state for each specific row
		 * @deprecated Use the {@link RowActionStyling} instead.
		 */
		readonly rows?: {
			readonly [id: string]: {
				[event: string]: RowActionStyling.IndividualRowActionState;
			};
		};
	}

	/**
	 * @deprecated Use the {@link RowActionStyling} instead.
	 */
	export namespace RowActionState {
		/**
		 * @deprecated Use {@link RowActionStyling.IndividualRowActionState} instead.
		 */
		export type IndividualRowActionState = RowActionStyling.IndividualRowActionState;
	}

	/**
	 * Callback variant of {@link RowActionState}. Called per row and per action;
	 * returns the action state for that specific row.
	 *
	 * @remarks Wrap with `useCallback` to avoid unnecessary re-renders — the reference
	 * is included in a dependency array inside the engine.
	 */
	export interface RowActionStyling {
		(params: {
			row: JSONDocument;
			button: OverviewModel.Button;
		}): RowActionStyling.IndividualRowActionState | undefined;
	}

	export namespace RowActionStyling {
		export interface IndividualRowActionState {
			readonly hidden?: boolean;
			readonly disabled?: boolean;
		}
	}

	/**
	 * Base dialog type in overview engine
	 */
	export interface Dialog {
		readonly type?: string;
		readonly componentKey: string;
	}

	export namespace Dialog {
		/**
		 * Dialog types
		 */
		export import Types = DialogTypes;

		/**
		 * Confirmation dialog for row actions
		 */
		export interface RowActionConfirm extends Dialog, RowActionConfirmDialog.Props {
			readonly type: Dialog.Types.ROW_ACTION_CONFIRM;
		}

		export namespace RowActionConfirm {
			export function isInstance(dialog: Dialog): dialog is RowActionConfirm {
				return dialog.type === Dialog.Types.ROW_ACTION_CONFIRM;
			}
		}

		/**
		 * Confirmation dialog for overview buttons
		 */
		export interface OverviewButtonConfirm extends Dialog, OverviewButtonConfirmDialog.Props {
			readonly type: Dialog.Types.OVERVIEW_BUTTON_CONFIRM;
		}

		export namespace OverviewButtonConfirm {
			export function isInstance(dialog: Dialog): dialog is OverviewButtonConfirm {
				return dialog.type === Dialog.Types.OVERVIEW_BUTTON_CONFIRM;
			}
		}
	}

	/**
	 * A map between column's id and its statistical operation results
	 */
	export interface SummaryResult {
		[columnId: string]: Record<OverviewModel.Summary.Operation, number | undefined> | undefined;
	}

	/**
	 * Transform sorting property in UiState to OverviewEngineApi.Sorting
	 */
	export function getSortingProps(
		sorting: UiState["sorting"] | undefined,
		documentModel: DocumentModel,
		{ content: { columns } }: OverviewModel,
		relationshipModels?: RelationshipModel[],
		subDocumentModels?: DocumentModel[]
	): Sorting[] | undefined {
		if (sorting === undefined || sorting.length === 0) {
			return undefined;
		}

		return sorting.map((sort) => {
			const columnIndex = columns.findIndex((col) => {
				if (typeof sort.path === "string") {
					return (
						OverviewModel.ReferenceColumn.isAssignableFrom(col) &&
						DocumentModelUtils.getElementPathForId(col.elementRef, documentModel) === sort.path
					);
				}

				if (OverviewModel.LinkColumn.Reference.isAssignableFrom(col)) {
					const path = buildRelationshipField(col, documentModel, relationshipModels, subDocumentModels);

					return path !== undefined && relationshipFieldEquals(path, sort.path);
				}

				return false;
			});

			if (columnIndex < 0) {
				throw new Error(`No column could be found for the sorting path "${JSON.stringify(sort.path)}"`);
			}

			return { columnIndex, order: sort.order === "DESC" ? "desc" : "asc" };
		});
	}

	/**
	 * Transform OverviewEngineApi.Sorting to sorting property in UiState
	 */
	/** @internal */
	export function getUiStateSorting(
		sorting: Sorting[] | undefined,
		documentModel: DocumentModel,
		{ content: { columns } }: OverviewModel,
		relationshipModels?: RelationshipModel[],
		subDocumentModels?: DocumentModel[]
	): UiState["sorting"] | undefined {
		if (sorting === undefined || sorting.length === 0) {
			return undefined;
		}

		return sorting.map(({ columnIndex, order }) => {
			const column = columns[columnIndex];
			const sortingOrder = order === "desc" ? SortingOrder.DESC : SortingOrder.ASC;

			if (OverviewModel.LinkColumn.Reference.isAssignableFrom(column)) {
				const rf = buildRelationshipField(column, documentModel, relationshipModels, subDocumentModels);

				if (!rf) {
					throw new Error(`No relationship field could be built for column index "${columnIndex}"`);
				}

				return { path: rf, order: sortingOrder };
			}

			const path =
				OverviewModel.ReferenceColumn.isAssignableFrom(column) &&
				DocumentModelUtils.getElementPathForId(column.elementRef, documentModel);

			if (!path) {
				throw new Error(`No path could be found for column index "${columnIndex}"`);
			}

			return { path, order: sortingOrder };
		});
	}

	/**
	 * Combination of accessibility configurations when the project has accessibility requirements
	 */
	export interface AccessibilityConfigurations {
		/**
		 * Table footer only has aria-attributes when this property is set as true
		 */
		readonly hasFootContent?: boolean;
	}
}

export enum FilterOperation {
	AND = "and",
	OR = "or"
}
