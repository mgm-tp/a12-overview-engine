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
import { NumberFilterController } from "../../../../main/store/internal/filter-controllers/number-controller.js";
import { NumberFilterState } from "../../../../main/store/internal/filter-state.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

const { DefaultInputState, DefaultCriteria } = NumberFilterState;
const numberFilterController = new NumberFilterController();

function makeItem(options: Partial<OverviewModel.NewFilter.Number.Options> = {}): OverviewModel.NewFilter.Number.Item {
	return {
		id: "filter1",
		type: "number",
		options: {
			fieldId: ProductFieldIds.number.id,
			empty: { enabled: false },
			invert: { enabled: false },
			ranges: [
				{ option: "fromTo", default: true, enabled: true },
				{ option: "fromOnly", enabled: true },
				{ option: "toOnly", enabled: true },
				{ option: "exact", enabled: true }
			],
			...options
		}
	};
}

function makeOptions(overrides: Partial<NumberFilterState.Options> = {}): NumberFilterState.Options {
	return {
		empty: { enabled: false },
		invert: { enabled: false },
		selectedRange: "fromTo",
		criteria: DefaultCriteria,
		...overrides
	};
}

function input(value: number | null, raw?: string, error?: string): NumberFilterState.InputState {
	return { input: raw ?? (value === null ? "" : String(value)), value, error: error ?? null };
}

const labelCtx = {
	fieldPath: ProductFieldIds.number.path,
	documentModel: {} as never,
	locale: {} as never,
	formatValue: ({ value }: { value: unknown }) => String(value),
	localizeValue: ({ value }: { value: unknown }) => String(value),
	localizeResource: ({ key }: { key: string }) => key,
	getElementByPath: () => undefined,
	getDateTimeFormat: () => ""
} as never;

describe("NumberFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts number filter models", () => {
			expect(numberFilterController.accept(makeItem())).toBe(true);
		});

		it("rejects non-number filter models", () => {
			const stringItem = {
				id: "f",
				type: "string",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(numberFilterController.accept(stringItem)).toBe(false);
		});
	});

	describe("createInitialOptions()", () => {
		it("derives empty/invert from configurable (disabled)", () => {
			const init = numberFilterController.createInitialOptions(makeItem());
			expect(init.empty).toEqual({ enabled: false });
			expect(init.invert).toEqual({ enabled: false });
		});

		it("derives empty/invert from configurable (enabled with value)", () => {
			const init = numberFilterController.createInitialOptions(
				makeItem({ empty: { enabled: true, value: true }, invert: { enabled: true, value: false } })
			);
			expect(init.empty).toEqual({ enabled: true, value: true });
			expect(init.invert).toEqual({ enabled: true, value: false });
		});

		it("populates selectedRange from configuration default", () => {
			const init = numberFilterController.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromTo", enabled: true },
						{ option: "exact", default: true, enabled: true }
					]
				})
			);
			expect(init.selectedRange).toBe("exact");
		});

		it("falls back to first configured range when none marked default", () => {
			const init = numberFilterController.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromOnly", enabled: true },
						{ option: "toOnly", enabled: true }
					]
				})
			);
			expect(init.selectedRange).toBe("fromOnly");
		});

		it("uses DefaultInputState for criteria segments without configured defaults", () => {
			const init = numberFilterController.createInitialOptions(makeItem());
			expect(init.criteria.default.fromTo?.from).toEqual(DefaultInputState);
			expect(init.criteria.default.fromTo?.to).toEqual(DefaultInputState);
			expect(init.criteria.default.exact?.exact).toEqual(DefaultInputState);
		});

		it("derives criteria values from the default range entry", () => {
			const init = numberFilterController.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromTo", default: true, criteria: { from: 5, to: 10 }, enabled: true },
						{ option: "exact", enabled: true }
					]
				})
			);
			expect(init.criteria.default.fromTo?.from).toEqual({ input: "", value: 5, error: null });
			expect(init.criteria.default.fromTo?.to).toEqual({ input: "", value: 10, error: null });
			expect(init.criteria.default.exact?.exact).toEqual(DefaultInputState);
		});
	});

	describe("toEffectiveOptions()", () => {
		it("flattens runtime options to the selected range and its criteria", () => {
			const runtime = makeOptions({
				selectedRange: "exact",
				criteria: { default: { ...DefaultCriteria.default, exact: { exact: input(42) } } }
			});
			expect(numberFilterController.toEffectiveOptions(makeItem(), runtime)).toEqual({
				empty: { enabled: false },
				invert: { enabled: false },
				selectedRange: "exact",
				criteria: { exact: input(42) }
			});
		});
	});

	describe("reset()", () => {
		it("restores selectedOption and the matching criteria slot from initial options", () => {
			const runtime = makeOptions({
				selectedRange: "fromOnly",
				criteria: { default: { ...DefaultCriteria.default, fromOnly: { from: input(99) } } }
			});
			const defaults: NumberFilterState.EffectiveOptions = {
				empty: { enabled: false },
				invert: { enabled: false },
				selectedRange: "fromTo",
				criteria: { from: input(1), to: input(5) }
			};
			const result = numberFilterController.toResetOptions(makeItem(), runtime, defaults);
			expect(result.selectedRange).toBe("fromTo");
			expect(result.criteria.default.fromTo).toEqual({ from: input(1), to: input(5) });
			expect(result.criteria.default.fromOnly).toEqual({ from: input(99) });
		});

		it("restores empty toggle to its initial default", () => {
			const runtime = makeOptions({ empty: { enabled: true, value: true } });
			const defaults: NumberFilterState.EffectiveOptions = {
				empty: { enabled: true, value: false },
				invert: { enabled: false },
				selectedRange: "fromTo",
				criteria: { from: input(null), to: input(null) }
			};
			const result = numberFilterController.toResetOptions(makeItem(), runtime, defaults);
			expect(result.empty).toEqual({ enabled: true, value: false });
		});

		it("restores invert toggle to its initial default", () => {
			const runtime = makeOptions({ invert: { enabled: true, value: true } });
			const defaults: NumberFilterState.EffectiveOptions = {
				empty: { enabled: false },
				invert: { enabled: true, value: false },
				selectedRange: "fromTo",
				criteria: { from: input(null), to: input(null) }
			};
			const result = numberFilterController.toResetOptions(makeItem(), runtime, defaults);
			expect(result.invert).toEqual({ enabled: true, value: false });
		});
	});

	describe("hasErrors()", () => {
		it("returns false for default (empty) criteria", () => {
			expect(numberFilterController.hasErrors(makeItem(), makeOptions())).toBe(false);
		});

		it("returns true when an InputState carries an error (e.g. NaN)", () => {
			expect(
				numberFilterController.hasErrors(
					makeItem(),
					makeOptions({
						criteria: {
							default: { ...DefaultCriteria.default, fromTo: { from: input(null, "abc", "NaN"), to: input(10) } }
						}
					})
				)
			).toBe(true);
		});

		it("returns true when fromTo has from > to (invalid range)", () => {
			expect(
				numberFilterController.hasErrors(
					makeItem(),
					makeOptions({
						criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(20), to: input(5) } } }
					})
				)
			).toBe(true);
		});

		it("does not flag from > to when selected range is not fromTo", () => {
			expect(
				numberFilterController.hasErrors(
					makeItem(),
					makeOptions({
						selectedRange: "fromOnly",
						criteria: {
							default: {
								...DefaultCriteria.default,
								fromTo: { from: input(20), to: input(5) },
								fromOnly: { from: input(1) }
							}
						}
					})
				)
			).toBe(false);
		});

		it("ignores errors on a non-selected range slot", () => {
			expect(
				numberFilterController.hasErrors(
					makeItem(),
					makeOptions({
						selectedRange: "exact",
						criteria: {
							default: {
								...DefaultCriteria.default,
								fromTo: { from: input(null, "abc", "NaN"), to: input(10) },
								exact: { exact: input(7) }
							}
						}
					})
				)
			).toBe(false);
		});

		it("returns false when fromTo has only one side filled (other side null)", () => {
			expect(
				numberFilterController.hasErrors(
					makeItem(),
					makeOptions({
						criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(null) } } }
					})
				)
			).toBe(false);
		});
	});

	describe("toOperator()", () => {
		const model = makeItem();
		const ctx = { documentModel: {} as never, locale: {} as never, fieldPath: ProductFieldIds.number.path };

		it("returns undefined_match when empty is enabled and value is true", () => {
			const op = numberFilterController.toOperator(model, makeOptions({ empty: { enabled: true, value: true } }), ctx);
			expect(op).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: ProductFieldIds.number.path
			});
		});

		it("wraps undefined_match in NOT when invert is enabled and value is true", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					empty: { enabled: true, value: true },
					invert: { enabled: true, value: true }
				}),
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand).toMatchObject({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: ProductFieldIds.number.path
			});
		});

		it("ignores empty when value is false (falls through to range)", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					empty: { enabled: true, value: false },
					criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(20) } } }
				}),
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.DOUBLE_RANGE_OPERATOR);
		});

		it("fromTo produces a double_range with both bounds", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(20) } } }
				}),
				ctx
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR,
				field: ProductFieldIds.number.path,
				from: 10,
				to: 20
			});
		});

		it("fromOnly produces a double_range with only 'from'", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					selectedRange: "fromOnly",
					criteria: { default: { ...DefaultCriteria.default, fromOnly: { from: input(10) } } }
				}),
				ctx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR,
				field: ProductFieldIds.number.path,
				from: 10,
				to: undefined
			});
		});

		it("toOnly produces a double_range with only 'to'", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					selectedRange: "toOnly",
					criteria: { default: { ...DefaultCriteria.default, toOnly: { to: input(20) } } }
				}),
				ctx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR,
				field: ProductFieldIds.number.path,
				from: undefined,
				to: 20
			});
		});

		it("exact produces a double_range with from === to", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					selectedRange: "exact",
					criteria: { default: { ...DefaultCriteria.default, exact: { exact: input(42) } } }
				}),
				ctx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DOUBLE_RANGE_OPERATOR,
				field: ProductFieldIds.number.path,
				from: 42,
				to: 42
			});
		});

		it("returns undefined when no values are entered (empty range)", () => {
			const op = numberFilterController.toOperator(model, makeOptions(), ctx);
			expect(op).toBeUndefined();
		});

		it("returns undefined when exact has no value", () => {
			const op = numberFilterController.toOperator(model, makeOptions({ selectedRange: "exact" }), ctx);
			expect(op).toBeUndefined();
		});

		it("wraps double_range in NOT when invert is enabled with value true", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					invert: { enabled: true, value: true },
					criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(20) } } }
				}),
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand.operator).toBe(Query.OPERATORS.DOUBLE_RANGE_OPERATOR);
		});

		it("does not wrap in NOT when invert is enabled with value false", () => {
			const op = numberFilterController.toOperator(
				model,
				makeOptions({
					invert: { enabled: true, value: false },
					criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(20) } } }
				}),
				ctx
			);
			expect(op?.operator).toBe(Query.OPERATORS.DOUBLE_RANGE_OPERATOR);
		});
	});

	describe("toLabel()", () => {
		const model = makeItem();

		it("returns null when no values are entered", () => {
			expect(numberFilterController.toLabel(model, makeOptions(), labelCtx)).toBeNull();
		});

		it("fromTo renders 'from - to'", () => {
			const opts = makeOptions({
				criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(20) } } }
			});
			expect(numberFilterController.toLabel(model, opts, labelCtx)).toBe("10 - 20");
		});

		it("fromTo with from === to collapses to a single value", () => {
			const opts = makeOptions({
				criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(10) } } }
			});
			expect(numberFilterController.toLabel(model, opts, labelCtx)).toBe("10");
		});

		it("fromOnly renders '>= from'", () => {
			const opts = makeOptions({
				selectedRange: "fromOnly",
				criteria: { default: { ...DefaultCriteria.default, fromOnly: { from: input(10) } } }
			});
			expect(numberFilterController.toLabel(model, opts, labelCtx)).toBe("≥ 10");
		});

		it("toOnly renders '<= to'", () => {
			const opts = makeOptions({
				selectedRange: "toOnly",
				criteria: { default: { ...DefaultCriteria.default, toOnly: { to: input(20) } } }
			});
			expect(numberFilterController.toLabel(model, opts, labelCtx)).toBe("≤ 20");
		});

		it("exact renders the single value", () => {
			const opts = makeOptions({
				selectedRange: "exact",
				criteria: { default: { ...DefaultCriteria.default, exact: { exact: input(42) } } }
			});
			expect(numberFilterController.toLabel(model, opts, labelCtx)).toBe("42");
		});

		it("fromTo with only 'from' filled renders '>= from'", () => {
			const opts = makeOptions({
				criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(10), to: input(null) } } }
			});
			expect(numberFilterController.toLabel(model, opts, labelCtx)).toBe("≥ 10");
		});

		it("fromTo with only 'to' filled renders '<= to'", () => {
			const opts = makeOptions({
				criteria: { default: { ...DefaultCriteria.default, fromTo: { from: input(null), to: input(20) } } }
			});
			expect(numberFilterController.toLabel(model, opts, labelCtx)).toBe("≤ 20");
		});
	});

	describe("isConfigurable()", () => {
		it("is true when empty is enabled", () => {
			expect(numberFilterController.isConfigurable(makeItem({ empty: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when invert is enabled", () => {
			expect(numberFilterController.isConfigurable(makeItem({ invert: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when more than one range option is configured", () => {
			expect(numberFilterController.isConfigurable(makeItem())).toBe(true);
		});

		it("is false when empty/invert disabled and only one range option", () => {
			expect(
				numberFilterController.isConfigurable(
					makeItem({
						empty: { enabled: false },
						invert: { enabled: false },
						ranges: [{ option: "fromTo", default: true, enabled: true }]
					})
				)
			).toBe(false);
		});
	});

	describe("isInstance()", () => {
		it("guards true for number filter state", () => {
			const state = { model: makeItem() } as never;
			expect(NumberFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-number filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(NumberFilterState.isInstance(state)).toBe(false);
		});
	});
});
