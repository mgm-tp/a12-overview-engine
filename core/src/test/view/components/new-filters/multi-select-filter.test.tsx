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

import { renderMultiSelectFilter } from "./pages/multi-select-filter-page.js";

const baseMultiSelectOptions: OverviewModel.NewFilter.MultiSelect.Item = {
	id: "meta",
	type: "multi-select",
	options: {
		fieldId: ProductFieldIds.meta.id,
		viewMode: "list",
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false },
		matchOperator: { enabled: true, value: "or" }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.multi-select-filter", () => {
	describe("Interaction", () => {
		describe("List mode", () => {
			it("selecting single option generates filter operator", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				expect(page.selectedLabels).toEqual([]);

				await page.clickCheckbox("Number One");

				expect(page.isChecked("Number One")).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/meta/item",
					    "operator": "exact_match",
					    "value": "1",
					  },
					]
				`);
			});

			it("selecting multiple options generates OR operator by default", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				await page.clickCheckbox("Number One");
				await page.clickCheckbox("Number Five");

				expect(page.selectedLabels.sort()).toEqual(["Number Five", "Number One"]);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "5",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "1",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});

			it("deselecting all options clears filter operator", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				await page.clickCheckbox("Number One");
				expect(page.operator).not.toBeUndefined();

				await page.clickCheckbox("Number One");
				expect(page.selectedLabels).toEqual([]);
				expect(page.operator).toEqual([]);
			});

			it("reset button restores initial selection", async () => {
				const { page } = await renderMultiSelectFilter({
					filterItem: { ...baseMultiSelectOptions, options: { ...baseMultiSelectOptions.options, criteria: ["2"] } }
				});

				await page.clickCheckbox("Number One");
				expect(page.selectedLabels).toEqual(["Number One"]);

				await page.clickReset();

				expect(page.selectedLabels).toEqual([]);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/meta/item",
					    "operator": "exact_match",
					    "value": "2",
					  },
					]
				`);
			});

			it("clicking select all checkbox selects all options", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				expect(page.selectedLabels).toEqual([]);
				expect(page.selectAllCheckbox).toBeDefined();
				expect(page.selectAllState).toBe(false);

				await page.clickSelectAll();

				expect(page.selectedLabels.sort()).toEqual(["Number Five", "Number Four", "Number One", "Number Six"]);
				expect(page.selectAllState).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "5",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "4",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "1",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "6",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "3",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "2",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});

			it("clicking select all checkbox deselects all when all are selected", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				await page.clickSelectAll();
				expect(page.selectAllState).toBe(true);

				await page.clickSelectAll();

				expect(page.selectedLabels).toEqual([]);
				expect(page.selectAllState).toBe(false);
			});

			it("select all checkbox shows mixed state when some options are selected", async () => {
				const withCriteria: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, criteria: ["1", "2"] }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: withCriteria });

				expect(page.selectAllState).toBe("mixed");
			});

			it("clicking select all when in mixed state selects all options", async () => {
				const withCriteria: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, criteria: ["1"] }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: withCriteria });

				expect(page.selectAllState).toBe("mixed");

				await page.clickSelectAll();

				expect(page.selectAllState).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "5",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "4",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "1",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "6",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "3",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "2",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});
		});

		describe("Compact mode", () => {
			const compactOptions: OverviewModel.NewFilter.MultiSelect.Item = {
				...baseMultiSelectOptions,
				options: { ...baseMultiSelectOptions.options, viewMode: "compact" }
			};

			it("renders multiselect widget in compact mode", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: compactOptions });

				expect(page.isCompactMode).toBe(true);
				expect(page.multiselectInput).toBeDefined();
			});

			it("opens dropdown when clicking input", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: compactOptions });

				expect(page.multiselectDropdown).toBeUndefined();

				await page.openMultiselect();

				expect(page.multiselectDropdown).toBeDefined();
			});

			it("selecting option generates filter operator", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: compactOptions });

				await page.openMultiselect();
				await page.clickDropdownItem("Number One");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/meta/item",
					    "operator": "exact_match",
					    "value": "1",
					  },
					]
				`);
			});

			it("selecting multiple options generates OR operator by default", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: compactOptions });

				await page.openMultiselect();
				await page.clickDropdownItem("Number One");
				await page.clickDropdownItem("Number Two");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "1",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "2",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});
		});

		describe("Match Operator", () => {
			it("uses OR operator by default when matchOperator.value is OR", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				await page.clickCheckbox("Number Four");
				await page.clickCheckbox("Number Five");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "5",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "4",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});

			it("uses AND operator when matchOperator.value is AND", async () => {
				const andOptions: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: {
						...baseMultiSelectOptions.options,
						matchOperator: { enabled: true, value: "and" }
					}
				};

				const { page } = await renderMultiSelectFilter({ filterItem: andOptions });

				await page.clickCheckbox("Number Four");
				await page.clickCheckbox("Number Five");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "5",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "4",
					      },
					    ],
					    "operator": "and",
					  },
					]
				`);
			});

			it("toggling match operator from Any to All changes OR to AND", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				await page.clickCheckbox("Number Four");
				await page.clickCheckbox("Number Five");
				expect(page.operator?.[0]).toHaveProperty("operator", "or");

				await page.setMatchOperator("All");

				expect(page.operator?.[0]).toHaveProperty("operator", "and");
			});

			it("toggling match operator from All to Any changes AND to OR", async () => {
				const andOptions: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: {
						...baseMultiSelectOptions.options,
						matchOperator: { enabled: true, value: "and" }
					}
				};

				const { page } = await renderMultiSelectFilter({ filterItem: andOptions });

				await page.clickCheckbox("Number Four");
				await page.clickCheckbox("Number Five");
				expect(page.operator?.[0]).toHaveProperty("operator", "and");

				await page.setMatchOperator("Any");

				expect(page.operator?.[0]).toHaveProperty("operator", "or");
			});

			it("match operator does not affect single selection", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				await page.clickCheckbox("Number One");

				expect(page.operator?.[0]).toHaveProperty("operator", "exact_match");

				await page.setMatchOperator("All");

				expect(page.operator?.[0]).toHaveProperty("operator", "exact_match");
			});
		});
	});

	describe("UI Configuration", () => {
		describe("criteria option", () => {
			it("renders with no checkboxes selected when criteria is not preset", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				expect(page.selectedLabels).toEqual([]);
				expect(page.checkboxLabels).toEqual(["Number Five", "Number Four", "Number One", "Number Six"]);
			});

			it("still renders with preset selections when criteria is provided", async () => {
				const withCriteria: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, criteria: ["1", "2"] }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: withCriteria });

				expect(page.selectedLabels.sort()).toEqual(["Number One"]);
			});
		});

		describe("viewMode option", () => {
			it("when LIST (default) > renders checkboxes for each value", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				expect(page.checkboxes.length).toBeGreaterThan(0);
			});

			it("when COMPACT > renders multiselect widget instead of checkboxes", async () => {
				const compactOptions: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, viewMode: "compact" }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: compactOptions });

				expect(page.isCompactMode).toBe(true);
				expect(page.multiselectInput).toBeDefined();
			});
		});

		describe("empty option", () => {
			it("when disabled > settings portal does not show Empty toggle", async () => {
				const noEmpty: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, empty: { enabled: false } }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: noEmpty });

				await page.withSettings((settings) => {
					expect(settings.empty()).toBeUndefined();
				});
			});

			it("when enabled with preset value true > renders EmptyInput and settings shows Empty selected", async () => {
				const emptyTrue: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, empty: { enabled: true, value: true } }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: emptyTrue });

				expect(page.isEmptyMode).toBe(true);
				await page.withSettings((settings) => {
					expect(settings.empty()?.selectedItem?.textContent).toBe("Yes");
				});
			});

			it("when enabled with preset value false > renders checkbox list and settings shows Empty not selected", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				expect(page.isEmptyMode).toBe(false);
				await page.withSettings((settings) => {
					expect(settings.empty()?.selectedItem?.textContent).toBe("No");
				});
			});

			it("when both empty and invert are enabled > undefined_match operator is wrapped in NOT operator", async () => {
				const emptyAndInvert: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: {
						...baseMultiSelectOptions.options,
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: true }
					}
				};

				const { page } = await renderMultiSelectFilter({ filterItem: emptyAndInvert });

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "field": "/product/meta/item",
					      "operator": "undefined_match",
					    },
					    "operator": "not",
					  },
					]
				`);
			});
		});

		describe("invert option", () => {
			it("when disabled > settings portal does not show Invert toggle", async () => {
				const noInvert: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, invert: { enabled: false } }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: noInvert });

				await page.withSettings((settings) => {
					expect(settings.invert()).toBeUndefined();
				});
			});

			it("when enabled with preset value true > filter operator is wrapped in NOT operator", async () => {
				const invertTrue: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, invert: { enabled: true, value: true } }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: invertTrue });

				await page.clickCheckbox("Number One");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operand": {
					      "caseSensitive": true,
					      "field": "/product/meta/item",
					      "operator": "exact_match",
					      "value": "1",
					    },
					    "operator": "not",
					  },
					]
				`);
			});
		});

		describe("matchOperator option", () => {
			it("when enabled > settings portal shows Match section with Any/All toggles", async () => {
				const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

				await page.withSettings((settings) => {
					expect(settings.section("Match")).toBeDefined();
				});
			});

			it("when disabled > settings portal does not show Match section and use AND operator", async () => {
				const noMatchOperator: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: {
						...baseMultiSelectOptions.options,
						matchOperator: { enabled: false }
					}
				};

				const { page } = await renderMultiSelectFilter({ filterItem: noMatchOperator });

				await page.withSettings((settings) => {
					expect(settings.section("Match")).toBeUndefined();
				});

				await page.clickCheckbox("Number Four");
				await page.clickCheckbox("Number Five");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "5",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/meta/item",
					        "operator": "exact_match",
					        "value": "4",
					      },
					    ],
					    "operator": "and",
					  },
					]
				`);
			});

			it("Match section is hidden when empty is active", async () => {
				const emptyTrue: OverviewModel.NewFilter.MultiSelect.Item = {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, empty: { enabled: true, value: true } }
				};

				const { page } = await renderMultiSelectFilter({ filterItem: emptyTrue });

				await page.withSettings((settings) => {
					expect(settings.section("Match")).toBeUndefined();
				});
			});
		});

		it("hides settings button when all settings are disabled", async () => {
			const noSettings: OverviewModel.NewFilter.MultiSelect.Item = {
				...baseMultiSelectOptions,
				options: {
					...baseMultiSelectOptions.options,
					empty: { enabled: false },
					invert: { enabled: false },
					matchOperator: { enabled: false }
				}
			};

			const { page } = await renderMultiSelectFilter({ filterItem: noSettings });

			expect(page.settingsButton).toBeUndefined();
		});
	});

	describe("Settings Interaction", () => {
		it("toggling Empty setting switches between checkbox list and Empty mode", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			expect(page.isEmptyMode).toBe(false);

			await page.setEmptySetting("Yes");

			expect(page.isEmptyMode).toBe(true);
			expect(page.operator?.[0]).toHaveProperty("operator", "undefined_match");

			await page.setEmptySetting("No");

			expect(page.isEmptyMode).toBe(false);
		});

		it("toggling Invert setting affects filter operator", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			await page.clickCheckbox("Number One");
			expect(page.operator?.[0]).toHaveProperty("operator", "exact_match");

			await page.setInvertSetting("Yes");

			expect(page.operator?.[0]).toHaveProperty("operator", "not");

			await page.setInvertSetting("No");

			expect(page.operator?.[0]).toHaveProperty("operator", "exact_match");
		});

		it("toggling Match setting between Any and All affects filter operator", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			await page.clickCheckbox("Number Four");
			await page.clickCheckbox("Number Five");
			expect(page.operator?.[0]).toHaveProperty("operator", "or");

			await page.setMatchOperator("All");
			expect(page.operator?.[0]).toHaveProperty("operator", "and");

			await page.setMatchOperator("Any");
			expect(page.operator?.[0]).toHaveProperty("operator", "or");
		});
	});

	describe("Query Operator", () => {
		it("no selection → undefined (empty array)", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("single selection + match=OR → exact_match", async () => {
			const { page } = await renderMultiSelectFilter({
				filterItem: {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, criteria: ["ADULT"] }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/meta/item",
				    "operator": "exact_match",
				    "value": "ADULT",
				  },
				]
			`);
		});

		it("multiple selections + match=OR → OR(exact_match, ...)", async () => {
			const { page } = await renderMultiSelectFilter({
				filterItem: {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, criteria: ["ADULT", "CHILDREN"] }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "caseSensitive": true,
				        "field": "/product/meta/item",
				        "operator": "exact_match",
				        "value": "ADULT",
				      },
				      {
				        "caseSensitive": true,
				        "field": "/product/meta/item",
				        "operator": "exact_match",
				        "value": "CHILDREN",
				      },
				    ],
				    "operator": "or",
				  },
				]
			`);
		});

		it("multiple selections + match=AND → AND(exact_match, ...)", async () => {
			const { page } = await renderMultiSelectFilter({
				filterItem: {
					...baseMultiSelectOptions,
					options: {
						...baseMultiSelectOptions.options,
						criteria: ["ADULT", "CHILDREN"],
						matchOperator: { enabled: true, value: "and" }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "caseSensitive": true,
				        "field": "/product/meta/item",
				        "operator": "exact_match",
				        "value": "ADULT",
				      },
				      {
				        "caseSensitive": true,
				        "field": "/product/meta/item",
				        "operator": "exact_match",
				        "value": "CHILDREN",
				      },
				    ],
				    "operator": "and",
				  },
				]
			`);
		});

		it("empty=true → undefined_match", async () => {
			const { page } = await renderMultiSelectFilter({
				filterItem: {
					...baseMultiSelectOptions,
					options: { ...baseMultiSelectOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/meta/item",
				    "operator": "undefined_match",
				  },
				]
			`);
		});

		it("empty=true + invert=true → NOT(undefined_match)", async () => {
			const { page } = await renderMultiSelectFilter({
				filterItem: {
					...baseMultiSelectOptions,
					options: {
						...baseMultiSelectOptions.options,
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: true }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "field": "/product/meta/item",
				      "operator": "undefined_match",
				    },
				    "operator": "not",
				  },
				]
			`);
		});

		it("invert=true + selection → NOT(OR(exact_match, ...))", async () => {
			const { page } = await renderMultiSelectFilter({
				filterItem: {
					...baseMultiSelectOptions,
					options: {
						...baseMultiSelectOptions.options,
						criteria: ["ADULT"],
						invert: { enabled: true, value: true }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "caseSensitive": true,
				      "field": "/product/meta/item",
				      "operator": "exact_match",
				      "value": "ADULT",
				    },
				    "operator": "not",
				  },
				]
			`);
		});
	});

	describe("Filter Bar Item Label", () => {
		it("displays null when no criteria is selected", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			expect(page.filterBarItemLabel).toBeNull();
		});

		it("displays single value when one criterion is selected", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			await page.clickCheckbox("Number One");

			expect(page.filterBarItemLabel).toBe("Number One");
		});

		it("renders all selected values comma-joined when multiple criteria are selected", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			await page.clickCheckbox("Number Four");
			await page.clickCheckbox("Number Five");

			expect(page.filterBarItemLabel).toBe("Number Five, Number Four");
		});

		it("displays Empty when empty option is enabled and set to true", async () => {
			const emptyTrue: OverviewModel.NewFilter.MultiSelect.Item = {
				...baseMultiSelectOptions,
				options: { ...baseMultiSelectOptions.options, empty: { enabled: true, value: true } }
			};

			const { page } = await renderMultiSelectFilter({ filterItem: emptyTrue });

			expect(page.filterBarItemLabel).toBe("Empty");
		});

		it("updates label after selecting an option", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			expect(page.filterBarItemLabel).toBeNull();

			await page.clickCheckbox("Number Five");

			expect(page.filterBarItemLabel).toBe("Number Five");
		});

		it("updates label after toggling empty setting", async () => {
			const { page } = await renderMultiSelectFilter({ filterItem: baseMultiSelectOptions });

			await page.clickCheckbox("Number Five");
			expect(page.filterBarItemLabel).toBe("Number Five");

			await page.setEmptySetting("Yes");

			expect(page.filterBarItemLabel).toBe("Empty");
		});
	});

	describe("Pinned Values", () => {
		it("renders pinned values first and shows Show more button", async () => {
			const pinnedOptions: OverviewModel.NewFilter.MultiSelect.Item = {
				...baseMultiSelectOptions,
				options: { ...baseMultiSelectOptions.options, pinnedValues: ["2", "3"] }
			};

			const { page } = await renderMultiSelectFilter({ filterItem: pinnedOptions });

			expect(page.checkboxLabels).toEqual(["Number Two", "Number Three"]);
			expect(page.showMoreButton).toBeDefined();
		});

		it("clicking Show more reveals additional options", async () => {
			const pinnedOptions: OverviewModel.NewFilter.MultiSelect.Item = {
				...baseMultiSelectOptions,
				options: { ...baseMultiSelectOptions.options, pinnedValues: ["2", "3"] }
			};

			const { page } = await renderMultiSelectFilter({ filterItem: pinnedOptions });

			expect(page.checkboxLabels.length).toEqual(2);
			expect(page.showMoreButton).toBeDefined();
			expect(page.showLessButton).toBeUndefined();

			await page.showMore();

			expect(page.checkboxLabels.length).toBe(6);
			expect(page.showMoreButton).toBeUndefined();
			expect(page.showLessButton).toBeDefined();
		});

		it("clicking Show less hides non-pinned options", async () => {
			const pinnedOptions: OverviewModel.NewFilter.MultiSelect.Item = {
				...baseMultiSelectOptions,
				options: { ...baseMultiSelectOptions.options, pinnedValues: ["1", "2"] }
			};

			const { page } = await renderMultiSelectFilter({ filterItem: pinnedOptions });

			expect(page.checkboxLabels.length).toEqual(2);

			await page.showMore();

			expect(page.checkboxLabels.length).toBeGreaterThan(2);

			await page.showLess();

			expect(page.checkboxLabels.length).toEqual(2);
		});
	});
});
