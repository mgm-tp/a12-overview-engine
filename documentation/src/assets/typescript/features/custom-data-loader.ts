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

import { call, type SagaGenerator } from "typed-redux-saga";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import {
	DataOperation,
	maybeAsyncFnWrapper,
	OverviewEngineFactories,
	type OverviewEngineDataLoader
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

// tag::default_data_loader_fallback[]
function* defaultBuildRequests(params: Parameters<OverviewEngineDataLoader["buildRequests"]>[0]) {
	return yield* call(
		maybeAsyncFnWrapper(OverviewEngineFactories.dataLoader.buildRequests.bind(OverviewEngineFactories.dataLoader)),
		params
	);
}

function defaultHandleResponses(
	params: Parameters<OverviewEngineDataLoader["handleResponses"]>[0]
): SagaGenerator<DataOperation.ResultSet> {
	return call(
		maybeAsyncFnWrapper(OverviewEngineFactories.dataLoader.handleResponses.bind(OverviewEngineFactories.dataLoader)),
		params
	);
}
// end::default_data_loader_fallback[]

// tag::filter[]
export const customFilterDataLoader: OverviewEngineDataLoader = {
	*buildRequests(params) {
		const { queries, documentModel } = params;
		const [query, ...otherQueries] = queries;
		let updatedQuery = query;

		if (DataOperation.ListDocuments.Query.isAssignableFrom(query) && documentModel.header.id === "ProductDM") {
			// Create a custom constraint to filter products without productType
			const customConstraint: Query.Operator = {
				operator: Query.OPERATORS.NOT_OPERATOR,
				operand: { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: "/product/productType" }
			};

			updatedQuery = {
				...query,
				// Either extends the existing constraint or directly uses it if none exists
				constraint: query.constraint
					? { operator: Query.OPERATORS.AND_OPERATOR, operands: [query.constraint, customConstraint] }
					: customConstraint
			};
		}

		return yield* defaultBuildRequests({ ...params, queries: [updatedQuery, ...otherQueries] });
	},
	*handleResponses(params): SagaGenerator<DataOperation.ResultSet> {
		return yield* defaultHandleResponses(params);
	}
};
// end::filter[]

// tag::EnumeratedStringFilter[]
export const customEnumeratedStringFiltersDataLoader: OverviewEngineDataLoader = {
	*buildRequests(params) {
		const { queries, documentModel } = params;
		const [query, ...otherQueries] = queries;
		let updatedQuery = query;

		if (
			DataOperation.ListStringFilterOptions.Query.isAssignableFrom(query) &&
			documentModel.header.id === "ProductDM"
		) {
			// A valid candidate for the enumerated string options must be a person with an email address
			const withEmailFieldConstraint: Query.Operator = {
				operator: Query.OPERATORS.NOT_OPERATOR,
				operand: { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: "/product/seller/email" }
			};
			updatedQuery = {
				...query,
				// Either extends the existing constraint or directly uses it if none exists
				constraint: query.constraint
					? { operator: Query.OPERATORS.AND_OPERATOR, operands: [query.constraint, withEmailFieldConstraint] }
					: withEmailFieldConstraint
			};
		}

		return yield* defaultBuildRequests({ ...params, queries: [updatedQuery, ...otherQueries] });
	},
	*handleResponses(params): SagaGenerator<DataOperation.ResultSet> {
		return yield* defaultHandleResponses(params);
	}
};
// end::EnumeratedStringFilter[]

// tag::fields_projection[]
export const customFieldsProjectionDataLoader: OverviewEngineDataLoader = {
	*buildRequests(params) {
		const { queries, documentModel } = params;
		const [query, ...otherQueries] = queries;
		let updatedQuery = query;

		if (DataOperation.ListDocuments.Query.isAssignableFrom(query) && documentModel.header.id === "BundleDM") {
			updatedQuery = {
				...query,
				// Extends the default selection of fields projection to include the "bundleType"
				// If not specified, all fields are returned
				fields: query.fields ? [...query.fields, "/bundle/bundleType"] : undefined
			};
		}

		return yield* defaultBuildRequests({ ...params, queries: [updatedQuery, ...otherQueries] });
	},
	*handleResponses(params): SagaGenerator<DataOperation.ResultSet> {
		return yield* defaultHandleResponses(params);
	}
};
// end::fields_projection[]

// tag::sorting[]
export const customSortingDataLoader: OverviewEngineDataLoader = {
	*buildRequests(params) {
		const { queries, documentModel } = params;
		const [query, ...otherQueries] = queries;
		let updatedQuery = query;

		if (DataOperation.ListDocuments.Query.isAssignableFrom(query) && documentModel.header.id === "PersonDM") {
			updatedQuery = {
				...query,
				// Apply a custom default sorting, this could also be extended to emulate the multi-column sorting
				sort: query.sort ?? [
					{
						field: "/person/city",
						direction: Query.Direction.ASC,
						ignoreCase: false,
						nullHandling: Query.NullHandling.NULLS_LAST
					}
				]
			};
		}

		return yield* defaultBuildRequests({ ...params, queries: [updatedQuery, ...otherQueries] });
	},
	*handleResponses(params): SagaGenerator<DataOperation.ResultSet> {
		return yield* defaultHandleResponses(params);
	}
};
// end::sorting[]
