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

import { enUS } from "date-fns/locale";
import { it, expect, describe } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OverviewModel } from "../../../../main/overview-model.js";
import type { FilterLabelContext } from "../../../../main/store/internal/filter-controllers/filter-controller.js";
import { MultiSelectFilterController } from "../../../../main/store/internal/filter-controllers/multi-select-controller.js";
import { MultiSelectFilterState } from "../../../../main/store/internal/filter-state.js";
import { createGroup, createDocumentModel, createEnumerationField } from "../../../utils.js";

const controller = new MultiSelectFilterController();

const FIELD_PATH = "/root/tags";

function makeItem(
	options: Partial<OverviewModel.NewFilter.MultiSelect.Options> = {}
): OverviewModel.NewFilter.MultiSelect.Item {
	return {
		id: "filter1",
		type: "multi-select",
		options: {
			fieldId: FIELD_PATH,
			empty: { enabled: false },
			invert: { enabled: false },
			matchOperator: { enabled: false },
			viewMode: "list",
			...options
		}
	};
}

function makeDocumentModel(): DocumentModel {
	return createDocumentModel([
		createGroup({
			id: "tags",
			repeatability: 999,
			usageType: "multi-select",
			elements: [createEnumerationField()]
		})
	]);
}

const ctx = { documentModel: makeDocumentModel(), fieldPath: FIELD_PATH };

describe("MultiSelectFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts multi-select filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-multi-select filter models", () => {
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

		it("derives invert from configurable (enabled with value)", () => {
			expect(controller.createInitialOptions(makeItem({ invert: { enabled: true, value: true } })).invert).toEqual({
				enabled: true,
				value: true
			});
		});

		it("derives matchOperator from configurable (enabled with OR)", () => {
			expect(
				controller.createInitialOptions(makeItem({ matchOperator: { enabled: true, value: "or" } })).matchOperator
			).toEqual({ enabled: true, value: "or" });
		});

		it("uses empty array when no criteria configured", () => {
			expect(controller.createInitialOptions(makeItem()).criteria).toEqual([]);
		});

		it("derives criteria from preset", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: ["1", "2"] })).criteria).toEqual(["1", "2"]);
		});
	});

	describe("reset()", () => {
		it("returns the default options", () => {
			const defaults: MultiSelectFilterState.Options = {
				empty: { enabled: false },
				invert: { enabled: false },
				matchOperator: { enabled: false },
				criteria: []
			};
			const runtime: MultiSelectFilterState.Options = {
				empty: { enabled: true, value: true },
				invert: { enabled: true, value: true },
				matchOperator: { enabled: true, value: "or" },
				criteria: ["1"]
			};
			expect(controller.toResetOptions(makeItem(), runtime, defaults)).toBe(defaults);
		});
	});

	describe("hasErrors()", () => {
		it("returns false (multi-select filter never has input errors)", () => {
			expect(
				controller.hasErrors(makeItem(), {
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: false },
					criteria: []
				})
			).toBe(false);
		});
	});

	describe("isConfigurable()", () => {
		it("is true when empty is enabled", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						empty: { enabled: true, value: false },
						invert: { enabled: false },
						matchOperator: { enabled: false }
					})
				)
			).toBe(true);
		});

		it("is true when invert is enabled", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						empty: { enabled: false },
						invert: { enabled: true, value: false },
						matchOperator: { enabled: false }
					})
				)
			).toBe(true);
		});

		it("is true when matchOperator is enabled", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						empty: { enabled: false },
						invert: { enabled: false },
						matchOperator: { enabled: true, value: "and" }
					})
				)
			).toBe(true);
		});

		it("is false when empty, invert and matchOperator are all disabled", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						empty: { enabled: false },
						invert: { enabled: false },
						matchOperator: { enabled: false }
					})
				)
			).toBe(false);
		});
	});

	describe("toOperator()", () => {
		const model = makeItem();

		it("returns undefined_match operator when empty is enabled and value is true", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: true },
					invert: { enabled: false },
					matchOperator: { enabled: false },
					criteria: []
				},
				ctx
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: `${FIELD_PATH}/value`
			});
		});

		it("wraps undefined_match in NOT when invert is active alongside empty", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: true },
					invert: { enabled: true, value: true },
					matchOperator: { enabled: false },
					criteria: []
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("returns undefined when criteria is empty and empty toggle is not active", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: false },
					criteria: []
				},
				ctx
			);
			expect(op).toBeUndefined();
		});

		it("unwraps a single criterion to a bare exact_match (regardless of join op)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: true, value: "or" },
					criteria: ["1"]
				},
				ctx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: `${FIELD_PATH}/value`,
				value: "1",
				caseSensitive: true
			});
		});

		it("joins multiple selections with AND when matchOperator is AND (default)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: false },
					criteria: ["1", "2"]
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.AND_OPERATOR);
			const andOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.AND_OPERATOR }>;
			expect(andOp.operands).toHaveLength(2);
			expect(andOp.operands[0]).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: `${FIELD_PATH}/value`,
				value: "1"
			});
			expect(andOp.operands[1]).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: `${FIELD_PATH}/value`,
				value: "2"
			});
		});

		it("joins multiple selections with AND when matchOperator is explicitly enabled as AND", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: true, value: "and" },
					criteria: ["1", "2"]
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.AND_OPERATOR);
		});

		it("joins multiple selections with OR when matchOperator is enabled as OR", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: true, value: "or" },
					criteria: ["1", "2"]
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.OR_OPERATOR);
			const orOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.OR_OPERATOR }>;
			expect(orOp.operands).toHaveLength(2);
		});

		it("wraps a single-criterion result in NOT when invert is active", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: true, value: true },
					matchOperator: { enabled: false },
					criteria: ["1"]
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("does not wrap in NOT when invert is enabled but value is false", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: true, value: false },
					matchOperator: { enabled: false },
					criteria: ["1"]
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
		});

		it("returns undefined when fieldPath does not resolve to a multi-select group", () => {
			const otherDocumentModel = createDocumentModel([
				createGroup({
					id: "tags",
					repeatability: 999,
					usageType: "attachment",
					elements: [createEnumerationField()]
				})
			]);
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: false },
					criteria: ["1"]
				},
				{ documentModel: otherDocumentModel, fieldPath: FIELD_PATH }
			);
			expect(op).toBeUndefined();
		});

		it("falls back to raw value when no enum label matches the locale", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: false },
					criteria: ["unknown-value"]
				},
				ctx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: `${FIELD_PATH}/value`,
				value: "unknown-value"
			});
		});
	});

	describe("toLabel()", () => {
		const model = makeItem();
		const documentModel = makeDocumentModel();
		const multiSelectGroup = (documentModel.content.modelRoot.elements[0] as DocumentModel.Group)
			.elements[0] as DocumentModel.Group;
		const labelCtx: FilterLabelContext = {
			documentModel,
			fieldPath: FIELD_PATH,
			locale: enUS,
			formatValue: ({ value }) => String(value),
			localizeValue: ({ value }) => `L(${String(value)})`,
			localizeResource: ({ key }) => key,
			getElementByPath: () => multiSelectGroup,
			getDateTimeFormat: () => ""
		};

		it("returns null when no criteria are selected", () => {
			expect(
				controller.toLabel(
					model,
					{
						empty: { enabled: false },
						invert: { enabled: false },
						matchOperator: { enabled: false },
						criteria: []
					},
					labelCtx
				)
			).toBeNull();
		});

		it("returns the localized values as an array", () => {
			expect(
				controller.toLabel(
					model,
					{
						empty: { enabled: false },
						invert: { enabled: false },
						matchOperator: { enabled: false },
						criteria: ["1"]
					},
					labelCtx
				)
			).toEqual(["L(1)"]);

			expect(
				controller.toLabel(
					model,
					{
						empty: { enabled: false },
						invert: { enabled: false },
						matchOperator: { enabled: false },
						criteria: ["1", "2", "3"]
					},
					labelCtx
				)
			).toEqual(["L(1)", "L(2)", "L(3)"]);
		});

		it("returns null when fieldPath does not resolve to a multi-select group", () => {
			expect(
				controller.toLabel(
					model,
					{
						empty: { enabled: false },
						invert: { enabled: false },
						matchOperator: { enabled: false },
						criteria: ["1"]
					},
					{ ...labelCtx, getElementByPath: () => createEnumerationField() }
				)
			).toBeNull();
		});
	});

	describe("isInstance()", () => {
		it("guards true for multi-select filter state", () => {
			const state = { model: makeItem() } as never;
			expect(MultiSelectFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-multi-select filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(MultiSelectFilterState.isInstance(state)).toBe(false);
		});
	});
});
