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

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { Query, QueryJsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { OverviewModel } from "../../../overview-model.js";
import type { OverviewEngineApi } from "../../../view/api.js";
import { DocumentModelUtils } from "../../../models/internal/shared.js";

export interface AggregationResolver {
	resolveSummaryResult: (
		aggregationEntries?: QueryJsonRpc2Response.AggregationEntry[]
	) => OverviewEngineApi.SummaryResult;
	aggregation?: Query.AggregationProjector;
}

export namespace AggregationResolver {
	export function create(
		requestId: string,
		overviewModel: OverviewModel,
		documentModel: DocumentModel
	): AggregationResolver {
		const aggregationFunctions: Query.SumAggregationFunction[] = [];
		const aggregationGroup: Query.ProjectionField[] = [{ field: "/__meta/modelReference", alias: "model" }];
		const facetRequestMap: { columnId: string; operation: OverviewModel.Summary.Operation }[] = [];

		for (const column of overviewModel.content.columns) {
			if (!OverviewModel.ReferenceColumn.isAssignableFrom(column)) {
				continue;
			}

			const { elementRef, summary = [] } = column;
			const field = DocumentModelUtils.getElementPath(elementRef, documentModel);
			const fieldPath = ModelPath.toString(field);

			for (const { operation } of summary) {
				facetRequestMap.push({ columnId: column.id, operation });
				aggregationFunctions.push({ field: fieldPath, function: operation });
			}
		}

		if (aggregationFunctions.length === 0) {
			return { resolveSummaryResult };
		}

		return {
			aggregation: { aggregations: aggregationFunctions, group: aggregationGroup },
			resolveSummaryResult
		};

		function resolveSummaryResult(
			aggregationEntries?: QueryJsonRpc2Response.AggregationEntry[]
		): OverviewEngineApi.SummaryResult {
			const result: OverviewEngineApi.SummaryResult = {};

			if (!aggregationEntries || aggregationEntries.length !== 1) {
				return result;
			}

			const [aggregationEntry] = aggregationEntries;

			for (let index = 0; index < facetRequestMap.length; index++) {
				const { columnId, operation } = facetRequestMap[index];
				const value = aggregationEntry.document?.[index + 1];
				result[columnId] = { ...result[columnId], [operation]: Number(value) };
			}

			return result;
		}
	}
}
