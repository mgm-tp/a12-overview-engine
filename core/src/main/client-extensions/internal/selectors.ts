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

import { QueryModel } from "@com.mgmtp.a12.querymodel/querymodel-core";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { Model, Activity, type Selector, ModelSelectors, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { OverviewEngineApi } from "../../view/api.js";
import { isOverviewModel } from "../../models/index.js";
import { OverviewModel } from "../../overview-model.js";
import { type UiState, type ModelsState } from "../../store/index.js";
import { OverviewEngineInternalConstants } from "../../shared/constants.js";

import { createSelector } from "./utils.js";
import { EnumeratedStringDataHolder } from "./data-holder.js";
import { getSorting, SLICE_NAME, getScrolling, getPagination } from "./state.js";

export namespace OverviewEngineSelectors {
	export function uiState(activityId: string): Selector<UiState> {
		return (state) => uiStateReselect(state, activityId);
	}

	const uiStateReselect = createSelector(
		[
			(state: object, activityId: string) => uiStateWithoutDefaults(activityId)(state),
			(state: object, activityId: string) => enumeratedStringFilterMapReselect(state, activityId),
			(state: object, activityId: string) => modelsState(activityId)(state)
		],
		(uiStateSlice, enumeratedStringFilterMap, modelsState) => {
			if (!modelsState) {
				return OverviewEngineInternalConstants.DEFAULT_UI_STATE;
			}

			const { overviewModel, documentModel } = modelsState;

			const { multiSelection } = overviewModel.content.configuration;
			const expandedMultiSelection =
				uiStateSlice?.expandedMultiSelection === undefined
					? multiSelection?.collapseOption === OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED ||
						multiSelection?.collapseOption === OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
					: uiStateSlice.expandedMultiSelection;

			const scrolling = getScrolling(overviewModel);
			const sorting = getSorting(overviewModel, documentModel);

			return {
				...uiStateSlice,
				pagination: uiStateSlice?.pagination ?? (scrolling ? undefined : getPagination(overviewModel)),
				scrolling: uiStateSlice?.scrolling ?? scrolling,
				sorting: uiStateSlice?.sorting ?? sorting,
				expandedMultiSelection,
				activeFilters: uiStateSlice?.activeFilters ?? OverviewEngineInternalConstants.NO_ACTIVE_FILTER,
				enumeratedStringFilterMap
			};
		}
	);

	export function uiStateWithoutDefaults(activityId: string): Selector<UiState | undefined> {
		return (state: object) =>
			ActivitySelectors.activityPropById(
				activityId,
				(activity) => Activity.findDefaultDataHolder(activity)?.slices[SLICE_NAME]
			)(state);
	}

	export function enumeratedStringFilterMap(
		activityId: string
	): Selector<OverviewEngineApi.EnumeratedStringFilterMap | undefined> {
		return (state) => enumeratedStringFilterMapReselect(state, activityId);
	}

	const enumeratedStringFilterMapReselect = createSelector(
		[
			(state: object, activityId: string) =>
				ActivitySelectors.activityPropById(activityId, (activity) =>
					activity.dataHolders.filter(EnumeratedStringDataHolder.isInstance)
				)(state),
			(state: object, activityId: string) =>
				uiStateWithoutDefaults(activityId)(state)?.activeFilters ?? OverviewEngineInternalConstants.NO_ACTIVE_FILTER
		],
		(
			enumeratedStringDataHolders: Activity.DataHolder<EnumeratedStringDataHolder.Data>[] | undefined,
			activeFilters: OverviewEngineApi.FilterMap | undefined
		) => {
			return enumeratedStringDataHolders?.reduce<OverviewEngineApi.EnumeratedStringFilterMap>(
				(filterMap, dataHolder) => {
					const { data } = dataHolder;

					if (!data) {
						return filterMap;
					}

					const { fieldPath, candidates } = data;

					const currentFilter = activeFilters?.[fieldPath];
					let activeCandidates: string[] = [];

					if (
						currentFilter &&
						OverviewEngineApi.Filter.EnumerationOptions.isInstance(currentFilter) &&
						OverviewEngineApi.Filter.EnumeratedStringOptions.isInstance(currentFilter)
					) {
						activeCandidates = currentFilter.criteria?.selectedValues ?? [];
					}

					const nonActiveCandidates = candidates.filter((candidate) => !activeCandidates.includes(candidate));

					return {
						...filterMap,
						[data.fieldPath]: {
							...data,
							candidates: [...activeCandidates, ...nonActiveCandidates],
							loading: dataHolder.loadingState !== "loaded"
						}
					};
				},
				{}
			);
		}
	);

	/** @experimental */
	export function modelsState(activityId: string): Selector<ModelsState | undefined> {
		return (state) => modelsStateReselect(state, activityId);
	}

	const modelsStateReselect = createSelector(
		[
			(state: object, activityId: string) =>
				ModelSelectors.modelInScene({ activityId, modelType: "overview" }, isOverviewModel)(state),
			(state: object) => ModelSelectors.models()(state)
		],
		(overviewModel, models) => {
			if (!overviewModel) {
				return undefined;
			}

			const queryModelName = overviewModel.header.modelReferences?.find(
				({ modelType, purpose }) => modelType === "query" && purpose === "query-model-for-overview"
			)?.reference;

			const queryModel = queryModelName ? models[queryModelName] : undefined;

			if (queryModel && !QueryModel.isInstance(queryModel)) {
				return undefined;
			}

			let documentModel: unknown | undefined;

			if (queryModel) {
				const documentModelName = queryModel.header.modelReferences?.find(
					({ modelType, purpose }) => modelType === "document" && purpose === "document-model-for-query"
				)?.reference;
				documentModel = documentModelName ? models[documentModelName] : undefined;
			} else {
				const documentModelName = overviewModel.header.modelReferences?.find(
					({ modelType, purpose }) => modelType === "document" && purpose === "document-model-for-overview"
				)?.reference;
				documentModel = documentModelName ? models[documentModelName] : undefined;
			}

			if (!Model.isDocumentModel(documentModel)) {
				return undefined;
			}

			const subDocumentModelNames = overviewModel.header.modelReferences
				?.filter(({ modelType, purpose }) => modelType === "document" && purpose === "sub-document-model-for-overview")
				.map(({ reference }) => reference);

			const subDocumentModels = subDocumentModelNames
				?.map((documentModelName) => {
					const documentModel = models[documentModelName];

					if (!Model.isDocumentModel(documentModel)) {
						return undefined;
					}

					return documentModel;
				})
				.filter((nullableDocumentModel): nullableDocumentModel is DocumentModel => !!nullableDocumentModel);

			if (subDocumentModelNames?.length !== subDocumentModels?.length) {
				return undefined;
			}

			return { overviewModel, queryModel, documentModel, subDocumentModels };
		}
	);
}
