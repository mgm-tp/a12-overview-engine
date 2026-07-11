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

import { it, vi, expect, describe, afterEach, beforeEach } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OverviewModel } from "../../../../main/overview-model.js";
import { RESOURCE_KEYS } from "../../../../main/services/localization/index.js";
import { DateFilterState } from "../../../../main/store/internal/filter-state.js";
import { isInvalidRange } from "../../../../main/store/internal/filter-controllers/resolvers/resolver.js";
import { DateFilterController } from "../../../../main/store/internal/filter-controllers/date-controller.js";
import { dateResolver } from "../../../../main/store/internal/filter-controllers/resolvers/date-resolver.js";
import { yearResolver } from "../../../../main/store/internal/filter-controllers/resolvers/year-resolver.js";
import { yearMonthResolver } from "../../../../main/store/internal/filter-controllers/resolvers/year-month-resolver.js";

import { enLocale } from "../../../basic.spec.js";
import { createField, createDocumentModel } from "../../../utils.js";

const controller = new DateFilterController();
const {
	DefaultCriteria,
	DefaultDateViewInputState,
	DefaultYearViewInputState,
	DefaultYearMonthViewInputState,
	DefaultMonthViewInputState
} = DateFilterState;

const FIELD_PATH = "/root/publishedAt";

function makeItem(options: Partial<OverviewModel.NewFilter.Date.Options> = {}): OverviewModel.NewFilter.Date.Item {
	return {
		id: "filter1",
		type: "date",
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
			periods: [
				{ option: "date", default: true, enabled: true },
				{ option: "year", enabled: true },
				{ option: "yearMonth", enabled: true }
			],
			...options
		}
	};
}

function makeDateDocumentModel(): DocumentModel {
	const dateField = createField("DateType", "publishedAt");

	return createDocumentModel([
		{ ...dateField, fieldType: { type: "DateType", format: "yyyy-MM-dd" } } as typeof dateField
	]);
}

function dateInput(input: string, value: Date | null, error?: string): DateFilterState.DateViewInputState {
	return { input, value, error: error ?? null };
}

function makeOptions(overrides: Partial<DateFilterState.Options> = {}): DateFilterState.Options {
	return {
		empty: { enabled: false },
		invert: { enabled: false },
		selectedRange: "fromTo",
		selectedPeriod: "date",
		criteria: DefaultCriteria,
		...overrides
	};
}

const operatorCtx = { documentModel: makeDateDocumentModel(), locale: enLocale, fieldPath: FIELD_PATH };

const labelCtx = {
	documentModel: makeDateDocumentModel(),
	locale: enLocale,
	fieldPath: FIELD_PATH,
	formatValue: ({ value }: { value: unknown }) => String(value),
	localizeValue: ({ value }: { value: unknown }) => String(value),
	localizeResource: ({ key }: { key: string }) => key,
	getElementByPath: () => undefined,
	getDateTimeFormat: ({ kind }: { kind: "date" | "year" | "monthYear" | "dateTime" | "time" }) => {
		if (kind === "year") {
			return "yyyy";
		}

		if (kind === "monthYear") {
			return "yyyy-MM";
		}

		return "yyyy-MM-dd";
	}
} as unknown as Parameters<typeof controller.toLabel>[2];

describe("DateFilterState.Controller", () => {
	describe("accept()", () => {
		it("accepts date filter models", () => {
			expect(controller.accept(makeItem())).toBe(true);
		});

		it("rejects non-date filter models", () => {
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
			const init = controller.createInitialOptions(makeItem());
			expect(init.empty).toEqual({ enabled: false });
			expect(init.invert).toEqual({ enabled: false });
		});

		it("derives empty/invert from configurable (enabled with value)", () => {
			const init = controller.createInitialOptions(
				makeItem({ empty: { enabled: true, value: true }, invert: { enabled: true, value: false } })
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
				})
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
				})
			);
			expect(init.selectedRange).toBe("fromOnly");
		});

		it("populates selectedPeriod from configuration default", () => {
			const init = controller.createInitialOptions(
				makeItem({
					periods: [
						{ option: "date", enabled: true },
						{ option: "year", default: true, enabled: true }
					]
				})
			);
			expect(init.selectedPeriod).toBe("year");
		});

		it("falls back to first period when none marked default", () => {
			const init = controller.createInitialOptions(
				makeItem({
					periods: [
						{ option: "yearMonth", enabled: true },
						{ option: "year", enabled: true }
					]
				})
			);
			expect(init.selectedPeriod).toBe("yearMonth");
		});

		it("falls back to DATE period when periods list is empty", () => {
			const init = controller.createInitialOptions(makeItem({ periods: [] }));
			expect(init.selectedPeriod).toBe("date");
		});

		it("uses default DATE/YEAR/YEAR_MONTH/MONTH input states when no preset is configured", () => {
			const init = controller.createInitialOptions(makeItem());
			expect(init.criteria.date.fromTo?.from).toEqual(DefaultDateViewInputState);
			expect(init.criteria.date.fromTo?.to).toEqual(DefaultDateViewInputState);
			expect(init.criteria.date.exact?.exact).toEqual(DefaultDateViewInputState);
			expect(init.criteria.year.fromTo?.from).toEqual(DefaultYearViewInputState);
			expect(init.criteria.yearMonth.fromTo?.from).toEqual(DefaultYearMonthViewInputState);
			expect(init.criteria.month.fromTo?.from).toEqual(DefaultMonthViewInputState);
			expect(init.criteria.month.exact?.exact).toEqual(DefaultMonthViewInputState);
		});

		it("derives DATE criteria values from the default range entry's preset strings", () => {
			const init = controller.createInitialOptions(
				makeItem({
					ranges: [
						{ option: "fromTo", default: true, criteria: { from: "2026-01-01", to: "2026-12-31" }, enabled: true },
						{ option: "exact", enabled: true }
					]
				})
			);
			expect(init.criteria.date.fromTo?.from.input).toBe("2026-01-01");
			expect(init.criteria.date.fromTo?.from.value).toEqual(new Date("2026-01-01"));
			expect(init.criteria.date.fromTo?.to.input).toBe("2026-12-31");
			expect(init.criteria.date.fromTo?.to.value).toEqual(new Date("2026-12-31"));
			expect(init.criteria.date.exact?.exact).toEqual(DefaultDateViewInputState);
		});
	});

	describe("toEffectiveOptions()", () => {
		it("flattens runtime options to selected period/range and its criteria", () => {
			const runtime = makeOptions({
				selectedPeriod: "year",
				selectedRange: "exact",
				criteria: {
					...DefaultCriteria,
					year: {
						...DefaultCriteria.year,
						exact: { exact: { value: 2026, error: null } }
					}
				}
			});
			expect(controller.toEffectiveOptions(makeItem(), runtime)).toEqual({
				empty: { enabled: false },
				invert: { enabled: false },
				selectedPeriod: "year",
				selectedRange: "exact",
				criteria: { exact: { value: 2026, error: null } }
			});
		});
	});

	describe("reset()", () => {
		it("restores selected period/range and the matching criteria slot from initial options", () => {
			const runtime = makeOptions({
				selectedPeriod: "year",
				selectedRange: "exact",
				criteria: {
					...DefaultCriteria,
					year: { ...DefaultCriteria.year, exact: { exact: { value: 2026, error: null } } }
				}
			});
			const defaults: DateFilterState.EffectiveOptions = {
				empty: { enabled: false },
				invert: { enabled: false },
				selectedPeriod: "date",
				selectedRange: "fromTo",
				criteria: {
					from: dateInput("2026-01-01", new Date("2026-01-01")),
					to: dateInput("2026-12-31", new Date("2026-12-31"))
				}
			};
			const result = controller.toResetOptions(makeItem(), runtime, defaults);
			expect(result.selectedPeriod).toBe("date");
			expect(result.selectedRange).toBe("fromTo");
			expect(result.criteria.date.fromTo).toEqual(defaults.criteria);
			expect(result.criteria.year.exact).toEqual({ exact: { value: 2026, error: null } });
		});

		it("restores empty and invert toggles to initial defaults", () => {
			const runtime = makeOptions({
				empty: { enabled: true, value: true },
				invert: { enabled: true, value: true }
			});
			const defaults: DateFilterState.EffectiveOptions = {
				empty: { enabled: true, value: false },
				invert: { enabled: true, value: false },
				selectedPeriod: "date",
				selectedRange: "fromTo",
				criteria: { from: dateInput("", null), to: dateInput("", null) }
			};
			const result = controller.toResetOptions(makeItem(), runtime, defaults);
			expect(result.empty).toEqual({ enabled: true, value: false });
			expect(result.invert).toEqual({ enabled: true, value: false });
		});
	});

	describe("hasErrors()", () => {
		it("returns false for default (empty) DATE criteria", () => {
			expect(controller.hasErrors(makeItem(), makeOptions())).toBe(false);
		});

		it("returns true when DATE fromTo has from > to (invalid range)", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromTo: {
									from: dateInput("2026-12-31", new Date("2026-12-31")),
									to: dateInput("2026-01-01", new Date("2026-01-01"))
								}
							}
						}
					})
				)
			).toBe(true);
		});

		it("returns false when DATE fromTo has from <= to", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromTo: {
									from: dateInput("2026-01-01", new Date("2026-01-01")),
									to: dateInput("2026-12-31", new Date("2026-12-31"))
								}
							}
						}
					})
				)
			).toBe(false);
		});

		it("returns true when DATE input carries a parse error (field-level)", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromTo: {
									from: dateInput("not-a-date", null, "INVALID"),
									to: DefaultDateViewInputState
								}
							}
						}
					})
				)
			).toBe(true);
		});

		it("flags a parse error on fromOnly when that range is selected", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						selectedRange: "fromOnly",
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromOnly: { from: dateInput("bad", null, "INVALID") }
							}
						}
					})
				)
			).toBe(true);
		});

		it("does not flag from > to when selected range is not fromTo", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						selectedRange: "fromOnly",
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromTo: {
									from: dateInput("2026-12-31", new Date("2026-12-31")),
									to: dateInput("2026-01-01", new Date("2026-01-01"))
								},
								fromOnly: { from: dateInput("2026-01-01", new Date("2026-01-01")) }
							}
						}
					})
				)
			).toBe(false);
		});

		it("returns true for YEAR fromTo with from > to", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						selectedPeriod: "year",
						criteria: {
							...DefaultCriteria,
							year: {
								...DefaultCriteria.year,
								fromTo: { from: { value: 2026, error: null }, to: { value: 2024, error: null } }
							}
						}
					})
				)
			).toBe(true);
		});

		it("returns true for YEAR_MONTH fromTo with from > to (same year, later month)", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						selectedPeriod: "yearMonth",
						criteria: {
							...DefaultCriteria,
							yearMonth: {
								...DefaultCriteria.yearMonth,
								fromTo: {
									from: { value: { year: 2026, month: 11 }, error: null },
									to: { value: { year: 2026, month: 0 }, error: null }
								}
							}
						}
					})
				)
			).toBe(true);
		});

		it("returns true for MONTH fromTo with from > to", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						selectedPeriod: "month",
						criteria: {
							...DefaultCriteria,
							month: {
								...DefaultCriteria.month,
								fromTo: { from: { value: 8 }, to: { value: 2 } }
							}
						}
					})
				)
			).toBe(true);
		});

		it("returns false for MONTH fromTo with from <= to", () => {
			expect(
				controller.hasErrors(
					makeItem(),
					makeOptions({
						selectedPeriod: "month",
						criteria: {
							...DefaultCriteria,
							month: {
								...DefaultCriteria.month,
								fromTo: { from: { value: 2 }, to: { value: 8 } }
							}
						}
					})
				)
			).toBe(false);
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

		it("is true when more than one period option is configured", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						periods: [
							{ option: "date", default: true, enabled: true },
							{ option: "year", enabled: true }
						]
					})
				)
			).toBe(true);
		});

		it("is false when single range, single period, no toggles", () => {
			expect(
				controller.isConfigurable(
					makeItem({
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						periods: [{ option: "date", default: true, enabled: true }]
					})
				)
			).toBe(false);
		});
	});

	describe("toOperator() — empty / invert handling", () => {
		const model = makeItem();

		it("returns undefined_match when empty is enabled and value is true", () => {
			const op = controller.toOperator(model, makeOptions({ empty: { enabled: true, value: true } }), operatorCtx);
			expect(op).toEqual({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: FIELD_PATH
			});
		});

		it("wraps undefined_match in NOT when invert is enabled and value is true", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					empty: { enabled: true, value: true },
					invert: { enabled: true, value: true }
				}),
				operatorCtx
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand).toMatchObject({
				operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR,
				field: FIELD_PATH
			});
		});

		it("ignores empty when value is false (falls through to range)", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					empty: { enabled: true, value: false },
					criteria: {
						...DefaultCriteria,
						date: {
							...DefaultCriteria.date,
							fromTo: {
								from: dateInput("2026-01-01", new Date("2026-01-01")),
								to: dateInput("2026-12-31", new Date("2026-12-31"))
							}
						}
					}
				}),
				operatorCtx
			);
			expect(op?.operator).toBe(Query.OPERATORS.DATE_RANGE_OPERATOR);
		});

		it("returns undefined when no values entered (empty range across all periods)", () => {
			expect(controller.toOperator(model, makeOptions(), operatorCtx)).toBeUndefined();
			expect(controller.toOperator(model, makeOptions({ selectedPeriod: "year" }), operatorCtx)).toBeUndefined();
			expect(controller.toOperator(model, makeOptions({ selectedPeriod: "yearMonth" }), operatorCtx)).toBeUndefined();
		});
	});

	describe("toOperator() — DATE period", () => {
		const model = makeItem();

		it("fromTo produces date_range with both bounds", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					criteria: {
						...DefaultCriteria,
						date: {
							...DefaultCriteria.date,
							fromTo: {
								from: dateInput("2026-01-01", new Date("2026-01-01")),
								to: dateInput("2026-12-31", new Date("2026-12-31"))
							}
						}
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: FIELD_PATH,
				from: "2026-01-01",
				to: "2026-12-31"
			});
		});

		it("fromOnly produces date_range with only 'from'", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedRange: "fromOnly",
					criteria: {
						...DefaultCriteria,
						date: {
							...DefaultCriteria.date,
							fromOnly: { from: dateInput("2026-01-01", new Date("2026-01-01")) }
						}
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: FIELD_PATH,
				from: "2026-01-01",
				to: undefined
			});
		});

		it("toOnly produces date_range with only 'to'", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedRange: "toOnly",
					criteria: {
						...DefaultCriteria,
						date: {
							...DefaultCriteria.date,
							toOnly: { to: dateInput("2026-12-31", new Date("2026-12-31")) }
						}
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: FIELD_PATH,
				from: undefined,
				to: "2026-12-31"
			});
		});

		it("exact produces date_range with from === to", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedRange: "exact",
					criteria: {
						...DefaultCriteria,
						date: { ...DefaultCriteria.date, exact: { exact: dateInput("2026-04-25", new Date("2026-04-25")) } }
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: FIELD_PATH,
				from: "2026-04-25",
				to: "2026-04-25"
			});
		});

		it("wraps date_range in NOT when invert is enabled with value true", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					invert: { enabled: true, value: true },
					criteria: {
						...DefaultCriteria,
						date: {
							...DefaultCriteria.date,
							fromTo: {
								from: dateInput("2026-01-01", new Date("2026-01-01")),
								to: dateInput("2026-12-31", new Date("2026-12-31"))
							}
						}
					}
				}),
				operatorCtx
			);
			expect(op?.operator).toBe(Query.OPERATORS.NOT_OPERATOR);
			const notOp = op as Extract<Query.Operator, { operator: typeof Query.OPERATORS.NOT_OPERATOR }>;
			expect(notOp.operand.operator).toBe(Query.OPERATORS.DATE_RANGE_OPERATOR);
		});
	});

	describe("toOperator() — YEAR period", () => {
		const model = makeItem();

		it("fromTo produces date_range expanded to first/last day of each year", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "year",
					criteria: {
						...DefaultCriteria,
						year: {
							...DefaultCriteria.year,
							fromTo: { from: { value: 2024, error: null }, to: { value: 2026, error: null } }
						}
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: FIELD_PATH,
				from: "2024-01-01",
				to: "2026-12-31"
			});
		});

		it("exact produces date_range covering the full year", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "year",
					selectedRange: "exact",
					criteria: {
						...DefaultCriteria,
						year: { ...DefaultCriteria.year, exact: { exact: { value: 2026, error: null } } }
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				from: "2026-01-01",
				to: "2026-12-31"
			});
		});

		it("fromOnly produces date_range with only 'from' (start-of-year)", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "year",
					selectedRange: "fromOnly",
					criteria: {
						...DefaultCriteria,
						year: { ...DefaultCriteria.year, fromOnly: { from: { value: 2026, error: null } } }
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				from: "2026-01-01",
				to: undefined
			});
		});
	});

	describe("toOperator() — YEAR_MONTH period", () => {
		const model = makeItem();

		it("fromTo produces date_range expanded to first/last day of each month", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
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
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				from: "2026-01-01",
				to: "2026-12-31"
			});
		});

		it("exact produces date_range covering the full month", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "yearMonth",
					selectedRange: "exact",
					criteria: {
						...DefaultCriteria,
						yearMonth: {
							...DefaultCriteria.yearMonth,
							exact: { exact: { value: { year: 2026, month: 3 }, error: null } }
						}
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				from: "2026-04-01",
				to: "2026-04-30"
			});
		});
	});

	describe("toOperator() — MONTH period (Phase 0)", () => {
		const model = makeItem();

		it("MONTH fromTo expands first/last day of month within current year (golden)", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "month",
					criteria: {
						...DefaultCriteria,
						month: { ...DefaultCriteria.month, fromTo: { from: { value: 0 }, to: { value: 11 } } }
					}
				}),
				operatorCtx
			);
			const currentYear = new Date().getFullYear();
			expect(op).toMatchObject({
				operator: Query.OPERATORS.DATE_RANGE_OPERATOR,
				field: FIELD_PATH,
				from: `${currentYear}-01-01`,
				to: `${currentYear}-12-31`
			});
		});

		it("MONTH exact emits start/end of single month", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "month",
					selectedRange: "exact",
					criteria: {
						...DefaultCriteria,
						month: { ...DefaultCriteria.month, exact: { exact: { value: 3 } } } // April
					}
				}),
				operatorCtx
			);
			const currentYear = new Date().getFullYear();
			expect(op).toMatchObject({ from: `${currentYear}-04-01`, to: `${currentYear}-04-30` });
		});

		it("MONTH fromOnly month=0 (January) is NOT treated as null — pins falsy-value semantics", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "month",
					selectedRange: "fromOnly",
					criteria: {
						...DefaultCriteria,
						month: { ...DefaultCriteria.month, fromOnly: { from: { value: 0 } } }
					}
				}),
				operatorCtx
			);
			const currentYear = new Date().getFullYear();
			expect(op).toMatchObject({ from: `${currentYear}-01-01`, to: undefined });
		});

		it("MONTH toOnly month=11 (December) emits last day of December", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "month",
					selectedRange: "toOnly",
					criteria: {
						...DefaultCriteria,
						month: { ...DefaultCriteria.month, toOnly: { to: { value: 11 } } }
					}
				}),
				operatorCtx
			);
			const currentYear = new Date().getFullYear();
			expect(op).toMatchObject({ from: undefined, to: `${currentYear}-12-31` });
		});

		it("MONTH null value drops the slot (no operator produced)", () => {
			expect(controller.toOperator(model, makeOptions({ selectedPeriod: "month" }), operatorCtx)).toBeUndefined();
		});
	});

	describe("toOperator() — null/empty value pins (Phase 0)", () => {
		const model = makeItem();

		it("DATE fromTo with null 'from' drops only that bound", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					criteria: {
						...DefaultCriteria,
						date: {
							...DefaultCriteria.date,
							fromTo: {
								from: dateInput("", null),
								to: dateInput("2026-12-31", new Date("2026-12-31"))
							}
						}
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({ from: undefined, to: "2026-12-31" });
		});

		it("YEAR fromTo with null 'to' drops only that bound", () => {
			const op = controller.toOperator(
				model,
				makeOptions({
					selectedPeriod: "year",
					criteria: {
						...DefaultCriteria,
						year: {
							...DefaultCriteria.year,
							fromTo: { from: { value: 2026, error: null }, to: { value: null, error: null } }
						}
					}
				}),
				operatorCtx
			);
			expect(op).toMatchObject({ from: "2026-01-01", to: undefined });
		});

		it("YEAR_MONTH null both bounds returns undefined operator", () => {
			expect(controller.toOperator(model, makeOptions({ selectedPeriod: "yearMonth" }), operatorCtx)).toBeUndefined();
		});
	});

	describe("toLabel()", () => {
		const model = makeItem();

		it("DATE returns null when no values entered", () => {
			expect(controller.toLabel(model, makeOptions(), labelCtx)).toBeNull();
		});

		it("DATE fromTo renders 'from - to'", () => {
			const opts = makeOptions({
				criteria: {
					...DefaultCriteria,
					date: {
						...DefaultCriteria.date,
						fromTo: {
							from: dateInput("2026-01-01", new Date("2026-01-01")),
							to: dateInput("2026-12-31", new Date("2026-12-31"))
						}
					}
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("2026-01-01 - 2026-12-31");
		});

		it("DATE exact collapses to a single value", () => {
			const opts = makeOptions({
				selectedRange: "exact",
				criteria: {
					...DefaultCriteria,
					date: { ...DefaultCriteria.date, exact: { exact: dateInput("2026-04-25", new Date("2026-04-25")) } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("2026-04-25");
		});

		it("DATE fromOnly renders '>= from'", () => {
			const opts = makeOptions({
				selectedRange: "fromOnly",
				criteria: {
					...DefaultCriteria,
					date: { ...DefaultCriteria.date, fromOnly: { from: dateInput("2026-01-01", new Date("2026-01-01")) } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("≥ 2026-01-01");
		});

		it("DATE toOnly renders '<= to'", () => {
			const opts = makeOptions({
				selectedRange: "toOnly",
				criteria: {
					...DefaultCriteria,
					date: { ...DefaultCriteria.date, toOnly: { to: dateInput("2026-12-31", new Date("2026-12-31")) } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("≤ 2026-12-31");
		});

		it("YEAR returns null when no values entered", () => {
			expect(controller.toLabel(model, makeOptions({ selectedPeriod: "year" }), labelCtx)).toBeNull();
		});

		it("YEAR fromTo renders 'yyyy - yyyy'", () => {
			const opts = makeOptions({
				selectedPeriod: "year",
				criteria: {
					...DefaultCriteria,
					year: {
						...DefaultCriteria.year,
						fromTo: { from: { value: 2024, error: null }, to: { value: 2026, error: null } }
					}
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("2024 - 2026");
		});

		it("YEAR exact collapses to a single value", () => {
			const opts = makeOptions({
				selectedPeriod: "year",
				selectedRange: "exact",
				criteria: {
					...DefaultCriteria,
					year: { ...DefaultCriteria.year, exact: { exact: { value: 2026, error: null } } }
				}
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("2026");
		});

		it("YEAR_MONTH returns null when no values entered", () => {
			expect(controller.toLabel(model, makeOptions({ selectedPeriod: "yearMonth" }), labelCtx)).toBeNull();
		});

		it("YEAR_MONTH fromTo renders 'yyyy-MM - yyyy-MM'", () => {
			const opts = makeOptions({
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
			});
			expect(controller.toLabel(model, opts, labelCtx)).toBe("2026-01 - 2026-12");
		});
	});

	describe("isInstance()", () => {
		it("guards true for date filter state", () => {
			const state = { model: makeItem() } as never;
			expect(DateFilterState.isInstance(state)).toBe(true);
		});

		it("guards false for non-date filter state", () => {
			const state = {
				model: { id: "f", type: "string", options: { fieldId: "x" } }
			} as never;
			expect(DateFilterState.isInstance(state)).toBe(false);
		});
	});

	describe("toGeneralError()", () => {
		const baseState = { model: makeItem() } as DateFilterState.State;
		const generalErrorKey = (state: DateFilterState.State) =>
			(controller.toGeneralError(state.model, state.options) as { key: string } | null)?.key ?? null;

		it("returns null when not in fromTo mode", () => {
			expect(
				generalErrorKey({
					...baseState,
					options: makeOptions({ selectedRange: "exact" })
				})
			).toBeNull();
		});

		it("returns null for valid DATE fromTo range", () => {
			expect(
				generalErrorKey({
					...baseState,
					options: makeOptions({
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromTo: {
									from: dateInput("2026-01-01", new Date("2026-01-01")),
									to: dateInput("2026-12-31", new Date("2026-12-31"))
								}
							}
						}
					})
				})
			).toBeNull();
		});

		it("returns startGreaterThanEnd key for an inverted DATE fromTo range", () => {
			expect(
				generalErrorKey({
					...baseState,
					options: makeOptions({
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromTo: {
									from: dateInput("2026-12-31", new Date("2026-12-31")),
									to: dateInput("2026-01-01", new Date("2026-01-01"))
								}
							}
						}
					})
				})
			).toBe(RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd);
		});

		it("suppresses general error when DATE input has a field-level parse error", () => {
			expect(
				generalErrorKey({
					...baseState,
					options: makeOptions({
						criteria: {
							...DefaultCriteria,
							date: {
								...DefaultCriteria.date,
								fromTo: {
									from: dateInput("bad", null, "INVALID"),
									to: dateInput("2026-01-01", new Date("2026-01-01"))
								}
							}
						}
					})
				})
			).toBeNull();
		});

		it("returns startGreaterThanEnd key for an inverted YEAR fromTo range", () => {
			expect(
				generalErrorKey({
					...baseState,
					options: makeOptions({
						selectedPeriod: "year",
						criteria: {
							...DefaultCriteria,
							year: {
								...DefaultCriteria.year,
								fromTo: { from: { value: 2026, error: null }, to: { value: 2024, error: null } }
							}
						}
					})
				})
			).toBe(RESOURCE_KEYS.overviewEngine.filterOptionView.error.startGreaterThanEnd);
		});
	});
});

describe("DateFilterState — shared range validators", () => {
	it("dateResolver isInvalidRange returns true when from > to", () => {
		expect(
			isInvalidRange(
				dateResolver,
				{ input: "2026-12-31", value: new Date("2026-12-31"), error: null },
				{ input: "2026-01-01", value: new Date("2026-01-01"), error: null }
			)
		).toBe(true);
	});

	it("dateResolver isInvalidRange returns false when one side is null", () => {
		expect(
			isInvalidRange(
				dateResolver,
				{ input: "", value: null, error: null },
				{ input: "2026-12-31", value: new Date("2026-12-31"), error: null }
			)
		).toBe(false);
	});

	it("yearResolver isInvalidRange returns true when from > to", () => {
		expect(isInvalidRange(yearResolver, { value: 2026, error: null }, { value: 2024, error: null })).toBe(true);
	});

	it("yearResolver isInvalidRange returns false when one side is null", () => {
		expect(isInvalidRange(yearResolver, { value: null, error: null }, { value: 2024, error: null })).toBe(false);
	});

	it("yearMonthResolver isInvalidRange returns true when later year/month", () => {
		expect(
			isInvalidRange(
				yearMonthResolver,
				{ value: { year: 2026, month: 5 }, error: null },
				{ value: { year: 2026, month: 1 }, error: null }
			)
		).toBe(true);
	});

	it("yearMonthResolver isInvalidRange returns false when chronological", () => {
		expect(
			isInvalidRange(
				yearMonthResolver,
				{ value: { year: 2024, month: 0 }, error: null },
				{ value: { year: 2026, month: 0 }, error: null }
			)
		).toBe(false);
	});
});

describe("DateFilterState — deterministic time", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-25T00:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("controller is stateless w.r.t. wall-clock time (sanity)", () => {
		const opts = makeOptions();
		expect(controller.toOperator(makeItem(), opts, operatorCtx)).toBeUndefined();
		expect(controller.hasErrors(makeItem(), opts)).toBe(false);
	});
});
