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

/* eslint-disable @typescript-eslint/no-non-null-assertion -- test assertions use ! for concise access to known-present values */

import { it, expect, describe } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.states.query-builder", () => {
	describe("QueryBuilder", () => {
		describe("static factory methods", () => {
			it("undefinedMatch creates undefined_match operator", () => {
				const result = QueryBuilder.undefinedMatch("/field").build();

				expect(result).toEqual({
					operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
					field: "/field"
				});
			});

			it("exactMatch creates exact_match operator", () => {
				const result = QueryBuilder.exactMatch("/field", "value", true).build();

				expect(result).toEqual({
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "/field",
					value: "value",
					caseSensitive: true
				});
			});

			it("exactMatch defaults to case sensitive", () => {
				const result = QueryBuilder.exactMatch("/field", "value").build();

				expect(result).toMatchObject({ caseSensitive: true });
			});

			it("doubleRange creates double_range operator", () => {
				const result = QueryBuilder.doubleRange("/field", 10, 20).build();

				expect(result).toEqual({
					operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR,
					field: "/field",
					from: 10,
					to: 20
				});
			});

			it("doubleRange returns undefined when both from and to are undefined", () => {
				const result = QueryBuilder.doubleRange("/field", undefined, undefined).build();

				expect(result).toBeUndefined();
			});

			it("doubleRange handles partial ranges", () => {
				const fromOnly = QueryBuilder.doubleRange("/field", 10, undefined).build();
				const toOnly = QueryBuilder.doubleRange("/field", undefined, 20).build();

				expect(fromOnly).toMatchObject({ from: 10, to: undefined });
				expect(toOnly).toMatchObject({ from: undefined, to: 20 });
			});

			it("dateRange creates date_range operator", () => {
				const result = QueryBuilder.dateRange("/field", "2024-01-01", "2024-12-31").build();

				expect(result).toEqual({
					operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
					field: "/field",
					from: "2024-01-01",
					to: "2024-12-31"
				});
			});

			it("dateRange returns undefined when both from and to are undefined", () => {
				const result = QueryBuilder.dateRange("/field", undefined, undefined).build();

				expect(result).toBeUndefined();
			});

			it("simpleSearch creates simple_search operator", () => {
				const result = QueryBuilder.simpleSearch("search", ["/field"]).build();

				expect(result).toEqual({
					operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
					fields: ["/field"],
					value: "search"
				});
			});
		});

		describe("or operator", () => {
			it("returns undefined when no operands provided", () => {
				const result = QueryBuilder.or().build();

				expect(result).toBeUndefined();
			});

			it("returns undefined when all operands are undefined", () => {
				const result = QueryBuilder.or(undefined, undefined, undefined).build();

				expect(result).toBeUndefined();
			});

			it("returns single operand directly when only one valid operand", () => {
				const operand = QueryBuilder.exactMatch("/field", "value").build()!;
				const result = QueryBuilder.or(operand, undefined).build();

				expect(result).toEqual(operand);
				expect(result?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
			});

			it("returns OR operator when multiple valid operands", () => {
				const op1 = QueryBuilder.exactMatch("/field", "value1").build()!;
				const op2 = QueryBuilder.exactMatch("/field", "value2").build()!;
				const result = QueryBuilder.or(op1, op2).build();

				expect(result).toEqual({
					operator: Query.OPERATORS.OR_OPERATOR,
					operands: [op1, op2]
				});
			});

			it("filters out undefined operands", () => {
				const op1 = QueryBuilder.exactMatch("/field", "value1").build()!;
				const op2 = QueryBuilder.exactMatch("/field", "value2").build()!;
				const result = QueryBuilder.or(op1, undefined, op2, undefined).build();

				expect(result).toEqual({
					operator: Query.OPERATORS.OR_OPERATOR,
					operands: [op1, op2]
				});
			});

			it("accepts QueryBuilder instances as operands", () => {
				const result = QueryBuilder.or(
					QueryBuilder.exactMatch("/field", "value1"),
					QueryBuilder.exactMatch("/field", "value2")
				).build();

				expect(result?.operator).toBe(Query.OPERATORS.OR_OPERATOR);
			});
		});

		describe("and operator", () => {
			it("returns undefined when no operands provided", () => {
				const result = QueryBuilder.and().build();

				expect(result).toBeUndefined();
			});

			it("returns single operand directly when only one valid operand", () => {
				const operand = QueryBuilder.exactMatch("/field", "value").build()!;
				const result = QueryBuilder.and(operand).build();

				expect(result).toEqual(operand);
			});

			it("returns AND operator when multiple valid operands", () => {
				const op1 = QueryBuilder.exactMatch("/field", "value1").build()!;
				const op2 = QueryBuilder.exactMatch("/field", "value2").build()!;
				const result = QueryBuilder.and(op1, op2).build();

				expect(result).toEqual({
					operator: Query.OPERATORS.AND_OPERATOR,
					operands: [op1, op2]
				});
			});
		});

		describe("not method with boolean parameter", () => {
			it("wraps operator with NOT when enabled is true", () => {
				const operand = QueryBuilder.exactMatch("/field", "value").build()!;
				const result = QueryBuilder.create(operand).not(true).build();

				expect(result).toEqual({
					operator: Query.OPERATORS.NOT_OPERATOR,
					operand
				});
			});

			it("returns operator unchanged when enabled is false", () => {
				const operand = QueryBuilder.exactMatch("/field", "value").build()!;
				const result = QueryBuilder.create(operand).not(false).build();

				expect(result).toEqual(operand);
			});

			it("returns undefined when operator is undefined", () => {
				const result = QueryBuilder.create(undefined).not(true).build();

				expect(result).toBeUndefined();
			});
		});

		describe("not method without parameter", () => {
			it("wraps operator with NOT unconditionally", () => {
				const operand = QueryBuilder.exactMatch("/field", "value").build()!;
				const result = QueryBuilder.create(operand).not().build();

				expect(result).toEqual({
					operator: Query.OPERATORS.NOT_OPERATOR,
					operand
				});
			});

			it("returns undefined when operator is undefined", () => {
				const result = QueryBuilder.create(undefined).not().build();

				expect(result).toBeUndefined();
			});
		});

		describe("fluent chaining", () => {
			it("supports chaining factory and not", () => {
				const result = QueryBuilder.exactMatch("/field", "value").not(true).build();

				expect(result?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			});

			it("supports complex compositions", () => {
				const result = QueryBuilder.or(
					QueryBuilder.exactMatch("/field", "value1"),
					QueryBuilder.exactMatch("/field", "value2")
				)
					.not(true)
					.build();

				expect(result?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
				expect((result as Query.NotOperator).operand.operator).toBe(Query.OPERATORS.OR_OPERATOR);
			});
		});

		describe("build returns defined or undefined", () => {
			it("returns defined when operator exists", () => {
				expect(QueryBuilder.exactMatch("/field", "value").build()).toBeDefined();
			});

			it("returns undefined when operator is undefined", () => {
				expect(QueryBuilder.create(undefined).build()).toBeUndefined();
			});
		});
	});
});
