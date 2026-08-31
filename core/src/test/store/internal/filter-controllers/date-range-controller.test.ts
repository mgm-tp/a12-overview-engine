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
import type { FormatTypedDateRangeType } from "../../../../main/models/internal/shared.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { RangeCriteria } from "../../../../main/store/internal/filter-controllers/criteria.js";
import {
	DateRangeFilterController,
	deriveDateRangePeriodOptions
} from "../../../../main/store/internal/filter-controllers/date-range-controller.js";
import type { DateRangeFilterState } from "../../../../main/store/internal/filter-state.js";
import { createField, createDocumentModel } from "../../../utils.js";

const controller = new DateRangeFilterController();

type Format = FormatTypedDateRangeType["format"];
type PeriodInputMap = DateRangeFilterState.PeriodInputMap;

function defaultPeriodInput<P extends keyof PeriodInputMap>(period: P): PeriodInputMap[P] {
	switch (period) {
		case "yearMonth":
			return { value: { year: null, month: null }, error: null } as PeriodInputMap[P];
		case "year":
			return { value: null, error: null } as PeriodInputMap[P];
		case "month":
			return { value: null } as PeriodInputMap[P];
		case "date":
			return { input: "", value: null, error: null } as PeriodInputMap[P];
		case "monthDay":
			return { value: null, input: "", error: null } as PeriodInputMap[P];
		default:
			throw new Error(`Unsupported period: ${period}`);
	}
}

function createDefaultCriteria<P extends keyof PeriodInputMap>(period: P): RangeCriteria<PeriodInputMap[P]> {
	return RangeCriteria.create(defaultPeriodInput(period)) as RangeCriteria<PeriodInputMap[P]>;
}

function makeItem(
	options: Partial<OverviewModel.NewFilter.DateRange.Options> = {}
): OverviewModel.NewFilter.DateRange.Item {
	return {
		id: "filter1",
		type: "dateRange",
		options: {
			fieldId: "F100",
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

function makeElement(format: Format): DocumentModelTypedField<FormatTypedDateRangeType> {
	return {
		fieldType: { type: "DateRangeType", format, rangeSeparator: "/" }
	} as unknown as DocumentModelTypedField<FormatTypedDateRangeType>;
}

function makeOptions<P extends keyof PeriodInputMap>(
	period: P,
	overrides: { criteria?: RangeCriteria<PeriodInputMap[P]> } & Omit<
		Partial<DateRangeFilterState.Options>,
		"criteria"
	> = {}
): DateRangeFilterState.Options {
	const { criteria: periodCriteria, ...rest } = overrides;
	const allPeriods: readonly (keyof PeriodInputMap)[] = ["year", "month", "yearMonth", "date", "monthDay"];
	const fullCriteria = Object.fromEntries(
		allPeriods.map((p) => [p, p === period && periodCriteria ? periodCriteria : createDefaultCriteria(p)])
	) as DateRangeFilterState.Criteria;

	return {
		empty: { enabled: false } as const,
		invert: { enabled: false } as const,
		selectedRange: "fromTo" as OverviewModel.NewFilter.RangeOption,
		selectedPeriod: period,
		criteria: fullCriteria,
		...rest
	} as DateRangeFilterState.Options;
}

const yearField = createField("DateRangeType", "saleYearRange");
const fieldPath = `/root/${yearField.name}`;
const documentModel = createDocumentModel([yearField]);
const operatorCtx = { documentModel, locale: {} as never, fieldPath };

const labelCtx = {
	...operatorCtx,
	formatValue: ({ value }: { value: unknown }) => `formatted(${String(value)})`,
	localizeValue: ({ value }: { value: unknown }) => String(value),
	localizeResource: ({ key }: { key: string }) => key,
	getElementByPath: () => undefined,
	getDateTimeFormat: () => "yyyy",
	locale: enUS
} as never;

describe("DateRangeFilterController", () => {
	describe("accept()", () => {
		it("accepts dateRange filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-dateRange filter models", () => {
			const stringItem = { id: "f", type: "string", options: {} as never } as unknown as OverviewModel.NewFilter.Item;
			expect(controller.accept(stringItem)).toBe(false);
		});
	});

	describe("deriveDateRangePeriodOptions()", () => {
		it("yyyy → [year]", () => {
			expect(deriveDateRangePeriodOptions(undefined, "yyyy")).toEqual({
				availableOptions: ["year"],
				defaultOption: "year"
			});
		});

		it("MM → [month]", () => {
			expect(deriveDateRangePeriodOptions(undefined, "MM")).toEqual({
				availableOptions: ["month"],
				defaultOption: "month"
			});
		});

		it("yyyy-MM with no configured periods → only the allowance default", () => {
			expect(deriveDateRangePeriodOptions(undefined, "yyyy-MM")).toEqual({
				availableOptions: ["yearMonth"],
				defaultOption: "yearMonth"
			});
		});

		it("yyyy-MM with all 3 periods configured → exposes all", () => {
			const result = deriveDateRangePeriodOptions(
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

		it("yyyy-MM-dd → [date]", () => {
			expect(deriveDateRangePeriodOptions(undefined, "yyyy-MM-dd")).toEqual({
				availableOptions: ["date"],
				defaultOption: "date"
			});
		});

		it("MM-dd → [monthDay]", () => {
			expect(deriveDateRangePeriodOptions(undefined, "MM-dd")).toEqual({
				availableOptions: ["monthDay"],
				defaultOption: "monthDay"
			});
		});

		it("intersects configured periods with field allowance", () => {
			const result = deriveDateRangePeriodOptions(
				[
					{ option: "year", default: true, enabled: true },
					{ option: "yearMonth", enabled: true },
					{ option: "monthDay", enabled: true }
				],
				"yyyy-MM"
			);

			expect(result.availableOptions).toEqual(["year", "yearMonth"]);
			expect(result.defaultOption).toBe("year");
		});

		it("falls back to first configured period when none marked default", () => {
			const result = deriveDateRangePeriodOptions(
				[
					{ option: "month", enabled: true },
					{ option: "yearMonth", enabled: true }
				],
				"yyyy-MM"
			);
			expect(result.defaultOption).toBe("month");
		});

		it("falls back to allowance default when no periods configured", () => {
			expect(deriveDateRangePeriodOptions([], "yyyy-MM").defaultOption).toBe("yearMonth");
		});

		it("throws on unsupported format", () => {
			expect(() => deriveDateRangePeriodOptions(undefined, "dd-MM" as Format)).toThrow(/Unsupported DateRange format/);
		});
	});

	describe("createInitialOptions()", () => {
		it("derives empty/invert from configurable", () => {
			const init = controller.createInitialOptions(
				makeItem({ empty: { enabled: true, value: true }, invert: { enabled: true, value: false } }),
				makeElement("yyyy")
			);
			expect(init.empty).toEqual({ enabled: true, value: true });
			expect(init.invert).toEqual({ enabled: true, value: false });
		});

		it("yyyy field → year period with {value:null} default", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("yyyy"));
			expect(init.selectedPeriod).toBe("year");
			expect(init.criteria.year?.fromTo?.from).toEqual({ value: null, error: null });
		});

		it("MM field → month period with {value:null} default", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("MM"));
			expect(init.selectedPeriod).toBe("month");
			expect(init.criteria.month?.fromTo?.from).toEqual({ value: null });
		});

		it("yyyy-MM field → yearMonth period with {value:{year,month}} default", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("yyyy-MM"));
			expect(init.selectedPeriod).toBe("yearMonth");
			expect(init.criteria.yearMonth?.fromTo?.from).toEqual({ value: { year: null, month: null }, error: null });
		});

		it("yyyy-MM-dd field → date period with {input:'', value:null} default", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("yyyy-MM-dd"));
			expect(init.selectedPeriod).toBe("date");
			expect(init.criteria.date?.fromTo?.from).toEqual({ input: "", value: null, error: null });
		});

		it("MM-dd field → monthDay period with {value:null,input:''} default", () => {
			const init = controller.createInitialOptions(makeItem(), makeElement("MM-dd"));
			expect(init.selectedPeriod).toBe("monthDay");
			expect(init.criteria.monthDay?.fromTo?.from).toEqual({ value: null, input: "", error: null });
		});
	});

	describe("isConfigurable()", () => {
		it("returns true when empty toggle enabled", () => {
			expect(controller.isConfigurable(makeItem({ empty: { enabled: true, value: false } }))).toBe(true);
		});

		it("returns true when invert toggle enabled", () => {
			expect(controller.isConfigurable(makeItem({ invert: { enabled: true, value: false } }))).toBe(true);
		});

		it("returns true when multiple ranges available", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						ranges: [
							{ option: "fromTo", enabled: true },
							{ option: "exact", enabled: true }
						]
					})
				)
			).toBe(true);
		});

		it("returns false when no toggles + single range", () => {
			expect(controller.isConfigurable(makeItem({ ranges: [{ option: "fromTo", enabled: true }] }))).toBe(false);
		});
	});

	describe("toGeneralError()", () => {
		it("returns null when range mode is not fromTo", () => {
			const opts = makeOptions("year", { selectedRange: "exact" });
			expect(controller.toGeneralError(makeItem(), opts)).toBeNull();
		});

		it("returns startGreaterThanEnd when from > to (year)", () => {
			const criteria = RangeCriteria.create({ value: 0 } as PeriodInputMap["year"]);
			(criteria as { fromTo?: object }).fromTo = { from: { value: 2025 }, to: { value: 2020 } };
			const opts = makeOptions("year", { criteria });

			const err = controller.toGeneralError(makeItem(), opts);
			expect(err).toBeTruthy();
			expect(err?.key).toMatch(/startGreaterThanEnd$/);
		});

		it("returns null when from < to", () => {
			const criteria = RangeCriteria.create({ value: 0 } as PeriodInputMap["year"]);
			(criteria as { fromTo?: object }).fromTo = { from: { value: 2020 }, to: { value: 2025 } };
			const opts = makeOptions("year", { criteria });

			expect(controller.toGeneralError(makeItem(), opts)).toBeNull();
		});

		it("returns null when one side is null (incomplete range)", () => {
			const criteria = RangeCriteria.create({ value: null } as PeriodInputMap["year"]);
			(criteria as { fromTo?: object }).fromTo = { from: { value: null }, to: { value: 2025 } };
			const opts = makeOptions("year", { criteria });

			expect(controller.toGeneralError(makeItem(), opts)).toBeNull();
		});
	});

	describe("hasErrors()", () => {
		it("flags general error", () => {
			const criteria = RangeCriteria.create({ value: 0 } as PeriodInputMap["year"]);
			(criteria as { fromTo?: object }).fromTo = { from: { value: 2025 }, to: { value: 2020 } };
			expect(controller.hasErrors(makeItem(), makeOptions("year", { criteria }))).toBe(true);
		});

		it("flags per-input error", () => {
			const criteria = RangeCriteria.create({ value: null } as PeriodInputMap["year"]);
			(criteria as { fromTo?: object }).fromTo = { from: { value: null, error: "bad" }, to: { value: null } };
			expect(controller.hasErrors(makeItem(), makeOptions("year", { criteria }))).toBe(true);
		});

		it("returns false on clean state", () => {
			expect(controller.hasErrors(makeItem(), makeOptions("year"))).toBe(false);
		});
	});

	describe("toResetOptions()", () => {
		it("returns the supplied default options unchanged", () => {
			const defaults = makeOptions("year");
			expect(controller.toResetOptions(makeItem(), makeOptions("year"), defaults)).toBe(defaults);
		});
	});

	describe("toEffectiveOptions()", () => {
		it("returns options unchanged (no derivation)", () => {
			const opts = makeOptions("year");
			expect(controller.toEffectiveOptions(makeItem(), opts)).toBe(opts);
		});
	});

	describe("toOperator()", () => {
		it("returns undefined match when empty toggle is set", () => {
			const opts = makeOptions("year", { empty: { enabled: true, value: true } });
			const op = controller.toOperator(makeItem(), opts, operatorCtx);

			expect(op).toBeDefined();
			expect((op as { operator: string }).operator).toBe(Query.OPERATORS.UNDEFINED_MATCH_OPERATOR);
		});

		it("yyyy field returns DateRangeOperator with year-formatted from/to", () => {
			const criteria = RangeCriteria.create({ value: null } as PeriodInputMap["year"]);
			(criteria as { fromTo?: object }).fromTo = { from: { value: 2020 }, to: { value: 2024 } };
			const op = controller.toOperator(makeItem(), makeOptions("year", { criteria }), operatorCtx);

			expect(op).toBeDefined();
			expect((op as { operator: string }).operator).toBe(Query.OPERATORS.DATE_RANGE_OPERATOR);
			const range = op as Query.DateRangeOperator;
			expect(range.from).toBe("2020");
			expect(range.to).toBe("2024");
		});

		it("returns no operator when both bounds absent", () => {
			expect(controller.toOperator(makeItem(), makeOptions("year"), operatorCtx)).toBeUndefined();
		});
	});

	describe("toLabel()", () => {
		it("formats a year range as 'from - to'", () => {
			const criteria = RangeCriteria.create({ value: null } as PeriodInputMap["year"]);
			(criteria as { fromTo?: object }).fromTo = { from: { value: 2020 }, to: { value: 2024 } };
			const label = controller.toLabel(makeItem(), makeOptions("year", { criteria }), labelCtx);

			expect(label).toBe("2020 - 2024");
		});

		it("returns null on empty inputs", () => {
			expect(controller.toLabel(makeItem(), makeOptions("year"), labelCtx)).toBeNull();
		});
	});
});
