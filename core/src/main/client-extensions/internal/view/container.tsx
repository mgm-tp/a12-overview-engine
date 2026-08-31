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
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { List, InfiniteLoader } from "react-virtualized";

import { Activity, type View, ViewViews, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import type { RowStyleGetter } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../../models/index.js";
import type { OverviewModel } from "../../../overview-model.js";
import { Commands, type UiState, UiStateSelector } from "../../../store/index.js";
import { OverviewEngine } from "../../../view/overview-engine.js";
import { resolveRowActivation } from "../../../view/utils.js";
import { OverviewEngineActions } from "../actions.js";
import { OverviewActivity } from "../activity.js";
import { OverviewEngineSelectors } from "../selectors.js";

import { useModels, useSelectedRow, useEventHandlers, useInfiniteScrollOptions } from "./hooks/index.js";

export namespace OverviewEngineContainer {
	export type OmitProps =
		| "documentModel"
		| "overviewModel"
		| "modelGraph"
		| "data"
		| "links"
		| "totalDocumentsCount"
		| "summaryResult"
		| "uiState";

	export interface Props extends View, Omit<OverviewEngine.Props, OmitProps> {
		readonly data?: OverviewEngine.Props["data"];
		readonly links?: OverviewEngine.Props["links"];
		readonly threshold?: number;
		readonly minimumBatchSize?: number;
		// Embedded mode support
		readonly overviewModelName?: string;
		// Embedded mode support, Overview Engine will instead access data from this data holder instead
		readonly dataHolderDescriptor?: Activity.DataHolderDescriptor;
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

		const findDataHolder = React.useCallback(
			(activity: Activity): Activity.DataHolder | undefined => {
				if (props.dataHolderDescriptor) {
					return activity.dataHolders.find(Activity.DataHolder.hasDescriptor(props.dataHolderDescriptor));
				}

				return Activity.findDefaultDataHolder(activity);
			},
			[props.dataHolderDescriptor]
		);

		const thumbnailsSelector = React.useMemo(() => {
			return ActivitySelectors.activityPropById(
				activityId,
				(activity) => findDataHolder(activity)?.slices["thumbnails"]
			);
		}, [activityId, findDataHolder]);
		const thumbnails = useSelector(thumbnailsSelector);

		const dataHolderDataSelector = React.useMemo(() => {
			return ActivitySelectors.activityPropById(activityId, (activity) => findDataHolder(activity)?.data);
		}, [activityId, findDataHolder]);
		const dataHolderData = useSelector(dataHolderDataSelector);

		const documentListData: OverviewActivity.Data.DocumentListData = React.useMemo(() => {
			return OverviewActivity.Data.DocumentListData.isInstance(dataHolderData)
				? dataHolderData
				: { documents: [], totalDocumentsCount: 0 };
		}, [dataHolderData]);

		const { totalDocumentsCount, summaryResult } = documentListData;
		const data = props.data ?? documentListData.documents;
		const links = props.links ?? documentListData.links;
		const selectedRow = useSelectedRow({ activityId, data });

		const { documentModel, overviewModel, modelGraph, subDocumentModels } = useModels({
			activityId,
			overviewModelName: props.overviewModelName
		});

		const uiState = useSelector(
			OverviewEngineSelectors.uiState(activityId, {
				filterStateSelectors: props.filterStateSelectors,
				descriptor: props.dataHolderDescriptor,
				overviewModelName: props.overviewModelName
			})
		);

		const uiStateSliceSelector = React.useMemo(() => {
			return ActivitySelectors.activityPropById(activityId, (activity) => findDataHolder(activity)?.slices["uiState"]);
		}, [activityId, findDataHolder]);
		const uiStateSlice = useSelector(uiStateSliceSelector) as UiState | undefined;
		const dispatch = useDispatch();

		useEffect(() => {
			if (uiState.newFilter && !uiStateSlice?.newFilter) {
				dispatch(
					OverviewEngineActions.command({
						activityId,
						dataHolderDescriptor: props.dataHolderDescriptor,
						overviewModelName: props.overviewModelName,
						engineAction: Commands.setFilterState({ state: uiState.newFilter })
					})
				);
			}
		}, [
			activityId,
			dispatch,
			props.dataHolderDescriptor,
			props.overviewModelName,
			uiState.newFilter,
			uiStateSlice?.newFilter
		]);

		const loaderRef = React.useRef<InfiniteLoader | null>(null);
		const setLoaderRef: React.RefCallback<InfiniteLoader | null> = React.useCallback((ref) => {
			loaderRef.current = ref;
		}, []);

		const listRef = React.useRef<List | null>(null);
		const setListRef: React.RefCallback<List | null> = React.useCallback((ref) => {
			listRef.current = ref;
		}, []);

		const { nonInteractive: isNonInteractive } = resolveRowActivation(
			overviewModel?.content ?? ({} as OverviewModel.Content)
		);

		const multiSelectRowClickActive =
			isNonInteractive &&
			UiStateSelector.isMultiSelectRowClickActive(overviewModel?.content.configuration.multiSelection)(
				uiStateSlice ?? ({} as UiState)
			);

		const rowStyling: RowStyleGetter<JSONDocument> = React.useMemo(() => {
			return ({ row, rowIndex }) => {
				return { interactive: !isNonInteractive || multiSelectRowClickActive, ...rowStylingProp?.({ row, rowIndex }) };
			};
		}, [rowStylingProp, isNonInteractive, multiSelectRowClickActive]);

		const eventHandlers = useEventHandlers({
			activityId,
			uiState,
			data,
			eventHandlerProps,
			loaderRef,
			listRef,
			rowStyling,
			dataHolderDescriptor: props.dataHolderDescriptor,
			overviewModelName: props.overviewModelName
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
			return scrolling ? { data, infiniteScrollOptions, links } : { data: data as JSONDocument[], links };
		}, [data, infiniteScrollOptions, scrolling, links]);

		if (pagination && totalDocumentsCount === undefined) {
			throw new Error("Total number of documents must be set when using pagination");
		}

		if (!documentModel || !overviewModel || !modelGraph) {
			return null;
		}

		return (
			<OverviewEngineElement
				key={activityId}
				summaryResult={summaryResult}
				cardView={false}
				activeRowId={selectedRow}
				documentModel={documentModel}
				overviewModel={overviewModel}
				subDocumentModels={subDocumentModels}
				modelGraph={modelGraph}
				uiState={uiState}
				totalDocumentsCount={totalDocumentsCount}
				thumbnails={thumbnails}
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
