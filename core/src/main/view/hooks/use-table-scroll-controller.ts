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

import { type BaseTableProps, type TableScrollToNodeHandler } from "@com.mgmtp.a12.widgets/widgets-core";

import { type JSONDocument } from "../../models/index.js";
import { UiStateSelector, type ScrollToRowRequest } from "../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

type ScrollRegistrar = NonNullable<BaseTableProps<JSONDocument>["scrollToNode"]>;

/** @internal */
export function useTableScrollController(): ScrollRegistrar {
	const data = useOverviewEngineContext((context) => context.data) as ReadonlyArray<JSONDocument | undefined>;
	const onScrollHandled = useOverviewEngineContext((context) => context.eventHandlers.onScrollToRowHandled);
	const scrollRequest = useOverviewEngineState(UiStateSelector.scrollToRow());

	const handlerRef = React.useRef<TableScrollToNodeHandler | null>(null);

	const documentIndexMapRef = React.useRef<Map<string, number>>(new Map());
	React.useEffect(() => {
		const map = new Map<string, number>();
		data.forEach((row, index) => {
			if (row?.id) {
				map.set(row.id, index);
			}
		});
		documentIndexMapRef.current = map;
	}, [data]);

	const resolveTargetIndex = React.useCallback(
		(request: ScrollToRowRequest): number | undefined => {
			if (typeof request.rowIndex === "number" && request.rowIndex >= 0 && request.rowIndex < data.length) {
				return request.rowIndex;
			}

			if (request.docRef) {
				const index = documentIndexMapRef.current.get(request.docRef);

				if (typeof index === "number") {
					return index;
				}
			}

			return undefined;
		},
		[data.length]
	);

	const tryHandleScroll = React.useCallback(
		(request?: ScrollToRowRequest) => {
			if (!request) {
				return;
			}

			const targetIndex = resolveTargetIndex(request);

			if (targetIndex === undefined) {
				return;
			}

			handlerRef.current?.(targetIndex, { autoFocus: request.autoFocus });
			onScrollHandled?.();
		},
		[onScrollHandled, resolveTargetIndex]
	);

	React.useEffect(() => {
		tryHandleScroll(scrollRequest);
	}, [scrollRequest, tryHandleScroll]);

	const registerScrollHandler = React.useCallback<ScrollRegistrar>(
		(handler) => {
			handlerRef.current = handler;
			tryHandleScroll(scrollRequest);
		},
		[scrollRequest, tryHandleScroll]
	);

	return registerScrollHandler;
}
