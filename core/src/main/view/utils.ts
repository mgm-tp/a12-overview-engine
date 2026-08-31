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

import { getAllFocusableElements } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../models/index.js";
import { OverviewModel } from "../overview-model.js";
import { UiStateSelector } from "../store/index.js";

import type { OverviewEngineApi } from "./api.js";
import {
	useOverviewEngineState,
	useOverviewEngineContext,
	OverviewEngineContextType
} from "./context/overview-engine-context.js";

/** @internal */
export function focusNextElement(currentElement: HTMLElement, containerElement: HTMLElement): void {
	const elements = getAllFocusableElements(containerElement);

	if (elements && elements.length > 0) {
		let index = -1;
		elements.forEach((item, id) => {
			if (item === currentElement) {
				index = id;
			}
		});

		if (index !== -1) {
			if (index + 1 < elements.length) {
				elements[index + 1].focus();
			} else {
				elements[0].focus();
			}
		}
	}
}

/** @internal */
export function useIdGenerator() {
	const modelId = useOverviewEngineContext((context) => context.overviewModel.header.id);
	const uiIdPrefix = useOverviewEngineContext((context) => context.uiIdPrefix);

	return React.useCallback(
		(params: { id: string; suffix?: string }) => {
			return [uiIdPrefix, modelId, params.id, params.suffix].filter(Boolean).join("-");
		},
		[modelId, uiIdPrefix]
	);
}

/** @internal */
export function useRowCount() {
	const pagination = usePagination();
	const dataLoadTriggered = useOverviewEngineState(UiStateSelector.dataLoadTriggered());

	return useOverviewEngineContext((context) => {
		if (context.overviewModel.content.configuration.skipInitialLoad && !dataLoadTriggered) {
			return undefined;
		}

		return context.overviewModel.content.configuration.enableInfiniteScroll &&
			OverviewEngineContextType.InfiniteScroll.isInstance(context)
			? context.infiniteScrollOptions.rowCount
			: pagination?.rowCount;
	});
}

/** @internal */
export function usePagination(): OverviewEngineApi.Pagination | undefined {
	const pagination = useOverviewEngineState(UiStateSelector.pagination());
	const totalDocumentsCount = useOverviewEngineContext((context) => context.totalDocumentsCount);

	return React.useMemo(() => {
		if (pagination) {
			const { pageCount } = pagination;

			// Support the deprecated pagination property from OverviewEngine.PaginatedProps interface
			// pageCount is an optional property in UiState Pagination interface but required in OverviewEngineApi.Pagination
			if (pageCount) {
				return { ...pagination, pageCount };
			}

			if (totalDocumentsCount) {
				return {
					...pagination,
					rowCount: totalDocumentsCount,
					pageCount: Math.ceil(totalDocumentsCount / pagination.pageSize)
				};
			}
		}

		return undefined;
	}, [pagination, totalDocumentsCount]);
}

/** @internal */
export function useShouldAllowSearch() {
	return useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.showFullTextSearch && context.eventHandlers.onSearch
	);
}

/** @internal */
export function isPageable(obj: OverviewEngineApi.Pagination) {
	return obj.pageSize > 0 && obj.pageCount > 1;
}

/** @internal */
export function nullFistComparator<T>(a: T, b: T): number {
	if (a === null && b !== null) {
		return -1;
	}

	if (a !== null && b === null) {
		return 1;
	}

	return 0;
}

/** @internal */
export function toConditionalArray<T>(condition: boolean, ...elements: T[]): T[] {
	return condition ? elements : [];
}

/** @internal */
export function toCellId(row: JSONDocument, columnId: string): string {
	return row.linkId ? `${row.id}_${row.linkId}_${columnId}` : `${row.id}_${columnId}`;
}

/** @internal */
export function resolveRowActivation(content: OverviewModel.Content): {
	nonInteractive: boolean;
	customEvent: string | undefined;
} {
	const { rowActivation } = content;
	const nonInteractive = rowActivation
		? OverviewModel.NonInteractiveRowActivation.isAssignableFrom(rowActivation)
		: false;
	const customEvent =
		rowActivation && OverviewModel.EventRowActivation.isAssignableFrom(rowActivation) ? rowActivation.event : undefined;

	return { nonInteractive, customEvent };
}

/**
 * Resolves the effective row state entry for a row, preferring the linkId-specific entry when available.
 * @internal
 */
export function pickRowState(
	rowState: OverviewEngineApi.RowState | undefined,
	row: Pick<JSONDocument, "id" | "linkId">
): OverviewEngineApi.RowState[string] | undefined {
	const entry = rowState?.[row.id];

	if (row.linkId && entry?.byLink?.[row.linkId]) {
		return entry.byLink[row.linkId];
	}

	return entry;
}
