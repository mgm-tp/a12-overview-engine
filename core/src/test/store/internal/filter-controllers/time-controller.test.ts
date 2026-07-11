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

import { it, vi, expect, describe } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type * as KernelInternal from "@com.mgmtp.a12.kernel/kernel-md-facade/a12internal";

import type { OverviewModel } from "../../../../main/overview-model.js";
import { TimeFilterState } from "../../../../main/store/internal/filter-state.js";
import { TimeFilterController } from "../../../../main/store/internal/filter-controllers/time-controller.js";

import { createField, createDocumentModel } from "../../../utils.js";

const controller = new TimeFilterController();

vi.mock("@com.mgmtp.a12.kernel/kernel-md-facade/a12internal", async (importOriginal) => {
	const actual = await importOriginal<typeof KernelInternal>();

	return {
		...actual,
		formatDate: (value: Date | undefined, formatString?: string, ...rest: unknown[]) => {
			if (!value) {
				return undefined;
			}

			const h = String(value.getUTCHours()).padStart(2, "0");
			const m = String(value.getUTCMinutes()).padStart(2, "0");
			const s = String(value.getUTCSeconds()).padStart(2, "0");

			if (formatString === "HH:mm:ss") {
				return `${h}:${m}:${s}`;
			}

			if (formatString === "HH:mm") {
				return `${h}:${m}`;
			}

			return (actual as { formatDate: (...a: unknown[]) => string }).formatDate(value, formatString, ...rest);
		}
	};
});

const { DefaultCriteria, DefaultInputState } = TimeFilterState;

const FIELD_PATH = "/root/timeField";

function makeItem(options: Partial<OverviewModel.NewFilter.Time.Options> = {}): OverviewModel.NewFilter.Time.Item {
	return {
		id: "filter1",
		type: "time",
		options: {
			fieldId: FIELD_PATH,
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

function makeDocumentModel(): DocumentModel {
	return createDocumentModel([createField("TimeType", "timeField")]);
}

function input(text: string, value: Date | null, error?: string): TimeFilterState.InputState {
	return error !== undefined ? { input: text, value, error } : { input: text, value, error: null };
}

const NINE_AM = new Date("2020-01-01T09:00:00.000Z");
const FIVE_PM = new Date("2020-01-01T17:00:00.000Z");
const ELEVEN_PM = new Date("2020-01-01T23:00:00.000Z");
const ONE_AM = new Date("2020-01-02T01:00:00.000Z");

describe("TimeFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts time filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-time filter models", () => {
			const stringItem = {
				id: "f",
				type: "string",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(stringItem)).toBe(false);
		});
	});

	describe("createInitialOptions()", () => {
		it("derives empty toggle from configurable", () => {
			expect(controller.createInitialOptions(makeItem({ empty: { enabled: true, value: true } })).empty).toEqual({
				enabled: true,
				value: true
			});
		});

		it("derives invert toggle from configurable", () => {
			expect(controller.createInitialOptions(makeItem({ invert: { enabled: true, value: true } })).invert).toEqual({
				enabled: true,
				value: true
			});
		});

		it("selects the default range from configuration", () => {
			const initial = controller.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromTo", enabled: true },
						{ option: "fromOnly", enabled: true },
						{ option: "exact", default: true, enabled: true }
					]
				})
			);
			expect(initial.selectedRange).toBe("exact");
		});

		it("falls back to first configured range when none marked default", () => {
			const initial = controller.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromOnly", enabled: true },
						{ option: "toOnly", enabled: true }
					]
				})
			);
			expect(initial.selectedRange).toBe("fromOnly");
		});

		it("uses DefaultInputState for every segment when no preset is configured", () => {
			const initial = controller.createInitialOptions(makeItem());
			expect(initial.criteria).toEqual(DefaultCriteria);
		});

		it("derives criteria preset from the default range entry", () => {
			const initial = controller.createInitialOptions(
				makeItem({
					ranges: [
						{
							option: "fromTo",
							default: true,
							enabled: true,
							criteria: { from: "09:00", to: "17:00" }
						},
						{ option: "exact", enabled: true }
					]
				})
			);
			expect(initial.criteria.default.fromTo?.from.input).toBe("09:00");
			expect(initial.criteria.default.fromTo?.to.input).toBe("17:00");
			expect(initial.criteria.default.fromTo?.from.value).toEqual(new Date("09:00"));
			expect(initial.criteria.default.exact?.exact).toEqual(DefaultInputState);
			expect(initial.criteria.default.fromOnly).toBeUndefined();
		});
	});

	describe("toEffectiveOptions()", () => {
		it("flattens runtime options into the active range/criteria pair", () => {
			const runtime: TimeFilterState.Options = {
				empty: { enabled: false },
				invert: { enabled: true, value: false },
				selectedRange: "exact",
				criteria: { default: { ...DefaultCriteria.default, exact: { exact: input("12:00", NINE_AM) } } }
			};
			expect(controller.toEffectiveOptions(makeItem(), runtime)).toEqual({
				empty: { enabled: false },
				invert: { enabled: true, value: false },
				selectedRange: "exact",
				criteria: { exact: input("12:00", NINE_AM) }
			});
		});
	});

	describe("reset()", () => {
		it("restores the initial range and criteria into the runtime options", () => {
			const defaults: TimeFilterState.EffectiveOptions = {
				empty: { enabled: false },
				invert: { enabled: false },
				selectedRange: "fromTo",
				criteria: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
			};
			const runtime: TimeFilterState.Options = {
				empty: { enabled: false },
				invert: { enabled: false },
				selectedRange: "exact",
				criteria: {
					default: {
						fromTo: { from: input("00:00", null), to: input("23:00", ELEVEN_PM) },
						fromOnly: { from: DefaultInputState },
						toOnly: { to: DefaultInputState },
						exact: { exact: input("01:00", ONE_AM) }
					}
				}
			};

			const reset = controller.toResetOptions(makeItem(), runtime, defaults);

			expect(reset.selectedRange).toBe("fromTo");
			expect(reset.criteria.default.fromTo).toEqual(defaults.criteria);
			expect(reset.criteria.default.exact).toEqual(runtime.criteria.default.exact);
		});

		it("restores empty and invert toggles to initial defaults", () => {
			const defaults: TimeFilterState.EffectiveOptions = {
				empty: { enabled: true, value: false },
				invert: { enabled: true, value: false },
				selectedRange: "fromTo",
				criteria: { from: DefaultInputState, to: DefaultInputState }
			};
			const runtime: TimeFilterState.Options = {
				empty: { enabled: true, value: true },
				invert: { enabled: true, value: true },
				selectedRange: "fromTo",
				criteria: {
					default: {
						fromTo: { from: DefaultInputState, to: DefaultInputState },
						fromOnly: { from: DefaultInputState },
						toOnly: { to: DefaultInputState },
						exact: { exact: DefaultInputState }
					}
				}
			};

			const reset = controller.toResetOptions(makeItem(), runtime, defaults);

			expect(reset.empty).toEqual({ enabled: true, value: false });
			expect(reset.invert).toEqual({ enabled: true, value: false });
		});
	});

	describe("hasErrors()", () => {
		const baseOptions = (overrides: Partial<TimeFilterState.Options> = {}): TimeFilterState.Options => ({
			empty: { enabled: false },
			invert: { enabled: false },
			selectedRange: "fromTo",
			criteria: DefaultCriteria,
			...overrides
		});

		it("returns false when no segment carries an error and the range is valid", () => {
			expect(controller.hasErrors(makeItem(), baseOptions())).toBe(false);
		});

		it("returns true when a segment input has an error string", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					baseOptions({
						criteria: {
							default: {
								...DefaultCriteria.default,
								fromTo: { from: input("bad", null, "Invalid time"), to: DefaultInputState }
							}
						}
					})
				)
			).toBe(true);
		});

		it("returns true when FROM > TO in fromTo mode (general error)", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					baseOptions({
						criteria: {
							default: {
								...DefaultCriteria.default,
								fromTo: { from: input("17:00", FIVE_PM), to: input("09:00", NINE_AM) }
							}
						}
					})
				)
			).toBe(true);
		});

		it("ignores errors that live in non-selected range modes", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					baseOptions({
						selectedRange: "fromTo",
						criteria: { default: { ...DefaultCriteria.default, exact: { exact: input("xx", null, "Invalid time") } } }
					})
				)
			).toBe(false);
		});
	});

	describe("toOperator()", () => {
		const documentModel = makeDocumentModel();
		const ctx = { documentModel, fieldPath: FIELD_PATH } as { documentModel: DocumentModel } & Record<string, unknown>;

		const base = (overrides: Partial<TimeFilterState.Options> = {}): TimeFilterState.Options => ({
			empty: { enabled: false },
			invert: { enabled: false },
			selectedRange: "fromTo",
			criteria: DefaultCriteria,
			...overrides
		});

		it("returns undefined_match when empty toggle is enabled and value is true", () => {
			const op = controller.toOperator(makeItem(), base({ empty: { enabled: true, value: true } }), ctx as never);
			expect(op).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: FIELD_PATH
			});
		});

		it("wraps undefined_match with NOT when invert is on alongside empty", () => {
			const op = controller.toOperator(
				makeItem(),
				base({ empty: { enabled: true, value: true }, invert: { enabled: true, value: true } }),
				ctx as never
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("ignores empty when value is false (falls through to range)", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					empty: { enabled: true, value: false },
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
						}
					}
				}),
				ctx as never
			);
			expect(op?.operator).toBe(Query.OPERATORS.DATE_RANGE_OPERATOR);
		});

		it("returns undefined when no time has been entered (empty range)", () => {
			expect(controller.toOperator(makeItem(), base(), ctx as never)).toBeUndefined();
		});

		it("fromTo mode produces a date_range with both bounds", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
						}
					}
				}),
				ctx as never
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: FIELD_PATH
			});
			const range = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;
			expect(range.from).toBeDefined();
			expect(range.to).toBeDefined();
		});

		it("fromOnly mode produces a date_range with only the from bound", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					selectedRange: "fromOnly",
					criteria: { default: { ...DefaultCriteria.default, fromOnly: { from: input("09:00", NINE_AM) } } }
				}),
				ctx as never
			);
			const range = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;
			expect(range.from).toBeDefined();
			expect(range.to).toBeUndefined();
		});

		it("toOnly mode produces a date_range with only the to bound", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					selectedRange: "toOnly",
					criteria: { default: { ...DefaultCriteria.default, toOnly: { to: input("17:00", FIVE_PM) } } }
				}),
				ctx as never
			);
			const range = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;
			expect(range.from).toBeUndefined();
			expect(range.to).toBeDefined();
		});

		it("exact mode produces a date_range where both bounds resolve to the same instant", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					selectedRange: "exact",
					criteria: { default: { ...DefaultCriteria.default, exact: { exact: input("12:00", NINE_AM) } } }
				}),
				ctx as never
			);
			const range = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;
			expect(range.from).toBeDefined();
			expect(range.to).toBeDefined();
			expect(range.from).toEqual(range.to);
		});

		it("wraps date_range with NOT when invert is enabled", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					invert: { enabled: true, value: true },
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
						}
					}
				}),
				ctx as never
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("supports cross-midnight (wrap-around) time ranges as a plain date_range", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("23:00", ELEVEN_PM), to: input("01:00", ONE_AM) }
						}
					}
				}),
				ctx as never
			);
			expect(op?.operator).toBe(Query.OPERATORS.DATE_RANGE_OPERATOR);
		});
	});

	describe("toOperator() — golden output (Phase 0)", () => {
		const documentModel = makeDocumentModel();
		const ctx = { documentModel, fieldPath: FIELD_PATH } as { documentModel: DocumentModel } & Record<string, unknown>;

		type DateRangeOp = Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;

		const base = (overrides: Partial<TimeFilterState.Options> = {}): TimeFilterState.Options => ({
			empty: { enabled: false },
			invert: { enabled: false },
			selectedRange: "fromTo",
			criteria: DefaultCriteria,
			...overrides
		});

		it("fromTo emits both bounds as formatted strings (golden)", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
						}
					}
				}),
				ctx as never
			) as DateRangeOp;
			expect(op.from).toBe("09:00:00");
			expect(op.to).toBe("17:00:00");
		});

		it("fromOnly omits to bound but emits from as a formatted string", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					selectedRange: "fromOnly",
					criteria: { default: { ...DefaultCriteria.default, fromOnly: { from: input("09:00", NINE_AM) } } }
				}),
				ctx as never
			) as DateRangeOp;
			expect(op.to).toBeUndefined();
			expect(op.from).toBe("09:00:00");
		});

		it("toOnly omits from bound but emits to as a formatted string", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					selectedRange: "toOnly",
					criteria: { default: { ...DefaultCriteria.default, toOnly: { to: input("17:00", FIVE_PM) } } }
				}),
				ctx as never
			) as DateRangeOp;
			expect(op.from).toBeUndefined();
			expect(op.to).toBe("17:00:00");
		});

		it("exact emits identical from/to bounds (collapse to single instant)", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					selectedRange: "exact",
					criteria: { default: { ...DefaultCriteria.default, exact: { exact: input("12:00", NINE_AM) } } }
				}),
				ctx as never
			) as DateRangeOp;
			expect(op.from).toBe("09:00:00");
			expect(op.to).toBe("09:00:00");
		});

		it("empty + invert combo wraps undefined_match in NOT (golden shape)", () => {
			const op = controller.toOperator(
				makeItem(),
				base({ empty: { enabled: true, value: true }, invert: { enabled: true, value: true } }),
				ctx as never
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("populated range + invert wraps date_range in NOT", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					invert: { enabled: true, value: true },
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
						}
					}
				}),
				ctx as never
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("invert.enabled=false ignored regardless of value", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					invert: { enabled: false, value: true } as never,
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
						}
					}
				}),
				ctx as never
			);
			expect(op?.operator).toBe(Query.OPERATORS.DATE_RANGE_OPERATOR);
		});

		it("null value in fromTo.from drops the from bound only", () => {
			const op = controller.toOperator(
				makeItem(),
				base({
					criteria: {
						default: { ...DefaultCriteria.default, fromTo: { from: input("", null), to: input("17:00", FIVE_PM) } }
					}
				}),
				ctx as never
			) as DateRangeOp;
			expect(op.from).toBeUndefined();
			expect(op.to).toBe("17:00:00");
		});

		it("both bounds null returns undefined operator (no query produced)", () => {
			const op = controller.toOperator(makeItem(), base(), ctx as never);
			expect(op).toBeUndefined();
		});
	});

	describe("toLabel()", () => {
		const documentModel = makeDocumentModel();
		const ctx = {
			documentModel,
			locale: { language: "en" } as never,
			fieldPath: FIELD_PATH,
			formatValue: ({ value }: { value: unknown }) => String(value),
			localizeValue: ({ value }: { value: unknown }) => String(value),
			localizeResource: ({ key }: { key: string }) => key,
			getElementByPath: () => undefined,
			getDateTimeFormat: () => "HH:mm"
		};

		const base = (overrides: Partial<TimeFilterState.Options> = {}): TimeFilterState.Options => ({
			empty: { enabled: false },
			invert: { enabled: false },
			selectedRange: "fromTo",
			criteria: DefaultCriteria,
			...overrides
		});

		it("returns null when no time has been entered", () => {
			expect(controller.toLabel(makeItem(), base(), ctx)).toBeNull();
		});

		it("fromTo mode renders both bounds as a range", () => {
			expect(
				controller.toLabel(
					makeItem(),
					base({
						criteria: {
							default: {
								...DefaultCriteria.default,
								fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
							}
						}
					}),
					ctx
				)
			).toBe("09:00 - 17:00");
		});

		it("fromOnly mode renders the lower-bound prefix", () => {
			expect(
				controller.toLabel(
					makeItem(),
					base({
						selectedRange: "fromOnly",
						criteria: { default: { ...DefaultCriteria.default, fromOnly: { from: input("09:00", NINE_AM) } } }
					}),
					ctx
				)
			).toBe("≥ 09:00");
		});

		it("toOnly mode renders the upper-bound prefix", () => {
			expect(
				controller.toLabel(
					makeItem(),
					base({
						selectedRange: "toOnly",
						criteria: { default: { ...DefaultCriteria.default, toOnly: { to: input("17:00", FIVE_PM) } } }
					}),
					ctx
				)
			).toBe("≤ 17:00");
		});

		it("exact mode renders a single value (formatRange collapses identical bounds)", () => {
			expect(
				controller.toLabel(
					makeItem(),
					base({
						selectedRange: "exact",
						criteria: { default: { ...DefaultCriteria.default, exact: { exact: input("09:00", NINE_AM) } } }
					}),
					ctx
				)
			).toBe("09:00");
		});
	});

	describe("isConfigurable()", () => {
		it("is true when more than one range option is configured", () => {
			expect(controller.isConfigurable(makeItem())).toBe(true);
		});

		it("is true when empty is enabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when invert is enabled", () => {
			expect(controller.isConfigurable(makeItem({ invert: { enabled: true, value: false } }))).toBe(true);
		});

		it("is false when empty/invert disabled and only one range option", () => {
			expect(
				controller.isConfigurable(
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
		it("guards true for a time filter state", () => {
			const state = { model: makeItem() } as never;
			expect(TimeFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for a non-time filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(TimeFilterState.isInstance(state)).toBe(false);
		});
	});

	describe("toGeneralError()", () => {
		it("flags fromTo when from > to", () => {
			expect(
				controller.toGeneralError(makeItem(), {
					empty: { enabled: false },
					invert: { enabled: false },
					selectedRange: "fromTo",
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("17:00", FIVE_PM), to: input("09:00", NINE_AM) }
						}
					}
				})
			).not.toBeNull();
		});

		it("does not flag fromTo when from <= to", () => {
			expect(
				controller.toGeneralError(makeItem(), {
					empty: { enabled: false },
					invert: { enabled: false },
					selectedRange: "fromTo",
					criteria: {
						default: {
							...DefaultCriteria.default,
							fromTo: { from: input("09:00", NINE_AM), to: input("17:00", FIVE_PM) }
						}
					}
				})
			).toBeNull();
		});

		it("returns null for non-fromTo modes regardless of values", () => {
			expect(
				controller.toGeneralError(makeItem(), {
					empty: { enabled: false },
					invert: { enabled: false },
					selectedRange: "exact",
					criteria: { default: { ...DefaultCriteria.default, exact: { exact: input("12:00", NINE_AM) } } }
				})
			).toBeNull();
		});

		it("returns null when either bound is null", () => {
			const fromOnly = controller.toGeneralError(makeItem(), {
				empty: { enabled: false },
				invert: { enabled: false },
				selectedRange: "fromTo",
				criteria: {
					default: { ...DefaultCriteria.default, fromTo: { from: input("17:00", FIVE_PM), to: DefaultInputState } }
				}
			});

			expect(fromOnly).toBeNull();

			const toOnly = controller.toGeneralError(makeItem(), {
				empty: { enabled: false },
				invert: { enabled: false },
				selectedRange: "fromTo",
				criteria: {
					default: { ...DefaultCriteria.default, fromTo: { from: DefaultInputState, to: input("09:00", NINE_AM) } }
				}
			});

			expect(toOnly).toBeNull();
		});
	});
});
