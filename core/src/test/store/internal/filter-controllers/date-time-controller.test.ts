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

import { it, vi, expect, describe, afterEach, beforeAll, beforeEach } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OverviewModel } from "../../../../main/overview-model.js";
import { RangeCriteria } from "../../../../main/store/internal/filter-controllers/criteria.js";
import { DateTimeFilterController } from "../../../../main/store/internal/filter-controllers/date-time-controller.js";
import { DateFilterState, DateTimeFilterState } from "../../../../main/store/internal/filter-state.js";
import { getDocumentModel } from "../../../setup/models.js";

const controller = new DateTimeFilterController();
const { DefaultCriteria } = DateTimeFilterState;

let productDM: DocumentModel;

function withTimezone(tz: string): DocumentModel {
	return {
		...productDM,
		content: {
			...productDM.content,
			modelConfig: { ...productDM.content.modelConfig, timeZone: tz }
		}
	};
}

beforeAll(async () => {
	productDM = await getDocumentModel("product", "ProductDM");
});

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-04-25T12:00:00Z"));
});

afterEach(() => {
	vi.useRealTimers();
});

const DEFAULT_PERIODS: OverviewModel.NewFilter.DateTime.Options["periods"] = [
	{ option: "dateTime", default: true, enabled: true },
	{ option: "date", enabled: true },
	{ option: "time", enabled: true },
	{ option: "year", enabled: true },
	{ option: "yearMonth", enabled: true }
];

const DEFAULT_RANGES: OverviewModel.NewFilter.DateTime.Options["ranges"] = [
	{ option: "fromTo", default: true, enabled: true },
	{ option: "fromOnly", enabled: true },
	{ option: "toOnly", enabled: true },
	{ option: "exact", enabled: true }
];

function makeItem(
	overrides: Partial<OverviewModel.NewFilter.DateTime.Options> = {}
): OverviewModel.NewFilter.DateTime.Item {
	return {
		id: "filter1",
		type: "dateTime",
		options: {
			fieldId: "/product/dateTimeField",
			empty: { enabled: false },
			invert: { enabled: false },
			ranges: DEFAULT_RANGES,
			periods: DEFAULT_PERIODS,
			...overrides
		}
	};
}

const dateTimeFormats: Record<string, string> = {
	date: "yyyy-MM-dd",
	datetime: "yyyy-MM-dd'T'HH:mm:ss",
	time: "HH:mm:ss",
	year: "yyyy",
	monthYear: "yyyy-MM"
};

const getDateTimeFormat = ({ kind }: { kind: string }) => dateTimeFormats[kind] ?? "yyyy-MM-dd";

const noopServices = {
	formatValue: ({ value }: { value: unknown }) => String(value),
	localizeValue: ({ value }: { value: unknown }) => String(value),
	localizeResource: ({ key }: { key: string }) => key,
	getElementByPath: () => undefined
};

function dateInput(input: string): DateTimeFilterState.DateViewInputState {
	return { input, value: new Date(input), error: null };
}

function emptyDateInput(): DateTimeFilterState.DateViewInputState {
	return { input: "", value: null, error: null };
}

describe("DateTimeFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts dateTime filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-dateTime filter models", () => {
			const stringItem = {
				id: "f",
				type: "string",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(stringItem)).toBe(false);
		});

		it("rejects date filter models (different type discriminator)", () => {
			const dateItem = {
				id: "f",
				type: "date",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(dateItem)).toBe(false);
		});
	});

	describe("isInstance()", () => {
		it("guards true for dateTime filter state", () => {
			const state = { model: makeItem() } as never;
			expect(DateTimeFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-dateTime filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(DateTimeFilterState.isInstance(state)).toBe(false);
		});
	});

	describe("createInitialOptions()", () => {
		it("uses DefaultCriteria when no criteria configured", () => {
			expect(controller.createInitialOptions(makeItem()).criteria).toStrictEqual(DefaultCriteria);
		});

		it("derives empty/invert from configurable (disabled)", () => {
			const opts = controller.createInitialOptions(makeItem({ empty: { enabled: false }, invert: { enabled: false } }));
			expect(opts.empty).toEqual({ enabled: false });
			expect(opts.invert).toEqual({ enabled: false });
		});

		it("derives empty/invert from configurable (enabled with value)", () => {
			const opts = controller.createInitialOptions(
				makeItem({ empty: { enabled: true, value: true }, invert: { enabled: true, value: false } })
			);
			expect(opts.empty).toEqual({ enabled: true, value: true });
			expect(opts.invert).toEqual({ enabled: true, value: false });
		});

		it("uses default range from configuration", () => {
			const opts = controller.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromTo", enabled: true },
						{ option: "fromOnly", default: true, enabled: true },
						{ option: "toOnly", enabled: true },
						{ option: "exact", enabled: true }
					]
				})
			);
			expect(opts.selectedRange).toBe("fromOnly");
		});

		it("falls back to fromTo when no range marked default", () => {
			const opts = controller.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromTo", enabled: true },
						{ option: "fromOnly", enabled: true }
					]
				})
			);
			expect(opts.selectedRange).toBe("fromTo");
		});

		it("uses default period from configuration", () => {
			const opts = controller.createInitialOptions(
				makeItem({
					periods: [
						{ option: "dateTime", enabled: true },
						{ option: "date", default: true, enabled: true },
						{ option: "time", enabled: true }
					]
				})
			);
			expect(opts.selectedPeriod).toBe("date");
		});

		it("falls back to first period when none marked default", () => {
			const opts = controller.createInitialOptions(
				makeItem({
					periods: [
						{ option: "time", enabled: true },
						{ option: "date", enabled: true }
					]
				})
			);
			expect(opts.selectedPeriod).toBe("time");
		});

		it("falls back to DATE_TIME when periods list is empty", () => {
			const opts = controller.createInitialOptions(makeItem({ periods: [] }));
			expect(opts.selectedPeriod).toBe("dateTime");
		});
	});

	describe("toEffectiveOptions()", () => {
		it("flattens runtime options to selected (period, range, criteria) tuple", () => {
			const runtime = controller.createInitialOptions(makeItem());
			const eff = controller.toEffectiveOptions(makeItem(), runtime);
			expect(eff.selectedPeriod).toBe("dateTime");
			expect(eff.selectedRange).toBe("fromTo");
			expect(eff.criteria).toBe(runtime.criteria.dateTime.fromTo);
		});

		it("follows the currently-selected period when extracting criteria", () => {
			const runtime = controller.createInitialOptions(makeItem());
			const updated: DateTimeFilterState.Options = {
				...runtime,
				selectedPeriod: "time",
				selectedRange: "exact"
			};
			const eff = controller.toEffectiveOptions(makeItem(), updated);
			expect(eff.selectedPeriod).toBe("time");
			expect(eff.selectedRange).toBe("exact");
			expect(eff.criteria).toBe(updated.criteria.time.exact);
		});
	});

	describe("reset()", () => {
		it("restores selected period+range and replaces only that slot's criteria", () => {
			const initial = controller.createInitialOptions(makeItem());
			const polluted: DateTimeFilterState.Options = {
				...initial,
				selectedPeriod: "time",
				selectedRange: "exact",
				criteria: {
					...initial.criteria,
					dateTime: {
						...initial.criteria.dateTime,
						fromTo: { from: dateInput("2026-01-01T00:00:00"), to: dateInput("2026-12-31T23:59:59") }
					}
				}
			};

			const initialEff = controller.toEffectiveOptions(makeItem(), initial);
			const reset = controller.toResetOptions(makeItem(), polluted, initialEff);

			expect(reset.selectedPeriod).toBe("dateTime");
			expect(reset.selectedRange).toBe("fromTo");
			expect(reset.criteria.dateTime.fromTo).toBe(initialEff.criteria);
			expect(reset.criteria.time).toBe(polluted.criteria.time);
		});

		it("restores empty and invert toggles to initial defaults", () => {
			const initial = controller.createInitialOptions(makeItem());
			const polluted: DateTimeFilterState.Options = {
				...initial,
				empty: { enabled: true, value: true },
				invert: { enabled: true, value: true }
			};
			const initialEff = controller.toEffectiveOptions(makeItem(), initial);
			const reset = controller.toResetOptions(makeItem(), polluted, initialEff);
			expect(reset.empty).toEqual(initialEff.empty);
			expect(reset.invert).toEqual(initialEff.invert);
		});
	});

	describe("hasErrors()", () => {
		it("is false on a freshly-initialized filter (defaults)", () => {
			const opts = controller.createInitialOptions(makeItem());
			expect(controller.hasErrors(makeItem(), opts)).toBe(false);
		});

		it("is true when a DATE field input carries an error", () => {
			const opts = controller.createInitialOptions(makeItem());
			const tainted: DateTimeFilterState.Options = {
				...opts,
				selectedPeriod: "date",
				criteria: {
					...opts.criteria,
					date: {
						...opts.criteria.date,
						fromTo: {
							from: { input: "bogus", value: null, error: "invalid" },
							to: emptyDateInput()
						}
					}
				}
			};
			expect(controller.hasErrors(makeItem(), tainted)).toBe(true);
		});

		it("is true when DATE fromTo is inverted (from > to)", () => {
			const opts = controller.createInitialOptions(makeItem());
			const tainted: DateTimeFilterState.Options = {
				...opts,
				selectedPeriod: "date",
				criteria: {
					...opts.criteria,
					date: {
						...opts.criteria.date,
						fromTo: {
							from: dateInput("2026-12-31"),
							to: dateInput("2026-01-01")
						}
					}
				}
			};
			expect(controller.hasErrors(makeItem(), tainted)).toBe(true);
		});

		it("is false when DATE fromOnly is set with no upper bound (no order to violate)", () => {
			const opts = controller.createInitialOptions(makeItem());
			const single: DateTimeFilterState.Options = {
				...opts,
				selectedRange: "fromOnly",
				selectedPeriod: "date",
				criteria: {
					...opts.criteria,
					date: { ...opts.criteria.date, fromOnly: { from: dateInput("2026-12-31") } }
				}
			};
			expect(controller.hasErrors(makeItem(), single)).toBe(false);
		});

		it("is true when YEAR fromTo has from > to", () => {
			const opts = controller.createInitialOptions(makeItem());
			const tainted: DateTimeFilterState.Options = {
				...opts,
				selectedPeriod: "year",
				criteria: {
					...opts.criteria,
					year: {
						...opts.criteria.year,
						fromTo: { from: { value: 2030, error: null }, to: { value: 2020, error: null } }
					}
				}
			};
			expect(controller.hasErrors(makeItem(), tainted)).toBe(true);
		});

		it("is true when YEAR_MONTH fromTo has from > to", () => {
			const opts = controller.createInitialOptions(makeItem());
			const tainted: DateTimeFilterState.Options = {
				...opts,
				selectedPeriod: "yearMonth",
				criteria: {
					...opts.criteria,
					yearMonth: {
						...opts.criteria.yearMonth,
						fromTo: {
							from: { value: { year: 2026, month: 5 }, error: null },
							to: { value: { year: 2026, month: 1 }, error: null }
						}
					}
				}
			};
			expect(controller.hasErrors(makeItem(), tainted)).toBe(true);
		});

		it("is true when MONTH fromTo has from > to", () => {
			const opts = controller.createInitialOptions(makeItem());
			const tainted: DateTimeFilterState.Options = {
				...opts,
				selectedPeriod: "month",
				criteria: {
					...opts.criteria,
					month: {
						...opts.criteria.month,
						fromTo: { from: { value: 5 }, to: { value: 1 } }
					}
				}
			};
			expect(controller.hasErrors(makeItem(), tainted)).toBe(true);
		});

		it("is false when MONTH fromTo has from <= to", () => {
			const opts = controller.createInitialOptions(makeItem());
			const valid: DateTimeFilterState.Options = {
				...opts,
				selectedPeriod: "month",
				criteria: {
					...opts.criteria,
					month: {
						...opts.criteria.month,
						fromTo: { from: { value: 1 }, to: { value: 5 } }
					}
				}
			};
			expect(controller.hasErrors(makeItem(), valid)).toBe(false);
		});
	});

	describe("isConfigurable()", () => {
		it("is true with default ranges/periods (multi-entry)", () => {
			expect(controller.isConfigurable(makeItem())).toBe(true);
		});

		it("is true when empty is enabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when invert is enabled", () => {
			expect(controller.isConfigurable(makeItem({ invert: { enabled: true, value: false } }))).toBe(true);
		});

		it("is false when empty/invert disabled and only one range/period option", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						empty: { enabled: false },
						invert: { enabled: false },
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						periods: [{ option: "dateTime", default: true, enabled: true }]
					})
				)
			).toBe(false);
		});
	});

	describe("toOperator()", () => {
		const ctxFor = (dm: DocumentModel) => ({
			documentModel: dm,
			locale: { language: "en" } as never,
			fieldPath: "/product/dateTimeField"
		});

		it("returns undefined_match when empty toggle is enabled+true", () => {
			const opts = controller.createInitialOptions(makeItem({ empty: { enabled: true, value: true } }));
			const op = controller.toOperator(makeItem({ empty: { enabled: true, value: true } }), opts, ctxFor(productDM));
			expect(op).toEqual({ operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: "/product/dateTimeField" });
		});

		it("wraps undefined_match in NOT when invert is enabled+true", () => {
			const item = makeItem({
				empty: { enabled: true, value: true },
				invert: { enabled: true, value: true }
			});
			const opts = controller.createInitialOptions(item);
			const op = controller.toOperator(item, opts, ctxFor(productDM));
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});

		it("returns undefined when no criteria are set (empty fromTo)", () => {
			const item = makeItem();
			const opts = controller.createInitialOptions(item);
			const op = controller.toOperator(item, opts, ctxFor(productDM));
			expect(op).toBeUndefined();
		});

		it("DATE_TIME fromTo: emits date_range with both bounds (UTC timezone)", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				criteria: {
					...DefaultCriteria,
					dateTime: {
						...DefaultCriteria.dateTime,
						fromTo: {
							from: dateInput("2026-01-01T08:00:00Z"),
							to: dateInput("2026-12-31T17:00:00Z")
						}
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC")));
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: "/product/dateTimeField"
			});
			const range = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;
			expect(range.from).toBe("2026-01-01T08:00:00");
			expect(range.to).toBe("2026-12-31T17:00:00");
		});

		it("DATE_TIME fromTo: timezone shifts the rendered ISO local string", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				criteria: {
					...DefaultCriteria,
					dateTime: {
						...DefaultCriteria.dateTime,
						fromTo: {
							from: dateInput("2026-01-01T08:00:00Z"),
							to: dateInput("2026-12-31T17:00:00Z")
						}
					}
				}
			};
			const utcOp = controller.toOperator(item, opts, ctxFor(withTimezone("UTC")));
			const laOp = controller.toOperator(item, opts, ctxFor(withTimezone("America/Los_Angeles")));
			const utcRange = utcOp as Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;
			const laRange = laOp as Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;
			expect(utcRange.from).not.toBe(laRange.from);
			expect(utcRange.to).not.toBe(laRange.to);
		});

		it("DATE_TIME fromOnly: emits only a from bound", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedRange: "fromOnly",
				criteria: {
					...DefaultCriteria,
					dateTime: {
						...DefaultCriteria.dateTime,
						fromOnly: { from: dateInput("2026-06-15T10:00:00Z") }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.operator).toBe(Query.OPERATORS.DATE_RANGE_OPERATOR);
			expect(op.from).toBe("2026-06-15T10:00:00");
			expect(op.to).toBeUndefined();
		});

		it("DATE_TIME toOnly: emits only a to bound", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedRange: "toOnly",
				criteria: {
					...DefaultCriteria,
					dateTime: {
						...DefaultCriteria.dateTime,
						toOnly: { to: dateInput("2026-06-15T10:00:00Z") }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toBeUndefined();
			expect(op.to).toBe("2026-06-15T10:00:00");
		});

		it("DATE_TIME exact: from and to collapse to the same instant", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedRange: "exact",
				criteria: {
					...DefaultCriteria,
					dateTime: {
						...DefaultCriteria.dateTime,
						exact: { exact: dateInput("2026-06-15T10:00:00Z") }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toBe("2026-06-15T10:00:00");
			expect(op.to).toBe("2026-06-15T10:00:00");
		});

		it("YEAR fromTo: pads from to start-of-year and to to end-of-year (UTC)", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "year",
				criteria: {
					...DefaultCriteria,
					year: {
						...DefaultCriteria.year,
						fromTo: { from: { value: 2026, error: null }, to: { value: 2027, error: null } }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toMatch(/^2026-01-01T00:00:00$/);
			expect(op.to).toMatch(/^2027-12-31T23:59:59$/);
		});

		it("YEAR_MONTH fromTo: pads to start-of-month and end-of-month (UTC)", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "yearMonth",
				criteria: {
					...DefaultCriteria,
					yearMonth: {
						...DefaultCriteria.yearMonth,
						fromTo: {
							from: { value: { year: 2026, month: 0 }, error: null },
							to: { value: { year: 2026, month: 11 }, error: null }
						}
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toMatch(/^2026-01-01T00:00:00$/);
			expect(op.to).toMatch(/^2026-12-31T23:59:59$/);
		});

		it("MONTH fromTo: pads to first/last moment of selected month in current year (UTC)", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "month",
				criteria: {
					...DefaultCriteria,
					month: {
						...DefaultCriteria.month,
						fromTo: { from: { value: 0 }, to: { value: 11 } }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toMatch(/^2026-01-01T00:00:00$/);
			expect(op.to).toMatch(/^2026-12-31T23:59:59$/);
		});

		it("MONTH exact: from=start of month, to=end of same month (current year)", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedRange: "exact",
				selectedPeriod: "month",
				criteria: {
					...DefaultCriteria,
					month: {
						...DefaultCriteria.month,
						exact: { exact: { value: 3 } }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toMatch(/^2026-04-01T00:00:00$/);
			expect(op.to).toMatch(/^2026-04-30T23:59:59$/);
		});

		it("DATE fromTo: pads to start/end of selected day (UTC)", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "date",
				criteria: {
					...DefaultCriteria,
					date: {
						...DefaultCriteria.date,
						fromTo: { from: dateInput("2026-04-25T00:00:00Z"), to: dateInput("2026-04-25T00:00:00Z") }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toMatch(/^2026-04-25T00:00:00$/);
			expect(op.to).toMatch(/^2026-04-25T23:59:59$/);
		});

		it("TIME fromTo: emits formatted dates as-is (no padding)", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "time",
				criteria: {
					...DefaultCriteria,
					time: {
						...DefaultCriteria.time,
						fromTo: { from: dateInput("2026-04-25T08:00:00Z"), to: dateInput("2026-04-25T17:30:00Z") }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as Extract<
				Query.Operator,
				{ operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }
			>;
			expect(op.from).toBe("2026-04-25T08:00:00");
			expect(op.to).toBe("2026-04-25T17:30:00");
		});

		it("invert wraps the date_range in a NOT operator", () => {
			const item = makeItem({ invert: { enabled: true, value: true } });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				criteria: {
					...DefaultCriteria,
					dateTime: {
						...DefaultCriteria.dateTime,
						fromTo: { from: dateInput("2026-01-01T00:00:00Z"), to: dateInput("2026-12-31T23:59:59Z") }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC")));
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});
	});

	describe("toOperator() — Phase 0 regression net", () => {
		const ctxFor = (dm: DocumentModel) => ({
			documentModel: dm,
			locale: { language: "en" } as never,
			fieldPath: "/product/dateTimeField"
		});

		type DateRangeOp = Extract<Query.Operator, { operator: typeof Query.OPERATORS.DATE_RANGE_OPERATOR }>;

		it("MONTH period value=0 (January) emits start-of-January, not undefined", () => {
			const item = makeItem({
				ranges: DEFAULT_RANGES,
				periods: DEFAULT_PERIODS
			});
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "month",
				selectedRange: "fromOnly",
				criteria: {
					...DefaultCriteria,
					month: { ...DefaultCriteria.month, fromOnly: { from: { value: 0 } } }
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as DateRangeOp;
			expect(op.from).toBeDefined();
			expect(op.from).toMatch(/-01-01T00:00:00$/);
		});

		it("MONTH period value=0 (January) toOnly emits end-of-January", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "month",
				selectedRange: "toOnly",
				criteria: {
					...DefaultCriteria,
					month: { ...DefaultCriteria.month, toOnly: { to: { value: 0 } } }
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as DateRangeOp;
			expect(op.to).toBeDefined();
			expect(op.to).toMatch(/-01-31T23:59:59$/);
		});

		it("TIME period and DATE_TIME period produce identical bounds for the same Date input (pin duplicated branches)", () => {
			const item = makeItem();
			const sharedDate = dateInput("2026-04-25T12:34:56Z");

			const timeOpts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "time",
				selectedRange: "fromTo",
				criteria: {
					...DefaultCriteria,
					time: { ...DefaultCriteria.time, fromTo: { from: sharedDate, to: sharedDate } }
				}
			};
			const dateTimeOpts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "dateTime",
				selectedRange: "fromTo",
				criteria: {
					...DefaultCriteria,
					dateTime: { ...DefaultCriteria.dateTime, fromTo: { from: sharedDate, to: sharedDate } }
				}
			};

			const timeOp = controller.toOperator(item, timeOpts, ctxFor(withTimezone("UTC"))) as DateRangeOp;
			const dateTimeOp = controller.toOperator(item, dateTimeOpts, ctxFor(withTimezone("UTC"))) as DateRangeOp;

			expect(timeOp.from).toBe(dateTimeOp.from);
			expect(timeOp.to).toBe(dateTimeOp.to);
		});

		it("YEAR fromTo with null 'to' drops only the to bound", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "year",
				selectedRange: "fromTo",
				criteria: {
					...DefaultCriteria,
					year: {
						...DefaultCriteria.year,
						fromTo: { from: { value: 2026, error: null }, to: { value: null, error: null } }
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as DateRangeOp;
			expect(op.from).toBeDefined();
			expect(op.to).toBeUndefined();
		});

		it("YEAR_MONTH fromTo with empty 'from.value' drops only the from bound", () => {
			const item = makeItem();
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "yearMonth",
				selectedRange: "fromTo",
				criteria: {
					...DefaultCriteria,
					yearMonth: {
						...DefaultCriteria.yearMonth,
						fromTo: {
							from: { value: { year: null, month: null }, error: null },
							to: { value: { year: 2026, month: 5 }, error: null }
						}
					}
				}
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC"))) as DateRangeOp;
			expect(op.from).toBeUndefined();
			expect(op.to).toBeDefined();
		});

		it("empty + invert combo wraps undefined_match in NOT (pin shape)", () => {
			const item = makeItem({
				empty: { enabled: true, value: true },
				invert: { enabled: true, value: true }
			});
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item)
			};
			const op = controller.toOperator(item, opts, ctxFor(withTimezone("UTC")));
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
		});
	});

	describe("toLabel()", () => {
		const labelCtx = (dm: DocumentModel) => ({
			documentModel: dm,
			locale: { language: "en" } as never,
			getDateTimeFormat: getDateTimeFormat as never,
			fieldPath: "/product/dateTimeField",
			...noopServices
		});

		it("returns null when no criteria are set", () => {
			const item = makeItem();
			const opts = controller.createInitialOptions(item);
			expect(controller.toLabel(item, opts, labelCtx(productDM))).toBeNull();
		});

		it("DATE period: formats both bounds as yyyy-MM-dd", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "date",
				criteria: {
					...DefaultCriteria,
					date: {
						...DefaultCriteria.date,
						fromTo: { from: dateInput("2026-01-01T00:00:00Z"), to: dateInput("2026-12-31T00:00:00Z") }
					}
				}
			};
			const label = controller.toLabel(item, opts, labelCtx(withTimezone("UTC")));
			expect(label).toContain("2026-01-01");
			expect(label).toContain("2026-12-31");
		});

		it("YEAR period: formats with yyyy and joins as a range", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "year",
				criteria: {
					...DefaultCriteria,
					year: {
						...DefaultCriteria.year,
						fromTo: { from: { value: 2025, error: null }, to: { value: 2027, error: null } }
					}
				}
			};
			const label = controller.toLabel(item, opts, labelCtx(withTimezone("UTC")));
			expect(label).toContain("2025");
			expect(label).toContain("2027");
		});

		it("YEAR period fromOnly: renders as a one-sided range", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "year",
				selectedRange: "fromOnly",
				criteria: {
					...DefaultCriteria,
					year: { ...DefaultCriteria.year, fromOnly: { from: { value: 2025, error: null } } }
				}
			};
			const label = controller.toLabel(item, opts, labelCtx(withTimezone("UTC")));
			expect(label).toMatch(/^≥/);
			expect(label).toContain("2025");
		});

		it("YEAR_MONTH period: emits a yyyy-MM range", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "yearMonth",
				criteria: {
					...DefaultCriteria,
					yearMonth: {
						...DefaultCriteria.yearMonth,
						fromTo: {
							from: { value: { year: 2026, month: 0 }, error: null },
							to: { value: { year: 2026, month: 11 }, error: null }
						}
					}
				}
			};
			const label = controller.toLabel(item, opts, labelCtx(withTimezone("UTC")));
			expect(label).toContain("2026-01");
			expect(label).toContain("2026-12");
		});

		it("MONTH period: emits a yyyy-MM range using the current year", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "month",
				criteria: {
					...DefaultCriteria,
					month: {
						...DefaultCriteria.month,
						fromTo: { from: { value: 0 }, to: { value: 11 } }
					}
				}
			};
			const label = controller.toLabel(item, opts, labelCtx(withTimezone("UTC")));
			expect(label).toContain("2026-01");
			expect(label).toContain("2026-12");
		});

		it("TIME period: emits HH:mm:ss strings", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				selectedPeriod: "time",
				criteria: {
					...DefaultCriteria,
					time: {
						...DefaultCriteria.time,
						fromTo: { from: dateInput("2026-04-25T08:30:00Z"), to: dateInput("2026-04-25T17:45:00Z") }
					}
				}
			};
			const label = controller.toLabel(item, opts, labelCtx(withTimezone("UTC")));
			expect(label).toContain("08:30:00");
			expect(label).toContain("17:45:00");
		});

		it("DATE_TIME period: delegates to converter.formatValue for both bounds", () => {
			const item = makeItem({ fieldId: "/product/dateTimeField" });
			const opts: DateTimeFilterState.Options = {
				...controller.createInitialOptions(item),
				criteria: {
					...DefaultCriteria,
					dateTime: {
						...DefaultCriteria.dateTime,
						fromTo: { from: dateInput("2026-01-01T08:00:00Z"), to: dateInput("2026-12-31T17:00:00Z") }
					}
				}
			};
			const seen: unknown[] = [];
			const localCtx = {
				...labelCtx(productDM),
				formatValue: ({ value }: { value: unknown }) => {
					seen.push(value);

					return `formatted(${(value as Date).toISOString()})`;
				}
			};
			const label = controller.toLabel(item, opts, localCtx);
			expect(seen).toHaveLength(2);
			expect(label).toContain("formatted(2026-01-01T08:00:00.000Z)");
			expect(label).toContain("formatted(2026-12-31T17:00:00.000Z)");
		});
	});

	describe("toGeneralError()", () => {
		it("returns null when range is not fromTo", () => {
			const opts = controller.createInitialOptions(makeItem());
			const state = {
				model: makeItem(),
				options: { ...opts, selectedRange: "fromOnly" }
			} as DateTimeFilterState.State;
			expect(controller.toGeneralError(state.model, state.options)).toBeNull();
		});

		it("returns null when no criteria error exists in fromTo", () => {
			const opts = controller.createInitialOptions(makeItem());
			const state = { model: makeItem(), options: opts } as DateTimeFilterState.State;
			expect(controller.toGeneralError(state.model, state.options)).toBeNull();
		});

		it("returns startGreaterThanEnd key when YEAR fromTo is inverted", () => {
			const opts = controller.createInitialOptions(makeItem());
			const state = {
				model: makeItem(),
				options: {
					...opts,
					selectedPeriod: "year",
					criteria: {
						...opts.criteria,
						year: {
							...opts.criteria.year,
							fromTo: { from: { value: 2030 }, to: { value: 2020 } }
						}
					}
				}
			} as DateTimeFilterState.State;
			expect(controller.toGeneralError(state.model, state.options)).not.toBeNull();
		});

		it("returns startGreaterThanEnd key when DATE fromTo is inverted (no field-level errors)", () => {
			const opts = controller.createInitialOptions(makeItem());
			const state = {
				model: makeItem(),
				options: {
					...opts,
					selectedPeriod: "date",
					criteria: {
						...opts.criteria,
						date: {
							...opts.criteria.date,
							fromTo: { from: dateInput("2026-12-31"), to: dateInput("2026-01-01") }
						}
					}
				}
			} as DateTimeFilterState.State;
			expect(controller.toGeneralError(state.model, state.options)).not.toBeNull();
		});

		it("returns startGreaterThanEnd key when MONTH fromTo is inverted", () => {
			const opts = controller.createInitialOptions(makeItem());
			const state = {
				model: makeItem(),
				options: {
					...opts,
					selectedPeriod: "month",
					criteria: {
						...opts.criteria,
						month: {
							...opts.criteria.month,
							fromTo: { from: { value: 5 }, to: { value: 1 } }
						}
					}
				}
			} as DateTimeFilterState.State;
			expect(controller.toGeneralError(state.model, state.options)).not.toBeNull();
		});
	});

	describe("DefaultCriteria", () => {
		it("includes all six period buckets pre-initialized to default range modes", () => {
			expect(Object.keys(DefaultCriteria).sort()).toEqual(["date", "dateTime", "month", "time", "year", "yearMonth"]);
		});

		it("re-exports DateFilterState input defaults under aliased names", () => {
			expect(DateTimeFilterState.DefaultDateViewInputState).toBe(DateFilterState.DefaultDateViewInputState);
			expect(DateTimeFilterState.DefaultYearViewInputState).toBe(DateFilterState.DefaultYearViewInputState);
			expect(DateTimeFilterState.DefaultYearMonthViewInputState).toBe(DateFilterState.DefaultYearMonthViewInputState);
			expect(DateTimeFilterState.DefaultTimeViewInputState).toBe(DateFilterState.DefaultDateViewInputState);
			expect(DateTimeFilterState.DefaultDateTimeViewInputState).toBe(DateFilterState.DefaultDateViewInputState);
		});
	});

	describe("RangeCriteria.resolve (sanity for date-time controller usage)", () => {
		it("fromTo yields [from, to]", () => {
			const c = RangeCriteria.create<{ value: number | null }>({ value: null });
			const populated = { ...c, fromTo: { from: { value: 1 }, to: { value: 2 } } };
			expect(RangeCriteria.resolve(populated, "fromTo").asValues()).toEqual([{ value: 1 }, { value: 2 }]);
		});

		it("exact yields [exact, exact]", () => {
			const c = RangeCriteria.create<{ value: number | null }>({ value: null });
			const populated = { ...c, exact: { exact: { value: 42 } } };
			expect(RangeCriteria.resolve(populated, "exact").asValues()).toEqual([{ value: 42 }, { value: 42 }]);
		});
	});
});
