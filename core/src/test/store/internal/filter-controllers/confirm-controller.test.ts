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
import { ConfirmFilterState } from "../../../../main/store/internal/filter-state.js";
import { ConfirmFilterController } from "../../../../main/store/internal/filter-controllers/confirm-controller.js";

const controller = new ConfirmFilterController();
const { DefaultCriteria } = ConfirmFilterState;

function makeItem(
	options: Partial<OverviewModel.NewFilter.Confirm.Options> = {}
): OverviewModel.NewFilter.Confirm.Item {
	return {
		id: "filter1",
		type: "confirm",
		options: {
			fieldId: "isApproved",
			empty: { enabled: false },
			...options
		}
	};
}

describe("ConfirmFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts confirm filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-confirm filter models", () => {
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
			expect(controller.createInitialOptions(makeItem()).criteria).toBe(DefaultCriteria);
		});

		it("derives criteria from preset true", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: true })).criteria).toBe(true);
		});
	});

	describe("reset()", () => {
		it("returns the default options", () => {
			const defaults: ConfirmFilterState.Options = {
				empty: { enabled: false },
				criteria: null
			};
			const runtime: ConfirmFilterState.Options = {
				empty: { enabled: true, value: true },
				criteria: true
			};
			expect(controller.toResetOptions(makeItem(), runtime, defaults)).toBe(defaults);
		});
	});

	describe("hasErrors()", () => {
		it("returns false (confirm filter never has input errors)", () => {
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
		const ctx = { documentModel: {} as never, locale: {} as never, fieldPath: "isApproved" };

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
				field: "isApproved"
			});
		});

		it("ignores empty when value is false (falls through to criteria)", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: false },
					criteria: true
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
					criteria: true
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
		});

		it("returns undefined when criteria is null and empty is not active", () => {
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

		it("returns exact_match for value 'true' when criteria is true", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: false },
					criteria: true
				},
				ctx
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: "isApproved",
				value: "true",
				caseSensitive: true
			});
		});

		it("prefers undefined_match over criteria when both are active", () => {
			const op = controller.toOperator(
				model,
				{
					empty: { enabled: true, value: true },
					criteria: true
				},
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.UNDEFINED_MATCH_OPERATOR);
		});
	});

	describe("toLabel()", () => {
		const model = makeItem();
		const ctx = {
			documentModel: {} as never,
			locale: {} as never,
			fieldPath: "isApproved",
			formatValue: ({ value }: { value: unknown }) => String(value),
			localizeValue: ({ value }: { value: unknown }) => String(value),
			localizeResource: ({ key }: { key: string }) => key,
			getElementByPath: () => undefined,
			getDateTimeFormat: () => ""
		};

		it("returns null when criteria is null", () => {
			expect(controller.toLabel(model, { empty: { enabled: false }, criteria: null }, ctx)).toBeNull();
		});

		it("returns localized 'true' when criteria is true", () => {
			expect(controller.toLabel(model, { empty: { enabled: false }, criteria: true }, ctx)).toBe("true");
		});
	});

	describe("isInstance()", () => {
		it("guards true for confirm filter state", () => {
			const state = { model: makeItem() } as never;
			expect(ConfirmFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-confirm filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(ConfirmFilterState.isInstance(state)).toBe(false);
		});
	});
});
