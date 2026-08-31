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

import { put, call, select, type SagaGenerator } from "typed-redux-saga";

import {
	Model,
	StoreSagas,
	type Activity,
	type Selector,
	ModelSelectors,
	ActivityActions,
	LocaleSelectors,
	ReferencedModel,
	type DataProvider,
	extractModelsInScenePayload
} from "@com.mgmtp.a12.client/client-core";
import { setThumbnails } from "@com.mgmtp.a12.client/client-core/a12internal";
import {
	Query,
	Dispatcher,
	isRelationshipModel,
	type SupportedRequest,
	type QueryJsonRpc2Response
} from "@com.mgmtp.a12.dataservices/dataservices-access";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";

import { Links } from "../../../models/index.js";
import { DefaultFilterStateSelectors } from "../../../store/index.js";
import type { FilterState, FilterStateSelectors } from "../../../store/index.js";
import { Commands, type Sorting, SortingOrder, type ModelsState } from "../../../store/index.js";
import type { OverviewEngineApi } from "../../../view/api.js";
import { OverviewEngineActions } from "../actions.js";
import { OverviewActivity } from "../activity.js";
import { DataOperation, maybeAsyncFnWrapper, type OverviewEngineDataLoader } from "../data-loader/data-loader.js";
import { OverviewEngineSelectors } from "../selectors.js";
import { AggregationResolver } from "../utils/aggregation-resolver.js";
import { isCdm } from "../utils/cdm-utils.js";
import { FieldBasedFiltering } from "../utils/field-based-filtering.js";
import { getProjectedLinks, getProjectedFields } from "../utils/fields-projection.js";
import { InfiniteScrollUtils } from "../utils/infinite-scroll-utils.js";
import { NewFieldBasedFiltering } from "../utils/new-field-based-filtering.js";
import { toQueryRelationshipOrder } from "../utils/relationship-sort-utils.js";
import { type RequestSelectorMap, DefaultRequestSelectorMap } from "../utils/request-selector-map.js";
import { triggerFileDownload } from "../utils/trigger-file-download.js";

import { executeQueryPlan as executeQueryPlanFn } from "./execute-plan.js";
import type { UpdatedDataHolder, QueryExecutionPlan } from "./query-execution-plan.js";
import type { DataProvidersConfig } from "./types.js";

/** @experimental */
export class OverviewEngineDataProvider implements DataProvider {
	private operationCounter = 0;
	public name = "OverviewEngineDataProvider";
	private documentService = new DocumentServiceFactory().getDocumentService();
	private readonly requestSelectorMap: RequestSelectorMap;
	private readonly filterStateSelectors: FilterStateSelectors;

	constructor(
		protected dataLoader: OverviewEngineDataLoader,
		protected config?: DataProvidersConfig
	) {
		this.requestSelectorMap = config?.requestSelectorMap ?? DefaultRequestSelectorMap;
		this.filterStateSelectors = config?.filterStateSelectors ?? DefaultFilterStateSelectors;
	}

	canHandle({ action }: DataProvider.CanHandleConfig): boolean {
		const { modelsInScene } = extractModelsInScenePayload(action) ?? {};

		if (!modelsInScene) {
			return false;
		}

		return modelsInScene.some(
			(refModel) =>
				refModel.direct &&
				(ReferencedModel.isLoaded(refModel)
					? refModel.model.header.modelType
					: ReferencedModel.isNotLoaded(refModel)
						? refModel.model.modelType
						: undefined) === "overview"
		);
	}

	*provideData(config: DataProvider.ProvideDataConfig): SagaGenerator<void> {
		const { dataHolders } = config;

		for (const dataHolder of dataHolders) {
			if (config.operation === "load") {
				if ("exporting" in config.details && config.details.exporting === true) {
					yield* call(this.exportData.bind(this), config, dataHolder);
				} else {
					yield* call(this.loadData.bind(this), config, dataHolder);
				}
			}

			if (config.operation === "delete") {
				yield* call(this.deleteData.bind(this), config, dataHolder);
			}
		}
	}

	protected *loadData(config: DataProvider.LoadConfig, dataHolder: Activity.DataHolder): SagaGenerator<void> {
		const plans: QueryExecutionPlan[] = [yield* call([this, this.createExecutionPlan], config, dataHolder)];

		const updates = yield* call([this, this.executeQueryPlan], config.activityId, plans);

		yield* call([this, this.applyUpdates], config.activityId, updates);
	}

	protected *createExecutionPlan(
		config: DataProvider.LoadConfig,
		dataHolder: Activity.DataHolder
	): SagaGenerator<QueryExecutionPlan> {
		const { activityId } = config;
		const descriptor = dataHolder.descriptor;

		const modelsState = yield* call(this.getModels.bind(this), activityId, dataHolder);
		const { documentModel, overviewModel, subDocumentModels } = modelsState;

		const uiState = yield* select(
			OverviewEngineSelectors.uiState(activityId, {
				descriptor: dataHolder.descriptor,
				overviewModelName: overviewModel.header.id,
				filterStateSelectors: this.filterStateSelectors
			})
		);

		if (overviewModel.content.configuration.skipInitialLoad && !uiState.dataLoadTriggered) {
			return {
				id: `${this.name}-${this.operationCounter++}`,
				dataHolder,
				requests: [],
				applyResponse: function* () /* eslint-disable-line require-yield */ {
					return [{ descriptor, data: { documents: [], totalDocumentsCount: 0 } }];
				}
			};
		}

		if (uiState.scrolling?.pageNumbers.length === 0) {
			const scrolling = uiState.scrolling;
			const configPageSize = this.config?.infiniteScroll?.pageSize;

			return {
				id: `${this.name}-${this.operationCounter++}`,
				dataHolder,
				requests: [],
				applyResponse: function* () {
					if (configPageSize && configPageSize !== scrolling.pageSize) {
						yield* put(
							OverviewEngineActions.command({
								activityId,
								engineAction: Commands.setQueryParameters({
									...uiState,
									scrolling: { ...scrolling, pageSize: configPageSize }
								})
							})
						);
					}

					return [{ descriptor, data: { documents: [], totalDocumentsCount: undefined } }];
				}
			};
		}

		const queryId = `${this.name}-${this.operationCounter++}`;
		const { searchString: fulltext = "", pagination, scrolling, sorting, activeFilters, newFilter } = uiState;

		let paging: DataOperation.ListDocuments.Paging;

		if (scrolling) {
			paging = { pageNumbers: scrolling.pageNumbers, pageSize: scrolling.pageSize };
		} else if (pagination) {
			paging = { pageNumbers: [pagination.pageNumber], pageSize: pagination.pageSize };
		} else {
			throw new Error("Neither pagination nor infinite scrolling data provided!");
		}

		const models = yield* select(ModelSelectors.allLoadedModelsInScene(activityId));
		const relationshipModels = models?.filter(isRelationshipModel);

		const fields = isCdm(documentModel)
			? undefined
			: getProjectedFields(overviewModel, documentModel, modelsState.queryModel);

		const { aggregation, resolveSummaryResult } = AggregationResolver.create(queryId, overviewModel, documentModel);
		const projectedLinks =
			modelsState.queryModel && relationshipModels
				? getProjectedLinks(overviewModel, documentModel, subDocumentModels, relationshipModels, modelsState.queryModel)
				: undefined;

		const query: DataOperation.ListDocuments.Query = {
			id: queryId,
			type: "LIST_DOCUMENTS",
			paging,
			sort: computeListDocumentsQueryOrders(modelsState, sorting),
			constraint: computeListDocumentsConstraints(
				modelsState,
				this.filterStateSelectors,
				activeFilters,
				newFilter,
				fulltext
			),
			fields,
			aggregation,
			links: projectedLinks,
			exclude: modelsState.queryModel?.content.exclude,
			targetDocumentModel: modelsState.queryModel?.content.targetDocumentModel
		};

		const requests: SupportedRequest[] = yield* call(
			maybeAsyncFnWrapper(this.dataLoader.buildRequests.bind(this.dataLoader)),
			{
				activityId,
				dataHolderDescriptor: descriptor,
				queries: [query],
				documentService: this.documentService,
				documentModel,
				subDocumentModels,
				overviewModel,
				requestSelectorMap: this.requestSelectorMap
			}
		);

		const documentService = this.documentService;
		const cachePages = this.config?.infiniteScroll?.cachePages;
		const dataLoader = this.dataLoader;

		return {
			id: queryId,
			dataHolder,
			requests,
			applyResponse: function* (responses, context) {
				const responsesByQueryId: ReadonlyMap<string, QueryJsonRpc2Response> = new Map(
					requests.map((r, i) => [String(r.id), responses[i]])
				);

				const resultSet: DataOperation.ResultSet = yield* call(
					maybeAsyncFnWrapper(dataLoader.handleResponses.bind(dataLoader)),
					{
						activityId,
						dataHolderDescriptor: descriptor,
						queries: [query],
						responsesByQueryId,
						thumbnails: context.thumbnails ?? {},
						documentService,
						documentModel,
						subDocumentModels,
						overviewModel
					}
				);

				const queryResult = resultSet.queryResults.find(DataOperation.ListDocuments.Result.isAssignableFrom);

				if (!queryResult) {
					throw new Error(`No LIST_DOCUMENTS result for query ${queryId}`);
				}

				const summaryResult = resolveSummaryResult(queryResult.aggregationResult);
				const thumbnails = context.thumbnails;

				if (!scrolling) {
					return [
						{
							descriptor,
							data: {
								links: queryResult.links,
								documents: queryResult.documents,
								totalDocumentsCount: queryResult.fullSize,
								summaryResult
							} satisfies OverviewActivity.Data.DocumentListData,
							thumbnails
						}
					];
				}

				if (!OverviewActivity.Data.DocumentListData.isInstance(dataHolder.data)) {
					throw new Error(`No default DataHolder found for activityId ${activityId}`);
				}

				const existingData = dataHolder.data;
				const mergedDocuments = InfiniteScrollUtils.mergeDocuments({
					scrolling,
					documents: queryResult.documents,
					fullSize: queryResult.fullSize,
					existingDocuments: existingData.documents ?? [],
					cachePages
				});

				const activeDocRefs = new Set(mergedDocuments.flatMap((doc) => (doc ? [doc.id] : [])));

				return [
					{
						descriptor,
						data: {
							documents: mergedDocuments,
							links: InfiniteScrollUtils.mergeLink(
								queryResult.links ?? Links.create(),
								activeDocRefs
							)(existingData.links),
							totalDocumentsCount: queryResult.fullSize,
							summaryResult
						} satisfies OverviewActivity.Data.DocumentListData,
						thumbnails
					}
				];
			}
		};
	}

	protected *executeQueryPlan(
		activityId: string,
		plans: ReadonlyArray<QueryExecutionPlan>
	): SagaGenerator<UpdatedDataHolder[]> {
		return yield* call(executeQueryPlanFn, activityId, plans);
	}

	protected *applyUpdates(activityId: string, updates: UpdatedDataHolder[]): SagaGenerator<void> {
		for (const { data, thumbnails } of updates) {
			if (data !== undefined) {
				yield* put(ActivityActions.setData({ activityId, data }));
			}

			if (thumbnails !== undefined) {
				yield* put(setThumbnails({ activityId, thumbnails }));
			}
		}
	}

	protected *exportData(config: DataProvider.LoadConfig, dataHolder?: Activity.DataHolder): SagaGenerator<void> {
		const { activityId } = config;
		const modelsState = yield* call(this.getModels.bind(this), config.activityId, dataHolder);
		const { documentModel, overviewModel, subDocumentModels } = modelsState;
		const {
			searchString: fulltext = "",
			activeFilters,
			sorting,
			newFilter
		} = yield* select(
			OverviewEngineSelectors.uiState(activityId, {
				descriptor: dataHolder?.descriptor,
				overviewModelName: overviewModel.header.id,
				filterStateSelectors: this.filterStateSelectors
			})
		);

		try {
			const query: DataOperation.Export.Query = {
				id: "export",
				type: "EXPORT",
				sort: computeListDocumentsQueryOrders(modelsState, sorting),
				constraint: computeListDocumentsConstraints(
					modelsState,
					this.filterStateSelectors,
					activeFilters,
					newFilter,
					fulltext
				)
			};

			const buildParams = {
				activityId,
				dataHolderDescriptor: dataHolder?.descriptor,
				documentModel,
				overviewModel,
				subDocumentModels,
				documentService: this.documentService,
				requestSelectorMap: this.requestSelectorMap,
				queries: [query]
			};

			const requests: SupportedRequest[] = yield* call(
				maybeAsyncFnWrapper(this.dataLoader.buildRequests.bind(this.dataLoader)),
				buildParams
			);

			const { language } = yield* select(LocaleSelectors.locale());
			const responses = yield* call(() => Dispatcher.rpc(language, requests));
			const responsesByQueryId: ReadonlyMap<string, QueryJsonRpc2Response> = new Map(
				requests.map((r, i) => [String(r.id), (responses as QueryJsonRpc2Response[])[i]])
			);

			const result = yield* call(maybeAsyncFnWrapper(this.dataLoader.handleResponses.bind(this.dataLoader)), {
				activityId,
				dataHolderDescriptor: dataHolder?.descriptor,
				documentModel,
				overviewModel,
				subDocumentModels,
				documentService: this.documentService,
				queries: [query],
				responsesByQueryId,
				thumbnails: {}
			});

			const queryResult = result.queryResults.find(DataOperation.Export.Result.isAssignableFrom);

			if (!queryResult) {
				throw new Error(`Expect an EXPORT result from query results`);
			}

			triggerFileDownload(queryResult.location);
		} finally {
			const data = dataHolder?.data;

			if (data) {
				yield* put(ActivityActions.setData({ activityId, data }));
			}
		}
	}

	protected *deleteData(config: DataProvider.DeleteConfig, dataHolder?: Activity.DataHolder): SagaGenerator<void> {
		const locale = yield* select(LocaleSelectors.locale());
		const { activityId, details } = config;
		const { instanceId } = details;
		const { rowState = {} } = yield* select(OverviewEngineSelectors.uiState(activityId));
		const { documentModel, overviewModel } = yield* call(this.getModels.bind(this), config.activityId, dataHolder);
		const state = yield* select();

		if (instanceId === "" && "deletedDocumentIds" in details) {
			const { deletedDocumentIds } = details;

			if (areDocumentIds(deletedDocumentIds)) {
				yield* call(() =>
					Dispatcher.rpc(locale.language, [
						this.requestSelectorMap.deleteMultiDocuments({
							activityId,
							documentModel,
							overviewModel,
							docRefs: deletedDocumentIds
						})(state)
					])
				);

				yield* call(updateRowState, { activityId, rowState, deletedDocumentIds: deletedDocumentIds });
			}
		}

		if (instanceId !== "") {
			yield* call(() =>
				Dispatcher.rpc(locale.language, [
					this.requestSelectorMap.deleteDocument({
						activityId,
						documentModel,
						overviewModel,
						docRef: instanceId
					})(state)
				])
			);
			yield* call(updateRowState, { activityId, rowState, deletedDocumentIds: [instanceId] });
		}

		yield* put(ActivityActions.reloadData({ activityId }));
	}

	protected *getModels(activityId: string, _dataHolder?: Activity.DataHolder): SagaGenerator<ModelsState> {
		return yield* call(getModels, activityId);
	}
}

/** @internal */
export function computeListDocumentsQueryOrders(modelsState: ModelsState, sorting?: Sorting[]): Query.Order[] {
	const isExcludeMode = !!modelsState.queryModel?.content.exclude;

	if (isExcludeMode) {
		return [];
	}

	const querySort = modelsState.queryModel?.content.sort;
	const fallback: Query.Order[] = querySort?.length
		? querySort
		: [
				{
					field: "/__meta/createdAt",
					direction: Query.Direction.DESC,
					nullHandling: Query.NullHandling.NULLS_LAST,
					ignoreCase: false
				}
			];

	if (!sorting?.length) {
		return fallback;
	}

	return sorting.map((s) => {
		const direction = s.order === SortingOrder.ASC ? Query.Direction.ASC : Query.Direction.DESC;
		const fieldOrder = {
			direction,
			nullHandling: Query.NullHandling.NULLS_LAST,
			ignoreCase: true
		};

		if (typeof s.path === "string") {
			return { field: s.path, ...fieldOrder };
		}

		return toQueryRelationshipOrder(s.path, fieldOrder);
	});
}

/** @internal */
export function computeListDocumentsConstraints(
	modelsState: ModelsState,
	selectors: FilterStateSelectors,
	activeFilters?: OverviewEngineApi.FilterMap,
	newFilterState?: FilterState,
	fulltext?: string
): Query.Operator | undefined {
	return QueryBuilder.and(
		modelsState.queryModel?.content.constraint,
		...FieldBasedFiltering.toOperators(activeFilters ?? {}, modelsState),
		newFilterState ? NewFieldBasedFiltering.toOperator(newFilterState, modelsState, selectors) : undefined,
		QueryBuilder.simpleSearch(fulltext)
	).build();
}

/** @internal */
export function* getModels(activityId: string): SagaGenerator<ModelsState> {
	const models = yield* call(() => StoreSagas.waitForStateChange(modelsLoaded(activityId)));

	if (models === undefined || Array.isArray(models)) {
		const errMessage = models?.map(({ message }) => message).join("\n") ?? "Cannot load necessary models.";

		throw new Error(errMessage);
	}

	return models;
}

const modelsLoaded: (activityId: string) => Selector<{
	stateChanged: boolean;
	returnValue: ModelsState | Model.Error[] | undefined;
}> = (activityId) => (state) => {
	const models = ModelSelectors.allLoadedModelsInScene(activityId)(state);

	if (!models) {
		return { stateChanged: false, returnValue: undefined };
	}

	const errors = models.filter(Model.Error.isInstance);

	if (errors.length > 0) {
		return { stateChanged: true, returnValue: errors };
	}

	const modelsState = OverviewEngineSelectors.modelsState(activityId)(state);

	if (!modelsState) {
		return { stateChanged: false, returnValue: undefined };
	}

	return { stateChanged: true, returnValue: modelsState };
};

function areDocumentIds(documentIds: unknown): documentIds is string[] {
	return Array.isArray(documentIds) && documentIds.every((item) => typeof item === "string");
}

function* updateRowState(params: {
	activityId: string;
	rowState: OverviewEngineApi.RowState;
	deletedDocumentIds: string[];
}) {
	const { activityId, rowState, deletedDocumentIds } = params;
	const nextRowState = Object.fromEntries(
		Object.entries(rowState).filter(([documentId]) => !deletedDocumentIds.includes(documentId))
	);

	yield* put(
		OverviewEngineActions.command({
			activityId,
			engineAction: Commands.setRowState({ rowState: nextRowState })
		})
	);
}
