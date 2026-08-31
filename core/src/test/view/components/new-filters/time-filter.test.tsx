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

import type { OverviewModel } from "../../../../main/index.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderTimeFilter } from "./pages/time-filter-page.js";

const baseTimeFilterOptions: OverviewModel.NewFilter.Time.Item = {
	id: "startTime",
	type: "time",
	options: {
		fieldId: ProductFieldIds.timeField.id,
		ranges: [
			{ option: "fromTo", default: true, enabled: true },
			{ option: "fromOnly", enabled: true },
			{ option: "toOnly", enabled: true },
			{ option: "exact", enabled: true }
		],
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.time-filter", () => {
	describe("Interaction", () => {
		it("fromTo range - basic input and validation", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			const inputs = page.getInputs(["From", "To"]);
			expect(inputs.From.input).toBeInTheDocument();
			expect(inputs.To.input).toBeInTheDocument();
			expect(inputs.From.value).toBe("");
			expect(inputs.To.value).toBe("");

			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.setFromValue("05:00 AM");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "05:00:00",
				    "operator": "date_range",
				    "to": undefined,
				  },
				]
			`);

			let dialog = await page.openToTimePicker();

			await dialog.selectHour("07");
			dialog.clickPm();
			dialog.clickOk();

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "05:00:00",
				    "operator": "date_range",
				    "to": "19:00:00",
				  },
				]
			`);

			dialog = await page.openFromTimePicker();
			await dialog.clickClockNumber("08");
			dialog.clickPm();
			dialog.clickOk();

			expect(page.errorMessage).toBe("The start value must not be bigger than the end value.");

			await page.clickReset();

			expect(page.fromValue).toBe("");
			expect(page.toValue).toBe("");
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("switching between range modes", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromInput).toBeInTheDocument();
			expect(page.toInput).toBeInTheDocument();

			await page.setRangeMode("From");

			expect(page.fromInput).toBeInTheDocument();
			expect(page.toInput).toBeUndefined();

			await page.setFromValue("09:00 AM");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "09:00:00",
				    "operator": "date_range",
				    "to": undefined,
				  },
				]
			`);

			await page.setRangeMode("To");

			expect(page.fromInput).toBeUndefined();
			expect(page.toInput).toBeInTheDocument();

			await page.setToValue("05:00 PM");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": undefined,
				    "operator": "date_range",
				    "to": "17:00:00",
				  },
				]
			`);

			await page.setRangeMode("Exact");

			expect(page.exactInput).toBeInTheDocument();
			expect(page.fromInput).toBeUndefined();
			expect(page.toInput).toBeUndefined();

			await page.setExactValue("03:00 AM");
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "03:00:00",
				    "operator": "date_range",
				    "to": "03:00:00",
				  },
				]
			`);

			await page.setRangeMode("From To");

			expect(page.fromInput).toBeInTheDocument();
			expect(page.toInput).toBeInTheDocument();
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("Empty filter option", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					empty: { enabled: true, value: false },
					invert: { enabled: false }
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromInput).toBeInTheDocument();
			expect(page.toInput).toBeInTheDocument();

			await page.setEmptySetting("Yes");

			expect(page.isEmptyMode).toBe(true);

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "operator": "undefined_match",
				  },
				]
			`);

			await page.setEmptySetting("No");

			expect(page.fromInput).toBeInTheDocument();
			expect(page.toInput).toBeInTheDocument();
		});

		it("Invert filter option", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					empty: { enabled: false },
					invert: { enabled: true, value: false }
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromInput).toBeInTheDocument();
			expect(page.toInput).toBeInTheDocument();

			await page.setRange("09:00 AM", "07:00 PM");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "09:00:00",
				    "operator": "date_range",
				    "to": "19:00:00",
				  },
				]
			`);

			await page.setInvertSetting("Yes");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "field": "/product/timeField",
				      "from": "09:00:00",
				      "operator": "date_range",
				      "to": "19:00:00",
				    },
				    "operator": "not",
				  },
				]
			`);
		});
	});

	describe.skip("Time Picker Dialog", () => {
		it("clicking time picker button opens dialog in hour view", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromTimePickerButton).toBeDefined();
			expect(page.toTimePickerButton).toBeDefined();

			const dialog = await page.openFromTimePicker();

			expect(dialog.isOpen).toBe(true);

			expect(dialog.isHourViewActive).toBe(true);
			expect(dialog.isMinuteViewActive).toBe(false);

			expect(dialog.clockNumbers.length).toBeGreaterThan(0);

			expect(dialog.okButton).toBeInTheDocument();
		});

		it("selecting hour switches to minute view", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			const dialog = await page.openFromTimePicker();

			expect(dialog.isHourViewActive).toBe(true);

			await dialog.selectHour("03", true);

			expect(dialog.isMinuteViewActive).toBe(true);
			expect(dialog.hourValue).toBe("03");

			expect(dialog.getClockNumber("00")).toBeDefined();
			expect(dialog.getClockNumber("15")).toBeDefined();
			expect(dialog.getClockNumber("30")).toBeDefined();
			expect(dialog.getClockNumber("45")).toBeDefined();
		});

		it("selecting time and clicking Ok saves the value and updates operator", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromValue).toBe("");
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			const dialog = await page.openFromTimePicker();

			await dialog.selectHour("05", true);

			await dialog.selectMinute("15");

			dialog.clickAm();

			dialog.clickOk();

			expect(dialog.isOpen).toBe(false);

			expect(page.fromValue).not.toBe("");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "05:15:00",
				    "operator": "date_range",
				    "to": undefined,
				  },
				]
			`);
		});

		it("selecting time but clicking Clear does not save changes or affect operator", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromValue).toBe("");
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			const dialog = await page.openFromTimePicker();

			await dialog.selectHour("08", true);

			await dialog.selectMinute("30");

			dialog.clickPm();

			expect(dialog.headerTitle).toContain("08");
			expect(dialog.headerTitle).toContain("30");

			dialog.clickClear();

			expect(dialog.isOpen).toBe(false);

			expect(page.fromValue).toBe("");

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("selecting complete time range updates operator correctly", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.operator).toMatchInlineSnapshot(`[]`);

			let dialog = await page.openFromTimePicker();
			await dialog.selectHour("09", true);
			await dialog.selectMinute("00");
			dialog.clickAm();
			dialog.clickOk();

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "09:00:00",
				    "operator": "date_range",
				    "to": undefined,
				  },
				]
			`);

			dialog = await page.openToTimePicker();
			await dialog.selectHour("05", true);
			await dialog.selectMinute("00");
			dialog.clickPm();
			dialog.clickOk();

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "from": "09:00:00",
				    "operator": "date_range",
				    "to": "17:00:00",
				  },
				]
			`);
		});

		it("can toggle between AM and PM", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			const dialog = await page.openFromTimePicker();

			dialog.clickAm();
			expect(dialog.isAmSelected).toBe(true);
			expect(dialog.isPmSelected).toBe(false);
			expect(dialog.amPmValue).toBe("AM");

			dialog.clickPm();
			expect(dialog.isAmSelected).toBe(false);
			expect(dialog.isPmSelected).toBe(true);
			expect(dialog.amPmValue).toBe("PM");
		});

		it("can switch back to hour view by clicking hour display", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			const dialog = await page.openFromTimePicker();

			await dialog.selectHour("10", true);
			expect(dialog.isMinuteViewActive).toBe(true);

			dialog.clickHourDisplay();
			expect(dialog.isHourViewActive).toBe(true);
		});

		it("time picker button available in all range modes", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromTimePickerButton).toBeDefined();
			expect(page.toTimePickerButton).toBeDefined();

			await page.setRangeMode("From");
			expect(page.fromTimePickerButton).toBeDefined();

			await page.setRangeMode("To");
			expect(page.toTimePickerButton).toBeDefined();

			await page.setRangeMode("Exact");
			expect(page.exactTimePickerButton).toBeDefined();
		});
	});

	describe("Format Placeholder", () => {
		it("shows format as placeholder in input fields", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromPlaceholder).toBe("hh:mm AM/PM");
			expect(page.toPlaceholder).toBe("hh:mm AM/PM");
		});

		it("placeholder visible in all range modes", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = baseTimeFilterOptions;

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromPlaceholder).toBe("hh:mm AM/PM");
			expect(page.toPlaceholder).toBe("hh:mm AM/PM");

			await page.setRangeMode("From");
			expect(page.fromPlaceholder).toBe("hh:mm AM/PM");

			await page.setRangeMode("To");
			expect(page.toPlaceholder).toBe("hh:mm AM/PM");

			await page.setRangeMode("Exact");
			expect(page.exactPlaceholder).toBe("hh:mm AM/PM");
		});
	});

	describe("Configuration", () => {
		it("respects disabled range options", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [{ option: "fromTo", default: true, enabled: true }]
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.fromInput).toBeInTheDocument();
			expect(page.toInput).toBeInTheDocument();

			await page.withSettings(async (settings) => {
				expect(settings.range()).toBeUndefined();
			});
		});

		it("respects disabled empty option", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					empty: { enabled: false },
					invert: { enabled: true, value: false }
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			await page.withSettings(async (settings) => {
				expect(settings.empty()).toBeUndefined();
			});
		});

		it("respects disabled invert option", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					empty: { enabled: true, value: false },
					invert: { enabled: false }
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			await page.withSettings(async (settings) => {
				expect(settings.invert()).toBeUndefined();
			});
		});

		it("respects multiple range options", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [
						{ option: "fromTo", default: true, enabled: true },
						{ option: "exact", enabled: true }
					]
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			await page.withSettings(async (settings) => {
				const rangeToggle = settings.range();
				expect(rangeToggle).toBeDefined();
				expect(rangeToggle?.items).toHaveLength(2);
				expect(rangeToggle?.itemByDataRole("range-icon-fromTo")).toBeDefined();
				expect(rangeToggle?.itemByDataRole("range-icon-exact")).toBeDefined();
			});
		});

		it("uses default range option on initial render", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [
						{ option: "fromTo", enabled: true },
						{ option: "exact", default: true, enabled: true }
					]
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			expect(page.exactInput).toBeInTheDocument();
			expect(page.fromInput).toBeUndefined();
			expect(page.toInput).toBeUndefined();
		});
	});

	describe("Query Operator", () => {
		it("no input → undefined (empty array)", async () => {
			const { page } = await renderTimeFilter({ filterItem: baseTimeFilterOptions });

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("empty=true → undefined_match", async () => {
			const { page } = await renderTimeFilter({
				filterItem: {
					...baseTimeFilterOptions,
					options: { ...baseTimeFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/timeField",
				    "operator": "undefined_match",
				  },
				]
			`);
		});

		it("empty=true + invert=true → NOT(undefined_match)", async () => {
			const { page } = await renderTimeFilter({
				filterItem: {
					...baseTimeFilterOptions,
					options: {
						...baseTimeFilterOptions.options,
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: true }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "field": "/product/timeField",
				      "operator": "undefined_match",
				    },
				    "operator": "not",
				  },
				]
			`);
		});

		it("range section hidden when only 1 option available", async () => {
			const { page } = await renderTimeFilter({
				filterItem: {
					...baseTimeFilterOptions,
					options: {
						...baseTimeFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }]
					}
				}
			});

			await page.withSettings(async (settings) => {
				expect(settings.range()).toBeUndefined();
			});
		});
	});

	describe("Validation", () => {
		it("shows error for invalid time format", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					empty: { enabled: false },
					invert: { enabled: false }
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			await page.setFromValue("invalid");

			page.assertError("Only dates in the format 'hh:mm AM/PM' are allowed.");

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("shows error when From time is after To time", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					empty: { enabled: false },
					invert: { enabled: false }
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			await page.setRange("08:00 PM", "10:00 AM");

			page.assertError("The start value must not be bigger than the end value.");
		});

		it("clears error when range becomes valid", async () => {
			const filterItem: OverviewModel.NewFilter.Time.Item = {
				...baseTimeFilterOptions,
				options: {
					...baseTimeFilterOptions.options,
					ranges: [{ option: "fromTo", default: true, enabled: true }],
					empty: { enabled: false },
					invert: { enabled: false }
				}
			};

			const { page } = await renderTimeFilter({ filterItem });

			await page.setRange("08:00 PM", "10:00 AM");

			page.assertError("The start value must not be bigger than the end value.");

			await page.setFromValue("08:00 AM");

			page.assertNoError();
		});
	});

	describe("Filter Bar Item Label", () => {
		it("displays null when no values are entered", async () => {
			const { page } = await renderTimeFilter({ filterItem: baseTimeFilterOptions });

			expect(page.filterBarItemLabel).toBe(null);
		});

		it("displays range format when fromTo values are entered", async () => {
			const { page } = await renderTimeFilter({ filterItem: baseTimeFilterOptions });

			await page.setFromValue("09:00 AM");
			await page.setToValue("05:00 PM");

			expect(page.filterBarItemLabel).toBe("09:00 AM - 05:00 PM");
		});

		it("displays from value when only FROM is entered", async () => {
			const { page } = await renderTimeFilter({ filterItem: baseTimeFilterOptions });

			await page.setFromValue("10:30 AM");

			expect(page.filterBarItemLabel).toBe("≥ 10:30 AM");
		});

		it("displays to value when only TO is entered", async () => {
			const { page } = await renderTimeFilter({ filterItem: baseTimeFilterOptions });

			await page.setToValue("06:00 PM");

			expect(page.filterBarItemLabel).toBe("≤ 06:00 PM");
		});

		it("displays exact value when exact mode is used", async () => {
			const { page } = await renderTimeFilter({ filterItem: baseTimeFilterOptions });

			await page.setRangeMode("Exact");

			await page.setExactValue("12:00 PM");

			expect(page.filterBarItemLabel).toBe("12:00 PM");
		});

		it("displays Empty when empty option is enabled and set to true", async () => {
			const { page } = await renderTimeFilter({
				filterItem: {
					...baseTimeFilterOptions,
					options: { ...baseTimeFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.filterBarItemLabel).toBe("Empty");
		});

		it("updates label after toggling empty setting", async () => {
			const { page } = await renderTimeFilter({
				filterItem: {
					...baseTimeFilterOptions,
					options: { ...baseTimeFilterOptions.options, empty: { enabled: true, value: false } }
				}
			});

			await page.setFromValue("08:00 AM");

			expect(page.filterBarItemLabel).toBe("≥ 08:00 AM");

			await page.setEmptySetting("Yes");

			expect(page.filterBarItemLabel).toBe("Empty");
		});

		it("clears label when filter is reset", async () => {
			const { page } = await renderTimeFilter({ filterItem: baseTimeFilterOptions });

			await page.setFromValue("09:00 AM");

			expect(page.filterBarItemLabel).toBe("≥ 09:00 AM");

			await page.clickReset();

			expect(page.filterBarItemLabel).toBe(null);
		});
	});
});
