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
import { QueryFilterState } from "../../../../main/store/internal/filter-state.js";
import { QueryFilterController } from "../../../../main/store/internal/filter-controllers/query-controller.js";

const controller = new QueryFilterController();

const defaultOperator: Query.Operator = {
	operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
	field: "status",
	value: "active",
	caseSensitive: true
};

function makeItem(options: Partial<OverviewModel.NewFilter.Query.Options> = {}): OverviewModel.NewFilter.Query.Item {
	return {
		id: "filter1",
		type: "query",
		description: [{ locale: "en", text: "Active items" }],
		options: {
			operator: defaultOperator,
			enabled: { enabled: false },
			...options
		}
	};
}

describe("QueryFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts query filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-query filter models", () => {
			const stringItem = {
				id: "f",
				type: "string",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(stringItem)).toBe(false);
		});
	});

	describe("createInitialOptions()", () => {
		it("derives enabled from configurable (disabled)", () => {
			expect(controller.createInitialOptions(makeItem({ enabled: { enabled: false } })).enabled).toEqual({
				enabled: false
			});
		});

		it("derives enabled from configurable (enabled with value=true)", () => {
			expect(controller.createInitialOptions(makeItem({ enabled: { enabled: true, value: true } })).enabled).toEqual({
				enabled: true,
				value: true
			});
		});

		it("derives enabled from configurable (enabled with value=false)", () => {
			expect(controller.createInitialOptions(makeItem({ enabled: { enabled: true, value: false } })).enabled).toEqual({
				enabled: true,
				value: false
			});
		});
	});

	describe("reset()", () => {
		it("returns the default options", () => {
			const defaults: QueryFilterState.Options = { enabled: { enabled: false } };
			const runtime: QueryFilterState.Options = { enabled: { enabled: true, value: true } };
			expect(controller.toResetOptions(makeItem(), runtime, defaults)).toBe(defaults);
		});
	});

	describe("hasErrors()", () => {
		it("returns false (query filter never has input errors)", () => {
			expect(controller.hasErrors(makeItem(), { enabled: { enabled: true, value: true } })).toBe(false);
		});
	});

	describe("isConfigurable()", () => {
		it("is always false (query filters have no extra settings)", () => {
			expect(controller.isConfigurable(makeItem())).toBe(false);
		});
	});

	describe("toOperator()", () => {
		it("returns the model operator when enabled and value is true", () => {
			const model = makeItem();
			const op = controller.toOperator(model, { enabled: { enabled: true, value: true } });
			expect(op).toBe(defaultOperator);
		});

		it("returns undefined when enabled is true but value is false", () => {
			const model = makeItem();
			const op = controller.toOperator(model, { enabled: { enabled: true, value: false } });
			expect(op).toBeUndefined();
		});

		it("returns undefined when enabled is disabled", () => {
			const model = makeItem();
			const op = controller.toOperator(model, { enabled: { enabled: false } });
			expect(op).toBeUndefined();
		});

		it("returns the configured operator verbatim (e.g. OR with operands)", () => {
			const orOperator: Query.Operator = {
				operator: Query.OPERATORS.OR_OPERATOR,
				operands: [
					{
						operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
						field: "status",
						value: "active",
						caseSensitive: true
					},
					{
						operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
						field: "status",
						value: "pending",
						caseSensitive: true
					}
				]
			};
			const model = makeItem({ operator: orOperator });
			const op = controller.toOperator(model, { enabled: { enabled: true, value: true } });
			expect(op).toBe(orOperator);
		});
	});

	describe("toLabel()", () => {
		const ctx = {
			documentModel: {} as never,
			locale: {} as never,
			fieldPath: "",
			formatValue: () => "",
			localizeValue: () => "",
			localizeResource: () => "",
			getElementByPath: () => undefined,
			getDateTimeFormat: () => ""
		};

		it("returns null when disabled", () => {
			expect(controller.toLabel(makeItem(), { enabled: { enabled: false } }, ctx)).toBeNull();
		});

		it("returns null when enabled with value=false", () => {
			expect(controller.toLabel(makeItem(), { enabled: { enabled: true, value: false } }, ctx)).toBeNull();
		});

		it("returns localized resource text when enabled with value=true", () => {
			expect(
				controller.toLabel(
					makeItem(),
					{ enabled: { enabled: true, value: true } },
					{ ...ctx, localizeResource: () => "text" }
				)
			).toEqual("text");
		});
	});

	describe("isInstance()", () => {
		it("guards true for query filter state", () => {
			const state = { model: makeItem() } as never;
			expect(QueryFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-query filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(QueryFilterState.isInstance(state)).toBe(false);
		});
	});
});
