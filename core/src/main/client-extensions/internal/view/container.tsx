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
import { useSelector } from "react-redux";
import type { List, InfiniteLoader } from "react-virtualized";

import { type RowStyleGetter } from "@com.mgmtp.a12.widgets/widgets-core";
import { Activity, type View, ViewViews, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { OverviewActivity } from "../activity.js";
import { OverviewEngineSelectors } from "../selectors.js";
import { type JSONDocument } from "../../../models/index.js";
import { OverviewEngine } from "../../../view/overview-engine.js";

import { useModels, useSelectedRow, useEventHandlers, useInfiniteScrollOptions } from "./hooks/index.js";

export namespace OverviewEngineContainer {
	export type OmitProps =
		| "documentModel"
		| "overviewModel"
		| "data"
		| "totalDocumentsCount"
		| "summaryResult"
		| "uiState";

	export interface Props extends View, Omit<OverviewEngine.Props, OmitProps> {
		readonly threshold?: number;
		readonly minimumBatchSize?: number;
	}
}

/** @internal */
export const OverviewEngineContainer: React.FC<OverviewEngineContainer.Props> = React.memo(
	function OverviewEngineContainer(props) {
		const {
			activityId,
			eventHandlers: eventHandlerProps,
			minimumBatchSize,
			threshold,
			rowStyling: rowStylingProp
		} = props;

		const loadingState = useSelector(
			ActivitySelectors.activityPropById(
				activityId,
				(activity) => Activity.findDefaultDataHolder(activity)?.loadingState
			)
		);
		const thumbnailsSelector = React.useMemo(() => {
			return ActivitySelectors.activityPropById(
				activityId,
				(activity) => Activity.findDefaultDataHolder(activity)?.slices["thumbnails"]
			);
		}, [activityId]);
		const thumbnails = useSelector(thumbnailsSelector);

		const defaultDataHolderDataSelector = React.useMemo(() => {
			return ActivitySelectors.activityPropById(
				activityId,
				(activity) => Activity.findDefaultDataHolder(activity)?.data
			);
		}, [activityId]);
		const defaultDataHolderData = useSelector(defaultDataHolderDataSelector);

		const documentListData: OverviewActivity.Data.DocumentListData = React.useMemo(() => {
			return OverviewActivity.Data.DocumentListData.isInstance(defaultDataHolderData)
				? defaultDataHolderData
				: { documents: [], totalDocumentsCount: 0 };
		}, [defaultDataHolderData]);

		const { documents: data, totalDocumentsCount, summaryResult } = documentListData;
		const selectedRow = useSelectedRow({ activityId, data });

		const { documentModel, overviewModel, subDocumentModels } = useModels({ activityId });

		const uiStateSelector = React.useMemo(() => OverviewEngineSelectors.uiState(activityId), [activityId]);
		const uiState = useSelector(uiStateSelector);

		const loaderRef = React.useRef<InfiniteLoader | null>(null);
		const setLoaderRef: React.RefCallback<InfiniteLoader | null> = React.useCallback((ref) => {
			loaderRef.current = ref;
		}, []);

		const listRef = React.useRef<List | null>(null);
		const setListRef: React.RefCallback<List | null> = React.useCallback((ref) => {
			listRef.current = ref;
		}, []);

		const rowStyling: RowStyleGetter<JSONDocument> = React.useMemo(() => {
			return ({ row, rowIndex }) => {
				return { interactive: true, ...rowStylingProp?.({ row, rowIndex }) };
			};
		}, [rowStylingProp]);

		const eventHandlers = useEventHandlers({
			activityId,
			uiState,
			data,
			eventHandlerProps,
			loaderRef,
			listRef,
			rowStyling
		});

		const infiniteScrollOptions = useInfiniteScrollOptions({
			uiState,
			data,
			totalDocumentsCount,
			setLoaderRef,
			setListRef,
			minimumBatchSize,
			threshold,
			onInfiniteScroll: eventHandlers.onInfiniteScroll
		});

		const { pagination, scrolling } = uiState;

		const dataProps = React.useMemo(() => {
			return scrolling ? { data, infiniteScrollOptions } : { data: data as Activity.Data.Document[] };
		}, [data, infiniteScrollOptions, scrolling]);

		if (pagination && totalDocumentsCount === undefined) {
			throw new Error("Total number of documents must be set when using pagination");
		}

		if (!documentModel || !overviewModel) {
			return null;
		}

		return (
			<OverviewEngineElement
				summaryResult={summaryResult}
				cardView={false}
				activeRowId={selectedRow}
				documentModel={documentModel}
				subDocumentModels={subDocumentModels}
				overviewModel={overviewModel}
				uiState={uiState}
				totalDocumentsCount={totalDocumentsCount}
				thumbnails={thumbnails}
				loadingState={loadingState}
				{...props}
				{...dataProps}
				eventHandlers={eventHandlers}
				rowStyling={rowStyling}
			/>
		);
	}
);

type OverviewEngineElementProps = OverviewEngine.Props & Pick<View, "activityId" | "ProgressComponent">;

const OverviewEngineElement: React.FC<OverviewEngineElementProps> = React.memo(function OverviewEngineElement(props) {
	const { activityId, ProgressComponent, ...overviewEngineProps } = props;
	const activityContextValue = React.useMemo(() => {
		return { activityId };
	}, [activityId]);

	const OverviewEngineElement = (
		<ViewViews.ActivityContext.Provider value={activityContextValue}>
			<OverviewEngine {...overviewEngineProps} />
		</ViewViews.ActivityContext.Provider>
	);

	return ProgressComponent && !props.uiState?.scrolling ? (
		<ProgressComponent activityId={activityId}>{OverviewEngineElement}</ProgressComponent>
	) : (
		OverviewEngineElement
	);
});
