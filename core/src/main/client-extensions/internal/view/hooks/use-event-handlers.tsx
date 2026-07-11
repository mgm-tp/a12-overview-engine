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
import type { Dispatch } from "redux";
import { useDispatch, useSelector } from "react-redux";
import type { List, InfiniteLoader } from "react-virtualized";

import type { Activity } from "@com.mgmtp.a12.client/client-core";
import type { RowStyleGetter } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertObject } from "../../utils/assertion.js";
import { OverviewEngineActions } from "../../actions.js";
import { OverviewEngineSelectors } from "../../selectors.js";
import { OverviewModel } from "../../../../overview-model.js";
import type { JSONDocument } from "../../../../models/index.js";
import type { OverviewEngineApi } from "../../../../view/api.js";
import { DocumentModelUtils } from "../../../../models/internal/shared.js";
import { buildRelationshipField, relationshipFieldEquals } from "../../utils/relationship-sort-utils.js";
import { defaultMapDispatchToEventHandlers } from "../../../../view/configuration/event-handlers-dispatch-map.js";
import { Events, SortingOrder, type UiState, type Sorting, type PaginationState } from "../../../../store/index.js";

import { useModels } from "./use-models.js";

type SortPath = Sorting["path"];

interface SortDescriptor {
	readonly path: SortPath;
	readonly preferredSorting: SortingOrder;
}

const flipOrder = (order: SortingOrder): SortingOrder =>
	order === SortingOrder.ASC ? SortingOrder.DESC : SortingOrder.ASC;

const getPreferredSorting = (column: { readonly preferredSorting?: "ASC" | "DESC" }): SortingOrder =>
	column.preferredSorting === "DESC" ? SortingOrder.DESC : SortingOrder.ASC;

const isSamePath = (a: SortPath, b: SortPath): boolean => {
	if (typeof a === "string" || typeof b === "string") {
		return a === b;
	}

	return relationshipFieldEquals(a, b);
};

function computeNextSorting(params: {
	descriptor: SortDescriptor;
	isInitial: boolean;
	currentSorting: Sorting | undefined;
}): Sorting | undefined {
	const { descriptor, isInitial, currentSorting } = params;
	const { path, preferredSorting } = descriptor;

	if (!currentSorting && isInitial) {
		return { path, order: flipOrder(preferredSorting) };
	}

	if (!currentSorting || !isSamePath(currentSorting.path, path)) {
		return { path, order: preferredSorting };
	}

	if (currentSorting.order === preferredSorting) {
		return { path, order: flipOrder(preferredSorting) };
	}

	return undefined;
}

/** @internal */
export function useEventHandlers(params: {
	activityId: string;
	uiState: UiState;
	data: (Activity.Data.Document | undefined)[];
	eventHandlerProps: OverviewEngineApi.EventHandlers | undefined;
	loaderRef: React.MutableRefObject<InfiniteLoader | null>;
	listRef: React.MutableRefObject<List | null>;
	rowStyling: RowStyleGetter<JSONDocument> | undefined;
	dataHolderDescriptor?: Activity.DataHolderDescriptor;
	overviewModelName?: string;
}): OverviewEngineApi.EventHandlers {
	const {
		activityId,
		eventHandlerProps,
		loaderRef,
		listRef,
		uiState,
		data,
		rowStyling,
		dataHolderDescriptor,
		overviewModelName
	} = params;
	const { pagination } = uiState;

	const bapDispatch = useDispatch();
	const engineDispatch: Dispatch = React.useCallback(
		(action) => {
			bapDispatch(
				OverviewEngineActions.event({
					activityId,
					dataHolderDescriptor,
					overviewModelName,
					engineAction: action
				})
			);

			return action;
		},
		[bapDispatch, activityId, dataHolderDescriptor, overviewModelName]
	);

	const mergeEngineHandlers = React.useMemo(
		() => ({ ...defaultMapDispatchToEventHandlers(engineDispatch), ...eventHandlerProps }),
		[engineDispatch, eventHandlerProps]
	);

	const [
		onSearch,
		onFilterChange,
		onPageChange,
		onColumnClick,
		onEventButtonClick,
		onRowClick,
		onRowButtonClick,
		onSearchEnumeratedStringField
	] = [
		useOnSearch({ loaderRef, listRef, mergeEngineHandlers }),
		useOnFilterChange({ loaderRef, listRef, mergeEngineHandlers }),
		useOnPageChange({ pagination, mergeEngineHandlers }),
		useOnColumnClick({ activityId, loaderRef, listRef, mergeEngineHandlers, overviewModelName }),
		useOnEventButtonClick({ activityId, mergeEngineHandlers }),
		useOnRowClick({ data, mergeEngineHandlers, rowStyling }),
		useOnRowButtonClick({ mergeEngineHandlers }),
		useOnSearchEnumeratedStringField({ activityId, mergeEngineHandlers })
	];

	return React.useMemo(() => {
		return {
			...mergeEngineHandlers,
			onRowClick,
			onRowButtonClick,
			onColumnClick,
			onFilterChange,
			onPageChange,
			onEventButtonClick,
			onSearch,
			onSearchEnumeratedStringField
		};
	}, [
		mergeEngineHandlers,
		onColumnClick,
		onEventButtonClick,
		onFilterChange,
		onPageChange,
		onRowButtonClick,
		onRowClick,
		onSearch,
		onSearchEnumeratedStringField
	]);
}

function useOnSearch(params: {
	loaderRef: React.MutableRefObject<InfiniteLoader | null>;
	listRef: React.MutableRefObject<List | null>;
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
}): Required<OverviewEngineApi.EventHandlers>["onSearch"] {
	const { loaderRef, listRef, mergeEngineHandlers } = params;
	const [searchTrigger, setSearchTrigger] = React.useState<Element | null>(null);

	React.useEffect(() => {
		if (searchTrigger instanceof HTMLElement) {
			searchTrigger.focus();
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSearchTrigger(null);
		}
	}, [searchTrigger]);

	return React.useCallback(
		(searchString: string): void => {
			loaderRef.current?.resetLoadMoreRowsCache(true);
			listRef.current?.scrollToPosition(0);
			setSearchTrigger(document.activeElement);
			mergeEngineHandlers.onSearch?.(searchString);
		},
		[listRef, loaderRef, mergeEngineHandlers]
	);
}

function useOnFilterChange(params: {
	loaderRef: React.MutableRefObject<InfiniteLoader | null>;
	listRef: React.MutableRefObject<List | null>;
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
}): Required<OverviewEngineApi.EventHandlers>["onFilterChange"] {
	const { loaderRef, listRef, mergeEngineHandlers } = params;

	return React.useCallback(
		(fieldBasedFilters: OverviewEngineApi.FilterMap): void => {
			loaderRef.current?.resetLoadMoreRowsCache(true);
			listRef.current?.scrollToPosition(0);
			mergeEngineHandlers.onFilterChange?.(fieldBasedFilters);
		},
		[listRef, loaderRef, mergeEngineHandlers]
	);
}

function useOnPageChange(params: {
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
	pagination: PaginationState | undefined;
}): Required<OverviewEngineApi.EventHandlers>["onPageChange"] {
	const { mergeEngineHandlers, pagination } = params;

	return React.useCallback(
		(pageNumber) => {
			assertObject(pagination, "Pagination must be set when using onPageChange()");
			mergeEngineHandlers.onPageChange?.(pageNumber);
		},
		[mergeEngineHandlers, pagination]
	);
}

function useOnColumnClick(params: {
	activityId: string;
	loaderRef: React.MutableRefObject<InfiniteLoader | null>;
	listRef: React.MutableRefObject<List | null>;
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
	overviewModelName?: string;
}): Required<OverviewEngineApi.EventHandlers>["onColumnClick"] | undefined {
	const { activityId, loaderRef, listRef, mergeEngineHandlers, overviewModelName } = params;
	const { documentModel, overviewModel, modelGraph, subDocumentModels, queryModel } = useModels({
		activityId,
		overviewModelName
	});
	const isExcludeMode = !!queryModel?.content.exclude;

	const uiStateWithoutDefaultSelector = React.useMemo(() => {
		return OverviewEngineSelectors.uiStateWithoutDefaults(activityId);
	}, [activityId]);
	const uiStateWithoutDefault = useSelector(uiStateWithoutDefaultSelector);

	const resolveSortDescriptor = React.useCallback(
		(column: OverviewModel.Column): SortDescriptor | undefined => {
			if (!documentModel) {
				return undefined;
			}

			if (OverviewModel.ReferenceColumn.isAssignableFrom(column)) {
				return {
					path: DocumentModelUtils.getElementPathForId(column.elementRef, documentModel),
					preferredSorting: getPreferredSorting(column)
				};
			}

			if (OverviewModel.LinkColumn.Reference.isAssignableFrom(column)) {
				const path = buildRelationshipField(column, documentModel, modelGraph?.relationshipModels, subDocumentModels);

				if (path) {
					return { path, preferredSorting: getPreferredSorting(column) };
				}
			}

			return undefined;
		},
		[documentModel, modelGraph?.relationshipModels, subDocumentModels]
	);

	const onColumnClick = React.useCallback(
		(columnIndex: number) => {
			loaderRef.current?.resetLoadMoreRowsCache(true);
			listRef.current?.scrollToPosition(0);

			if (mergeEngineHandlers.onColumnClick) {
				mergeEngineHandlers.onColumnClick(columnIndex);

				return;
			}

			const content = overviewModel?.content;

			if (!content) {
				return;
			}

			const column = content.columns[columnIndex];
			const descriptor = resolveSortDescriptor(column);

			if (!descriptor) {
				return;
			}

			const next = computeNextSorting({
				descriptor,
				isInitial: !uiStateWithoutDefault?.sorting && content.configuration.initialSorting?.[0]?.idref === column.id,
				currentSorting: uiStateWithoutDefault?.sorting?.[0]
			});

			mergeEngineHandlers.onSort?.({ sorting: next ? [next] : [] });
		},
		[
			listRef,
			loaderRef,
			mergeEngineHandlers,
			overviewModel?.content,
			resolveSortDescriptor,
			uiStateWithoutDefault?.sorting
		]
	);

	return isExcludeMode ? undefined : onColumnClick;
}

function useOnEventButtonClick(params: {
	activityId: string;
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
}): Required<OverviewEngineApi.EventHandlers>["onEventButtonClick"] {
	const { activityId, mergeEngineHandlers } = params;
	const bapDispatch = useDispatch();

	return React.useCallback(
		(event, button) => {
			if (event === "export_excel") {
				const engineAction = Events.onExport({});
				bapDispatch(OverviewEngineActions.event({ activityId, engineAction }));
			} else {
				mergeEngineHandlers.onEventButtonClick?.(event, button);
			}
		},
		[activityId, bapDispatch, mergeEngineHandlers]
	);
}

function useOnRowClick(params: {
	data: (JSONDocument | undefined)[];
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
	rowStyling: RowStyleGetter<JSONDocument> | undefined;
}): Required<OverviewEngineApi.EventHandlers>["onRowClick"] {
	const { data, mergeEngineHandlers, rowStyling } = params;

	return React.useCallback(
		(params) => {
			const { documentId, linkId, customEvent } = params;
			let document: JSONDocument | undefined;
			const documentIndex = data.findIndex((d) => d?.id === documentId && d?.linkId === linkId);

			if (documentIndex > -1) {
				document = data[documentIndex];
			}

			if (document === undefined) {
				const optionalLinkMessage = linkId ? ` and linkId ${linkId}` : "";
				throw new Error(`Could not find document with id ${documentId}${optionalLinkMessage}.`);
			}

			if (rowStyling?.({ row: document, rowIndex: documentIndex }).interactive) {
				mergeEngineHandlers.onRowClick?.({ documentId: document.id, linkId, customEvent });
			}
		},
		[data, mergeEngineHandlers, rowStyling]
	);
}

function useOnRowButtonClick(params: {
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
}): Required<OverviewEngineApi.EventHandlers>["onRowButtonClick"] {
	const { mergeEngineHandlers } = params;

	return React.useCallback(
		({ documentId, linkId, rowActionModel }) => {
			mergeEngineHandlers.onRowButtonClick?.({ documentId, linkId, rowActionModel });
		},
		[mergeEngineHandlers]
	);
}

function useOnSearchEnumeratedStringField(params: {
	activityId: string;
	mergeEngineHandlers: OverviewEngineApi.EventHandlers;
}): Required<OverviewEngineApi.EventHandlers>["onSearchEnumeratedStringField"] {
	const { activityId, mergeEngineHandlers } = params;
	const bapDispatch = useDispatch();

	return React.useCallback(
		(params) => {
			const { fieldPath, keyword = "", nextPage = false, modelId } = params;

			if (mergeEngineHandlers.onSearchEnumeratedStringField) {
				mergeEngineHandlers.onSearchEnumeratedStringField({ fieldPath, keyword, nextPage, modelId });

				return;
			}

			bapDispatch(
				OverviewEngineActions.enumeratedStringQueryParametersChanged({
					activityId,
					modelId,
					fieldPath,
					keyword,
					nextPage
				})
			);
		},
		[activityId, bapDispatch, mergeEngineHandlers]
	);
}
