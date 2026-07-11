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

import { renderConfirmFilter } from "./pages/confirm-filter-page.js";

const baseConfirmFilterOptions: OverviewModel.NewFilter.Confirm.Item = {
	id: "limitedOffer",
	type: "confirm",
	options: {
		fieldId: ProductFieldIds.limitedOffer.id,
		empty: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.confirm-filter", () => {
	describe("Interaction", () => {
		it("clicking Yes checkbox generates exact_match operator for true", async () => {
			const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

			page.assertCheckbox({ label: "Yes", checked: false });
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.clickYes();

			expect(page.isChecked).toBe(true);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/limitedOffer",
				    "operator": "exact_match",
				    "value": "true",
				  },
				]
			`);
		});

		it("unchecking Yes removes the operator", async () => {
			const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

			await page.clickYes();
			expect(page.isChecked).toBe(true);

			await page.clickYes();
			expect(page.isChecked).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("reset button restores to default unchecked state", async () => {
			const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

			await page.clickYes();
			await page.clickReset();

			expect(page.isShowingCheckbox).toBe(true);
			expect(page.isChecked).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("UI Configuration", () => {
		describe("criteria option", () => {
			it("renders unchecked when criteria is not set", async () => {
				const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

				page.assertCheckbox({ label: "Yes", checked: false });
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("renders checked when criteria is true", async () => {
				const { page } = await renderConfirmFilter({
					filterItem: {
						...baseConfirmFilterOptions,
						options: { ...baseConfirmFilterOptions.options, criteria: true }
					}
				});

				page.assertCheckbox({ label: "Yes", checked: true });
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/limitedOffer",
					    "operator": "exact_match",
					    "value": "true",
					  },
					]
				`);
			});
		});

		describe("empty option", () => {
			it("when disabled — settings button not present", async () => {
				const { page } = await renderConfirmFilter({
					filterItem: {
						...baseConfirmFilterOptions,
						options: { ...baseConfirmFilterOptions.options, empty: { enabled: false } }
					}
				});

				expect(page.isShowingCheckbox).toBe(true);
				expect(page.hasSettings()).toBe(false);
			});

			it("when enabled, value true — shows Empty mode", async () => {
				const { page } = await renderConfirmFilter({
					filterItem: {
						...baseConfirmFilterOptions,
						options: { ...baseConfirmFilterOptions.options, empty: { enabled: true, value: true } }
					}
				});

				expect(page.isEmptyMode).toBe(true);
				expect(page.isShowingCheckbox).toBe(false);

				await page.withSettings((settings) => {
					expect(settings.empty()?.selectedItem?.textContent).toBe("Yes");
				});
			});

			it("when enabled, value false — shows normal checkbox mode", async () => {
				const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

				expect(page.isShowingCheckbox).toBe(true);

				await page.withSettings((settings) => {
					expect(settings.empty()?.selectedItem?.textContent).toBe("No");
				});
			});
		});
	});

	describe("Settings Interaction", () => {
		it("toggling Empty switches between checkbox and Empty mode", async () => {
			const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

			expect(page.isShowingCheckbox).toBe(true);

			await page.setEmptySetting("Yes");

			expect(page.isEmptyMode).toBe(true);
			expect(page.isShowingCheckbox).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/limitedOffer",
				    "operator": "undefined_match",
				  },
				]
			`);

			await page.setEmptySetting("No");

			expect(page.isShowingCheckbox).toBe(true);
			expect(page.isEmptyMode).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("Query Operator", () => {
		it("unchecked → undefined (empty array)", async () => {
			const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("checked → exact_match true", async () => {
			const { page } = await renderConfirmFilter({
				filterItem: {
					...baseConfirmFilterOptions,
					options: { ...baseConfirmFilterOptions.options, criteria: true }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/limitedOffer",
				    "operator": "exact_match",
				    "value": "true",
				  },
				]
			`);
		});

		it("empty=true → undefined_match", async () => {
			const { page } = await renderConfirmFilter({
				filterItem: {
					...baseConfirmFilterOptions,
					options: { ...baseConfirmFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/limitedOffer",
				    "operator": "undefined_match",
				  },
				]
			`);
		});
	});

	describe("Filter Bar Item Label", () => {
		it("displays null when unchecked", async () => {
			const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

			expect(page.filterBarItemLabel).toBe(null);
		});

		it("displays 'Yes' when checked", async () => {
			const { page } = await renderConfirmFilter({ filterItem: baseConfirmFilterOptions });

			await page.clickYes();
			expect(page.filterBarItemLabel).toMatchInlineSnapshot(`"Yes"`);
		});

		it("displays 'Empty' when empty is active", async () => {
			const { page } = await renderConfirmFilter({
				filterItem: {
					...baseConfirmFilterOptions,
					options: { ...baseConfirmFilterOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.filterBarItemLabel).toBe("Empty");
		});
	});
});
