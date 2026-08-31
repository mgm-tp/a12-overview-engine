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

import type { DocumentModelTypedField } from "../../../../main/models/index.js";
import type { FormatTypedDateFragmentType } from "../../../../main/models/internal/shared.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { RangeCriteria } from "../../../../main/store/internal/filter-controllers/criteria.js";
import {
	derivePeriodOptions,
	DateFragmentFilterController
} from "../../../../main/store/internal/filter-controllers/date-fragment-controller.js";
import { DateFragmentFilterState } from "../../../../main/store/internal/filter-state.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

const controller = new DateFragmentFilterController();

type PeriodInputMap = DateFragmentFilterState.PeriodInputMap;

function defaultPeriodInput<P extends keyof PeriodInputMap>(period: P): PeriodInputMap[P] {
	switch (period) {
		case "yearMonth":
			return { value: { year: null, month: null }, error: null } as PeriodInputMap[P];
		case "year":
			return { value: null, error: null } as PeriodInputMap[P];
		case "month":
			return { value: null } as PeriodInputMap[P];
		case "monthDay":
			return { value: null, input: "", error: null } as PeriodInputMap[P];
		default:
			throw new Error(`Unsupported format: ${period}`);
	}
}

function createDefaultCriteria<P extends keyof PeriodInputMap>(period: P): RangeCriteria<PeriodInputMap[P]> {
	return RangeCriteria.create(defaultPeriodInput(period)) as RangeCriteria<PeriodInputMap[P]>;
}

type FragmentFormat = FormatTypedDateFragmentType["formatOfFragment"];

function makeItem(
	options: Partial<OverviewModel.NewFilter.DateFragment.Options> = {}
): OverviewModel.NewFilter.DateFragment.Item {
	return {
		id: "filter1",
		type: "dateFragment",
		options: {
			fieldId: ProductFieldIds.releaseMonth.id,
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

function makeElement(formatOfFragment: FragmentFormat): DocumentModelTypedField<FormatTypedDateFragmentType> {
	return {
		fieldType: { formatOfFragment }
	} as unknown as DocumentModelTypedField<FormatTypedDateFragmentType>;
}

function makeOptions<Format extends keyof PeriodInputMap>(
	format: Format,
	overrides: { criteria?: RangeCriteria<PeriodInputMap[Format]> } & Omit<
		Partial<DateFragmentFilterState.Options>,
		"criteria"
	> = {}
): DateFragmentFilterState.Options {
	const { criteria: periodCriteria, ...rest } = overrides;
	const allPeriods: readonly (keyof PeriodInputMap)[] = ["yearMonth", "year", "month", "monthDay"];
	const fullCriteria = Object.fromEntries(
		allPeriods.map((p) => [p, p === format && periodCriteria ? periodCriteria : createDefaultCriteria(p)])
	) as DateFragmentFilterState.Criteria;

	return {
		empty: { enabled: false } as const,
		invert: { enabled: false } as const,
		selectedRange: "fromTo" as OverviewModel.NewFilter.RangeOption,
		selectedPeriod: format,
		criteria: fullCriteria,
		...rest
	} as DateFragmentFilterState.Options;
}

const labelCtx = {
	documentModel: { content: { modelConfig: { timeZone: "UTC" } } } as never,
	locale: enUS,
	fieldPath: ProductFieldIds.releaseMonth.path,
	formatValue: ({ value }: { value: unknown }) =>
		`formatted(${value instanceof Date ? value.toISOString() : String(value)})`,
	localizeValue: ({ value }: { value: unknown }) => String(value),
	localizeResource: ({ key }: { key: string }) => key,
	getElementByPath: () => undefined,
	getDateTimeFormat: () => "yyyy-MM-dd"
} as never;

const operatorCtx = {
	documentModel: { content: { modelConfig: { timeZone: "UTC" } } } as never,
	locale: {} as never,
	fieldPath: ProductFieldIds.releaseMonth.path
};

describe("DateFragmentFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts dateFragment filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-dateFragment filter models", () => {
			const stringItem = {
				id: "f",
				type: "string",
				options: {} as never
			} as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(stringItem)).toBe(false);
		});
	});

	describe("createInitialOptions()", () => {
		it("derives empty/invert from configurable (disabled)", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("yyyy-MM"));
			expect(init.empty).toEqual({ enabled: false });
			expect(init.invert).toEqual({ enabled: false });
		});

		it("derives empty/invert from configurable (enabled with value)", () => {
			const init = controller.createInitialOptions(
				makeItem({ empty: { enabled: true, value: true }, invert: { enabled: true, value: false } }),
				makeElement("yyyy-MM")
			);
			expect(init.empty).toEqual({ enabled: true, value: true });
			expect(init.invert).toEqual({ enabled: true, value: false });
		});

		it("populates selectedRange from configuration default", () => {
			const init = controller.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromTo", enabled: true },
						{ option: "exact", default: true, enabled: true }
					]
				}),
				makeElement("yyyy")
			);
			expect(init.selectedRange).toBe("exact");
		});

		it("falls back to first configured range when none marked default", () => {
			const init = controller.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromOnly", enabled: true },
						{ option: "toOnly", enabled: true }
					]
				}),
				makeElement("MM")
			);
			expect(init.selectedRange).toBe("fromOnly");
		});

		it("uses YEAR_MONTH format with default {year:null,month:null} criteria for 'yyyy-MM' fragment", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("yyyy-MM"));
			expect(init.selectedPeriod).toBe("yearMonth");
			expect(init.criteria[init.selectedPeriod]?.fromTo?.from).toEqual({
				value: { year: null, month: null },
				error: null
			});
			expect(init.criteria[init.selectedPeriod]?.exact?.exact).toEqual({
				value: { year: null, month: null },
				error: null
			});
		});

		it("uses YEAR format with default {value:null} criteria for 'yyyy' fragment", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("yyyy"));
			expect(init.selectedPeriod).toBe("year");
			expect(init.criteria[init.selectedPeriod]?.fromTo?.from).toEqual({ value: null, error: null });
			expect(init.criteria[init.selectedPeriod]?.exact?.exact).toEqual({ value: null, error: null });
		});

		it("uses MONTH format with default {value:null} criteria for 'MM' fragment", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("MM"));
			expect(init.selectedPeriod).toBe("month");
			expect(init.criteria[init.selectedPeriod]?.fromTo?.to).toEqual({ value: null });
		});

		it("uses MONTH_DAY format with default {value:null,input:''} criteria for 'MM-dd' fragment", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("MM-dd"));
			expect(init.selectedPeriod).toBe("monthDay");
			expect(init.criteria[init.selectedPeriod]?.fromTo?.from).toEqual({ value: null, input: "", error: null });
		});

		it("throws on unsupported format", () => {
			expect(() =>
				controller.createInitialOptions(makeItem(), makeElement("dd-MM" as unknown as FragmentFormat))
			).toThrow(/Unsupported DateFragment format/);
		});

		describe("periods state", () => {
			it("derives selectedPeriod 'year' for 'yyyy' fragment when config omitted", () => {
				const init = controller.createInitialOptions(makeItem(), makeElement("yyyy"));
				expect(init.selectedPeriod).toBe("year");
			});

			it("derives selectedPeriod 'month' for 'MM' fragment when config omitted", () => {
				const init = controller.createInitialOptions(makeItem(), makeElement("MM"));
				expect(init.selectedPeriod).toBe("month");
			});

			it("derives selectedPeriod 'monthDay' for 'MM-dd' fragment when config omitted", () => {
				const init = controller.createInitialOptions(makeItem(), makeElement("MM-dd"));
				expect(init.selectedPeriod).toBe("monthDay");
			});

			it("defaults 'yyyy-MM' fragment selectedPeriod to 'yearMonth' when periods config omitted", () => {
				const init = controller.createInitialOptions(makeItem(), makeElement("yyyy-MM"));
				expect(init.selectedPeriod).toBe("yearMonth");
			});

			it("honors configured single-period entry for 'yyyy' fragment", () => {
				const init = controller.createInitialOptions(
					makeItem({ periods: [{ option: "year", default: true, enabled: true }] }),
					makeElement("yyyy")
				);
				expect(init.selectedPeriod).toBe("year");
			});

			it("filters configured periods to fragment-allowed set (drops mismatched entries)", () => {
				const init = controller.createInitialOptions(
					makeItem({
						periods: [
							{ option: "month", enabled: true },
							{ option: "year", default: true, enabled: true }
						] as OverviewModel.NewFilter.DateFragment.Options["periods"]
					}),
					makeElement("yyyy")
				);
				expect(init.selectedPeriod).toBe("year");
			});

			it("falls back to fragment default option when configured periods are entirely invalid", () => {
				const init = controller.createInitialOptions(
					makeItem({
						periods: [{ option: "year", enabled: true }] as OverviewModel.NewFilter.DateFragment.Options["periods"]
					}),
					makeElement("MM")
				);
				expect(init.selectedPeriod).toBe("month");
			});
		});

		describe("derivePeriodOptions()", () => {
			it("returns fragment-allowed options when config omitted", () => {
				expect(derivePeriodOptions(undefined, "yyyy").availableOptions).toEqual(["year"]);
				expect(derivePeriodOptions(undefined, "MM").availableOptions).toEqual(["month"]);
				expect(derivePeriodOptions(undefined, "MM-dd").availableOptions).toEqual(["monthDay"]);
				expect(derivePeriodOptions(undefined, "yyyy-MM").availableOptions).toEqual(["yearMonth"]);
			});

			it("intersects configured periods with fragment-allowed set", () => {
				const result = derivePeriodOptions(
					[
						{ option: "year", enabled: true },
						{ option: "month", enabled: true },
						{ option: "yearMonth", default: true, enabled: true }
					],
					"yyyy-MM"
				);
				expect(result.availableOptions).toEqual(["year", "month", "yearMonth"]);
				expect(result.defaultOption).toBe("yearMonth");
			});

			it("falls back to first available option when no default marked", () => {
				const result = derivePeriodOptions(
					[
						{ option: "year", enabled: true },
						{ option: "yearMonth", enabled: true }
					],
					"yyyy-MM"
				);
				expect(result.defaultOption).toBe("year");
			});
		});

		describe("periods state — multi-period 'yyyy-MM'", () => {
			it("default-marked entry seeds selectedPeriod", () => {
				const init = controller.createInitialOptions(
					makeItem({
						periods: [
							{ option: "year", enabled: true },
							{ option: "month", enabled: true },
							{ option: "yearMonth", default: true, enabled: true }
						] as OverviewModel.NewFilter.DateFragment.Options["periods"]
					}),
					makeElement("yyyy-MM")
				);
				expect(init.selectedPeriod).toBe("yearMonth");
			});

			it("falls back to first configured period when no entry marked default", () => {
				const init = controller.createInitialOptions(
					makeItem({
						periods: [
							{ option: "year", enabled: true },
							{ option: "yearMonth", enabled: true }
						] as OverviewModel.NewFilter.DateFragment.Options["periods"]
					}),
					makeElement("yyyy-MM")
				);
				expect(init.selectedPeriod).toBe("year");
			});

			it("derives YEAR criteria when configured default is 'year'", () => {
				const init = controller.createInitialOptions(
					makeItem({
						periods: [
							{ option: "year", default: true, enabled: true },
							{ option: "yearMonth", enabled: true }
						] as OverviewModel.NewFilter.DateFragment.Options["periods"]
					}),
					makeElement("yyyy-MM")
				);
				expect(init.selectedPeriod).toBe("year");
				expect(init.selectedPeriod === "year").toBe(true);
				expect(init.criteria[init.selectedPeriod]?.fromTo?.from).toEqual({ value: null, error: null });
			});

			it("derives MONTH criteria when configured default is 'month'", () => {
				const init = controller.createInitialOptions(
					makeItem({
						periods: [
							{ option: "month", default: true, enabled: true },
							{ option: "yearMonth", enabled: true }
						] as OverviewModel.NewFilter.DateFragment.Options["periods"]
					}),
					makeElement("yyyy-MM")
				);
				expect(init.selectedPeriod).toBe("month");
				expect(init.selectedPeriod === "month").toBe(true);
				expect(init.criteria[init.selectedPeriod]?.fromTo?.from).toEqual({ value: null });
			});
		});
	});

	describe("createDefaultCriteria()", () => {
		it("YEAR_MONTH initializes year and month to null on every range slot", () => {
			const criteria = createDefaultCriteria("yearMonth");
			expect(criteria.fromTo?.from.value).toEqual({ year: null, month: null });
			expect(criteria.fromOnly?.from.value).toEqual({ year: null, month: null });
			expect(criteria.toOnly?.to.value).toEqual({ year: null, month: null });
			expect(criteria.exact?.exact?.value).toEqual({ year: null, month: null });
		});

		it("YEAR initializes value to null", () => {
			expect(createDefaultCriteria("year").fromTo?.from).toEqual({ value: null, error: null });
		});

		it("MONTH initializes value to null", () => {
			expect(createDefaultCriteria("month").fromTo?.from).toEqual({ value: null });
		});

		it("MONTH_DAY initializes value to null with empty input string", () => {
			expect(createDefaultCriteria("monthDay").fromTo?.from).toEqual({ value: null, input: "", error: null });
		});

		it("throws on unsupported format", () => {
			expect(() => createDefaultCriteria("BOGUS" as never)).toThrow(/Unsupported format/);
		});
	});

	describe("toEffectiveOptions()", () => {
		it("returns options unchanged", () => {
			const opts = makeOptions("year");
			expect(controller.toEffectiveOptions(makeItem(), opts)).toBe(opts);
		});
	});

	describe("reset()", () => {
		it("returns the captured default options", () => {
			const defaults = makeOptions("year", {
				selectedRange: "fromTo",
				criteria: {
					...createDefaultCriteria("year"),
					fromTo: { from: { value: 2020, error: null }, to: { value: 2025, error: null } }
				}
			});
			const runtime = makeOptions("year", {
				selectedRange: "exact",
				criteria: {
					...createDefaultCriteria("year"),
					exact: { exact: { value: 1999, error: null } }
				}
			});
			const result = controller.toResetOptions(makeItem(), runtime, defaults);
			expect(result).toBe(defaults);
		});
	});

	describe("hasErrors()", () => {
		it("returns false for default (empty) YEAR_MONTH criteria", () => {
			expect(controller.hasErrors(makeItem(), makeOptions("yearMonth"))).toBe(false);
		});

		it("returns true when YEAR_MONTH fromTo has from > to (invalid range)", () => {
			const opts = makeOptions("yearMonth", {
				criteria: {
					...createDefaultCriteria("yearMonth"),
					fromTo: {
						from: { value: { year: 2025, month: 6 }, error: null },
						to: { value: { year: 2024, month: 6 }, error: null }
					}
				}
			});
			expect(controller.hasErrors(makeItem(), opts)).toBe(true);
		});

		it("returns true when YEAR_MONTH input carries a parse error", () => {
			const opts = makeOptions("yearMonth", {
				criteria: {
					...createDefaultCriteria("yearMonth"),
					fromTo: {
						from: { value: { year: null, month: null }, error: "INVALID" },
						to: { value: { year: null, month: null }, error: null }
					}
				}
			});
			expect(controller.hasErrors(makeItem(), opts)).toBe(true);
		});

		it("returns false for default (empty) YEAR criteria", () => {
			expect(controller.hasErrors(makeItem(), makeOptions("year"))).toBe(false);
		});

		it("returns true when YEAR input carries a validation error (invalid 4-digit year)", () => {
			const opts = makeOptions("year", {
				criteria: {
					...createDefaultCriteria("year"),
					fromTo: {
						from: { value: null, error: "Year must be a 4-digit number." },
						to: { value: null, error: null }
					}
				}
			});
			expect(controller.hasErrors(makeItem(), opts)).toBe(true);
		});

		it("returns true when YEAR fromTo has from > to (invalid range)", () => {
			const opts = makeOptions("year", {
				criteria: {
					...createDefaultCriteria("year"),
					fromTo: { from: { value: 2025, error: null }, to: { value: 2020, error: null } }
				}
			});
			expect(controller.hasErrors(makeItem(), opts)).toBe(true);
		});

		it("returns false for default (empty) MONTH and MONTH_DAY criteria", () => {
			expect(controller.hasErrors(makeItem(), makeOptions("month"))).toBe(false);
			expect(controller.hasErrors(makeItem(), makeOptions("monthDay"))).toBe(false);
		});

		it("returns true when MONTH fromTo has from > to (invalid range)", () => {
			const opts = makeOptions("month", {
				criteria: {
					...createDefaultCriteria("month"),
					fromTo: { from: { value: 6 }, to: { value: 2 } }
				}
			});
			expect(controller.hasErrors(makeItem(), opts)).toBe(true);
		});
	});

	describe("isConfigurable()", () => {
		it("is true when empty is enabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when invert is enabled", () => {
			expect(controller.isConfigurable(makeItem({ invert: { enabled: true, value: false } }))).toBe(true);
		});

		it("is true when more than one range option is configured", () => {
			expect(controller.isConfigurable(makeItem())).toBe(true);
		});

		it("is false when only one range and no toggles", () => {
			expect(controller.isConfigurable(makeItem({ ranges: [{ option: "exact", default: true, enabled: true }] }))).toBe(
				false
			);
		});
	});

	describe("toOperator() — empty handling", () => {
		const model = makeItem();

		it("returns undefined_match when empty is enabled and value is true", () => {
			const op = controller.toOperator(
				model,
				makeOptions("year", { empty: { enabled: true, value: true } }),
				operatorCtx
			);
			expect(op).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: ProductFieldIds.releaseMonth.path
			});
		});

		it("wraps undefined_match in NOT when invert is enabled and value is true", () => {
			const op = controller.toOperator(
				model,
				makeOptions("year", {
					empty: { enabled: true, value: true },
					invert: { enabled: true, value: true }
				}),
				operatorCtx
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand).toMatchObject({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: ProductFieldIds.releaseMonth.path
			});
		});

		it("returns undefined when no values entered (all formats)", () => {
			expect(controller.toOperator(model, makeOptions("year"), operatorCtx)).toBeUndefined();
			expect(controller.toOperator(model, makeOptions("month"), operatorCtx)).toBeUndefined();
			expect(controller.toOperator(model, makeOptions("yearMonth"), operatorCtx)).toBeUndefined();
			expect(controller.toOperator(model, makeOptions("monthDay"), operatorCtx)).toBeUndefined();
		});
	});

	describe("toOperator() — YEAR format", () => {
		const model = makeItem();

		it("fromTo produces date_fragment_range with both year bounds", () => {
			const opts = makeOptions("year", {
				criteria: {
					...createDefaultCriteria("year"),
					fromTo: { from: { value: 2020, error: null }, to: { value: 2025, error: null } }
				}
			});
			const op = controller.toOperator(model, opts, operatorCtx);
			expect(op).toEqual({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "2020",
				to: "2025"
			});
		});

		it("fromOnly produces date_fragment_range with only 'from'", () => {
			const opts = makeOptions("year", {
				selectedRange: "fromOnly",
				criteria: {
					...createDefaultCriteria("year"),
					fromOnly: { from: { value: 2020, error: null } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "2020",
				to: undefined
			});
		});

		it("toOnly produces date_fragment_range with only 'to'", () => {
			const opts = makeOptions("year", {
				selectedRange: "toOnly",
				criteria: {
					...createDefaultCriteria("year"),
					toOnly: { to: { value: 2025, error: null } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: undefined,
				to: "2025"
			});
		});

		it("exact produces date_fragment_range with from === to", () => {
			const opts = makeOptions("year", {
				selectedRange: "exact",
				criteria: {
					...createDefaultCriteria("year"),
					exact: { exact: { value: 2024, error: null } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "2024",
				to: "2024"
			});
		});

		it("wraps in NOT when invert is enabled with value true", () => {
			const opts = makeOptions("year", {
				invert: { enabled: true, value: true },
				criteria: {
					...createDefaultCriteria("year"),
					fromTo: { from: { value: 2020, error: null }, to: { value: 2025, error: null } }
				}
			});
			const op = controller.toOperator(model, opts, operatorCtx);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand.operator).toBe(Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR);
		});
	});

	describe("toOperator() — YEAR_MONTH format", () => {
		const model = makeItem();

		it("fromTo produces date_fragment_range with 'yyyy-MM' bounds", () => {
			const opts = makeOptions("yearMonth", {
				criteria: {
					...createDefaultCriteria("yearMonth"),
					fromTo: {
						from: { value: { year: 2024, month: 0 }, error: null },
						to: { value: { year: 2024, month: 11 }, error: null }
					}
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toEqual({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "2024-01",
				to: "2024-12"
			});
		});

		it("exact produces date_fragment_range with from === to", () => {
			const opts = makeOptions("yearMonth", {
				selectedRange: "exact",
				criteria: {
					...createDefaultCriteria("yearMonth"),
					exact: { exact: { value: { year: 2024, month: 5 }, error: null } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "2024-06",
				to: "2024-06"
			});
		});

		it("returns undefined when only year is set (month null) — both must be defined", () => {
			const opts = makeOptions("yearMonth", {
				criteria: {
					...createDefaultCriteria("yearMonth"),
					fromTo: {
						from: { value: { year: 2024, month: null }, error: null },
						to: { value: { year: null, month: null }, error: null }
					}
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toBeUndefined();
		});
	});

	describe("toOperator() — MONTH format", () => {
		const model = makeItem();

		it("exact produces date_fragment_range with 'MM' value (month is 0-indexed)", () => {
			const opts = makeOptions("month", {
				selectedRange: "exact",
				criteria: {
					...createDefaultCriteria("month"),
					exact: { exact: { value: 0 } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "01",
				to: "01"
			});
		});

		it("fromTo produces date_fragment_range with both month bounds", () => {
			const opts = makeOptions("month", {
				criteria: {
					...createDefaultCriteria("month"),
					fromTo: { from: { value: 0 }, to: { value: 5 } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "01",
				to: "06"
			});
		});
	});

	describe("toOperator() — Phase 0 regression net", () => {
		const model = makeItem();

		it("MONTH fromOnly with value=0 (January) emits '01' (not undefined)", () => {
			const opts = makeOptions("month", {
				selectedRange: "fromOnly",
				criteria: {
					...createDefaultCriteria("month"),
					fromOnly: { from: { value: 0 } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "01",
				to: undefined
			});
		});

		it("MONTH toOnly value=11 (December) emits '12'", () => {
			const opts = makeOptions("month", {
				selectedRange: "toOnly",
				criteria: {
					...createDefaultCriteria("month"),
					toOnly: { to: { value: 11 } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				from: undefined,
				to: "12"
			});
		});

		it("MONTH fromTo with null 'from.value' drops only the from bound", () => {
			const opts = makeOptions("month", {
				criteria: {
					...createDefaultCriteria("month"),
					fromTo: { from: { value: null }, to: { value: 5 } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				from: undefined,
				to: "06"
			});
		});

		it("YEAR fromTo with null 'to.value' drops only the to bound", () => {
			const opts = makeOptions("year", {
				criteria: {
					...createDefaultCriteria("year"),
					fromTo: { from: { value: 2024, error: null }, to: { value: null, error: null } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				from: "2024",
				to: undefined
			});
		});

		it("YEAR_MONTH exact with null month returns undefined operator", () => {
			const opts = makeOptions("yearMonth", {
				selectedRange: "exact",
				criteria: {
					...createDefaultCriteria("yearMonth"),
					exact: { exact: { value: { year: 2024, month: null }, error: null } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toBeUndefined();
		});

		it("YEAR fromOnly with null value returns undefined operator", () => {
			const opts = makeOptions("year", {
				selectedRange: "fromOnly",
				criteria: {
					...createDefaultCriteria("year"),
					fromOnly: { from: { value: null, error: null } }
				}
			});
			expect(controller.toOperator(model, opts, operatorCtx)).toBeUndefined();
		});
	});

	describe("toOperator() — period switch", () => {
		const model = makeItem();

		it("yyyy-MM filter switched from yearMonth to year produces year-shaped query", () => {
			const opts = makeOptions("year", {
				criteria: {
					fromTo: { from: { value: 2020 }, to: { value: 2025 } }
				} as RangeCriteria<PeriodInputMap["year"]>
			});

			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "2020",
				to: "2025"
			});
		});

		it("yyyy-MM filter switched to month produces month-shaped query", () => {
			const opts = makeOptions("month", {
				criteria: {
					fromTo: { from: { value: 0 }, to: { value: 5 } }
				} as RangeCriteria<PeriodInputMap["month"]>
			});

			expect(controller.toOperator(model, opts, operatorCtx)).toMatchObject({
				operator: Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR,
				field: ProductFieldIds.releaseMonth.path,
				from: "01",
				to: "06"
			});
		});
	});

	describe("toLabel()", () => {
		const model = makeItem();

		it("YEAR returns null when no values entered", () => {
			expect(controller.toLabel(model, makeOptions("year"), labelCtx)).toBeNull();
		});

		it("YEAR fromTo renders 'from - to'", () => {
			const opts = makeOptions("year", {
				criteria: {
					...createDefaultCriteria("year"),
					fromTo: { from: { value: 2020, error: null }, to: { value: 2025, error: null } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("2020 - 2025");
		});

		it("YEAR fromOnly renders '>= from'", () => {
			const opts = makeOptions("year", {
				selectedRange: "fromOnly",
				criteria: {
					...createDefaultCriteria("year"),
					fromOnly: { from: { value: 2020, error: null } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("≥ 2020");
		});

		it("YEAR toOnly renders '<= to'", () => {
			const opts = makeOptions("year", {
				selectedRange: "toOnly",
				criteria: {
					...createDefaultCriteria("year"),
					toOnly: { to: { value: 2025, error: null } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("≤ 2025");
		});

		it("YEAR exact collapses to a single value", () => {
			const opts = makeOptions("year", {
				selectedRange: "exact",
				criteria: {
					...createDefaultCriteria("year"),
					exact: { exact: { value: 2024, error: null } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("2024");
		});

		it("YEAR_MONTH fromTo renders 'MMMM yyyy - MMMM yyyy'", () => {
			const opts = makeOptions("yearMonth", {
				criteria: {
					...createDefaultCriteria("yearMonth"),
					fromTo: {
						from: { value: { year: 2024, month: 0 }, error: null },
						to: { value: { year: 2024, month: 11 }, error: null }
					}
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("January 2024 - December 2024");
		});

		it("YEAR_MONTH returns null when no values entered", () => {
			expect(controller.toLabel(model, makeOptions("yearMonth"), labelCtx)).toBeNull();
		});

		it("MONTH fromTo renders 'MMMM - MMMM'", () => {
			const opts = makeOptions("month", {
				criteria: {
					...createDefaultCriteria("month"),
					fromTo: { from: { value: 0 }, to: { value: 5 } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("January - June");
		});

		it("MONTH returns null when no values entered", () => {
			expect(controller.toLabel(model, makeOptions("month"), labelCtx)).toBeNull();
		});

		it("MONTH_DAY returns null when no values entered", () => {
			expect(controller.toLabel(model, makeOptions("monthDay"), labelCtx)).toBeNull();
		});

		it("MONTH_DAY fromTo renders 'MMMM d - MMMM d'", () => {
			const opts = makeOptions("monthDay", {
				criteria: {
					...createDefaultCriteria("monthDay"),
					fromTo: {
						from: { value: { month: 0, day: 1 }, input: "01-01", error: null },
						to: { value: { month: 11, day: 31 }, input: "12-31", error: null }
					}
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("January 1 - December 31");
		});
	});

	describe("isInstance()", () => {
		it("guards true for dateFragment filter state", () => {
			const state = { model: makeItem() } as never;
			expect(DateFragmentFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-dateFragment filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(DateFragmentFilterState.isInstance(state)).toBe(false);
		});
	});

	describe("toGeneralError()", () => {
		it("returns null when not in fromTo mode", () => {
			expect(
				controller.toGeneralError(
					makeItem(),
					makeOptions("year", {
						selectedRange: "exact"
					})
				)
			).toBeNull();
		});

		it("returns null for valid YEAR_MONTH fromTo range", () => {
			expect(
				controller.toGeneralError(
					makeItem(),
					makeOptions("yearMonth", {
						criteria: {
							...createDefaultCriteria("yearMonth"),
							fromTo: {
								from: { value: { year: 2020, month: 0 }, error: null },
								to: { value: { year: 2025, month: 0 }, error: null }
							}
						}
					})
				)
			).toBeNull();
		});

		it("returns an error key for an inverted YEAR_MONTH fromTo range", () => {
			expect(
				controller.toGeneralError(
					makeItem(),
					makeOptions("yearMonth", {
						criteria: {
							...createDefaultCriteria("yearMonth"),
							fromTo: {
								from: { value: { year: 2025, month: 6 }, error: null },
								to: { value: { year: 2024, month: 6 }, error: null }
							}
						}
					})
				)
			).not.toBeNull();
		});

		it("returns an error key for an inverted YEAR fromTo range", () => {
			expect(
				controller.toGeneralError(
					makeItem(),
					makeOptions("year", {
						criteria: {
							...createDefaultCriteria("year"),
							fromTo: { from: { value: 2025, error: null }, to: { value: 2020, error: null } }
						}
					})
				)
			).not.toBeNull();
		});

		it("returns null for MONTH_DAY (no validation)", () => {
			expect(controller.toGeneralError(makeItem(), makeOptions("monthDay"))).toBeNull();
		});
	});
});
