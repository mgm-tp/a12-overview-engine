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

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";

/**
 * A fluent builder for constructing {@link Query.Operator} trees.
 *
 * - Filters out `undefined` operands automatically.
 * - Unwraps single-operand AND/OR to avoid unnecessary nesting.
 * - Supports `not()` wrapping for inversion.
 *
 * @example
 * ```ts
 * const operator = QueryBuilder.exactMatch(field, value).build();
 *
 * const operator = QueryBuilder.or(
 *   QueryBuilder.exactMatch(field, value1),
 *   undefined,
 *   QueryBuilder.exactMatch(field, value2)
 * ).build();
 *
 * const operator = QueryBuilder.and(...operands).not().build();
 * ```
 */
export class QueryBuilder {
	private constructor(private readonly operator: Query.Operator | undefined) {}

	private static resolve(op: Query.Operator | QueryBuilder | undefined): Query.Operator | undefined {
		return op instanceof QueryBuilder ? op.build() : op;
	}

	/** Create a builder wrapping an existing operator or `undefined`. */
	static create(operator?: Query.Operator): QueryBuilder {
		return new QueryBuilder(operator);
	}

	/** Create an `undefined_match` operator for empty/null field matching. */
	static undefinedMatch(field: string): QueryBuilder {
		return new QueryBuilder({
			operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
			field
		});
	}

	/** Create an `exact_match` operator. Defaults to case-sensitive (`caseSensitive = true`). */
	static exactMatch(field: string, value: string, caseSensitive = true): QueryBuilder {
		return new QueryBuilder({
			operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
			field,
			value,
			caseSensitive
		} satisfies Query.ExactMatchOperator);
	}

	/** Create a `double_range` operator for numeric ranges. Returns `undefined` if both bounds are absent. */
	static doubleRange(field: string, from?: number, to?: number): QueryBuilder {
		if (from === undefined && to === undefined) {
			return new QueryBuilder(undefined);
		}

		return new QueryBuilder({
			operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR,
			field,
			from,
			to
		} satisfies Query.DoubleRangeOperator);
	}

	/** Create a `date_range` operator. Returns `undefined` if both bounds are absent. */
	static dateRange(field: string, from?: string, to?: string): QueryBuilder {
		if (from === undefined && to === undefined) {
			return new QueryBuilder(undefined);
		}

		return new QueryBuilder({
			operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
			field,
			from,
			to
		} satisfies Query.DateRangeOperator);
	}

	/** Create a `date_fragment_range` operator. Returns `undefined` if both bounds are absent. */
	static dateFragmentRange(field: string, from?: string, to?: string): QueryBuilder {
		if (from === undefined && to === undefined) {
			return new QueryBuilder(undefined);
		}

		return new QueryBuilder({
			operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
			field,
			from,
			to
		} satisfies Query.DateFragmentRangeOperator);
	}

	/**
	 * Create a `has` operator for querying linked documents via relationships.
	 * Constraints that resolve to `undefined` (e.g. an empty `QueryBuilder`) are omitted.
	 */
	static has(
		relationshipModel: string,
		targetRole: string,
		options?: {
			constraint?: Query.Operator | QueryBuilder;
			linkDocumentConstraint?: Query.Operator | QueryBuilder;
			maxDepth?: number;
		}
	): QueryBuilder {
		return new QueryBuilder({
			operator: Query.OPERATORS.HAS_OPERATOR,
			relationshipModel,
			targetRole,
			constraint: QueryBuilder.resolve(options?.constraint),
			linkDocumentConstraint: QueryBuilder.resolve(options?.linkDocumentConstraint),
			maxDepth: options?.maxDepth
		} satisfies Query.HasOperator);
	}

	/** Create a `simple_search` operator for substring/approximate matching. Returns `undefined` if value is absent. */
	static simpleSearch(value: string | string[] | undefined, fields?: string[]): QueryBuilder {
		if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
			return new QueryBuilder(undefined);
		}

		const values = typeof value === "string" ? [value] : value;

		return new QueryBuilder({
			operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
			fields,
			values: values.length > 1 ? values : undefined,
			// @ts-expect-error the TypeScript API is not correct — value is omitted when values is provided. See https://geta12.com/#/docs/2025.06/ext2/data_services/dataservices-documentation-src%23simple-search-operator
			value: values.length === 1 ? values[0] : undefined
		});
	}

	/**
	 * Create an OR from multiple operands.
	 * Filters out `undefined`, unwraps single operand, returns `undefined` if none remain.
	 */
	static or(...operands: (Query.Operator | QueryBuilder | undefined)[]): QueryBuilder {
		return QueryBuilder.combine(Query.OPERATORS.OR_OPERATOR, operands);
	}

	/**
	 * Create an AND from multiple operands.
	 * Same collapsing semantics as {@link or}.
	 */
	static and(...operands: (Query.Operator | QueryBuilder | undefined)[]): QueryBuilder {
		return QueryBuilder.combine(Query.OPERATORS.AND_OPERATOR, operands);
	}

	private static combine(
		operatorType: typeof Query.OPERATORS.OR_OPERATOR | typeof Query.OPERATORS.AND_OPERATOR,
		operands: (Query.Operator | QueryBuilder | undefined)[]
	): QueryBuilder {
		const resolvedOperators = operands.map(QueryBuilder.resolve).filter((op): op is Query.Operator => op !== undefined);

		if (resolvedOperators.length === 0) {
			return new QueryBuilder(undefined);
		}

		if (resolvedOperators.length === 1) {
			return new QueryBuilder(resolvedOperators[0]);
		}

		return new QueryBuilder({ operator: operatorType, operands: resolvedOperators });
	}

	/** Wrap with NOT. No-op if `enabled` is `false` or the current operator is `undefined`. */
	not(enabled = true): QueryBuilder {
		if (!enabled || this.operator === undefined) {
			return this;
		}

		return new QueryBuilder({
			operator: Query.OPERATORS.NOT_OPERATOR,
			operand: this.operator
		});
	}

	/** Build the final operator, or `undefined` if no operator was constructed. */
	build(): Query.Operator | undefined {
		return this.operator;
	}
}
