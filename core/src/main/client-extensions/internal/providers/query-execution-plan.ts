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

import type { SagaGenerator } from "typed-redux-saga";

import type { Activity } from "@com.mgmtp.a12.client/client-core";
import type { SupportedRequest, QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

/**
 * Result of applying a plan's response for one data holder.
 * Mirrors the shape RE already uses, lifted into OE so both repos share it.
 * @experimental
 */
export interface UpdatedDataHolder {
	readonly descriptor: Activity.DataHolderDescriptor;
	readonly data?: object;
	readonly thumbnails?: Record<string, string>;
}

/**
 * Shared, batch-wide context handed to every applyResponse.
 * @experimental
 */
export interface PlanApplyContext {
	readonly thumbnails?: Record<string, string>;
}

/**
 * One unit of batched work for a single data holder.
 *
 * `requests` may be empty (e.g. skipInitialLoad / empty pageNumbers no-op);
 * in that case `applyResponse` is still called with an empty response slice
 * so it can write fallback data.
 * @experimental
 */
export interface QueryExecutionPlan {
	readonly id: string;
	readonly dataHolder: Activity.DataHolder;
	readonly requests: ReadonlyArray<SupportedRequest>;
	readonly applyResponse: (
		responses: ReadonlyArray<QueryJsonRpc2Response>,
		context: PlanApplyContext
	) => SagaGenerator<UpdatedDataHolder[]>;
}
