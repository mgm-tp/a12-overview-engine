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
import type { List, InfiniteLoader, OverscanIndexRange } from "react-virtualized";

import type { Activity } from "@com.mgmtp.a12.client/client-core";
import type { RowLoadingStatus } from "@com.mgmtp.a12.widgets/widgets-core";

import type { UiState, Scrolling } from "../../../../store/index.js";
import type { OverviewEngineApi } from "../../../../view/api.js";

interface OverscanRange {
	visibleStart: number;
	visibleEnd: number;
}

/** @internal */
export function useInfiniteScrollOptions(params: {
	uiState: UiState;
	data: (Activity.Data.Document | undefined)[];
	setLoaderRef: React.RefCallback<InfiniteLoader | null>;
	setListRef: React.RefCallback<List | null>;
	totalDocumentsCount: number | undefined;
	minimumBatchSize: number | undefined;
	threshold: number | undefined;
	onInfiniteScroll?(params: { scrolling: Scrolling }): void;
}): OverviewEngineApi.InfiniteScrollOptions {
	const {
		onInfiniteScroll,
		setLoaderRef,
		setListRef,
		minimumBatchSize,
		threshold,
		uiState,
		data,
		totalDocumentsCount
	} = params;

	const overscanRange = React.useRef<OverscanRange>({
		visibleStart: 0,
		visibleEnd: 0
	});

	const loadMoreRows = React.useCallback(
		(pageNumbers: number[]) => {
			if (!uiState.scrolling) {
				throw new Error("uiState.scrolling should always be defined");
			}

			onInfiniteScroll?.({
				scrolling: { ...uiState.scrolling, pageNumbers, ...overscanRange.current }
			});
		},
		[onInfiniteScroll, uiState.scrolling]
	);

	const loadMoreRowsDebounced = React.useMemo(() => {
		return debounce((pageNumbers: number[]) => loadMoreRows(pageNumbers), 300);
	}, [loadMoreRows]);

	const onLoadMoreRows = React.useCallback(
		({ startPage, endPage }): Promise<void> => {
			// start from `startPage` and `endPage` is inclusive
			const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
			loadMoreRowsDebounced(pageNumbers);

			return Promise.resolve();
		},
		[loadMoreRowsDebounced]
	) satisfies OverviewEngineApi.InfiniteScrollOptions["loadData"];

	const getRowLoadingStatus = React.useCallback(
		(rowIndex: number): RowLoadingStatus => {
			return data[rowIndex] !== undefined ? "loaded" : undefined;
		},
		[data]
	);

	const onRowsRendered = React.useCallback(
		({ overscanStartIndex, overscanStopIndex }: OverscanIndexRange) => {
			overscanRange.current = {
				visibleStart: overscanStartIndex,
				visibleEnd: overscanStopIndex
			};
		},
		[overscanRange]
	);

	return React.useMemo(() => {
		return {
			loadData: onLoadMoreRows,
			rowLoadingStatus: getRowLoadingStatus,
			rowCount: totalDocumentsCount,
			loaderRef: setLoaderRef,
			overrideListProps: {
				listRef: setListRef,
				onRowsRendered
			},
			minimumBatchSize,
			threshold
		};
	}, [
		getRowLoadingStatus,
		minimumBatchSize,
		onLoadMoreRows,
		onRowsRendered,
		setListRef,
		setLoaderRef,
		threshold,
		totalDocumentsCount
	]);
}

/*
 * ===== BEGIN THIRD-PARTY SOURCE: [ts-debounce] (https://github.com/chodorowicz/ts-debounce),
 * https://github.com/chodorowicz/ts-debounce/blob/v1.0.0/src/index.ts
 * Licensed under the MIT License.
 * Copyright (c) 2017 Jakub Chodorowicz
 * Modified by mgm technology partners on [2024-08-22].
 */

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function debounce<F extends Function>(
	func: F,
	waitMilliseconds = 50,
	options: { isImmediate: boolean } = {
		isImmediate: false
	}
): F {
	let timeoutId: number | undefined;

	return function (this: any, ...args: any[]) {
		// eslint-disable-next-line typescript/no-this-alias
		const context = this;

		const doLater = () => {
			timeoutId = undefined;

			if (!options.isImmediate) {
				func.apply(context, args);
			}
		};

		const shouldCallNow = options.isImmediate && timeoutId === undefined;

		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}

		timeoutId = window.setTimeout(doLater, waitMilliseconds);

		if (shouldCallNow) {
			func.apply(context, args);
		}
	} as any;
}

// ===== END THIRD-PARTY SOURCE =====
