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

import type { OverviewModel } from "../../../../main/overview-model.js";
import { BooleanFilterController } from "../../../../main/store/internal/filter-controllers/boolean-controller.js";
import { BooleanFilterState } from "../../../../main/store/internal/filter-state.js";

const controller = new BooleanFilterController();
const { DefaultCriteria } = BooleanFilterController;

function makeItem(
	options: Partial<OverviewModel.NewFilter.Boolean.Options> = {}
): OverviewModel.NewFilter.Boolean.Item {
	return {
		id: "filter1",
		type: "boolean",
		options: {
			fieldId: "isInStock",
			empty: { enabled: false },
			...options
		}
	};
}

describe("BooleanFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts boolean filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-boolean filter models", () => {
			const stringItem = {
				id: "f",
				type: "string",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(stringItem)).toBe(false);
		});
	});

	describe("createInitialOptions()", () => {
		it("derives empty from configurable (disabled)", () => {
			expect(controller.createInitialOptions(makeItem({ empty: { enabled: false } })).empty).toEqual({
				enabled: false
			});
		});

		it("derives empty from configurable (enabled with value)", () => {
			expect(controller.createInitialOptions(makeItem({ empty: { enabled: true, value: true } })).empty).toEqual({
				enabled: true,
				value: true
			});
		});

		it("uses DefaultCriteria when no criteria configured", () => {
			expect(controller.createInitialOptions(makeItem()).criteria).toEqual(DefaultCriteria);
		});

		it("derives criteria from preset [true]", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: [true] })).criteria).toEqual({
				true: true,
				false: false
			});
		});

		it("derives criteria from preset [false]", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: [false] })).criteria).toEqual({
				true: false,
				false: true
			});
		});

		it("derives criteria from preset [true, false]", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: [true, false] })).criteria).toEqual({
				true: true,
				false: true
			});
		});

		it("uses DefaultCriteria when preset is empty array", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: [] })).criteria).toEqual(DefaultCriteria);
		});
	});

	describe("reset()", () => {
		it("returns the default options", () => {
			const defaults: BooleanFilterState.Options = {
				empty: { enabled: false },
				criteria: { true: true, false: false }
			};
			const runtime: BooleanFilterState.Options = {
				empty: { enabled: true, value: true },
				criteria: { true: false, false: true }
			};
			expect(controller.toResetOptions(makeItem(), runtime, defaults)).toBe(defaults);
		});
	});

	describe("hasErrors()", () => {
		it("returns false (boolean filter never has input errors)", () => {
			expect(controller.hasErrors(makeItem(), { empty: { enabled: false }, criteria: DefaultCriteria })).toBe(false);
		});
	});

	describe("isConfigurable()", () => {
		it("is true when empty is enabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: true, value: false } }))).toBe(true);
		});

		it("is false when empty is disabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: false } }))).toBe(false);
		});
	});

	describe("toOperator()", () => {
		const model = makeItem();
		const ctx = { documentModel: {} as never, locale: {} as never, fieldPath: "isInStock" };

		it("returns undefined_match operator when empty is enabled and value is true", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: true },
					criteria: DefaultCriteria
				},
				ctx
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: "isInStock"
			});
		});

		it("ignores empty when value is false (falls through to criteria)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: false },
					criteria: { true: true, false: false }
				},
				ctx
			);
			expect(op?.operator).not.toBe(Query.OPERATORS.UNDEFINED_MATCH_OPERATOR);
			expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
		});

		it("ignores empty when disabled (falls through to criteria)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					criteria: { true: true, false: false }
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
		});

		it("returns undefined when no criteria selected (or() collapses to nothing)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					criteria: DefaultCriteria
				},
				ctx
			);
			expect(op).toBeUndefined();
		});

		it("unwraps single criterion to a bare exact_match operator (not wrapped in OR)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					criteria: { true: true, false: false }
				},
				ctx
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "isInStock",
				value: "true",
				caseSensitive: true
			});
		});

		it("returns OR with two exact_match operands for [true, false]", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					criteria: { true: true, false: true }
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.OR_OPERATOR);
			const orOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.OR_OPERATOR }>;
			expect(orOp.operands).toHaveLength(2);
			expect(orOp.operands[0]).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "isInStock",
				value: "true"
			});
			expect(orOp.operands[1]).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "isInStock",
				value: "false"
			});
		});
	});

	describe("toLabel()", () => {
		const model = makeItem();
		const ctx = {
			documentModel: {} as never,
			locale: {} as never,
			fieldPath: "isInStock",
			formatValue: ({ value }: { value: unknown }) => String(value),
			localizeValue: ({ value }: { value: unknown }) => String(value),
			localizeResource: ({ key }: { key: string }) => key,
			getElementByPath: () => undefined,
			getDateTimeFormat: () => ""
		};

		it("returns null when no criteria selected", () => {
			expect(controller.toLabel(model, { empty: { enabled: false }, criteria: DefaultCriteria }, ctx)).toBeNull();
		});

		it("returns 'true' when only true is selected", () => {
			expect(
				controller.toLabel(model, { empty: { enabled: false }, criteria: { true: true, false: false } }, ctx)
			).toBe("true");
		});

		it("returns 'false' when only false is selected", () => {
			expect(
				controller.toLabel(model, { empty: { enabled: false }, criteria: { true: false, false: true } }, ctx)
			).toBe("false");
		});

		it("returns 'true, false' when both selected", () => {
			expect(controller.toLabel(model, { empty: { enabled: false }, criteria: { true: true, false: true } }, ctx)).toBe(
				"true, false"
			);
		});
	});

	describe("isInstance()", () => {
		it("guards true for boolean filter state", () => {
			const state = { model: makeItem() } as never;
			expect(BooleanFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-boolean filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(BooleanFilterState.isInstance(state)).toBe(false);
		});
	});
});
