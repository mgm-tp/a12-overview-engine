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

import type { OverviewModel } from "../../../../main/overview-model.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderBooleanFilter } from "./pages/boolean-filter-page.js";

const baseBooleanFilterOptions: OverviewModel.NewFilter.Boolean.Item = {
	id: "inStock",
	type: "boolean",
	options: {
		fieldId: ProductFieldIds.inStock.id,
		empty: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.boolean-filter", () => {
	describe("Interaction", () => {
		it("clicking Yes checkbox generates exact_match operator for true", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			page.assertCheckboxes([{ label: "Yes" }, { label: "No" }]);
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.clickYes();

			expect(page.yesCheckbox?.checked).toBe(true);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/inStock",
				    "operator": "exact_match",
				    "value": "true",
				  },
				]
			`);
		});

		it("clicking both Yes and No generates OR operator", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			await page.clickYes();
			await page.clickNo();

			expect(page.yesCheckbox?.checked).toBe(true);
			expect(page.noCheckbox?.checked).toBe(true);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "caseSensitive": true,
				        "field": "/product/inStock",
				        "operator": "exact_match",
				        "value": "true",
				      },
				      {
				        "caseSensitive": true,
				        "field": "/product/inStock",
				        "operator": "exact_match",
				        "value": "false",
				      },
				    ],
				    "operator": "or",
				  },
				]
			`);
		});

		it("unchecking a checkbox removes it from the operator", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			await page.clickYes();
			await page.clickNo();
			await page.clickYes();

			expect(page.yesCheckbox?.checked).toBe(false);
			expect(page.noCheckbox?.checked).toBe(true);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/inStock",
				    "operator": "exact_match",
				    "value": "false",
				  },
				]
			`);
		});

		it("reset button restores to default unchecked state", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			await page.clickYes();
			await page.clickReset();

			expect(page.isShowingCheckboxes).toBe(true);
			expect(page.yesCheckbox?.checked).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("UI Configuration", () => {
		describe("criteria option", () => {
			it("renders unchecked Yes/No when no criteria preset", async () => {
				const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

				page.assertCheckboxes([
					{ label: "Yes", checked: false },
					{ label: "No", checked: false }
				]);
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("renders unchecked when criteria is empty array", async () => {
				const { page } = await renderBooleanFilter({
					filterItem: {
						...baseBooleanFilterOptions,
						options: { ...baseBooleanFilterOptions.options, criteria: [] }
					}
				});

				page.assertCheckboxes([
					{ label: "Yes", checked: false },
					{ label: "No", checked: false }
				]);
			});

			it("renders Yes checked when criteria is [true]", async () => {
				const { page } = await renderBooleanFilter({
					filterItem: {
						...baseBooleanFilterOptions,
						options: { ...baseBooleanFilterOptions.options, criteria: [true] }
					}
				});

				page.assertCheckboxes([
					{ label: "Yes", checked: true },
					{ label: "No", checked: false }
				]);
			});

			it("renders No checked when criteria is [false]", async () => {
				const { page } = await renderBooleanFilter({
					filterItem: {
						...baseBooleanFilterOptions,
						options: { ...baseBooleanFilterOptions.options, criteria: [false] }
					}
				});

				page.assertCheckboxes([
					{ label: "Yes", checked: false },
					{ label: "No", checked: true }
				]);
			});

			it("renders both checked when criteria is [true, false]", async () => {
				const { page } = await renderBooleanFilter({
					filterItem: {
						...baseBooleanFilterOptions,
						options: { ...baseBooleanFilterOptions.options, criteria: [true, false] }
					}
				});

				page.assertCheckboxes([
					{ label: "Yes", checked: true },
					{ label: "No", checked: true }
				]);
			});
		});

		describe("empty option", () => {
			it("when disabled — hidden from settings", async () => {
				const { page } = await renderBooleanFilter({
					filterItem: {
						...baseBooleanFilterOptions,
						options: { ...baseBooleanFilterOptions.options, empty: { enabled: false } }
					}
				});

				expect(page.isShowingCheckboxes).toBe(true);
				expect(page.hasSettings()).toBe(false);
			});

			it("when enabled, value true — shows Empty mode", async () => {
				const { page } = await renderBooleanFilter({
					filterItem: {
						...baseBooleanFilterOptions,
						options: { ...baseBooleanFilterOptions.options, empty: { enabled: true, value: true } }
					}
				});

				expect(page.isEmptyMode).toBe(true);
				expect(page.isShowingCheckboxes).toBe(false);

				await page.withSettings((settings) => {
					expect(settings.empty()?.selectedItem?.textContent).toBe("Yes");
				});

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "field": "/product/inStock",
					    "operator": "undefined_match",
					  },
					]
				`);
			});

			it("when enabled, value false — shows normal checkbox mode", async () => {
				const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

				expect(page.isShowingCheckboxes).toBe(true);

				await page.withSettings((settings) => {
					expect(settings.empty()?.selectedItem?.textContent).toBe("No");
				});
			});
		});
	});

	describe("Settings Interaction", () => {
		it("toggling Empty switches between checkboxes and Empty mode", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			expect(page.isShowingCheckboxes).toBe(true);

			await page.setEmptySetting("Yes");

			expect(page.isEmptyMode).toBe(true);
			expect(page.isShowingCheckboxes).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/inStock",
				    "operator": "undefined_match",
				  },
				]
			`);

			await page.setEmptySetting("No");

			expect(page.isShowingCheckboxes).toBe(true);
			expect(page.isEmptyMode).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("Query Operator", () => {
		it("no selection → undefined (empty array)", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("Yes only → exact_match true", async () => {
			const { page } = await renderBooleanFilter({
				filterItem: {
					...baseBooleanFilterOptions,
					options: { ...baseBooleanFilterOptions.options, criteria: [true] }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/inStock",
				    "operator": "exact_match",
				    "value": "true",
				  },
				]
			`);
		});

		it("No only → exact_match false", async () => {
			const { page } = await renderBooleanFilter({
				filterItem: {
					...baseBooleanFilterOptions,
					options: { ...baseBooleanFilterOptions.options, criteria: [false] }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/inStock",
				    "operator": "exact_match",
				    "value": "false",
				  },
				]
			`);
		});

		it("Yes + No → OR(exact_match true, exact_match false)", async () => {
			const { page } = await renderBooleanFilter({
				filterItem: {
					...baseBooleanFilterOptions,
					options: { ...baseBooleanFilterOptions.options, criteria: [true, false] }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "caseSensitive": true,
				        "field": "/product/inStock",
				        "operator": "exact_match",
				        "value": "true",
				      },
				      {
				        "caseSensitive": true,
				        "field": "/product/inStock",
				        "operator": "exact_match",
				        "value": "false",
				      },
				    ],
				    "operator": "or",
				  },
				]
			`);
		});

		it("empty=true → undefined_match", async () => {
			const { page } = await renderBooleanFilter({
				filterItem: {
					...baseBooleanFilterOptions,
					options: { ...baseBooleanFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/inStock",
				    "operator": "undefined_match",
				  },
				]
			`);
		});
	});

	describe("Filter Bar Item Label", () => {
		it("displays null when no value set", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			expect(page.filterBarItemLabel).toBe(null);
		});

		it("displays 'Yes' when only Yes is selected", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			await page.clickYes();
			expect(page.filterBarItemLabel).toBe("Yes");
		});

		it("displays 'No' when only No is selected", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			await page.clickNo();
			expect(page.filterBarItemLabel).toBe("No");
		});

		it("displays 'Yes, No' when both are selected", async () => {
			const { page } = await renderBooleanFilter({ filterItem: baseBooleanFilterOptions });

			await page.clickYes();
			await page.clickNo();
			expect(page.filterBarItemLabel).toMatchInlineSnapshot(`"Yes, No"`);
		});

		it("displays 'Empty' when empty is active", async () => {
			const { page } = await renderBooleanFilter({
				filterItem: {
					...baseBooleanFilterOptions,
					options: { ...baseBooleanFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.filterBarItemLabel).toBe("Empty");
		});
	});
});
