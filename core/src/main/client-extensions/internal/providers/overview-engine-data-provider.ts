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

import { type SagaIterator } from "redux-saga";
import { put, call, select, type SagaGenerator } from "typed-redux-saga";

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { Query, Dispatcher } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { setThumbnails } from "@com.mgmtp.a12.client/client-core/lib/core/activity/a12-internal/thumbnails/action.js";
import {
	Model,
	Activity,
	StoreSagas,
	type Selector,
	ModelSelectors,
	LocaleSelectors,
	ActivityActions,
	ReferencedModel,
	type DataProvider,
	ActivitySelectors,
	NotificationActions,
	extractModelsInScenePayload
} from "@com.mgmtp.a12.client/client-core";

import { isCdm } from "../utils/cdm-utils.js";
import { OverviewActivity } from "../activity.js";
import { OverviewEngineActions } from "../actions.js";
import { OverviewEngineSelectors } from "../selectors.js";
import { type OverviewEngineApi } from "../../../view/api.js";
import { RequestValidator } from "../utils/request-validator.js";
import { AggregationResolver } from "../utils/aggregation-resolver.js";
import { triggerFileDownload } from "../utils/trigger-file-download.js";
import { InfiniteScrollUtils } from "../utils/infinite-scroll-utils.js";
import { collectFieldsProjection } from "../utils/fields-projection.js";
import { FieldBasedFiltering } from "../utils/field-based-filtering.js";
import { RESOURCE_KEYS, LocalizableFactory } from "../../../services/index.js";
import { Commands, type Sorting, SortingOrder, type ModelsState } from "../../../store/index.js";
import { type RequestSelectorMap, DefaultRequestSelectorMap } from "../utils/request-selector-map.js";
import { DataOperation, maybeAsyncFnWrapper, type OverviewEngineDataLoader } from "../data-loader/data-loader.js";

import { type DataProvidersConfig } from "./types.js";

/** @internal */
export class OverviewEngineDataProvider implements DataProvider {
	private operationCounter = 0;
	public name = "OverviewEngineDataProvider";
	private documentService = new DocumentServiceFactory().getDocumentService();
	private requestSelectorMap: RequestSelectorMap;

	constructor(
		private dataLoader: OverviewEngineDataLoader,
		private config?: DataProvidersConfig
	) {
		this.requestSelectorMap = config?.requestSelectorMap ?? DefaultRequestSelectorMap;
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

	*provideData(config: DataProvider.ProvideDataConfig): SagaIterator<void> {
		if (config.operation === "load") {
			if ("exporting" in config.details && config.details.exporting === true) {
				yield* call(this.exportData.bind(this), config);
			} else {
				yield* call(this.loadData.bind(this), config);
			}
		}

		if (config.operation === "delete") {
			yield* call(this.deleteData.bind(this), config);
		}
	}

	protected *loadData(config: DataProvider.LoadConfig): SagaGenerator<void> {
		const { activityId } = config;
		const modelsState = yield* call(getModels, activityId);
		const { documentModel, overviewModel } = modelsState;
		const queryId = `${this.name}-${this.operationCounter++}`;

		const uiState = yield* select(OverviewEngineSelectors.uiState(activityId));

		// prevents unnecessary network request on infinite scroll initialization
		if (uiState.scrolling?.pageNumbers.length === 0) {
			yield* put(ActivityActions.setData({ activityId, data: { documents: [], totalDocumentsCount: undefined } }));

			if (
				this.config?.infiniteScroll?.pageSize &&
				this.config?.infiniteScroll?.pageSize !== uiState.scrolling.pageSize
			) {
				yield* put(
					OverviewEngineActions.command({
						activityId,
						engineAction: Commands.setQueryParameters({
							...uiState,
							scrolling: { ...uiState.scrolling, pageSize: this.config.infiniteScroll.pageSize }
						})
					})
				);
			}

			return;
		} else if (uiState.scrolling?.visibleEnd === 0) {
			yield* put(ActivityActions.setData({ activityId, data: { documents: [], totalDocumentsCount: undefined } }));
		}

		const { searchString: fulltext = "", pagination, scrolling, sorting, activeFilters } = uiState;

		let paging: DataOperation.ListDocuments.Paging;

		if (scrolling) {
			paging = { pageNumbers: scrolling.pageNumbers, pageSize: scrolling.pageSize };
		} else if (pagination) {
			paging = { pageNumbers: [pagination.pageNumber], pageSize: pagination.pageSize };
		} else {
			throw new Error("Neither pagination nor infinite scrolling data provided!");
		}

		const locale = yield* select(LocaleSelectors.locale());

		// CDM does not support fields projection
		const fields = isCdm(documentModel) ? undefined : collectFieldsProjection(overviewModel, documentModel);

		const { aggregation, resolveSummaryResult } = AggregationResolver.create(queryId, overviewModel, documentModel);

		const query: DataOperation.ListDocuments.Query = {
			id: queryId,
			type: "LIST_DOCUMENTS",
			paging,
			sort: computeListDocumentsQueryOrders(modelsState, sorting),
			constraint: computeListDocumentsConstraints(modelsState, locale, activeFilters, fulltext),
			fields,
			aggregation
		};

		let result: DataOperation.ResultSet;

		try {
			result = yield* call(maybeAsyncFnWrapper(this.dataLoader.provideData), {
				activityId,
				documentModel,
				overviewModel,
				documentService: this.documentService,
				requestSelectorMap: this.requestSelectorMap,
				queries: [query]
			});
		} catch (error) {
			if (error instanceof RequestValidator.RequestLimitExceededError) {
				// Show notification
				yield* put(
					NotificationActions.add({
						activityId,
						severity: "error",
						title: LocalizableFactory.createResourceLocalizable(
							RESOURCE_KEYS.overviewEngine.error.requestLimitExceeded.title
						),
						message: LocalizableFactory.createResourceLocalizable(
							RESOURCE_KEYS.overviewEngine.error.requestLimitExceeded.message,
							{
								maxRequests: { type: "plain", value: String(error.maxRequests) }
							}
						)
					})
				);

				// Reset loading state while preserving existing data
				const existingData = yield* select(
					ActivitySelectors.activityPropById(activityId, (a) => Activity.findDefaultDataHolder(a)?.data)
				);

				if (existingData) {
					yield* put(ActivityActions.setData({ activityId, data: existingData }));
				}

				return;
			}

			throw error;
		}

		const [queryResult] = result.queryResults;

		if (!DataOperation.ListDocuments.Result.isAssignableFrom(queryResult)) {
			throw new Error(`Expect a result from query results`);
		}

		if (!scrolling) {
			yield* put(
				ActivityActions.setData({
					activityId,
					data: {
						documents: queryResult.documents,
						totalDocumentsCount: queryResult.fullSize,
						summaryResult: resolveSummaryResult(queryResult.aggregationResult)
					}
				})
			);
		} else {
			const defaultDataHolder = yield* select(
				ActivitySelectors.activityPropById(activityId, Activity.findDefaultDataHolder)
			);

			if (!OverviewActivity.Data.DocumentListData.isInstance(defaultDataHolder?.data)) {
				throw new Error(`No default DataHolder found for activityId ${activityId}`);
			}

			yield* put(
				ActivityActions.setData({
					activityId,
					data: {
						documents: InfiniteScrollUtils.mergeDocuments({
							scrolling,
							documents: queryResult.documents,
							fullSize: queryResult.fullSize,
							existingDocuments: defaultDataHolder.data.documents ?? [],
							cachePages: this.config?.infiniteScroll?.cachePages
						}),
						totalDocumentsCount: queryResult.fullSize,
						summaryResult: resolveSummaryResult(queryResult.aggregationResult)
					}
				})
			);
		}

		if (queryResult.thumbnails) {
			yield* put(setThumbnails({ activityId, thumbnails: queryResult.thumbnails }));
		}
	}

	protected *exportData(config: DataProvider.LoadConfig): SagaGenerator<void> {
		const { activityId } = config;
		const modelsState = yield* call(getModels, config.activityId);
		const { documentModel, overviewModel } = modelsState;
		const {
			searchString: fulltext = "",
			activeFilters,
			sorting
		} = yield* select(OverviewEngineSelectors.uiState(activityId));

		const locale = yield* select(LocaleSelectors.locale());

		try {
			const query: DataOperation.Export.Query = {
				id: "export",
				type: "EXPORT",
				sort: computeListDocumentsQueryOrders(modelsState, sorting),
				constraint: computeListDocumentsConstraints(modelsState, locale, activeFilters, fulltext)
			};

			const result = yield* call(maybeAsyncFnWrapper(this.dataLoader.provideData), {
				activityId,
				documentModel,
				overviewModel,
				documentService: this.documentService,
				requestSelectorMap: this.requestSelectorMap,
				queries: [query]
			});

			const [queryResult] = result.queryResults;

			if (!DataOperation.Export.Result.isAssignableFrom(queryResult)) {
				throw new Error(`Expect a result from query results`);
			}

			triggerFileDownload(queryResult.location);
		} finally {
			const data = yield* select(
				ActivitySelectors.activityPropById(activityId, (a) => Activity.findDefaultDataHolder(a)?.data)
			);

			if (data) {
				yield* put(ActivityActions.setData({ activityId, data }));
			}
		}
	}

	protected *deleteData(config: DataProvider.DeleteConfig, dataHolder?: Activity.DataHolder): SagaGenerator<void> {
		const { activityId, details } = config;
		const { instanceId } = details;
		const { overviewModel, documentModel } = yield* call(getModels, activityId);
		const state = yield* select();
		const locale = yield* select(LocaleSelectors.locale());
		const { rowState = {} } = yield* select(OverviewEngineSelectors.uiState(activityId));

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
}

/** @internal */
export function computeListDocumentsQueryOrders(modelsState: ModelsState, sorting?: Sorting[]): Query.Order[] {
	if (!sorting?.length) {
		if (modelsState.queryModel?.content.sort?.length) {
			return modelsState.queryModel?.content.sort;
		}

		return [
			{
				field: "/__meta/createdAt",
				direction: Query.Direction.DESC,
				nullHandling: Query.NullHandling.NULLS_LAST,
				ignoreCase: false
			}
		];
	}

	return sorting.map((sorting) => {
		return {
			field: sorting.path,
			direction: sorting.order === SortingOrder.ASC ? Query.Direction.ASC : Query.Direction.DESC,
			nullHandling: Query.NullHandling.NULLS_LAST,
			ignoreCase: true
		};
	});
}

/** @internal */
export function computeListDocumentsConstraints(
	modelsState: ModelsState,
	locale: Locale,
	activeFilters?: OverviewEngineApi.FilterMap,
	fulltext?: string
): Query.Operator | undefined {
	const operators: (Query.Operator[] | undefined)[] = [
		modelsState.queryModel?.content.constraint ? [modelsState.queryModel.content.constraint] : undefined,
		activeFilters ? FieldBasedFiltering.toOperators(activeFilters, modelsState, locale) : undefined,
		fulltext && fulltext !== "" ? [{ operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR, value: fulltext }] : undefined
	];

	const nonNullOperators = operators.filter((op): op is Query.Operator[] => Array.isArray(op) && op.length > 0).flat();

	if (nonNullOperators.length === 0) {
		return undefined;
	}

	if (nonNullOperators.length === 1) {
		return nonNullOperators[0];
	}

	return {
		operator: Query.OPERATORS.AND_OPERATOR,
		operands: nonNullOperators
	};
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

export function createNotFoundError(modelType: string, modelName?: string): Model.Error {
	return {
		type: "NOT_FOUND",
		message: `Cannot find ${modelType} model${modelName ? ` "${modelName}"` : ""} from scene.`
	};
}

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
