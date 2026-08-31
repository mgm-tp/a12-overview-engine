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

import { it, expect, describe, beforeAll } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OverviewModel } from "../../../../main/overview-model.js";
import { EnumerationFilterController } from "../../../../main/store/internal/filter-controllers/enumeration-controller.js";
import { EnumerationFilterState } from "../../../../main/store/internal/filter-state.js";
import { enLocale } from "../../../basic.spec.js";
import { getDocumentModel } from "../../../setup/models.js";

const controller = new EnumerationFilterController();

function makeItem(
	options: Partial<OverviewModel.NewFilter.Enumeration.Options> = {}
): OverviewModel.NewFilter.Enumeration.Item {
	return {
		id: "filter1",
		type: "enumeration",
		options: {
			fieldId: "/root/enumeration",
			empty: { enabled: false },
			invert: { enabled: false },
			viewMode: "list",
			...options
		}
	};
}

describe("EnumerationFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts enumeration filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-enumeration filter models", () => {
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

		it("derives invert from configurable (disabled)", () => {
			expect(controller.createInitialOptions(makeItem({ invert: { enabled: false } })).invert).toEqual({
				enabled: false
			});
		});

		it("derives invert from configurable (enabled with value)", () => {
			expect(controller.createInitialOptions(makeItem({ invert: { enabled: true, value: true } })).invert).toEqual({
				enabled: true,
				value: true
			});
		});

		it("uses empty array criteria when no criteria configured", () => {
			expect(controller.createInitialOptions(makeItem()).criteria).toEqual([]);
		});

		it("derives criteria from single-value preset", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: ["enum1"] })).criteria).toEqual(["enum1"]);
		});

		it("derives criteria from multi-value preset", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: ["enum1", "enum2"] })).criteria).toEqual([
				"enum1",
				"enum2"
			]);
		});

		it("derives criteria from empty preset", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: [] })).criteria).toEqual([]);
		});
	});

	describe("reset()", () => {
		it("returns the default options", () => {
			const defaults: EnumerationFilterState.Options = {
				empty: { enabled: false },
				invert: { enabled: false },
				criteria: ["enum1"]
			};
			const runtime: EnumerationFilterState.Options = {
				empty: { enabled: true, value: true },
				invert: { enabled: true, value: true },
				criteria: ["enum2"]
			};
			expect(controller.toResetOptions(makeItem(), runtime, defaults)).toBe(defaults);
		});
	});

	describe("hasErrors()", () => {
		it("returns false (enumeration filter never has input errors)", () => {
			expect(
				controller.hasErrors(makeItem(), {
					empty: { enabled: false },
					invert: { enabled: false },
					criteria: []
				})
			).toBe(false);
		});
	});

	describe("isConfigurable()", () => {
		it("is true when empty is enabled", () => {
			expect(
				controller.isConfigurable(makeItem({ empty: { enabled: true, value: false }, invert: { enabled: false } }))
			).toBe(true);
		});

		it("is true when invert is enabled", () => {
			expect(
				controller.isConfigurable(makeItem({ empty: { enabled: false }, invert: { enabled: true, value: false } }))
			).toBe(true);
		});

		it("is true when both empty and invert are enabled", () => {
			expect(
				controller.isConfigurable(
					makeItem({ empty: { enabled: true, value: false }, invert: { enabled: true, value: false } })
				)
			).toBe(true);
		});

		it("is false when both empty and invert are disabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: false }, invert: { enabled: false } }))).toBe(
				false
			);
		});
	});

	describe("toOperator()", () => {
		let documentModel: DocumentModel;

		beforeAll(async () => {
			documentModel = await getDocumentModel("unit-test", "DomainTest");
		});

		const ctx = () => ({ documentModel, locale: enLocale, fieldPath: "/root/enumeration" });
		const model = makeItem();

		it("returns undefined_match operator when empty is enabled with value true", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: true },
					invert: { enabled: false },
					criteria: []
				},
				ctx()
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: "/root/enumeration"
			});
		});

		it("wraps undefined_match in NOT when invert is enabled with value true", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: true },
					invert: { enabled: true, value: true },
					criteria: []
				},
				ctx()
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand).toMatchObject({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: "/root/enumeration"
			});
		});

		it("ignores empty when value is false (falls through to criteria)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: false },
					invert: { enabled: false },
					criteria: ["enum1"]
				},
				ctx()
			);
			expect(op?.operator).not.toBe(Query.OPERATORS.UNDEFINED_MATCH_OPERATOR);
			expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
		});

		it("returns undefined when no criteria selected (or() collapses to nothing)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					criteria: []
				},
				ctx()
			);
			expect(op).toBeUndefined();
		});

		it("unwraps single criterion to a bare exact_match operator (not wrapped in OR)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					criteria: ["enum1"]
				},
				ctx()
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "/root/enumeration",
				value: "enum1",
				caseSensitive: true
			});
		});

		it("returns OR with two exact_match operands for multi-value criteria", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					criteria: ["enum1", "enum2"]
				},
				ctx()
			);
			expect(op?.operator).toBe(Query.OPERATORS.OR_OPERATOR);
			const orOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.OR_OPERATOR }>;
			expect(orOp.operands).toHaveLength(2);
			expect(orOp.operands[0]).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "/root/enumeration",
				value: "enum1"
			});
			expect(orOp.operands[1]).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "/root/enumeration",
				value: "enum2"
			});
		});

		it("wraps single criterion in NOT when invert is enabled with value true", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: true, value: true },
					criteria: ["enum1"]
				},
				ctx()
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "/root/enumeration",
				value: "enum1"
			});
		});

		it("does not wrap in NOT when invert is enabled with value false", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: true, value: false },
					criteria: ["enum1"]
				},
				ctx()
			);
			expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
		});
	});

	describe("toLabel()", () => {
		const model = makeItem();
		const ctx = {
			documentModel: {} as never,
			locale: {} as never,
			fieldPath: "/root/enumeration",
			formatValue: ({ value }: { value: unknown }) => String(value),
			localizeValue: ({ value }: { value: unknown }) => String(value),
			localizeResource: ({ key }: { key: string }) => key,
			getElementByPath: () => undefined,
			getDateTimeFormat: () => ""
		};

		it("returns null when no criteria selected", () => {
			expect(
				controller.toLabel(model, { empty: { enabled: false }, invert: { enabled: false }, criteria: [] }, ctx)
			).toBeNull();
		});

		it("returns the localized values as an array", () => {
			expect(
				controller.toLabel(model, { empty: { enabled: false }, invert: { enabled: false }, criteria: ["enum1"] }, ctx)
			).toEqual(["enum1"]);

			expect(
				controller.toLabel(
					model,
					{ empty: { enabled: false }, invert: { enabled: false }, criteria: ["enum1", "enum2"] },
					ctx
				)
			).toEqual(["enum1", "enum2"]);
		});
	});

	describe("isInstance()", () => {
		it("guards true for enumeration filter state", () => {
			const state = { model: makeItem() } as never;
			expect(EnumerationFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-enumeration filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(EnumerationFilterState.isInstance(state)).toBe(false);
		});
	});
});
