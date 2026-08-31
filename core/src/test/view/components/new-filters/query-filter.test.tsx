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

import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";

import type { OverviewModel } from "../../../../main/overview-model.js";
import { deLocale } from "../../../basic.spec.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderQueryFilter } from "./pages/query-filter-page.js";

/**
 * `(name = "Espresso" OR name = "Ristretto") AND NOT description = "discontinued"`
 * — a nested boolean query, which is the case query filters exist for: a
 * pre-resolved operator too complex to express through a field-based filter.
 */
const availableShortCoffeesOperator: Query.Operator = QueryBuilder.and(
	QueryBuilder.or(
		QueryBuilder.exactMatch(ProductFieldIds.name.path, "Espresso"),
		QueryBuilder.exactMatch(ProductFieldIds.name.path, "Ristretto")
	),
	QueryBuilder.create(QueryBuilder.exactMatch(ProductFieldIds.description.path, "discontinued").build()).not(true)
).build()!;

const DESCRIPTION_EN = "Matches Espresso or Ristretto, excluding discontinued items.";
const DESCRIPTION_DE = "Trifft auf Espresso oder Ristretto zu, ohne auslaufende Artikel.";

const localizedDescription = [
	{ locale: "en", text: DESCRIPTION_EN },
	{ locale: "de", text: DESCRIPTION_DE }
];

const baseQueryFilterItem: OverviewModel.NewFilter.Query.Item = {
	id: "availableShortCoffees",
	type: "query",
	label: [
		{ locale: "en", text: "Available short coffees" },
		{ locale: "de", text: "Verfügbare kurze Kaffees" }
	],
	options: {
		operator: availableShortCoffeesOperator,
		enabled: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.query-filter", () => {
	describe("Interaction", () => {
		it("checking the checkbox emits the modeled operator", async () => {
			const { page } = await renderQueryFilter({ filterItem: baseQueryFilterItem });

			expect(page.isChecked).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);

			await page.clickCheckbox();

			expect(page.isChecked).toBe(true);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "operands": [
				          {
				            "caseSensitive": true,
				            "field": "/product/name",
				            "operator": "exact_match",
				            "value": "Espresso",
				          },
				          {
				            "caseSensitive": true,
				            "field": "/product/name",
				            "operator": "exact_match",
				            "value": "Ristretto",
				          },
				        ],
				        "operator": "or",
				      },
				      {
				        "operand": {
				          "caseSensitive": true,
				          "field": "/product/description",
				          "operator": "exact_match",
				          "value": "discontinued",
				        },
				        "operator": "not",
				      },
				    ],
				    "operator": "and",
				  },
				]
			`);
		});

		it("unchecking the checkbox removes the operator", async () => {
			const { page } = await renderQueryFilter({ filterItem: baseQueryFilterItem });

			await page.clickCheckbox();
			expect(page.isChecked).toBe(true);

			await page.clickCheckbox();

			expect(page.isChecked).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("reset restores the modeled default", async () => {
			const { page } = await renderQueryFilter({ filterItem: baseQueryFilterItem });

			await page.clickCheckbox();
			expect(page.isChecked).toBe(true);

			await page.clickReset();

			expect(page.isChecked).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});
	});

	describe("UI Configuration", () => {
		describe("enabled option", () => {
			it("renders unchecked when enabled defaults to false", async () => {
				const { page } = await renderQueryFilter({ filterItem: baseQueryFilterItem });

				expect(page.isChecked).toBe(false);
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("renders checked and emits the operator when enabled defaults to true", async () => {
				const { page } = await renderQueryFilter({
					filterItem: {
						...baseQueryFilterItem,
						options: { ...baseQueryFilterItem.options, enabled: { enabled: true, value: true } }
					}
				});

				expect(page.isChecked).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "operands": [
					          {
					            "caseSensitive": true,
					            "field": "/product/name",
					            "operator": "exact_match",
					            "value": "Espresso",
					          },
					          {
					            "caseSensitive": true,
					            "field": "/product/name",
					            "operator": "exact_match",
					            "value": "Ristretto",
					          },
					        ],
					        "operator": "or",
					      },
					      {
					        "operand": {
					          "caseSensitive": true,
					          "field": "/product/description",
					          "operator": "exact_match",
					          "value": "discontinued",
					        },
					        "operator": "not",
					      },
					    ],
					    "operator": "and",
					  },
					]
				`);
			});
		});

		describe("description option", () => {
			it("renders the localized description as checkbox helper text", async () => {
				const { page } = await renderQueryFilter({
					filterItem: { ...baseQueryFilterItem, description: localizedDescription }
				});

				expect(page.helperTextContent).toBe(DESCRIPTION_EN);
			});

			it("renders the German description when the locale is German", async () => {
				const { page } = await renderQueryFilter({
					filterItem: { ...baseQueryFilterItem, description: localizedDescription },
					locale: deLocale
				});

				expect(page.helperTextContent).toBe(DESCRIPTION_DE);
			});

			it("falls back to no helper text when the active locale has no translation", async () => {
				const { page } = await renderQueryFilter({
					filterItem: { ...baseQueryFilterItem, description: [{ locale: "en", text: DESCRIPTION_EN }] },
					locale: deLocale
				});

				expect(page.helperTextContent).not.toBe(DESCRIPTION_EN);
			});

			it("associates the helper text with the checkbox for screen readers", async () => {
				const { page } = await renderQueryFilter({
					filterItem: { ...baseQueryFilterItem, description: localizedDescription }
				});

				expect(page.isHelperTextAnnounced).toBe(true);
			});

			it("renders no helper text when no description is modeled", async () => {
				const { page } = await renderQueryFilter({ filterItem: baseQueryFilterItem });

				expect(page.helperText).toBeNull();
			});

			it("renders no helper text when the description has no localized text", async () => {
				const { page } = await renderQueryFilter({ filterItem: { ...baseQueryFilterItem, description: [] } });

				expect(page.helperText).toBeNull();
			});

			it("keeps the description out of the filter bar chip label", async () => {
				const { page } = await renderQueryFilter({
					filterItem: {
						...baseQueryFilterItem,
						label: [],
						preferFilterBar: true,
						description: localizedDescription
					}
				});

				expect(page.filterBarItemLabel ?? "").not.toContain(DESCRIPTION_EN);
			});
		});
	});
});
