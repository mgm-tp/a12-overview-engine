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

import { QueryBuilder } from "../src/index.js";

describe("QueryBuilder", () => {
	describe("static factory methods", () => {
		it("create wraps an existing operator", () => {
			const op: Query.Operator = { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: "/f" };

			expect(QueryBuilder.create(op).build()).toBe(op);
		});

		it("create with no argument returns undefined", () => {
			expect(QueryBuilder.create().build()).toBeUndefined();
		});

		it("undefinedMatch creates undefined_match operator", () => {
			expect(QueryBuilder.undefinedMatch("/field").build()).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: "/field"
			});
		});

		it("exactMatch creates exact_match operator", () => {
			expect(QueryBuilder.exactMatch("/field", "value", true).build()).toEqual({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "/field",
				value: "value",
				caseSensitive: true
			});
		});

		it("exactMatch defaults to case sensitive", () => {
			expect(QueryBuilder.exactMatch("/field", "value").build()).toMatchObject({ caseSensitive: true });
		});

		it("doubleRange creates double_range operator", () => {
			expect(QueryBuilder.doubleRange("/field", 10, 20).build()).toEqual({
				operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR,
				field: "/field",
				from: 10,
				to: 20
			});
		});

		it("doubleRange returns undefined when both bounds are absent", () => {
			expect(QueryBuilder.doubleRange("/field").build()).toBeUndefined();
		});

		it("doubleRange handles partial ranges", () => {
			expect(QueryBuilder.doubleRange("/field", 10).build()).toMatchObject({ from: 10, to: undefined });
			expect(QueryBuilder.doubleRange("/field", undefined, 20).build()).toMatchObject({ from: undefined, to: 20 });
		});

		it("dateRange creates date_range operator", () => {
			expect(QueryBuilder.dateRange("/field", "2024-01-01", "2024-12-31").build()).toEqual({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: "/field",
				from: "2024-01-01",
				to: "2024-12-31"
			});
		});

		it("dateRange returns undefined when both bounds are absent", () => {
			expect(QueryBuilder.dateRange("/field").build()).toBeUndefined();
		});

		it("dateFragmentRange creates date_fragment_range operator", () => {
			expect(QueryBuilder.dateFragmentRange("/field", "2024", "2025").build()).toEqual({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: "/field",
				from: "2024",
				to: "2025"
			});
		});

		it("dateFragmentRange returns undefined when both bounds are absent", () => {
			expect(QueryBuilder.dateFragmentRange("/field").build()).toBeUndefined();
		});

		it("simpleSearch creates simple_search operator with single value", () => {
			expect(QueryBuilder.simpleSearch("search", ["/field"]).build()).toEqual({
				operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
				fields: ["/field"],
				value: "search"
			});
		});

		it("simpleSearch creates simple_search operator with multiple values", () => {
			expect(QueryBuilder.simpleSearch(["foo", "bar"], ["/field"]).build()).toEqual({
				operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
				fields: ["/field"],
				value: undefined,
				values: ["foo", "bar"]
			});
		});

		it("simpleSearch with single-element array uses value, not values", () => {
			expect(QueryBuilder.simpleSearch(["search"], ["/field"]).build()).toEqual({
				operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
				fields: ["/field"],
				value: "search"
			});
		});

		it("simpleSearch omits fields when not provided", () => {
			expect(QueryBuilder.simpleSearch("search").build()).toEqual({
				operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
				value: "search"
			});
		});

		it("simpleSearch returns undefined when value is undefined", () => {
			expect(QueryBuilder.simpleSearch(undefined).build()).toBeUndefined();
		});

		it("simpleSearch returns undefined when value is an empty array", () => {
			expect(QueryBuilder.simpleSearch([]).build()).toBeUndefined();
		});

		it("simpleSearch returns undefined when value is an empty string", () => {
			expect(QueryBuilder.simpleSearch("").build()).toBeUndefined();
		});

		it("has creates has operator with required fields only", () => {
			expect(QueryBuilder.has("rm", "child").build()).toEqual({
				operator: Query.OPERATORS.HAS_OPERATOR,
				relationshipModel: "rm",
				targetRole: "child"
			});
		});

		it("has creates has operator with constraint", () => {
			const constraint = QueryBuilder.exactMatch("/name", "foo").build();

			expect(QueryBuilder.has("rm", "child", { constraint }).build()).toEqual({
				operator: Query.OPERATORS.HAS_OPERATOR,
				relationshipModel: "rm",
				targetRole: "child",
				constraint
			});
		});

		it("has creates has operator with linkDocumentConstraint", () => {
			const linkDocumentConstraint = QueryBuilder.exactMatch("/linkField", "bar").build();

			expect(QueryBuilder.has("rm", "child", { linkDocumentConstraint }).build()).toEqual({
				operator: Query.OPERATORS.HAS_OPERATOR,
				relationshipModel: "rm",
				targetRole: "child",
				linkDocumentConstraint
			});
		});

		it("has creates has operator with maxDepth", () => {
			expect(QueryBuilder.has("rm", "child", { maxDepth: 3 }).build()).toEqual({
				operator: Query.OPERATORS.HAS_OPERATOR,
				relationshipModel: "rm",
				targetRole: "child",
				maxDepth: 3
			});
		});

		it("has accepts QueryBuilder instances for constraints", () => {
			const result = QueryBuilder.has("rm", "child", {
				constraint: QueryBuilder.exactMatch("/name", "foo"),
				linkDocumentConstraint: QueryBuilder.exactMatch("/linkField", "bar"),
				maxDepth: 2
			}).build();

			expect(result).toEqual({
				operator: Query.OPERATORS.HAS_OPERATOR,
				relationshipModel: "rm",
				targetRole: "child",
				constraint: {
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "/name",
					value: "foo",
					caseSensitive: true
				},
				linkDocumentConstraint: {
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "/linkField",
					value: "bar",
					caseSensitive: true
				},
				maxDepth: 2
			});
		});

		it("has omits constraint when QueryBuilder resolves to undefined", () => {
			expect(
				QueryBuilder.has("rm", "child", {
					constraint: QueryBuilder.create()
				}).build()
			).toEqual({
				operator: Query.OPERATORS.HAS_OPERATOR,
				relationshipModel: "rm",
				targetRole: "child"
			});
		});
	});

	describe("or", () => {
		it("returns undefined when no operands provided", () => {
			expect(QueryBuilder.or().build()).toBeUndefined();
		});

		it("returns undefined when all operands are undefined", () => {
			expect(QueryBuilder.or(undefined, undefined).build()).toBeUndefined();
		});

		it("unwraps single operand", () => {
			const op = QueryBuilder.exactMatch("/f", "v").build();

			expect(QueryBuilder.or(op, undefined).build()).toEqual(op);
		});

		it("returns OR operator with multiple operands", () => {
			const op1 = QueryBuilder.exactMatch("/f", "v1").build();
			const op2 = QueryBuilder.exactMatch("/f", "v2").build();

			expect(QueryBuilder.or(op1, op2).build()).toEqual({
				operator: Query.OPERATORS.OR_OPERATOR,
				operands: [op1, op2]
			});
		});

		it("filters out undefined operands", () => {
			const op1 = QueryBuilder.exactMatch("/f", "v1").build();
			const op2 = QueryBuilder.exactMatch("/f", "v2").build();

			expect(QueryBuilder.or(op1, undefined, op2).build()).toEqual({
				operator: Query.OPERATORS.OR_OPERATOR,
				operands: [op1, op2]
			});
		});

		it("accepts QueryBuilder instances as operands", () => {
			const result = QueryBuilder.or(QueryBuilder.exactMatch("/f", "v1"), QueryBuilder.exactMatch("/f", "v2")).build();

			expect(result?.operator).toBe(Query.OPERATORS.OR_OPERATOR);
		});
	});

	describe("and", () => {
		it("returns undefined when no operands provided", () => {
			expect(QueryBuilder.and().build()).toBeUndefined();
		});

		it("unwraps single operand", () => {
			const op = QueryBuilder.exactMatch("/f", "v").build();

			expect(QueryBuilder.and(op).build()).toEqual(op);
		});

		it("returns AND operator with multiple operands", () => {
			const op1 = QueryBuilder.exactMatch("/f", "v1").build();
			const op2 = QueryBuilder.exactMatch("/f", "v2").build();

			expect(QueryBuilder.and(op1, op2).build()).toEqual({
				operator: Query.OPERATORS.AND_OPERATOR,
				operands: [op1, op2]
			});
		});
	});

	describe("not", () => {
		it("wraps operator with NOT", () => {
			const op = QueryBuilder.exactMatch("/f", "v").build();

			expect(QueryBuilder.create(op).not().build()).toEqual({
				operator: Query.OPERATORS.NOT_OPERATOR,
				operand: op
			});
		});

		it("returns undefined when operator is undefined", () => {
			expect(QueryBuilder.create().not().build()).toBeUndefined();
		});

		it("wraps when condition is true", () => {
			const op = QueryBuilder.exactMatch("/f", "v").build();

			expect(QueryBuilder.create(op).not(true).build()?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("skips when condition is false", () => {
			const op = QueryBuilder.exactMatch("/f", "v").build();

			expect(QueryBuilder.create(op).not(false).build()).toEqual(op);
		});
	});

	describe("chaining", () => {
		it("supports not after or", () => {
			const result = QueryBuilder.or(QueryBuilder.exactMatch("/f", "v1"), QueryBuilder.exactMatch("/f", "v2"))
				.not()
				.build();

			expect(result?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			expect((result as Query.NotOperator).operand.operator).toBe(Query.OPERATORS.OR_OPERATOR);
		});

		it("supports not after and", () => {
			const result = QueryBuilder.and(QueryBuilder.exactMatch("/f", "v1"), QueryBuilder.exactMatch("/f", "v2"))
				.not()
				.build();

			expect(result?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			expect((result as Query.NotOperator).operand.operator).toBe(Query.OPERATORS.AND_OPERATOR);
		});
	});
});
