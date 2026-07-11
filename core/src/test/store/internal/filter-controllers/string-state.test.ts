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
import { StringFilterState } from "../../../../main/store/internal/filter-state.js";
import { StringFilterController } from "../../../../main/store/internal/filter-controllers/string-controller.js";

import { createField, createDocumentModel } from "../../../utils.js";

const { DefaultCriteria } = StringFilterState;
const controller = new StringFilterController();

const locale = enUS;

function makeItem(options: Partial<OverviewModel.NewFilter.String.Options> = {}): OverviewModel.NewFilter.String.Item {
	return {
		id: "filter1",
		type: "string",
		options: {
			fieldId: "",
			empty: { enabled: false },
			invert: { enabled: false },
			caseSensitive: { enabled: false },
			exactMatch: { enabled: false },
			...options
		}
	};
}

function defaultRuntime(
	overrides: Partial<Omit<StringFilterState.Options, "criteria">> & { criteria?: string; criteriaError?: string } = {}
): StringFilterState.Options {
	const { criteria, criteriaError, ...rest } = overrides;

	return {
		empty: { enabled: false },
		invert: { enabled: false },
		viewMode: "textField",
		caseSensitive: { enabled: false },
		exactMatch: { enabled: false },
		criteria:
			criteria === undefined && criteriaError === undefined
				? DefaultCriteria
				: { value: criteria, error: criteriaError },
		selectedValues: [],
		...rest
	};
}

const emptyPathDocumentModel: DocumentModel = createDocumentModel([]);

function ctxFor(documentModel: DocumentModel, fieldPath: string = "") {
	return { documentModel, locale, fieldPath };
}

function buildAnnotatedDocumentModel(
	fieldName: string,
	annotations: ReadonlyArray<{ name: string; value: string }>
): DocumentModel {
	const field = createField("StringType", fieldName);
	const annotatedField: DocumentModel.Field = { ...field, annotations: [...annotations] };

	return createDocumentModel([annotatedField]);
}

describe("StringFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts string filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-string filter models", () => {
			const booleanItem = {
				id: "f",
				type: "boolean",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(booleanItem)).toBe(false);
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
			expect(controller.createInitialOptions(makeItem({ invert: { enabled: true, value: false } })).invert).toEqual({
				enabled: true,
				value: false
			});
		});

		it("derives caseSensitive from configurable (enabled with value)", () => {
			expect(
				controller.createInitialOptions(makeItem({ caseSensitive: { enabled: true, value: true } })).caseSensitive
			).toEqual({ enabled: true, value: true });
		});

		it("derives exactMatch from configurable (enabled with value)", () => {
			expect(
				controller.createInitialOptions(makeItem({ exactMatch: { enabled: true, value: false } })).exactMatch
			).toEqual({ enabled: true, value: false });
		});

		it("uses DefaultCriteria when no criteria configured", () => {
			expect(controller.createInitialOptions(makeItem()).criteria).toBe(DefaultCriteria);
		});

		it("derives criteria from preset string", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: "hello" })).criteria).toEqual({ value: "hello" });
		});

		it("preserves an explicit empty-string criteria", () => {
			expect(controller.createInitialOptions(makeItem({ criteria: "" })).criteria).toEqual({ value: "" });
		});
	});

	describe("reset()", () => {
		it("returns the default options with criteria wrapped as input state", () => {
			const defaults = controller.toEffectiveOptions(makeItem(), defaultRuntime({ criteria: "init" }));
			const runtime = defaultRuntime({ criteria: "modified" });
			expect(controller.toResetOptions(makeItem(), runtime, defaults)).toEqual({
				...defaults,
				criteria: { value: "init" }
			});
		});
	});

	describe("hasErrors()", () => {
		it("returns false when criteria has no error", () => {
			expect(controller.hasErrors(makeItem(), defaultRuntime({ criteria: "anything" }))).toBe(false);
		});

		it("returns true when criteria carries an error and search-based matching is active", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					defaultRuntime({ exactMatch: { enabled: true, value: false }, criteria: "ab", criteriaError: "too short" })
				)
			).toBe(true);
		});

		it("returns false when criteria carries an error but exact match is on", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					defaultRuntime({ exactMatch: { enabled: true, value: true }, criteria: "ab", criteriaError: "too short" })
				)
			).toBe(false);
		});
	});

	describe("isConfigurable()", () => {
		it("is false when no toggle is enabled", () => {
			expect(controller.isConfigurable(makeItem())).toBe(false);
		});

		it("is true when empty is enabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when caseSensitive is enabled", () => {
			expect(controller.isConfigurable(makeItem({ caseSensitive: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when exactMatch is enabled", () => {
			expect(controller.isConfigurable(makeItem({ exactMatch: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when invert is enabled", () => {
			expect(controller.isConfigurable(makeItem({ invert: { enabled: true, value: false } }))).toBe(true);
		});
	});

	describe("toOperator()", () => {
		describe("empty branch", () => {
			it("returns undefined_match when empty is enabled and value is true", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({ empty: { enabled: true, value: true } }),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toEqual({
					operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
					field: ""
				});
			});

			it("wraps undefined_match in NOT when invert is enabled and true", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: true }
					}),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toEqual({
					operator: Query.OPERATORS.NOT_OPERATOR,
					operand: {
						operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
						field: ""
					}
				});
			});

			it("does not wrap in NOT when invert is enabled but value is false", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: false }
					}),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op?.operator).toBe(Query.OPERATORS.UNDEFINED_MATCH_OPERATOR);
			});

			it("falls through to criteria branch when empty.enabled is true but value is false", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({
						empty: { enabled: true, value: false },
						criteria: "hello"
					}),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
			});
		});

		describe("missing criteria", () => {
			it("returns undefined when criteria is undefined", () => {
				const op = controller.toOperator(makeItem(), defaultRuntime(), ctxFor(emptyPathDocumentModel));
				expect(op).toBeUndefined();
			});

			it("returns undefined when criteria is empty string", () => {
				const op = controller.toOperator(makeItem(), defaultRuntime({ criteria: "" }), ctxFor(emptyPathDocumentModel));
				expect(op).toBeUndefined();
			});
		});

		describe("exact_match branch (no annotations)", () => {
			it("emits exact_match with caseSensitive=false when annotations are absent", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({ criteria: "hello" }),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toEqual({
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "",
					value: "hello",
					caseSensitive: false
				});
			});

			it("honors caseSensitive=true from the toggle even when no annotation is present", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({
						caseSensitive: { enabled: true, value: true },
						criteria: "hello"
					}),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toMatchObject({
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					caseSensitive: true
				});
			});

			it("emits simple_search from the exactMatch toggle even when no annotation is present", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({
						exactMatch: { enabled: true, value: false },
						criteria: "hello"
					}),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toMatchObject({
					operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
					value: "hello"
				});
			});

			it("wraps exact_match in NOT when invert is enabled and true", () => {
				const op = controller.toOperator(
					makeItem(),
					defaultRuntime({
						invert: { enabled: true, value: true },
						criteria: "hello"
					}),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toEqual({
					operator: Query.OPERATORS.NOT_OPERATOR,
					operand: {
						operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
						field: "",
						value: "hello",
						caseSensitive: false
					}
				});
			});
		});

		describe("case-sensitive annotation interactions", () => {
			it("honors caseSensitive=true when the field has the case-insensitive annotation", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_case_insensitive_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						caseSensitive: { enabled: true, value: true },
						criteria: "hello"
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op).toMatchObject({
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "root/title",
					value: "hello",
					caseSensitive: true
				});
			});

			it("uses caseSensitive=false when the toggle is off even with the annotation", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_case_insensitive_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						caseSensitive: { enabled: true, value: false },
						criteria: "hello"
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op).toMatchObject({ caseSensitive: false });
			});
		});

		describe("substring (simple_search) branch", () => {
			it("emits a single simple_search when exactMatch is off, annotation present, and criteria is one word", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_approximate_match_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						exactMatch: { enabled: true, value: false },
						criteria: "hello"
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op).toMatchObject({
					operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
					fields: ["root/title"],
					value: "hello"
				});
			});

			it("emits AND of simple_search operands when criteria has multiple words", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_approximate_match_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						exactMatch: { enabled: true, value: false },
						criteria: "hello world foo"
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op?.operator).toBe(Query.OPERATORS.AND_OPERATOR);
				const andOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.AND_OPERATOR }>;
				expect(andOp.operands).toHaveLength(3);
				expect(andOp.operands[0]).toMatchObject({
					operator: Query.OPERATORS.SIMPLE_SEARCH_OPERATOR,
					value: "hello"
				});
				expect(andOp.operands[1]).toMatchObject({ value: "world" });
				expect(andOp.operands[2]).toMatchObject({ value: "foo" });
			});

			it("collapses multiple whitespace between words", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_approximate_match_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						exactMatch: { enabled: true, value: false },
						criteria: "  hello   world  "
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op?.operator).toBe(Query.OPERATORS.AND_OPERATOR);
				const andOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.AND_OPERATOR }>;
				expect(andOp.operands).toHaveLength(2);
			});

			it("returns undefined when criteria is only whitespace (no words)", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_approximate_match_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						exactMatch: { enabled: true, value: false },
						criteria: "   "
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op).toBeUndefined();
			});

			it("falls back to exact_match when exactMatch toggle is on but value is true", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_approximate_match_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						exactMatch: { enabled: true, value: true },
						criteria: "hello world"
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
			});

			it("falls back to exact_match when exactMatch toggle is disabled (regardless of annotation)", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_approximate_match_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({ criteria: "hello world" }),
					ctxFor(documentModel, "root/title")
				);
				expect(op?.operator).toBe(Query.OPERATORS.EXACT_MATCH_OPERATOR);
			});

			it("wraps the AND in NOT when invert is enabled", () => {
				const documentModel = buildAnnotatedDocumentModel("title", [
					{ name: "enable_approximate_match_search", value: "true" }
				]);
				const op = controller.toOperator(
					makeItem({ fieldId: "root/title" }),
					defaultRuntime({
						exactMatch: { enabled: true, value: false },
						invert: { enabled: true, value: true },
						criteria: "hello world"
					}),
					ctxFor(documentModel, "root/title")
				);
				expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
				const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
				expect(notOp.operand.operator).toBe(Query.OPERATORS.AND_OPERATOR);
			});
		});
	});

	describe("toLabel()", () => {
		const labelCtx = {
			documentModel: emptyPathDocumentModel,
			locale,
			fieldPath: "",
			formatValue: ({ value }: { value: unknown }) => String(value),
			localizeValue: ({ value }: { value: unknown }) => String(value),
			localizeResource: ({ key }: { key: string }) => key,
			getElementByPath: () => undefined,
			getDateTimeFormat: () => ""
		};

		it("returns null when criteria is undefined", () => {
			expect(controller.toLabel(makeItem(), defaultRuntime(), labelCtx)).toBeNull();
		});

		it("returns the empty string when criteria is empty", () => {
			expect(controller.toLabel(makeItem(), defaultRuntime({ criteria: "" }), labelCtx)).toBe("");
		});

		it("returns the criteria string when set", () => {
			expect(controller.toLabel(makeItem(), defaultRuntime({ criteria: "hello" }), labelCtx)).toBe("hello");
		});

		it("returns null when viewMode is LIST and selectedValues is empty", () => {
			expect(
				controller.toLabel(makeItem(), defaultRuntime({ viewMode: "list", selectedValues: [] }), labelCtx)
			).toBeNull();
		});

		it("returns the single selected value when viewMode is LIST with one selection", () => {
			expect(
				controller.toLabel(makeItem(), defaultRuntime({ viewMode: "list", selectedValues: ["alpha"] }), labelCtx)
			).toBe("alpha");
		});

		it("returns first value followed by ', …' when viewMode is LIST with multiple selections", () => {
			expect(
				controller.toLabel(
					makeItem(),
					defaultRuntime({ viewMode: "list", selectedValues: ["alpha", "beta", "gamma"] }),
					labelCtx
				)
			).toBe("alpha, …");
		});
	});

	describe("viewMode behavior", () => {
		describe("createInitialOptions()", () => {
			it("defaults viewMode to TEXT_FIELD when omitted in model", () => {
				expect(controller.createInitialOptions(makeItem()).viewMode).toBe("textField");
			});

			it("preserves explicit TEXT_FIELD viewMode", () => {
				expect(controller.createInitialOptions(makeItem({ viewMode: "textField" })).viewMode).toBe("textField");
			});

			it("preserves LIST viewMode", () => {
				expect(controller.createInitialOptions(makeItem({ viewMode: "list" })).viewMode).toBe("list");
			});

			it("force-disables caseSensitive when viewMode is LIST (even if model enables it)", () => {
				const opts = controller.createInitialOptions(
					makeItem({ viewMode: "list", caseSensitive: { enabled: true, value: true } })
				);
				expect(opts.caseSensitive).toEqual({ enabled: false });
			});

			it("force-disables exactMatch when viewMode is LIST (even if model enables it)", () => {
				const opts = controller.createInitialOptions(
					makeItem({ viewMode: "list", exactMatch: { enabled: true, value: false } })
				);
				expect(opts.exactMatch).toEqual({ enabled: false });
			});

			it("keeps caseSensitive enabled when viewMode is TEXT_FIELD", () => {
				const opts = controller.createInitialOptions(
					makeItem({ viewMode: "textField", caseSensitive: { enabled: true, value: true } })
				);
				expect(opts.caseSensitive).toEqual({ enabled: true, value: true });
			});

			it("ignores criteria when viewMode is LIST (text-field default text not surfaced)", () => {
				const opts = controller.createInitialOptions(makeItem({ viewMode: "list", criteria: "ignored" }));
				expect(opts.criteria).toBe(DefaultCriteria);
			});

			it("initializes selectedValues to empty array regardless of viewMode", () => {
				expect(controller.createInitialOptions(makeItem({ viewMode: "list" })).selectedValues).toEqual([]);
				expect(controller.createInitialOptions(makeItem({ viewMode: "textField" })).selectedValues).toEqual([]);
			});
		});

		describe("toOperator() — LIST branch", () => {
			it("returns undefined when viewMode is LIST and selectedValues is empty", () => {
				const op = controller.toOperator(
					makeItem({ viewMode: "list" }),
					defaultRuntime({ viewMode: "list" }),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toBeUndefined();
			});

			it("returns OR of exact case-sensitive matches for LIST with multiple selections", () => {
				const item = makeItem({ fieldId: "G0/x", viewMode: "list" });
				const dm = buildAnnotatedDocumentModel("x", []);
				const op = controller.toOperator(
					item,
					defaultRuntime({ viewMode: "list", selectedValues: ["alpha", "beta"] }),
					ctxFor(dm, "G0/x")
				) as Extract<Query.Operator, { operator: typeof Query.OPERATORS.OR_OPERATOR }>;
				expect(op.operator).toBe(Query.OPERATORS.OR_OPERATOR);
				expect(op.operands).toHaveLength(2);
				expect(op.operands[0]).toMatchObject({
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "G0/x",
					value: "alpha"
				});
				expect(op.operands[1]).toMatchObject({
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "G0/x",
					value: "beta"
				});
			});

			it("single LIST selection collapses to plain exact_match (OR of one operand)", () => {
				const item = makeItem({ fieldId: "G0/x", viewMode: "list" });
				const dm = buildAnnotatedDocumentModel("x", []);
				const op = controller.toOperator(
					item,
					defaultRuntime({ viewMode: "list", selectedValues: ["only"] }),
					ctxFor(dm, "G0/x")
				);
				expect(op).toMatchObject({
					operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
					field: "G0/x",
					value: "only"
				});
			});

			it("wraps the OR in NOT when invert is enabled", () => {
				const item = makeItem({
					fieldId: "G0/x",
					viewMode: "list",
					invert: { enabled: true, value: true }
				});
				const dm = buildAnnotatedDocumentModel("x", []);
				const op = controller.toOperator(
					item,
					defaultRuntime({
						viewMode: "list",
						selectedValues: ["alpha"],
						invert: { enabled: true, value: true }
					}),
					ctxFor(dm, "G0/x")
				);
				expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			});

			it("empty toggle still wins over selectedValues for LIST viewMode", () => {
				const op = controller.toOperator(
					makeItem({ viewMode: "list", empty: { enabled: true, value: true } }),
					defaultRuntime({
						viewMode: "list",
						selectedValues: ["ignored"],
						empty: { enabled: true, value: true }
					}),
					ctxFor(emptyPathDocumentModel)
				);
				expect(op).toMatchObject({ operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR });
			});
		});
	});

	describe("isInstance()", () => {
		it("guards true for string filter state", () => {
			const state = { model: makeItem() } as never;
			expect(StringFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-string filter state", () => {
			const state = {
				model: { id: "f", type: "boolean", options: { fieldId: "x" } }
			} as never;
			expect(StringFilterState.isInstance(state)).toBe(false);
		});
	});
});
