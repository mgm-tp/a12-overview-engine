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

import { fireEvent } from "@testing-library/react";
import { it, vi, expect, afterAll, describe, beforeAll } from "vitest";

import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderDateTimeFilter } from "./pages/date-time-filter-page.js";

const FIXED_DATE = new Date("2026-04-15T02:15:00.000Z");

beforeAll(() => {
	vi.useFakeTimers({ now: FIXED_DATE.getTime(), shouldAdvanceTime: true });
});

afterAll(() => {
	vi.useRealTimers();
});

const baseOptions: OverviewModel.NewFilter.DateTime.Item = {
	id: "createdDateTime",
	type: "dateTime",
	options: {
		fieldId: ProductFieldIds.dateTimeField.id,
		ranges: [
			{ option: "fromTo", default: true, enabled: true },
			{ option: "fromOnly", enabled: true },
			{ option: "toOnly", enabled: true },
			{ option: "exact", enabled: true }
		],
		periods: [
			{ option: "dateTime", default: true, enabled: true },
			{ option: "date", enabled: true },
			{ option: "year", enabled: true },
			{ option: "yearMonth", enabled: true },
			{ option: "time", enabled: true }
		],
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.date-time-filter", () => {
	describe("Period: DATE_TIME", () => {
		describe("Interaction", () => {
			it("fromTo range - basic input and validation", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = baseOptions;

				const { page } = await renderDateTimeFilter({ filterItem });

				expect(page.dateTimeView.fromInput).toBeInTheDocument();
				expect(page.dateTimeView.toInput).toBeInTheDocument();
				expect(page.dateTimeView.fromValue).toBe("");
				expect(page.dateTimeView.toValue).toBe("");

				expect(page.operator).toMatchInlineSnapshot(`[]`);

				await page.dateTimeView.setFromValue("01/15/2025 10:30 AM");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": "2025-01-15T10:30:00",
					    "operator": "date_range",
					    "to": undefined,
					  },
					]
				`);
				await page.dateTimeView.setToValue("01/31/2025 05:00 PM");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": "2025-01-15T10:30:00",
					    "operator": "date_range",
					    "to": "2025-01-31T17:00:00",
					  },
					]
				`);

				await page.dateTimeView.setFromValue("02/15/2025 10:30 AM");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);

				await page.setEmptySetting("Yes");

				expect(page.isEmptyMode).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "operator": "undefined_match",
					  },
					]
				`);

				await page.setInvertSetting("Yes");
				expect(page.isEmptyMode).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "field": "/product/dateTimeField",
					      "operator": "undefined_match",
					    },
					    "operator": "not",
					  },
					]
				`);

				await page.clickReset();
				expect(page.dateTimeView.fromValue).toBe("");
				expect(page.dateTimeView.toValue).toBe("");
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it.todo("switching between range modes");

			it.todo("using date-time picker dialog");

			it.todo("Empty option shows Empty filter");

			it.todo("Invert option inverts the filter result");
		});

		describe("Validation", () => {
			it("shows error for invalid date-time format", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseOptions });
				await page.dateTimeView.setFromValue("invalid");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only dates in the format 'MM/dd/yyyy hh:mm AM/PM' are allowed.",
					]
				`);
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("shows error when From date-time is after To date-time", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseOptions });

				await page.dateTimeView.setFromValue("02/15/2025 10:30 AM");
				await page.dateTimeView.setToValue("01/31/2025 05:00 PM");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseOptions });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseOptions });

				await page.timeView.setFromValue("02/15/2025 10:30 AM");
				await page.timeView.setToValue("04/30/2025 11:30 PM");

				expect(page.filterBarItemLabel).toBe("02/15/2025 10:30 AM - 04/30/2025 11:30 PM");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseOptions });

				await page.timeView.setFromValue("04/30/2025 11:30 PM");

				expect(page.filterBarItemLabel).toBe("≥ 04/30/2025 11:30 PM");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseOptions });

				await page.timeView.setToValue("04/30/2025 11:30 PM");

				expect(page.filterBarItemLabel).toBe("≤ 04/30/2025 11:30 PM");
			});

			it("displays single value when exact value is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseOptions });

				await page.setRangeMode("Exact");

				await page.timeView.setExactValue("04/30/2025 11:30 PM");

				expect(page.filterBarItemLabel).toBe("04/30/2025 11:30 PM");
			});
		});
	});

	describe("Period: TIME", () => {
		const baseTimeFilterItem: OverviewModel.NewFilter.DateTime.Item = {
			...baseOptions,
			options: {
				...baseOptions.options,
				periods: [{ option: "time", default: true, enabled: true }]
			}
		};

		describe("Interaction", () => {
			it("fromTo range - basic time input and validation", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseTimeFilterItem });
				expect(page.timeView.fromInput).toBeInTheDocument();
				expect(page.timeView.toInput).toBeInTheDocument();

				expect(page.timeView.fromPlaceholder).toEqual("hh:mm AM/PM");
				expect(page.operator).toMatchInlineSnapshot(`[]`);

				await page.timeView.setFromValue("10:30 AM");
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": "2026-04-14T10:30:00",
					    "operator": "date_range",
					    "to": undefined,
					  },
					]
				`);

				await page.timeView.setToValue("05:00 PM");
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": "2026-04-14T10:30:00",
					    "operator": "date_range",
					    "to": "2026-04-14T17:00:00",
					  },
					]
				`);

				await page.clickReset();
				expect(page.timeView.fromValue).toEqual("");
				expect(page.timeView.toValue).toEqual("");
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it.todo("switching between range modes");

			it.todo("using time picker dialog");
		});

		describe("Validation", () => {
			it("shows error for invalid time format", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...baseOptions,
					options: {
						...baseOptions.options,
						periods: [{ option: "time", default: true, enabled: true }],
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};
				const { page } = await renderDateTimeFilter({ filterItem });

				await page.timeView.setFromValue("invalid");
				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only dates in the format hh:mm AM/PM are allowed.",
					]
				`);
			});

			it("shows error when From time is after To time", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...baseOptions,
					options: {
						...baseOptions.options,
						periods: [{ option: "time", default: true, enabled: true }],
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};
				const { page } = await renderDateTimeFilter({ filterItem });

				await page.timeView.setFromValue("05:00 PM");
				await page.timeView.setToValue("10:00 AM");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseTimeFilterItem });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseTimeFilterItem });

				await page.timeView.setFromValue("10:00 AM");
				await page.timeView.setToValue("05:00 PM");

				expect(page.filterBarItemLabel).toBe("10:00 AM - 05:00 PM");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseTimeFilterItem });

				await page.timeView.setFromValue("11:00 AM");

				expect(page.filterBarItemLabel).toBe("≥ 11:00 AM");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseTimeFilterItem });

				await page.timeView.setToValue("07:00 PM");

				expect(page.filterBarItemLabel).toBe("≤ 07:00 PM");
			});

			it("displays single value when exact value is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseTimeFilterItem });

				await page.setRangeMode("Exact");

				await page.timeView.setExactValue("03:00 PM");

				expect(page.filterBarItemLabel).toBe("03:00 PM");
			});
		});
	});

	describe("Period: DATE", () => {
		const baseDateFilterItem: OverviewModel.NewFilter.DateTime.Item = {
			...baseOptions,
			options: {
				...baseOptions.options,
				periods: [{ option: "date", default: true, enabled: true }]
			}
		};

		describe("Interaction", () => {
			it("fromTo range - basic input and validation", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = baseDateFilterItem;

				const { page } = await renderDateTimeFilter({ filterItem });

				const inputs = page.getInputs(["From", "To"]);
				expect(inputs.From.input).toBeInTheDocument();
				expect(inputs.To.input).toBeInTheDocument();
				expect(inputs.From.input.getAttribute("placeholder")).toEqual("MM/dd/yyyy");
				expect(inputs.To.input.getAttribute("placeholder")).toEqual("MM/dd/yyyy");
				expect(inputs.From.value).toBe("");
				expect(inputs.To.value).toBe("");

				expect(page.operator).toMatchInlineSnapshot(`[]`);

				await page.dateView.setFrom("01/15/2025");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": "2025-01-15T00:00:00",
					    "operator": "date_range",
					    "to": undefined,
					  },
					]
				`);

				await page.dateView.setTo("01/31/2025");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": "2025-01-15T00:00:00",
					    "operator": "date_range",
					    "to": "2025-01-31T23:59:59",
					  },
					]
				`);

				await page.dateView.setFrom("02/15/2025");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);

				await page.dateView.setFrom("");
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": undefined,
					    "operator": "date_range",
					    "to": "2025-01-31T23:59:59",
					  },
					]
				`);

				await page.clickReset();

				expect(page.dateView.fromInput?.value).toBe("");
				expect(page.dateView.toInput?.value).toBe("");
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("switching between range modes", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = baseDateFilterItem;

				const { page } = await renderDateTimeFilter({ filterItem });

				expect(page.dateView.fromInput).toBeInTheDocument();
				expect(page.dateView.toInput).toBeInTheDocument();

				await page.setRangeMode("From");

				expect(page.dateView.fromInput).toBeInTheDocument();
				expect(page.dateView.toInput).toBeUndefined();

				await page.setRangeMode("To");

				expect(page.dateView.fromInput).toBeUndefined();
				expect(page.dateView.toInput).toBeInTheDocument();

				await page.setRangeMode("Exact");

				expect(page.dateView.exactInput).toBeInTheDocument();
				expect(page.dateView.fromInput).toBeUndefined();
				expect(page.dateView.toInput).toBeUndefined();
			});

			it("Empty option shows Empty filter", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...baseDateFilterItem,
					options: { ...baseDateFilterItem.options, empty: { enabled: true, value: true } }
				};

				const { page } = await renderDateTimeFilter({ filterItem });

				expect(page.isEmptyMode).toBe(true);
				expect(page.dateView.fromInput).toBeUndefined();
				expect(page.dateView.toInput).toBeUndefined();
			});

			it("Invert option inverts the filter result", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...baseDateFilterItem,
					options: { ...baseDateFilterItem.options, invert: { enabled: true, value: true } }
				};

				const { page } = await renderDateTimeFilter({ filterItem });

				await page.dateView.setFrom("01/15/2025");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "field": "/product/dateTimeField",
					      "from": "2025-01-15T00:00:00",
					      "operator": "date_range",
					      "to": undefined,
					    },
					    "operator": "not",
					  },
					]
				`);
			});
		});

		describe("Validation", () => {
			it("shows error for invalid time format", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseDateFilterItem });

				await page.timeView.setFromValue("invalid");
				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only dates in the format MM/dd/yyyy are allowed.",
					]
				`);
			});

			it("shows error when From time is after To time", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseDateFilterItem });

				await page.timeView.setFromValue("01/15/2025");
				await page.timeView.setToValue("12/25/2024");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseDateFilterItem });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseDateFilterItem });

				await page.timeView.setFromValue("01/15/2025");
				await page.timeView.setToValue("04/30/2025");

				expect(page.filterBarItemLabel).toBe("01/15/2025 - 04/30/2025");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseDateFilterItem });

				await page.timeView.setFromValue("01/15/2025");

				expect(page.filterBarItemLabel).toBe("≥ 01/15/2025");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseDateFilterItem });

				await page.timeView.setToValue("01/15/2025");

				expect(page.filterBarItemLabel).toBe("≤ 01/15/2025");
			});

			it("displays single value when exact value is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseDateFilterItem });

				await page.setRangeMode("Exact");

				await page.timeView.setExactValue("01/15/2025");

				expect(page.filterBarItemLabel).toBe("01/15/2025");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateTimeField",
					    "from": "2025-01-15T00:00:00",
					    "operator": "date_range",
					    "to": "2025-01-15T23:59:59",
					  },
					]
				`);
			});
		});
	});

	describe("Period: YEAR", () => {
		const baseYearFilterItem: OverviewModel.NewFilter.DateTime.Item = {
			...baseOptions,
			options: {
				...baseOptions.options,
				periods: [{ option: "year", default: true, enabled: true }]
			}
		};

		describe("Interaction", () => {
			it("works the same as date filter year period", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseYearFilterItem });

				expect(page.yearView.fromSelect).toBeInTheDocument();
				expect(page.yearView.toSelect).toBeInTheDocument();
				expect(page.yearView.fromSelect?.value).toBe("");
				expect(page.yearView.toSelect?.value).toBe("");

				expect(page.operator).toMatchInlineSnapshot(`[]`);

				await page.yearView.selectFrom("2020");

				expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/dateTimeField",
				    "from": "2020-01-01T00:00:00",
				    "operator": "date_range",
				    "to": undefined,
				  },
				]
			`);

				await page.yearView.selectTo("2025");

				expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/dateTimeField",
				    "from": "2020-01-01T00:00:00",
				    "operator": "date_range",
				    "to": "2025-12-31T23:59:59",
				  },
				]
			`);

				await page.yearView.selectFrom("2027");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);

				await page.clickReset();

				expect(page.yearView.fromSelect?.value).toBe("");
				expect(page.yearView.toSelect?.value).toBe("");
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});
		});

		describe("Validation", () => {
			it("shows error when From year is after To year", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...baseYearFilterItem,
					options: {
						...baseYearFilterItem.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateTimeFilter({ filterItem });

				await page.yearView.selectFrom("2030");
				await page.yearView.selectTo("2020");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);
			});

			it("clears error when range becomes valid", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...baseYearFilterItem,
					options: {
						...baseYearFilterItem.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateTimeFilter({ filterItem });

				await page.yearView.selectFrom("2027");
				await page.yearView.selectTo("2026");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);

				await page.yearView.selectFrom("2025");

				expect(page.errorMessages).toMatchInlineSnapshot(`[]`);
			});

			it("disables Reset All and Apply All again after a year is selected then cleared back to empty", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...baseYearFilterItem,
					options: {
						...baseYearFilterItem.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateTimeFilter({ filterItem });

				expect(page.isApplyAllEnabled).toBe(false);
				expect(page.isResetAllEnabled).toBe(false);

				await page.yearView.selectFrom("2025");
				expect(page.isApplyAllEnabled).toBe(true);
				expect(page.isResetAllEnabled).toBe(true);

				await page.yearView.selectFrom("");
				expect(page.errorMessages).toMatchInlineSnapshot(`[]`);
				expect(page.isApplyAllEnabled).toBe(false);
				expect(page.isResetAllEnabled).toBe(false);
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseYearFilterItem });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseYearFilterItem });

				await page.yearView.selectFrom("2020");
				await page.yearView.selectTo("2025");

				expect(page.filterBarItemLabel).toBe("2020 - 2025");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseYearFilterItem });

				await page.yearView.selectFrom("2020");

				expect(page.filterBarItemLabel).toBe("≥ 2020");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseYearFilterItem });

				await page.yearView.selectTo("2025");

				expect(page.filterBarItemLabel).toBe("≤ 2025");
			});

			it("displays single value when exact value is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: baseYearFilterItem });

				await page.setRangeMode("Exact");

				await page.yearView.selectExact("2027");

				expect(page.filterBarItemLabel).toBe("2027");
			});
		});
	});

	describe("Period: YEAR_MONTH", () => {
		const yearMonthPeriodFilterOptions: OverviewModel.NewFilter.DateTime.Item = {
			...baseOptions,
			options: {
				...baseOptions.options,
				periods: [{ option: "yearMonth", default: true, enabled: true }]
			}
		};

		it("Interaction", async () => {
			const filterItem: OverviewModel.NewFilter.DateTime.Item = yearMonthPeriodFilterOptions;

			const { page } = await renderDateTimeFilter({ filterItem });

			expect(page.monthYearView.fromYearSelect).toBeInTheDocument();
			expect(page.monthYearView.fromMonthSelect).toBeInTheDocument();
			expect(page.monthYearView.toYearSelect).toBeInTheDocument();
			expect(page.monthYearView.toMonthSelect).toBeInTheDocument();
			expect(page.monthYearView.fromYearSelect?.value).toBe("");
			expect(page.monthYearView.fromMonthSelect?.value).toBe("Month");
			expect(page.monthYearView.toYearSelect?.value).toBe("");
			expect(page.monthYearView.toMonthSelect?.value).toBe("Month");

			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.monthYearView.selectFromYear("2020");
			await page.monthYearView.selectFromMonth("7");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/dateTimeField",
				    "from": "2020-08-01T00:00:00",
				    "operator": "date_range",
				    "to": undefined,
				  },
				]
			`);

			await page.monthYearView.selectToYear("2025");
			await page.monthYearView.selectToMonth("6");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/dateTimeField",
				    "from": "2020-08-01T00:00:00",
				    "operator": "date_range",
				    "to": "2025-07-31T23:59:59",
				  },
				]
			`);

			await page.monthYearView.selectFromYear("2027");
			await page.monthYearView.selectFromMonth("1");

			expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);

			await page.clickReset();

			expect(page.monthYearView.fromYearSelect?.value).toBe("");
			expect(page.monthYearView.fromMonthSelect?.value).toBe("Month");
			expect(page.monthYearView.toYearSelect?.value).toBe("");
			expect(page.monthYearView.toMonthSelect?.value).toBe("Month");
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		describe("Validation", () => {
			it("shows error when From year/month is after To year/month", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...yearMonthPeriodFilterOptions,
					options: {
						...yearMonthPeriodFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateTimeFilter({ filterItem });

				await page.monthYearView.selectFromYear("2030");
				await page.monthYearView.selectFromMonth("6");
				await page.monthYearView.selectToYear("2020");
				await page.monthYearView.selectToMonth("3");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);
			});

			it("clears error when range becomes valid", async () => {
				const filterItem: OverviewModel.NewFilter.DateTime.Item = {
					...yearMonthPeriodFilterOptions,
					options: {
						...yearMonthPeriodFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateTimeFilter({ filterItem });

				await page.monthYearView.selectFromYear("2026");
				await page.monthYearView.selectFromMonth("6");
				await page.monthYearView.selectToYear("2025");
				await page.monthYearView.selectToMonth("3");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);

				await page.monthYearView.selectFromYear("2024");
				await page.monthYearView.selectFromMonth("1");

				expect(page.errorMessages).toMatchInlineSnapshot(`[]`);
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: yearMonthPeriodFilterOptions });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromYear("2020");
				await page.monthYearView.selectFromMonth("3");

				await page.monthYearView.selectToYear("2025");
				await page.monthYearView.selectToMonth("6");

				expect(page.filterBarItemLabel).toBe("04/2020 - 07/2025");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromYear("2020");
				await page.monthYearView.selectFromMonth("3");

				expect(page.filterBarItemLabel).toBe("≥ 04/2020");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectToYear("2025");
				await page.monthYearView.selectToMonth("6");

				expect(page.filterBarItemLabel).toBe("≤ 07/2025");
			});

			it("displays single value when exact value is entered", async () => {
				const { page } = await renderDateTimeFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.setRangeMode("Exact");

				await page.monthYearView.selectExactYear("2027");
				await page.monthYearView.selectExactMonth("9");

				expect(page.filterBarItemLabel).toBe("10/2027");
			});
		});
	});

	describe("Period: MONTH", () => {
		const monthPeriodFilterOptions: OverviewModel.NewFilter.DateTime.Item = {
			...baseOptions,
			options: {
				...baseOptions.options,
				periods: [{ option: "month", default: true, enabled: true }]
			}
		};

		it("fromTo maps to first/last day of the selected month in the current year", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: monthPeriodFilterOptions });

			expect(page.monthView.fromSelect).toBeInTheDocument();
			expect(page.monthView.toSelect).toBeInTheDocument();
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.monthView.selectFrom("3");
			await page.monthView.selectTo("3");

			const ops = page.operator as Array<Record<string, unknown>>;
			expect(ops).toHaveLength(1);
			expect(ops[0].field).toBe("/product/dateTimeField");
			expect(ops[0].operator).toBe("date_range");
			expect(ops[0].from).toMatch(/^\d{4}-04-01T00:00:00$/);
			expect(ops[0].to).toMatch(/^\d{4}-04-30T23:59:59$/);
		});

		it("exact maps to first/last moment of the selected month", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: monthPeriodFilterOptions });

			await page.setRangeMode("Exact");
			await page.monthView.selectExact("6");

			const ops = page.operator as Array<Record<string, unknown>>;
			expect(ops).toHaveLength(1);
			expect(ops[0].from).toMatch(/^\d{4}-07-01T00:00:00$/);
			expect(ops[0].to).toMatch(/^\d{4}-07-31T23:59:59$/);
		});

		it("shows error when From month is after To month", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: monthPeriodFilterOptions });

			await page.monthView.selectFrom("8");
			await page.monthView.selectTo("2");

			expect(page.errorMessages).toMatchInlineSnapshot(`
				[
				  "The start value must not be bigger than the end value.",
				]
			`);
		});

		it("reset clears month selection", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: monthPeriodFilterOptions });

			await page.monthView.selectFrom("5");
			await page.monthView.selectTo("9");
			await page.clickReset();

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("Switching Periods", () => {
		it("switching from DATE_TIME to TIME period", async () => {
			const filterItem: OverviewModel.NewFilter.DateTime.Item = baseOptions;
			const { page } = await renderDateTimeFilter({ filterItem });

			expect(page.dateTimeView.fromInput).toBeInTheDocument();
			expect(page.dateTimeView.toInput).toBeInTheDocument();
			expect(page.dateTimeView.fromPlaceholder).toEqual("MM/dd/yyyy hh:mm AM/PM");
			expect(page.dateTimeView.toPlaceholder).toEqual("MM/dd/yyyy hh:mm AM/PM");

			await page.setPeriodMode("Time (Today)");

			expect(page.timeView.fromInput).toBeInTheDocument();
			expect(page.timeView.toInput).toBeInTheDocument();
			expect(page.timeView.fromPlaceholder).toEqual("hh:mm AM/PM");
			expect(page.timeView.toPlaceholder).toEqual("hh:mm AM/PM");
		});

		it("switching from TIME to DATE_TIME period", async () => {
			const filterItem: OverviewModel.NewFilter.DateTime.Item = {
				...baseOptions,
				options: {
					...baseOptions.options,
					periods: [
						{ option: "time", default: true, enabled: true },
						{ option: "dateTime", enabled: true }
					]
				}
			};
			const { page } = await renderDateTimeFilter({ filterItem });

			expect(page.timeView.fromInput).toBeInTheDocument();
			expect(page.timeView.toInput).toBeInTheDocument();
			expect(page.timeView.fromPlaceholder).toEqual("hh:mm AM/PM");
			expect(page.timeView.toPlaceholder).toEqual("hh:mm AM/PM");

			await page.setPeriodMode("Date & Time");

			expect(page.dateTimeView.fromInput).toBeInTheDocument();
			expect(page.dateTimeView.toInput).toBeInTheDocument();
			expect(page.dateTimeView.fromPlaceholder).toEqual("MM/dd/yyyy hh:mm AM/PM");
			expect(page.dateTimeView.toPlaceholder).toEqual("MM/dd/yyyy hh:mm AM/PM");
		});
	});

	// Regression: filling an input and clearing it back to empty must return the filter to its
	// pristine state, so both footer buttons (Reset All / Apply All) disable again.
	describe("Footer button enablement after clearing values", () => {
		const itemWithDefaultPeriod = (
			period: OverviewModel.NewFilter.DateTime.PeriodOption
		): OverviewModel.NewFilter.DateTime.Item => ({
			...baseOptions,
			options: {
				...baseOptions.options,
				ranges: [{ option: "fromTo", default: true, enabled: true }],
				periods: [{ option: period, default: true, enabled: true }],
				empty: { enabled: false },
				invert: { enabled: false }
			}
		});

		it("dateTime period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: itemWithDefaultPeriod("dateTime") });

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.dateTimeView.setFromValue("01/15/2025 10:30 AM");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.dateTimeView.setFromValue("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("date period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: itemWithDefaultPeriod("date") });

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.dateView.setFrom("01/15/2025");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.dateView.setFrom("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("time period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: itemWithDefaultPeriod("time") });

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.timeView.setFromValue("10:30 AM");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.timeView.setFromValue("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("year period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: itemWithDefaultPeriod("year") });

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			await page.yearView.selectFrom("2024");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.yearView.selectFrom("");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});

		it("yearMonth period: disables Reset/Apply All after a value is cleared", async () => {
			const { page } = await renderDateTimeFilter({ filterItem: itemWithDefaultPeriod("yearMonth") });

			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);

			const monthSelect = page.monthYearView.fromMonthSelect;
			assertCondition(!!monthSelect, "From month select not found");
			fireEvent.change(monthSelect, { target: { value: "3" } });
			await page.monthYearView.selectFromYear("2024");
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(true);
			expect(page.isApplyAllEnabled).toBe(true);

			await page.monthYearView.selectFromYear("");
			fireEvent.change(monthSelect, { target: { value: "" } });
			expect(page.errorMessages).toEqual([]);
			expect(page.isResetAllEnabled).toBe(false);
			expect(page.isApplyAllEnabled).toBe(false);
		});
	});
});
