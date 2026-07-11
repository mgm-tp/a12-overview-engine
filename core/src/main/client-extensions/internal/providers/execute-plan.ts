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

import { LocaleSelectors, NotificationActions } from "@com.mgmtp.a12.client/client-core";
import { convertThumbnailResponse } from "@com.mgmtp.a12.client/client-core/a12internal";
import {
	Dispatcher,
	type SupportedRequest,
	LoadThumbnailUrlsJsonRpc2,
	type QueryJsonRpc2Response
} from "@com.mgmtp.a12.dataservices/dataservices-access";

import { RequestBuilder } from "../utils/request-builder.js";
import { RequestValidator } from "../utils/request-validator.js";
import { getMaxRequests } from "../data-loader/default-data-loader.js";
import { RESOURCE_KEYS, LocalizableFactory } from "../../../services/index.js";

import type { PlanApplyContext, UpdatedDataHolder, QueryExecutionPlan } from "./query-execution-plan.js";

/** @experimental */
export function* executeQueryPlan(
	activityId: string,
	plans: ReadonlyArray<QueryExecutionPlan>
): SagaGenerator<UpdatedDataHolder[]> {
	if (plans.length === 0) {
		return [];
	}

	const updates: UpdatedDataHolder[] = [];
	const errors: unknown[] = [];

	const { language } = yield* select(LocaleSelectors.locale());
	const maxRequests = yield* call(getMaxRequests);

	const { allRequests, ranges } = buildBatchedRequests(plans);

	if (allRequests.length === 0) {
		for (const plan of plans) {
			const planUpdates = yield* call([plan, plan.applyResponse], [], {});
			updates.push(...planUpdates);
		}

		return updates;
	}

	// Append shared thumbnail request last
	const thumbIndex = allRequests.length;
	allRequests.push(RequestBuilder.loadThumbnailURLs());

	if (maxRequests !== undefined) {
		RequestValidator.assertValidRequestCount(allRequests, maxRequests);
	}

	try {
		const responses = yield* call(() => Dispatcher.rpc(language, allRequests));

		const thumbnailsResponse = responses[thumbIndex];

		if (!LoadThumbnailUrlsJsonRpc2.Response.isInstance(thumbnailsResponse)) {
			throw new Error("Invalid thumbnail URLs response");
		}

		const thumbnails = convertThumbnailResponse(thumbnailsResponse);
		const context: PlanApplyContext = { thumbnails };

		const result = yield* applyResponses(plans, responses as QueryJsonRpc2Response[], ranges, context);
		updates.push(...result.updates);
		errors.push(...result.errors);
	} catch (error) {
		errors.push(error);

		for (const plan of plans) {
			if (plan.dataHolder.data !== undefined) {
				updates.push({ descriptor: plan.dataHolder.descriptor, data: plan.dataHolder.data });
			}
		}
	}

	for (const error of errors) {
		// eslint-disable-next-line no-console
		console.error(error);

		if (error instanceof RequestValidator.RequestLimitExceededError) {
			yield* put(
				NotificationActions.add({
					activityId,
					severity: "error",
					title: LocalizableFactory.createResourceLocalizable(
						RESOURCE_KEYS.overviewEngine.error.requestLimitExceeded.title
					),
					message: LocalizableFactory.createResourceLocalizable(
						RESOURCE_KEYS.overviewEngine.error.requestLimitExceeded.message,
						{ maxRequests: { type: "plain", value: String(error.maxRequests) } }
					)
				})
			);
		} else {
			yield* put(
				NotificationActions.add({
					activityId,
					severity: "error",
					title: LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.overviewEngine.error.serverError.title),
					message: LocalizableFactory.createResourceLocalizable(
						RESOURCE_KEYS.overviewEngine.error.serverError.message,
						{
							message: { type: "plain", value: error instanceof Error ? error.message : String(error) }
						}
					)
				})
			);
		}
	}

	return updates;
}

function buildBatchedRequests(executionPlans: ReadonlyArray<QueryExecutionPlan>): {
	allRequests: SupportedRequest[];
	ranges: Array<{ start: number; end: number }>;
} {
	const allRequests: SupportedRequest[] = [];
	const ranges: Array<{ start: number; end: number }> = [];

	for (const plan of executionPlans) {
		const start = allRequests.length;
		allRequests.push(...plan.requests);
		ranges.push({ start, end: allRequests.length });
	}

	return { allRequests, ranges };
}

function* applyResponses(
	executionPlans: ReadonlyArray<QueryExecutionPlan>,
	responses: QueryJsonRpc2Response[],
	ranges: Array<{ start: number; end: number }>,
	context: PlanApplyContext
): SagaGenerator<{ updates: UpdatedDataHolder[]; errors: unknown[] }> {
	const updates: UpdatedDataHolder[] = [];
	const errors: unknown[] = [];

	for (let index = 0; index < executionPlans.length; index++) {
		const { start, end } = ranges[index];
		const slice = responses.slice(start, end);
		const plan = executionPlans[index];

		try {
			const planUpdates = yield* call([plan, plan.applyResponse], slice, context);
			updates.push(...planUpdates);
		} catch (error) {
			errors.push(error);

			if (plan.dataHolder.data !== undefined) {
				updates.push({ descriptor: plan.dataHolder.descriptor, data: plan.dataHolder.data });
			}
		}
	}

	return { updates, errors };
}
