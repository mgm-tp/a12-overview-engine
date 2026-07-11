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

import { renderNumberFilter } from "./pages/number-filter-page.js";

const baseNumberFilterOptions: OverviewModel.NewFilter.Number.Item = {
	id: "price",
	type: "number",
	options: {
		fieldId: ProductFieldIds.number.id,
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

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.number-filter", () => {
	describe("Interaction", () => {
		it("basic input and operator generation", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			page.assertInputs([
				{ label: "From", value: "" },
				{ label: "To", value: "" }
			]);
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.setFromValue("10");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 10,
				    "operator": "double_range",
				    "to": undefined,
				  },
				]
			`);
		});

		it("clearing input resets operator to undefined", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setFromValue("10");
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 10,
				    "operator": "double_range",
				    "to": undefined,
				  },
				]
			`);

			await page.setFromValue("");
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("reset button restores to default values", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setRange("10", "100");
			await page.clickReset();

			expect(page.fromValue).toBe("");
			expect(page.toValue).toBe("");
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("switching between range modes", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			page.assertInputs([
				{ label: "From", value: "" },
				{ label: "To", value: "" }
			]);

			await page.setRangeMode("From");
			page.assertInputs([{ label: "From", value: "" }]);

			await page.setFromValue("25");
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 25,
				    "operator": "double_range",
				    "to": undefined,
				  },
				]
			`);

			await page.setRangeMode("To");
			page.assertInputs([{ label: "To", value: "" }]);

			await page.setToValue("75");
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": undefined,
				    "operator": "double_range",
				    "to": 75,
				  },
				]
			`);

			await page.setRangeMode("Exact");
			page.assertInputs([{ label: "Exact", value: "" }]);

			await page.setExactValue("50");
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 50,
				    "operator": "double_range",
				    "to": 50,
				  },
				]
			`);

			await page.setRangeMode("From To");
			page.assertInputs([
				{ label: "From", value: "" },
				{ label: "To", value: "" }
			]);
		});
	});

	describe("UI Configuration", () => {
		describe("ranges option", () => {
			it("renders From and To when fromTo is the only option", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [{ option: "fromTo", default: true, enabled: true }],
							empty: { enabled: false },
							invert: { enabled: false }
						}
					}
				});

				page.assertInputs([
					{ label: "From", value: "" },
					{ label: "To", value: "" }
				]);
			});

			it("renders single Exact field when exact is the only option", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [{ option: "exact", default: true, enabled: true }],
							empty: { enabled: false },
							invert: { enabled: false }
						}
					}
				});

				page.assertInputs([{ label: "Exact", value: "" }]);
			});

			it("uses fromOnly as default when configured", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [
								{ option: "fromTo", enabled: true },
								{ option: "fromOnly", default: true, enabled: true },
								{ option: "toOnly", enabled: true }
							],
							empty: { enabled: false },
							invert: { enabled: false }
						}
					}
				});

				page.assertInputs([{ label: "From", value: "" }]);
			});

			it("uses toOnly as default when configured", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [
								{ option: "fromTo", enabled: true },
								{ option: "fromOnly", enabled: true },
								{ option: "toOnly", default: true, enabled: true }
							],
							empty: { enabled: false },
							invert: { enabled: false }
						}
					}
				});

				page.assertInputs([{ label: "To", value: "" }]);
			});

			it("renders preset criteria values in input fields", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [{ option: "fromTo", default: true, criteria: { from: 10, to: 100 }, enabled: true }],
							empty: { enabled: false },
							invert: { enabled: false }
						}
					}
				});

				page.assertInputs([
					{ label: "From", value: "10" },
					{ label: "To", value: "100" }
				]);

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/number",
					    "from": 10,
					    "operator": "double_range",
					    "to": 100,
					  },
					]
				`);
			});

			it("hides settings button when only 1 range option and no other configurable bits", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [{ option: "fromTo", default: true, enabled: true }],
							empty: { enabled: false },
							invert: { enabled: false }
						}
					}
				});

				expect(page.hasSettings()).toBe(false);
			});
		});

		describe("empty option", () => {
			it("when disabled — hidden from settings", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [
								{ option: "fromTo", default: true, enabled: true },
								{ option: "exact", enabled: true }
							],
							empty: { enabled: false },
							invert: { enabled: false }
						}
					}
				});

				await page.withSettings(async (settings) => {
					expect(settings.empty()).toBeUndefined();
				});
			});

			it("when enabled, value true — shows Empty mode", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [{ option: "fromTo", default: true, enabled: true }],
							empty: { enabled: true, value: true },
							invert: { enabled: false }
						}
					}
				});

				expect(page.isEmptyMode).toBe(true);

				await page.withSettings((settings) => {
					expect(settings.empty()?.selectedItem?.textContent).toEqual("Yes");
				});

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/number",
					    "operator": "undefined_match",
					  },
					]
				`);
			});
		});

		describe("invert option", () => {
			it("when disabled — hidden from settings", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [{ option: "fromTo", default: true, enabled: true }],
							invert: { enabled: false }
						}
					}
				});

				await page.withSettings((settings) => {
					expect(settings.invert()).toBeUndefined();
				});
			});

			it("when enabled, value true — operator wrapped in NOT", async () => {
				const { page } = await renderNumberFilter({
					filterItem: {
						...baseNumberFilterOptions,
						options: {
							...baseNumberFilterOptions.options,
							ranges: [{ option: "fromTo", default: true, criteria: { from: 10, to: 100 }, enabled: true }],
							invert: { enabled: true, value: true }
						}
					}
				});

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "field": "/product/number",
					      "from": 10,
					      "operator": "double_range",
					      "to": 100,
					    },
					    "operator": "not",
					  },
					]
				`);
			});
		});
	});

	describe("Settings Interaction", () => {
		it("toggling Empty switches between input and Empty mode", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			expect(page.isEmptyMode).toBe(false);

			await page.setEmptySetting("Yes");
			expect(page.isEmptyMode).toBe(true);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "operator": "undefined_match",
				  },
				]
			`);

			await page.setEmptySetting("No");
			expect(page.isEmptyMode).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("toggling Invert wraps/unwraps operator in NOT", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setFromValue("10");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 10,
				    "operator": "double_range",
				    "to": undefined,
				  },
				]
			`);

			await page.setInvertSetting("Yes");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "field": "/product/number",
				      "from": 10,
				      "operator": "double_range",
				      "to": undefined,
				    },
				    "operator": "not",
				  },
				]
			`);

			await page.setInvertSetting("No");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 10,
				    "operator": "double_range",
				    "to": undefined,
				  },
				]
			`);
		});

		it("toggling Range mode changes input layout and operator", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			expect(page.fromInput).toBeDefined();
			expect(page.toInput).toBeDefined();

			await page.setRange("10", "100");
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 10,
				    "operator": "double_range",
				    "to": 100,
				  },
				]
			`);

			await page.setRangeMode("Exact");
			expect(page.exactInput).toBeDefined();
			expect(page.fromInput).toBeUndefined();
			expect(page.toInput).toBeUndefined();
		});
	});

	describe("Query Operator", () => {
		it("empty=true + invert=true → NOT(undefined_match)", async () => {
			const { page } = await renderNumberFilter({
				filterItem: {
					...baseNumberFilterOptions,
					options: {
						...baseNumberFilterOptions.options,
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: true }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "field": "/product/number",
				      "operator": "undefined_match",
				    },
				    "operator": "not",
				  },
				]
			`);
		});
	});

	describe("Filter Bar Item Label", () => {
		it("displays null when no values are entered", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			expect(page.filterBarItemLabel).toBe(null);
		});

		it("displays range format when fromTo values are entered", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setRange("10", "100");
			expect(page.filterBarItemLabel).toBe("10 - 100");
		});

		it("displays from value with ≥ when only FROM is entered", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setFromValue("50");
			expect(page.filterBarItemLabel).toBe("≥ 50");
		});

		it("displays to value with ≤ when only TO is entered", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setToValue("200");
			expect(page.filterBarItemLabel).toBe("≤ 200");
		});

		it("displays single value when FROM and TO have same value", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setRange("75", "75");
			expect(page.filterBarItemLabel).toBe("75");
		});

		it("displays exact value when exact mode is used", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setRangeMode("Exact");
			await page.setExactValue("42");
			expect(page.filterBarItemLabel).toBe("42");
		});

		it("displays 'Empty' when empty is active", async () => {
			const { page } = await renderNumberFilter({
				filterItem: {
					...baseNumberFilterOptions,
					options: { ...baseNumberFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.filterBarItemLabel).toBe("Empty");
		});

		it("updates label after toggling empty setting", async () => {
			const { page } = await renderNumberFilter({ filterItem: baseNumberFilterOptions });

			await page.setFromValue("25");
			expect(page.filterBarItemLabel).toBe("≥ 25");

			await page.setEmptySetting("Yes");
			expect(page.filterBarItemLabel).toBe("Empty");
		});
	});

	describe("Error Handling", () => {
		it("shows error when non-numeric input is entered", async () => {
			const { page } = await renderNumberFilter({
				filterItem: {
					...baseNumberFilterOptions,
					options: {
						...baseNumberFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				}
			});

			await page.setFromValue("abc");

			page.assertError("Only numbers are allowed.");
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("shows error when From > To", async () => {
			const { page } = await renderNumberFilter({
				filterItem: {
					...baseNumberFilterOptions,
					options: {
						...baseNumberFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				}
			});

			await page.setRange("100", "50");
			page.assertError("The start value must not be bigger than the end value.");
		});

		it("clears error when range becomes valid", async () => {
			const { page } = await renderNumberFilter({
				filterItem: {
					...baseNumberFilterOptions,
					options: {
						...baseNumberFilterOptions.options,
						ranges: [{ option: "fromTo", default: true, enabled: true }],
						empty: { enabled: false },
						invert: { enabled: false }
					}
				}
			});

			await page.setRange("100", "50");
			page.assertError("The start value must not be bigger than the end value.");

			await page.setFromValue("10");
			page.assertNoError();

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/number",
				    "from": 10,
				    "operator": "double_range",
				    "to": 50,
				  },
				]
			`);
		});
	});
});
