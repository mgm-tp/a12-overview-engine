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

import { weakMapMemoize } from "reselect";

import {
	Model,
	Activity,
	type ModelMap,
	type Selector,
	ModelSelectors,
	ActivitySelectors
} from "@com.mgmtp.a12.client/client-core";
import { isRelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { isQueryModel } from "@com.mgmtp.a12.querymodel/querymodel-core";
import type { QueryModel } from "@com.mgmtp.a12.querymodel/querymodel-core";

import { isOverviewModel } from "../../models/index.js";
import { OverviewModel } from "../../overview-model.js";
import { OverviewEngineInternalConstants } from "../../shared/constants.js";
import {
	type UiState,
	UiStateSelector,
	type FilterState,
	type ModelsState,
	FilterStateBuilder,
	type FilterStateSelectors,
	DefaultFilterStateSelectors
} from "../../store/index.js";
import { OverviewEngineApi } from "../../view/api.js";

import { EnumeratedStringDataHolder } from "./data-holder.js";
import { SLICE_NAME, getSorting, getScrolling, getPagination } from "./state.js";
import { createSelector } from "./utils.js";
import { removeLinkReferencesForExcludeMode } from "./utils/link-column-utils.js";

export namespace OverviewEngineSelectors {
	export function uiState(
		activityId: string,
		options?: {
			filterStateSelectors?: FilterStateSelectors;
			descriptor?: Activity.DataHolderDescriptor;
			overviewModelName?: string;
		}
	): Selector<UiState> {
		return (state) =>
			uiStateReselect(
				state,
				activityId,
				options?.descriptor,
				options?.overviewModelName,
				options?.filterStateSelectors
			);
	}

	const uiStateReselect = createSelector(
		[
			(state: object, activityId: string, descriptor?: Activity.DataHolderDescriptor) =>
				uiStateWithoutDefaults(activityId, descriptor)(state),
			(state: object, activityId: string, descriptor?: Activity.DataHolderDescriptor) =>
				enumeratedStringFilterMapReselect(state, activityId, descriptor),
			(state: object, activityId: string, _?: unknown, overviewModelName?: string) =>
				modelsState(activityId, overviewModelName)(state),
			(_state: object, _activityId: string, _?: unknown, __?: unknown, selectors?: FilterStateSelectors) =>
				selectors ?? DefaultFilterStateSelectors
		],
		(uiStateSlice, enumeratedStringFilterMap, modelsState, selectors) => {
			if (!modelsState) {
				return OverviewEngineInternalConstants.DEFAULT_UI_STATE;
			}

			const { overviewModel, documentModel, subDocumentModels = [] } = modelsState;

			const { multiSelection } = overviewModel.content.configuration;
			const expandedMultiSelection =
				uiStateSlice?.expandedMultiSelection === undefined
					? multiSelection?.collapseOption === OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED ||
						multiSelection?.collapseOption === OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
					: uiStateSlice.expandedMultiSelection;

			const scrolling = getScrolling(overviewModel);

			return {
				...uiStateSlice,
				pagination: uiStateSlice?.pagination ?? (scrolling ? undefined : getPagination(overviewModel)),
				scrolling: uiStateSlice?.scrolling ?? scrolling,
				sorting: uiStateSlice?.sorting ?? getSorting(modelsState),
				expandedMultiSelection,
				activeFilters: uiStateSlice?.activeFilters ?? OverviewEngineInternalConstants.NO_ACTIVE_FILTER,
				enumeratedStringFilterMap,
				newFilter:
					uiStateSlice?.newFilter ?? defaultNewFilterState(overviewModel, documentModel, subDocumentModels, selectors)
			} satisfies UiState;
		}
	);

	/**
	 * Initial NewFilter state derived from model configuration. Memoized by model identity
	 * because A12 models are immutable per engine instance — host must produce a new model
	 * object to refresh.
	 */
	const defaultNewFilterState = weakMapMemoize(
		(
			overviewModel: OverviewModel,
			documentModel: DocumentModel,
			subDocumentModels: DocumentModel[],
			selectors: FilterStateSelectors
		): FilterState | undefined => {
			const newFilter = new FilterStateBuilder(overviewModel, documentModel, subDocumentModels, selectors).build();

			return newFilter
				? { ...newFilter, snapshot: UiStateSelector.NewFilter.filtersSnapshot(selectors)({ newFilter }) }
				: undefined;
		}
	);

	export function uiStateWithoutDefaults(
		activityId: string,
		descriptor?: Activity.DataHolderDescriptor
	): Selector<UiState | undefined> {
		return ActivitySelectors.activityPropById(activityId, (activity) => {
			let dataHolder = Activity.findDefaultDataHolder(activity);

			if (descriptor) {
				dataHolder = activity.dataHolders.find(Activity.DataHolder.hasDescriptor(descriptor));
			}

			return dataHolder?.slices[SLICE_NAME];
		});
	}

	export function enumeratedStringFilterMap(
		activityId: string
	): Selector<OverviewEngineApi.EnumeratedStringFilterMap | undefined> {
		return (state) => enumeratedStringFilterMapReselect(state, activityId);
	}

	const enumeratedStringFilterMapReselect = createSelector(
		[
			(state: object, activityId: string, _descriptor?: Activity.DataHolderDescriptor) =>
				ActivitySelectors.activityPropById(activityId, (activity) =>
					activity.dataHolders.filter(EnumeratedStringDataHolder.isInstance)
				)(state),
			(state: object, activityId: string, descriptor?: Activity.DataHolderDescriptor) =>
				uiStateWithoutDefaults(activityId, descriptor)(state)?.activeFilters ??
				OverviewEngineInternalConstants.NO_ACTIVE_FILTER
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
	export function modelsState(activityId: string, overviewModelName?: string): Selector<ModelsState | undefined> {
		return (state) => modelsStateReselect(state, activityId, overviewModelName);
	}

	const overviewModelReselect = createSelector(
		[
			(state: object, activityId: string) =>
				ModelSelectors.modelInScene({ activityId, modelType: "overview" }, isOverviewModel)(state),
			(state: object, activityId: string, overrideOverviewModelName?: string) =>
				overrideOverviewModelName
					? ModelSelectors.modelByName(overrideOverviewModelName, isOverviewModel)(state)
					: undefined
		],
		(overviewModel, overrideOverviewModel) => overrideOverviewModel ?? overviewModel
	);

	const modelsStateReselect = createSelector(
		[
			(state: object, activityId: string, overrideOverviewModelName?: string) =>
				overviewModelReselect(state, activityId, overrideOverviewModelName),
			(state: object) => ModelSelectors.models()(state),
			(state: object) => ModelSelectors.modelGraph()(state)
		],
		(overviewModel, models, modelGraph) => {
			if (!overviewModel || !overviewModel.header.modelReferences) {
				return undefined;
			}

			const queryModelName = overviewModel.header.modelReferences.find(
				({ modelType, purpose }) => modelType === "query" && purpose === "query-model-for-overview"
			)?.reference;

			const queryModel = queryModelName ? models[queryModelName] : undefined;

			if (queryModel && !isQueryModel(queryModel)) {
				return undefined;
			}

			let documentModel: ModelMap[string];

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

			const { subDocumentModels, displayDocumentModel } = resolveRelatedDocumentModels(
				models,
				overviewModel,
				queryModel,
				documentModel
			);

			const finalDocumentModel = displayDocumentModel ?? documentModel;

			const firstLink = queryModel?.content.links?.[0];
			const isExcludeMode = !!queryModel?.content.exclude;
			const cleanedOverviewModel =
				isExcludeMode && firstLink
					? removeLinkReferencesForExcludeMode(overviewModel, {
							relationship: firstLink.relationshipModel,
							targetRole: firstLink.targetRole
						})
					: overviewModel;

			return {
				overviewModel: cleanedOverviewModel,
				queryModel,
				documentModel: finalDocumentModel,
				subDocumentModels: subDocumentModels?.filter((model) => model.header.id !== finalDocumentModel.header.id),
				modelGraph
			};
		}
	);

	function resolveRelatedDocumentModels(
		models: ModelMap,
		overviewModel: OverviewModel,
		queryModel: QueryModel | undefined,
		documentModel: DocumentModel
	): { subDocumentModels?: DocumentModel[]; displayDocumentModel?: DocumentModel } {
		const seen = new Set<string>();
		const subDocumentModels: DocumentModel[] = [];
		let displayDocumentModel: DocumentModel | undefined;

		const addSubDocument = (id: string, model: DocumentModel): void => {
			if (!seen.has(id)) {
				seen.add(id);
				subDocumentModels.push(model);
			}
		};

		// Collect sub-document models declared in the overview model
		for (const { modelType, purpose, reference } of overviewModel.header.modelReferences ?? []) {
			if (modelType === "document" && purpose === "sub-document-model-for-overview") {
				const model = models[reference];

				if (Model.isDocumentModel(model)) {
					addSubDocument(reference, model);
				}
			}
		}

		if (!queryModel) {
			return { subDocumentModels: subDocumentModels.length > 0 ? subDocumentModels : undefined };
		}

		const excludedRelationship = queryModel.content.exclude
			? queryModel.content.links?.[0]?.relationshipModel
			: undefined;
		const excludedLinkTargetRole = queryModel.content.exclude ? queryModel.content.links?.[0]?.targetRole : undefined;

		// The document ID to exclude from subDocumentModels
		// Initially the primary document; swapped to the display document once resolved
		let excludedDocumentId = documentModel.header.id;

		// Collect sub-document models from query relationships and resolve displayDocumentModel
		for (const { modelType, purpose, reference } of queryModel.header.modelReferences ?? []) {
			if (modelType !== "relationship" || purpose !== "relationship-model-for-query") {
				continue;
			}

			const relationshipModel = models[reference];

			if (!isRelationshipModel(relationshipModel)) {
				continue;
			}

			const { entityCharacteristics, linkDocumentModel } = relationshipModel.content;

			for (const { documentModel, role } of entityCharacteristics) {
				if (!documentModel || documentModel === excludedDocumentId) {
					continue;
				}

				const model = models[documentModel];

				if (!Model.isDocumentModel(model)) {
					continue;
				}

				// For exclude mode, only set displayDocumentModel for the entity characteristic
				// whose role matches the link's targetRole. Without this guard the last entity
				// characteristic unconditionally overwrites, which is wrong when the relationship
				// has roles in an order that puts the non-target role last (e.g. ProductBundle:
				// [Product→Product-document, Bundle→Bundle-document] with targetRole="Product"
				// would end up with Bundle-document instead of Product-document).
				if (excludedRelationship === reference && role === excludedLinkTargetRole) {
					displayDocumentModel = model;
					excludedDocumentId = documentModel;
					continue;
				}

				addSubDocument(documentModel, model);
			}

			if (linkDocumentModel && Model.isDocumentModel(models[linkDocumentModel])) {
				addSubDocument(linkDocumentModel, models[linkDocumentModel]);
			}
		}

		return { subDocumentModels: subDocumentModels.length > 0 ? subDocumentModels : undefined, displayDocumentModel };
	}
}
