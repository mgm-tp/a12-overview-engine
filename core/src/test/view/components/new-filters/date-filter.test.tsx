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
import { vi, it, expect, describe, afterAll, beforeAll } from "vitest";

import type { OverviewModel } from "../../../../main/index.js";
import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";

import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderDateFilter } from "./pages/date-filter-page.js";

const FIXED_DATE = new Date("2026-04-15T00:00:00.000Z");

beforeAll(() => {
	vi.useFakeTimers({ now: FIXED_DATE.getTime(), shouldAdvanceTime: true });
});

afterAll(() => {
	vi.useRealTimers();
});

const baseDateFilterOptions: OverviewModel.NewFilter.Date.Item = {
	id: "createdDate",
	type: "date",
	options: {
		fieldId: ProductFieldIds.dateField.id,
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
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.date-filter", () => {
	describe("Period: DATE", () => {
		describe("Interaction", () => {
			it("fromTo range - basic input and validation", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = baseDateFilterOptions;

				const { page } = await renderDateFilter({ filterItem });

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
					    "field": "/product/dateField",
					    "from": "2025-01-15",
					    "operator": "date_range",
					    "to": undefined,
					  },
					]
				`);

				await page.dateView.setTo("01/31/2025");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateField",
					    "from": "2025-01-15",
					    "operator": "date_range",
					    "to": "2025-01-31",
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
					    "field": "/product/dateField",
					    "from": undefined,
					    "operator": "date_range",
					    "to": "2025-01-31",
					  },
					]
				`);

				await page.clickReset();

				expect(page.dateView.fromInput?.value).toBe("");
				expect(page.dateView.toInput?.value).toBe("");
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("switching between range modes", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = baseDateFilterOptions;

				const { page } = await renderDateFilter({ filterItem });

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
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...baseDateFilterOptions,
					options: { ...baseDateFilterOptions.options, empty: { enabled: true, value: true } }
				};

				const { page } = await renderDateFilter({ filterItem });

				expect(page.isEmptyMode).toBe(true);
				expect(page.dateView.fromInput).toBeUndefined();
				expect(page.dateView.toInput).toBeUndefined();
			});

			it("Invert option inverts the filter result", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...baseDateFilterOptions,
					options: { ...baseDateFilterOptions.options, invert: { enabled: true, value: true } }
				};

				const { page } = await renderDateFilter({ filterItem });

				await page.dateView.setFrom("01/15/2025");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "field": "/product/dateField",
					      "from": "2025-01-15",
					      "operator": "date_range",
					      "to": undefined,
					    },
					    "operator": "not",
					  },
					]
				`);
			});
		});

		describe("Format Placeholder", () => {
			it("displays format placeholder in From input", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				expect(page.dateView.fromPlaceholder).toBe("MM/dd/yyyy");
			});

			it("displays format placeholder in To input", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				expect(page.dateView.fromPlaceholder).toBe("MM/dd/yyyy");
			});
		});

		describe("Validation", () => {
			it("shows error for invalid date format", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...baseDateFilterOptions,
					options: {
						...baseDateFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				await page.dateView.setFrom("invalid");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only dates in the format 'MM/dd/yyyy' are allowed.",
					]
				`);

				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("shows error when From date is after To date", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...baseDateFilterOptions,
					options: {
						...baseDateFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				await page.dateView.setFrom("12/31/2025");
				await page.dateView.setTo("01/01/2025");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);
			});

			it("clears error when range becomes valid", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...baseDateFilterOptions,
					options: {
						...baseDateFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				await page.dateView.setFrom("12/31/2025");
				await page.dateView.setTo("01/01/2025");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);

				await page.dateView.setFrom("01/01/2025");

				expect(page.errorMessages).toMatchInlineSnapshot(`[]`);
			});

			it("disables Apply All again after invalid input is cleared back to empty", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...baseDateFilterOptions,
					options: {
						...baseDateFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				// Pristine: nothing changed from the applied baseline.
				expect(page.isApplyAllEnabled).toBe(false);

				// Invalid input -> error shown, Apply All stays disabled.
				await page.dateView.setFrom("invalid");
				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only dates in the format 'MM/dd/yyyy' are allowed.",
					]
				`);
				expect(page.isApplyAllEnabled).toBe(false);

				// Clear back to the initial empty state -> nothing changed, Apply All must stay disabled.
				await page.dateView.setFrom("");
				expect(page.errorMessages).toMatchInlineSnapshot(`[]`);
				expect(page.isApplyAllEnabled).toBe(false);
			});
		});

		// Regression: filling an input and clearing it back to empty must return the filter to its
		// pristine state, so both footer buttons (Reset All / Apply All) disable again.
		describe("Footer button enablement after clearing values", () => {
			const itemWithDefaultPeriod = (
				period: OverviewModel.NewFilter.Date.PeriodOption
			): OverviewModel.NewFilter.Date.Item => ({
				...baseDateFilterOptions,
				options: {
					...baseDateFilterOptions.options,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					periods: [
						{ option: "date", enabled: true },
						{ option: "year", enabled: true },
						{ option: "yearMonth", enabled: true }
					].map((p) =>
						p.option === period ? { ...p, default: true } : p
					) as OverviewModel.NewFilter.Date.Options["periods"],
					empty: { enabled: false },
					invert: { enabled: false }
				}
			});

			it("date period: disables Reset/Apply All after a value is cleared", async () => {
				const { page } = await renderDateFilter({ filterItem: itemWithDefaultPeriod("date") });

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

			it("year period: disables Reset/Apply All after a value is cleared", async () => {
				const { page } = await renderDateFilter({ filterItem: itemWithDefaultPeriod("year") });

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
				const { page } = await renderDateFilter({ filterItem: itemWithDefaultPeriod("yearMonth") });

				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);

				// Set both month and year so the pair is complete (no partial-pair error).
				const monthSelect = page.monthYearView.fromMonthSelect;
				assertCondition(!!monthSelect, "From month select not found");
				fireEvent.change(monthSelect, { target: { value: "3" } });
				await page.monthYearView.selectFromYear("2024");
				expect(page.errorMessages).toEqual([]);
				expect(page.isResetAllEnabled).toBe(true);
				expect(page.isApplyAllEnabled).toBe(true);

				// Clear both back to empty.
				await page.monthYearView.selectFromYear("");
				fireEvent.change(monthSelect, { target: { value: "" } });
				expect(page.errorMessages).toEqual([]);
				expect(page.isResetAllEnabled).toBe(false);
				expect(page.isApplyAllEnabled).toBe(false);
			});
		});

		describe("Configuration", () => {
			describe("Range options", () => {
				it("hide range options if there is only one option", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							ranges: [{ option: "fromTo", default: true, enabled: true }]
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.withSettings(async (settings) => {
						expect(settings.range()).toBeUndefined();
					});
				});

				it("hide range options when empty is try", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							empty: {
								enabled: true,
								value: true
							},
							ranges: [
								{ option: "fromTo", default: true, enabled: true },
								{ option: "toOnly", enabled: true }
							]
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.withSettings(async (settings) => {
						expect(settings.range()).toBeUndefined();
					});
				});

				it("show only configured options", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,

							ranges: [
								{ option: "fromTo", default: true, enabled: true },
								{ option: "toOnly", enabled: true }
							]
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.withSettings(async (settings) => {
						const range = settings.range();
						expect(range?.items).toHaveLength(2);
						expect(range?.itemByDataRole("range-icon-fromTo")).toBeDefined();
						expect(range?.itemByDataRole("range-icon-toOnly")).toBeDefined();
					});
				});
			});

			describe("Empty option", () => {
				it("hide empty option when disabled", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							empty: { enabled: false }
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.withSettings(async (settings) => {
						expect(settings.empty()).toBeUndefined();
					});
				});

				it("show empty option with configured value", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							empty: { enabled: true, value: true }
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.withSettings(async (settings) => {
						expect(settings.empty()).toBeDefined();
						expect(settings.empty()?.selectedItem?.textContent).toEqual("Yes");
					});
				});

				it("show the select option when choose", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							empty: { enabled: true, value: false }
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.setEmptySetting("Yes");

					expect(page.emptyInput).toBeDefined();
				});
			});

			describe("Invert option", () => {
				it("hide invert option if disabled", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							invert: { enabled: false }
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.withSettings(async (settings) => {
						expect(settings.invert()).toBeUndefined();
					});
				});

				it("show invert option with configured value", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							invert: { enabled: true, value: true }
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.withSettings(async (settings) => {
						expect(settings.invert()).toBeDefined();
						expect(settings.invert()?.selectedItem?.textContent).toEqual("Yes");
					});
				});

				it("show the select option when choose", async () => {
					const filterItem: OverviewModel.NewFilter.Date.Item = {
						...baseDateFilterOptions,
						options: {
							...baseDateFilterOptions.options,
							invert: { enabled: true, value: false }
						}
					};

					const { page } = await renderDateFilter({ filterItem });

					await page.dateView.setFrom("01/01/2025");

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "field": "/product/dateField",
						    "from": "2025-01-01",
						    "operator": "date_range",
						    "to": undefined,
						  },
						]
					`);

					await page.setInvertSetting("Yes");

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "operand": {
						      "field": "/product/dateField",
						      "from": "2025-01-01",
						      "operator": "date_range",
						      "to": undefined,
						    },
						    "operator": "not",
						  },
						]
					`);
				});
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				await page.dateView.setFrom("01/15/2025");
				await page.dateView.setTo("01/31/2025");

				expect(page.filterBarItemLabel).toBe("01/15/2025 - 01/31/2025");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				await page.dateView.setFrom("01/15/2025");

				expect(page.filterBarItemLabel).toBe("≥ 01/15/2025");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				await page.dateView.setTo("01/31/2025");

				expect(page.filterBarItemLabel).toBe("≤ 01/31/2025");
			});

			it("displays exact value when exact mode is used", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				await page.setRangeMode("Exact");
				await page.dateView.setExact("01/20/2025");

				expect(page.filterBarItemLabel).toBe("01/20/2025");
			});

			it("displays Empty when empty option is set", async () => {
				const { page } = await renderDateFilter({
					filterItem: {
						...baseDateFilterOptions,
						options: { ...baseDateFilterOptions.options, empty: { enabled: true, value: true } }
					}
				});

				expect(page.filterBarItemLabel).toBe("Empty");
			});

			it("clears label when filter is reset", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				await page.dateView.setFrom("01/15/2025");
				expect(page.filterBarItemLabel).toBe("≥ 01/15/2025");

				await page.clickReset();

				expect(page.filterBarItemLabel).toBe(null);
			});
		});

		describe("Date Picker Dialog", () => {
			it("opens date picker when clicking the From field picker button", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				expect(page.isDatePickerOpen).toBe(false);

				const dialog = await page.openFromDatePicker();

				expect(dialog).toBeDefined();
			});

			it("opens date picker when clicking the To field picker button", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				expect(page.isDatePickerOpen).toBe(false);

				const dialog = await page.openToDatePicker();

				expect(dialog).toBeDefined();
			});

			it("shows the current month (April 2026) by default", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				const dialog = await page.openFromDatePicker();

				expect(dialog.monthSelector?.value).toEqual("3");
				expect(dialog.yearSelector?.value).toContain("2026");
			});

			it("selects a date when clicking a day and confirming with OK", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				const dialog = await page.openFromDatePicker();

				dialog.selectDate(20);

				expect(page.dateView.fromInput?.value).toBe("04/20/2026");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateField",
					    "from": "2026-04-20",
					    "operator": "date_range",
					    "to": undefined,
					  },
					]
				`);
			});

			it("navigates to previous month", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				const dialog = await page.openFromDatePicker();

				expect(dialog.monthSelector?.value).toEqual("3");

				dialog.clickPrevMonth();

				expect(dialog.monthSelector?.value).toEqual("2");
			});

			it("navigates to next month", async () => {
				const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

				const dialog = await page.openFromDatePicker();

				expect(dialog.monthSelector?.value).toEqual("3");

				dialog.clickNextMonth();

				expect(dialog.monthSelector?.value).toContain("4");
			});
		});
	});

	describe("Period: YEAR", () => {
		const yearPeriodFilterOptions: OverviewModel.NewFilter.Date.Item = {
			...baseDateFilterOptions,
			options: {
				...baseDateFilterOptions.options,
				periods: [{ option: "year", default: true, enabled: true }]
			}
		};

		describe("Interaction", () => {
			it("fromTo range - basic input with year selector", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = yearPeriodFilterOptions;

				const { page } = await renderDateFilter({ filterItem });

				expect(page.yearView.fromSelect).toBeInTheDocument();
				expect(page.yearView.toSelect).toBeInTheDocument();
				expect(page.yearView.fromSelect?.value).toBe("");
				expect(page.yearView.toSelect?.value).toBe("");

				expect(page.operator).toMatchInlineSnapshot(`[]`);

				await page.yearView.selectFrom("2020");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateField",
					    "from": "2020-01-01",
					    "operator": "date_range",
					    "to": undefined,
					  },
					]
				`);

				await page.yearView.selectTo("2025");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateField",
					    "from": "2020-01-01",
					    "operator": "date_range",
					    "to": "2025-12-31",
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

			it("switching between range modes", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearPeriodFilterOptions,
					options: {
						...yearPeriodFilterOptions.options,
						ranges: [
							{ option: "fromTo", default: true, enabled: true },
							{ option: "fromOnly", enabled: true },
							{ option: "toOnly", enabled: true },
							{ option: "exact", enabled: true }
						]
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				expect(page.yearView.fromSelect).toBeInTheDocument();
				expect(page.yearView.toSelect).toBeInTheDocument();

				await page.setRangeMode("From");

				expect(page.yearView.fromSelect).toBeInTheDocument();
				expect(page.yearView.toSelect).toBeUndefined();

				await page.setRangeMode("To");

				expect(page.yearView.fromSelect).toBeUndefined();
				expect(page.yearView.toSelect).toBeInTheDocument();

				await page.setRangeMode("Exact");

				expect(page.yearView.exactSelect).toBeInTheDocument();
				expect(page.yearView.fromSelect).toBeUndefined();
				expect(page.yearView.toSelect).toBeUndefined();
			});

			it("Empty option shows Empty filter", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearPeriodFilterOptions,
					options: { ...yearPeriodFilterOptions.options, empty: { enabled: true, value: true } }
				};

				const { page } = await renderDateFilter({ filterItem });

				expect(page.isEmptyMode).toBe(true);
				expect(page.yearView.fromSelect).toBeUndefined();
				expect(page.yearView.toSelect).toBeUndefined();
			});

			it("Invert option inverts the filter result", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearPeriodFilterOptions,
					options: { ...yearPeriodFilterOptions.options, invert: { enabled: true, value: true } }
				};

				const { page } = await renderDateFilter({ filterItem });

				await page.yearView.selectFrom("2020");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "field": "/product/dateField",
					      "from": "2020-01-01",
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
			it("shows error when From year is after To year", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearPeriodFilterOptions,
					options: {
						...yearPeriodFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				await page.yearView.selectFrom("2030");
				await page.yearView.selectTo("2020");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "The start value must not be bigger than the end value.",
					]
				`);
			});

			it("clears error when range becomes valid", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearPeriodFilterOptions,
					options: {
						...yearPeriodFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

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

			// Regression guard: the year editor must emit cleared input state that is structurally
			// identical to the pristine default (`{ value: null }` — no `error` key, `null` not
			// `undefined`). If a future change reintroduces `error: undefined` or an `undefined`
			// value on clear, the cleared filter no longer matches its baseline and both footer
			// buttons wrongly stay enabled. This test fails the moment that happens.
			it("disables Reset All and Apply All again after a year is selected then cleared back to empty", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearPeriodFilterOptions,
					options: {
						...yearPeriodFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				// Pristine: nothing changed from the applied baseline.
				expect(page.isApplyAllEnabled).toBe(false);
				expect(page.isResetAllEnabled).toBe(false);

				// Select a year -> something changed, both buttons enabled.
				await page.yearView.selectFrom("2025");
				expect(page.isApplyAllEnabled).toBe(true);
				expect(page.isResetAllEnabled).toBe(true);

				// Clear back to the initial empty state -> nothing changed, both buttons must be disabled again.
				await page.yearView.selectFrom("");
				expect(page.errorMessages).toMatchInlineSnapshot(`[]`);
				expect(page.isApplyAllEnabled).toBe(false);
				expect(page.isResetAllEnabled).toBe(false);
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearPeriodFilterOptions });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearPeriodFilterOptions });

				await page.yearView.selectFrom("2020");
				await page.yearView.selectTo("2025");

				expect(page.filterBarItemLabel).toBe("2020 - 2025");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearPeriodFilterOptions });

				await page.yearView.selectFrom("2020");

				expect(page.filterBarItemLabel).toBe("≥ 2020");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearPeriodFilterOptions });

				await page.yearView.selectTo("2025");

				expect(page.filterBarItemLabel).toBe("≤ 2025");
			});

			it("displays single value when exact value is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearPeriodFilterOptions });

				await page.setRangeMode("Exact");

				await page.yearView.selectExact("2027");

				expect(page.filterBarItemLabel).toBe("2027");
			});
		});
	});

	describe("Period: YEAR_MONTH", () => {
		const yearMonthPeriodFilterOptions: OverviewModel.NewFilter.Date.Item = {
			...baseDateFilterOptions,
			options: {
				...baseDateFilterOptions.options,
				periods: [{ option: "yearMonth", default: true, enabled: true }]
			}
		};

		describe("Interaction", () => {
			it("fromTo range - basic input with year/month selector", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = yearMonthPeriodFilterOptions;

				const { page } = await renderDateFilter({ filterItem });

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
					    "field": "/product/dateField",
					    "from": "2020-08-01",
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
					    "field": "/product/dateField",
					    "from": "2020-08-01",
					    "operator": "date_range",
					    "to": "2025-07-31",
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

			it("switching between range modes", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearMonthPeriodFilterOptions,
					options: {
						...yearMonthPeriodFilterOptions.options,
						ranges: [
							{ option: "fromTo", default: true, enabled: true },
							{ option: "fromOnly", enabled: true },
							{ option: "toOnly", enabled: true },
							{ option: "exact", enabled: true }
						]
					}
				};

				const { page } = await renderDateFilter({ filterItem });

				expect(page.monthYearView.fromYearSelect).toBeInTheDocument();
				expect(page.monthYearView.fromMonthSelect).toBeInTheDocument();
				expect(page.monthYearView.toYearSelect).toBeInTheDocument();
				expect(page.monthYearView.toMonthSelect).toBeInTheDocument();

				await page.setRangeMode("From");

				expect(page.monthYearView.fromYearSelect).toBeInTheDocument();
				expect(page.monthYearView.fromMonthSelect).toBeInTheDocument();
				expect(page.monthYearView.toYearSelect).toBeUndefined();
				expect(page.monthYearView.toMonthSelect).toBeUndefined();

				await page.setRangeMode("To");

				expect(page.monthYearView.fromYearSelect).toBeUndefined();
				expect(page.monthYearView.fromMonthSelect).toBeUndefined();
				expect(page.monthYearView.toYearSelect).toBeInTheDocument();
				expect(page.monthYearView.toMonthSelect).toBeInTheDocument();

				await page.setRangeMode("Exact");

				expect(page.monthYearView.exactYearSelect).toBeInTheDocument();
				expect(page.monthYearView.exactMonthSelect).toBeInTheDocument();
				expect(page.monthYearView.fromYearSelect).toBeUndefined();
				expect(page.monthYearView.toYearSelect).toBeUndefined();
			});

			it("Empty option shows Empty filter", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearMonthPeriodFilterOptions,
					options: { ...yearMonthPeriodFilterOptions.options, empty: { enabled: true, value: true } }
				};

				const { page } = await renderDateFilter({ filterItem });

				expect(page.isEmptyMode).toBe(true);
				expect(page.monthYearView.fromYearSelect).toBeUndefined();
				expect(page.monthYearView.fromMonthSelect).toBeUndefined();
				expect(page.monthYearView.toYearSelect).toBeUndefined();
				expect(page.monthYearView.toMonthSelect).toBeUndefined();
			});

			it("Invert option inverts the filter result", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearMonthPeriodFilterOptions,
					options: { ...yearMonthPeriodFilterOptions.options, invert: { enabled: true, value: true } }
				};

				const { page } = await renderDateFilter({ filterItem });

				await page.monthYearView.selectFromYear("2020");
				await page.monthYearView.selectFromMonth("6");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "field": "/product/dateField",
					      "from": "2020-07-01",
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
			it("shows error when From year/month is after To year/month", async () => {
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearMonthPeriodFilterOptions,
					options: {
						...yearMonthPeriodFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

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
				const filterItem: OverviewModel.NewFilter.Date.Item = {
					...yearMonthPeriodFilterOptions,
					options: {
						...yearMonthPeriodFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				};

				const { page } = await renderDateFilter({ filterItem });

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

			it("shows partial-yearMonth error when only year is set", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromYear("2024");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only selections with both year and month specified, or both left empty, are allowed.",
					]
				`);
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("shows partial-yearMonth error when only month is set", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromMonth("3");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only selections with both year and month specified, or both left empty, are allowed.",
					]
				`);
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("clears partial-yearMonth error once both fields are set", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromYear("2024");

				expect(page.errorMessages).toMatchInlineSnapshot(`
					[
					  "Only selections with both year and month specified, or both left empty, are allowed.",
					]
				`);

				await page.monthYearView.selectFromMonth("3");

				expect(page.errorMessages).toMatchInlineSnapshot(`[]`);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/dateField",
					    "from": "2024-04-01",
					    "operator": "date_range",
					    "to": undefined,
					  },
					]
				`);
			});

			it("preserves committed month when invalid year is entered then cleared", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromYear("2024");
				await page.monthYearView.selectFromMonth("3");

				expect(page.monthYearView.fromMonthSelect?.value).toBe("3");

				await page.monthYearView.selectFromYear("");

				expect(page.monthYearView.fromMonthSelect?.value).toBe("3");
			});
		});

		describe("Filter Bar Item Label", () => {
			it("displays null when no values are entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				expect(page.filterBarItemLabel).toBe(null);
			});

			it("displays range format when fromTo values are entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromYear("2020");
				await page.monthYearView.selectFromMonth("3");

				await page.monthYearView.selectToYear("2025");
				await page.monthYearView.selectToMonth("6");

				expect(page.filterBarItemLabel).toBe("04/2020 - 07/2025");
			});

			it("displays from value when only FROM is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectFromYear("2020");
				await page.monthYearView.selectFromMonth("3");

				expect(page.filterBarItemLabel).toBe("≥ 04/2020");
			});

			it("displays to value when only TO is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.monthYearView.selectToYear("2025");
				await page.monthYearView.selectToMonth("6");

				expect(page.filterBarItemLabel).toBe("≤ 07/2025");
			});

			it("displays single value when exact value is entered", async () => {
				const { page } = await renderDateFilter({ filterItem: yearMonthPeriodFilterOptions });

				await page.setRangeMode("Exact");

				await page.monthYearView.selectExactYear("2027");
				await page.monthYearView.selectExactMonth("9");

				expect(page.filterBarItemLabel).toBe("10/2027");
			});
		});
	});

	describe("Period: MONTH", () => {
		const monthPeriodFilterOptions: OverviewModel.NewFilter.Date.Item = {
			...baseDateFilterOptions,
			options: {
				...baseDateFilterOptions.options,
				periods: [{ option: "month", default: true, enabled: true }]
			}
		};

		it("fromTo range maps to first/last day in current year", async () => {
			const { page } = await renderDateFilter({ filterItem: monthPeriodFilterOptions });

			expect(page.monthView.fromSelect).toBeInTheDocument();
			expect(page.monthView.toSelect).toBeInTheDocument();
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.monthView.selectFrom("3"); // April
			await page.monthView.selectTo("5"); // June

			const ops = page.operator;
			expect(ops).toHaveLength(1);
			const [op] = ops as { from?: string; to?: string }[];
			expect(op.from).toMatch(/^\d{4}-04-01$/);
			expect(op.to).toMatch(/^\d{4}-06-30$/);
		});

		it("exact range maps single month to first/last day in current year", async () => {
			const filterItem: OverviewModel.NewFilter.Date.Item = {
				...monthPeriodFilterOptions,
				options: {
					...monthPeriodFilterOptions.options,
					ranges: [{ option: "exact", default: true, enabled: true }]
				}
			};

			const { page } = await renderDateFilter({ filterItem });

			await page.monthView.selectExact("0"); // January

			const ops = page.operator;
			expect(ops).toHaveLength(1);
			const [op] = ops as { from?: string; to?: string }[];
			expect(op.from).toMatch(/^\d{4}-01-01$/);
			expect(op.to).toMatch(/^\d{4}-01-31$/);
		});

		it("from > to triggers range error", async () => {
			const { page } = await renderDateFilter({ filterItem: monthPeriodFilterOptions });

			await page.monthView.selectFrom("8"); // September
			await page.monthView.selectTo("2"); // March

			expect(page.errorMessages).toMatchInlineSnapshot(`
				[
				  "The start value must not be bigger than the end value.",
				]
			`);
		});

		it("reset returns inputs to default", async () => {
			const { page } = await renderDateFilter({ filterItem: monthPeriodFilterOptions });

			await page.monthView.selectFrom("3");
			await page.monthView.selectTo("5");
			expect(page.operator).not.toEqual([]);

			await page.clickReset();

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("Period Switching", () => {
		const allPeriodsFilterOptions: OverviewModel.NewFilter.Date.Item = {
			...baseDateFilterOptions,
			options: {
				...baseDateFilterOptions.options,
				periods: [
					{ option: "date", default: true, enabled: true },
					{ option: "year", enabled: true },
					{ option: "yearMonth", enabled: true },
					{ option: "month", enabled: true }
				]
			}
		};

		it("switching from DATE to YEAR period", async () => {
			const { page } = await renderDateFilter({ filterItem: allPeriodsFilterOptions });

			expect(page.dateView.fromInput).toBeInTheDocument();
			expect(page.dateView.toInput).toBeInTheDocument();
			expect(page.monthYearView.fromMonthSelect).toBeFalsy(); // No month selector in DATE

			await page.setPeriodMode("Year");

			expect(page.dateView.fromInput).toBeFalsy();
			expect(page.dateView.toInput).toBeFalsy();
			expect(page.yearView.fromSelect).toBeInTheDocument();
			expect(page.yearView.toSelect).toBeInTheDocument();
			expect(page.monthYearView.fromMonthSelect).toBeFalsy(); // No month selector in YEAR
		});

		it("switching from DATE to YEAR_MONTH period", async () => {
			const { page } = await renderDateFilter({ filterItem: allPeriodsFilterOptions });

			expect(page.dateView.fromInput).toBeInTheDocument();
			expect(page.dateView.toInput).toBeInTheDocument();
			expect(page.monthYearView.fromMonthSelect).toBeFalsy();

			await page.setPeriodMode("Year & Month");

			expect(page.dateView.fromInput).toBeFalsy();
			expect(page.dateView.toInput).toBeFalsy();
			expect(page.monthYearView.fromYearSelect).toBeInTheDocument();
			expect(page.monthYearView.fromMonthSelect).toBeInTheDocument();
			expect(page.monthYearView.toYearSelect).toBeInTheDocument();
			expect(page.monthYearView.toMonthSelect).toBeInTheDocument();
		});

		it("switching from YEAR to YEAR_MONTH period", async () => {
			const filterItem: OverviewModel.NewFilter.Date.Item = {
				...baseDateFilterOptions,
				options: {
					...baseDateFilterOptions.options,
					periods: [
						{ option: "year", default: true, enabled: true },
						{ option: "yearMonth", enabled: true }
					]
				}
			};

			const { page } = await renderDateFilter({ filterItem });

			expect(page.yearView.fromSelect).toBeInTheDocument();
			expect(page.yearView.toSelect).toBeInTheDocument();
			expect(page.monthYearView.fromMonthSelect).toBeFalsy();

			await page.setPeriodMode("Year & Month");

			expect(page.monthYearView.fromMonthSelect).toBeInTheDocument();
			expect(page.monthYearView.toMonthSelect).toBeInTheDocument();
		});

		it("switching from YEAR_MONTH to DATE period", async () => {
			const filterItem: OverviewModel.NewFilter.Date.Item = {
				...baseDateFilterOptions,
				options: {
					...baseDateFilterOptions.options,
					periods: [
						{ option: "yearMonth", default: true, enabled: true },
						{ option: "date", enabled: true }
					]
				}
			};

			const { page } = await renderDateFilter({ filterItem });

			expect(page.monthYearView.fromYearSelect).toBeInTheDocument();
			expect(page.monthYearView.fromMonthSelect).toBeInTheDocument();

			await page.setPeriodMode("Date");

			expect(page.monthYearView.fromMonthSelect).toBeFalsy();
			expect(page.dateView.fromInput).toBeInTheDocument();
			expect(page.dateView.toInput).toBeInTheDocument();
		});

		it("clears operator when switching periods", async () => {
			const { page } = await renderDateFilter({ filterItem: allPeriodsFilterOptions });

			await page.dateView.setFrom("01/15/2024");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/dateField",
				    "from": "2024-01-15",
				    "operator": "date_range",
				    "to": undefined,
				  },
				]
			`);

			await page.setPeriodMode("Year");

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("Query Operator", () => {
		it("no input → undefined (empty array)", async () => {
			const { page } = await renderDateFilter({ filterItem: baseDateFilterOptions });

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("empty=true → undefined_match", async () => {
			const { page } = await renderDateFilter({
				filterItem: {
					...baseDateFilterOptions,
					options: { ...baseDateFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/dateField",
				    "operator": "undefined_match",
				  },
				]
			`);
		});

		it("empty=true + invert=true → NOT(undefined_match)", async () => {
			const { page } = await renderDateFilter({
				filterItem: {
					...baseDateFilterOptions,
					options: {
						...baseDateFilterOptions.options,
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: true }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "field": "/product/dateField",
				      "operator": "undefined_match",
				    },
				    "operator": "not",
				  },
				]
			`);
		});

		it("range/period section hidden when only 1 option available", async () => {
			const { page } = await renderDateFilter({
				filterItem: {
					...baseDateFilterOptions,
					options: {
						...baseDateFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						periods: [{ option: "date", default: true, enabled: true }]
					}
				}
			});

			await page.withSettings(async (settings) => {
				expect(settings.range()).toBeUndefined();
				expect(settings.period()).toBeUndefined();
			});
		});
	});
});
