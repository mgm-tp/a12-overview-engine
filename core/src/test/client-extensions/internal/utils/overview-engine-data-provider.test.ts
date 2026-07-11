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

import { it, expect, describe } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { QueryModel } from "@com.mgmtp.a12.querymodel/querymodel-core";

import { SortingOrder, DefaultFilterStateSelectors } from "../../../../main/index.js";
import {
	computeListDocumentsQueryOrders,
	computeListDocumentsConstraints
} from "../../../../main/client-extensions/internal/providers/overview-engine-data-provider.js";

import { mockType, createModelsState } from "../../../utils.js";

describe("com.mgmtp.a12.overview-engine.client-extensions.providers.overview-engine-data-provider", () => {
	describe("computeListDocumentsQueryOrders", () => {
		it("should return default sorting with createdAt field if no sorting specified", () => {
			const modelsState = createModelsState();
			const result = computeListDocumentsQueryOrders(modelsState);
			expect(result).toEqual([
				{
					field: "/__meta/createdAt",
					direction: Query.Direction.DESC,
					nullHandling: Query.NullHandling.NULLS_LAST,
					ignoreCase: false
				}
			]);
		});

		it("should return default sorting with createdAt field if sorting is an empty array", () => {
			const modelsState = createModelsState();
			const result = computeListDocumentsQueryOrders(modelsState, []);
			expect(result).toEqual([
				{
					field: "/__meta/createdAt",
					direction: Query.Direction.DESC,
					nullHandling: Query.NullHandling.NULLS_LAST,
					ignoreCase: false
				}
			]);
		});

		it("should return respective sorting if specified", () => {
			const modelsState = createModelsState();
			const result = computeListDocumentsQueryOrders(modelsState, [{ path: "/Person/Name", order: SortingOrder.DESC }]);
			expect(result).toEqual([
				{
					field: "/Person/Name",
					direction: Query.Direction.DESC,
					nullHandling: Query.NullHandling.NULLS_LAST,
					ignoreCase: true
				}
			]);
		});

		it("should return single-hop RelationshipOrder with sortBy containing field and direction", () => {
			const modelsState = createModelsState();
			const result = computeListDocumentsQueryOrders(modelsState, [
				{
					path: {
						relationshipModel: "ContractBusinessPartner",
						targetRole: "Partner",
						sortBy: "/BusinessPartnerRoot/Name"
					},
					order: SortingOrder.ASC
				}
			]);
			expect(result).toEqual([
				{
					relationshipModel: "ContractBusinessPartner",
					targetRole: "Partner",
					sortBy: {
						field: "/BusinessPartnerRoot/Name",
						direction: Query.Direction.ASC,
						nullHandling: Query.NullHandling.NULLS_LAST,
						ignoreCase: true
					}
				}
			]);
		});

		it("should return multi-hop RelationshipOrder with nested sortBy chain", () => {
			const modelsState = createModelsState();
			const result = computeListDocumentsQueryOrders(modelsState, [
				{
					path: {
						relationshipModel: "ContractBusinessPartner",
						targetRole: "Partner",
						sortBy: {
							relationshipModel: "PartnerPrimaryAddress",
							targetRole: "PrimaryAddress",
							sortBy: "/AddressRoot/City"
						}
					},
					order: SortingOrder.DESC
				}
			]);
			expect(result).toEqual([
				{
					relationshipModel: "ContractBusinessPartner",
					targetRole: "Partner",
					sortBy: {
						relationshipModel: "PartnerPrimaryAddress",
						targetRole: "PrimaryAddress",
						sortBy: {
							field: "/AddressRoot/City",
							direction: Query.Direction.DESC,
							nullHandling: Query.NullHandling.NULLS_LAST,
							ignoreCase: true
						}
					}
				}
			]);
		});

		it("should read sort from queryModel when sorting param is not provided", () => {
			const qmSort: Query.Order[] = [
				{
					field: "/person/lastName",
					direction: Query.Direction.ASC,
					nullHandling: Query.NullHandling.NULLS_FIRST,
					ignoreCase: false
				}
			];

			const modelsState = createModelsState({
				queryModel: mockType<QueryModel>({ content: { sort: qmSort } })
			});

			const result = computeListDocumentsQueryOrders(modelsState);
			expect(result).toEqual(qmSort);
		});

		it("should ignore user sorting and return empty array when in exclude mode", () => {
			const modelsState = createModelsState({
				queryModel: mockType<QueryModel>({ content: { exclude: true } })
			});

			const result = computeListDocumentsQueryOrders(modelsState, [{ path: "/Person/Name", order: SortingOrder.DESC }]);

			expect(result).toEqual([]);
		});

		it("should return empty array when in exclude mode even if queryModel has sort", () => {
			const qmSort: Query.Order[] = [
				{
					field: "/person/lastName",
					direction: Query.Direction.ASC,
					nullHandling: Query.NullHandling.NULLS_FIRST,
					ignoreCase: false
				}
			];

			const modelsState = createModelsState({
				queryModel: mockType<QueryModel>({ content: { exclude: true, sort: qmSort } })
			});

			const result = computeListDocumentsQueryOrders(modelsState, [{ path: "/Person/Name", order: SortingOrder.DESC }]);

			expect(result).toEqual([]);
		});
	});

	describe("computeListDocumentsConstraints", () => {
		it("should return the constraint from queryModel when provided and no other inputs", () => {
			const constraintFromModel = {
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "/person/status",
				value: "ACTIVE"
			};

			const modelsState = createModelsState({
				queryModel: mockType<QueryModel>({ content: { constraint: constraintFromModel } })
			});

			const constraint = computeListDocumentsConstraints(modelsState, DefaultFilterStateSelectors);
			expect(constraint).toBeDefined();
			expect(constraint?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
			expect((constraint as Record<string, unknown>)["field"]).toBe("/person/status");
			expect((constraint as Record<string, unknown>)["value"]).toBe("ACTIVE");
		});
	});
});
