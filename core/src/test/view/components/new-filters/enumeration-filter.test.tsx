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

import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OverviewModel } from "../../../../main/overview-model.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderEnumerationFilter } from "./pages/enumeration-filter-page.js";
import type { DocumentModelModifier } from "./setup.js";

const baseEnumerationOptions: OverviewModel.NewFilter.Enumeration.Item = {
	id: "targetGroup",
	type: "enumeration",
	options: {
		fieldId: ProductFieldIds.targetGroup.id,
		viewMode: "list",
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

function limitEnumValuesToFour(fieldPath: string): DocumentModelModifier {
	return (element: DocumentModel.Element) => {
		if (element.type !== "Field") {
			return null;
		}

		const field = element as DocumentModel.Field;

		if (`/product/${field.name}` !== fieldPath) {
			return null;
		}

		const fieldType = field.fieldType;

		if (fieldType.type !== "EnumerationType") {
			return null;
		}

		const enumType = fieldType as DocumentModel.EnumerationType;
		const limitedValues = enumType.values.slice(0, 4);

		return {
			...field,
			fieldType: {
				...enumType,
				values: limitedValues
			}
		} as DocumentModel.Field;
	};
}

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.enumeration-filter", () => {
	describe("Interaction", () => {
		describe("List mode", () => {
			it("selecting single option generates filter operator", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

				expect(page.selectedLabels).toEqual([]);

				await page.clickCheckbox("Children");

				expect(page.isChecked("Children")).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/targetGroup",
					    "operator": "exact_match",
					    "value": "children",
					  },
					]
				`);
			});

			it("selecting multiple options generates OR operator", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

				await page.clickCheckbox("Children");
				await page.clickCheckbox("Seniors");

				expect(page.selectedLabels).toEqual(["Children", "Seniors"]);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "children",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "seniors",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});

			it("deselecting all options clears filter operator", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, criteria: ["children"] }
					}
				});

				expect(page.isChecked("Children")).toBe(true);

				await page.clickCheckbox("Children");

				expect(page.selectedLabels).toEqual([]);
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("reset button restores initial selection", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, criteria: ["adults"] }
					}
				});

				expect(page.isChecked("Adults")).toBe(true);
				expect(page.selectedLabels).toEqual(["Adults"]);

				await page.clickCheckbox("Children");
				await page.clickCheckbox("Seniors");

				expect(page.selectedLabels).toEqual(["Adults", "Children", "Seniors"]);

				await page.clickReset();

				expect(page.selectedLabels).toEqual(["Adults"]);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/targetGroup",
					    "operator": "exact_match",
					    "value": "adults",
					  },
					]
				`);
			});

			it("clicking select all checkbox selects all options", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

				expect(page.selectedLabels).toEqual([]);
				expect(page.selectAllCheckbox).toBeDefined();
				expect(page.selectAllState).toBe(false);

				await page.clickSelectAll();

				expect(page.selectedLabels).toEqual(["Adults", "Children", "Men", "Seniors"]);
				expect(page.selectAllState).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "adults",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "children",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "men",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "seniors",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "women",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "youth",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});

			it("clicking select all checkbox deselects all when all are selected", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, criteria: ["women", "men", "children", "adults"] }
					}
				});

				await page.clickSelectAll();
				expect(page.selectedLabels).toEqual(["Adults", "Children", "Men", "Seniors"]);

				expect(page.selectAllState).toBe(true);

				await page.clickSelectAll();

				expect(page.selectedLabels).toEqual([]);
				expect(page.selectAllState).toBe(false);
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("select all checkbox shows mixed state when some options are selected", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, criteria: ["women", "men"] }
					}
				});

				expect(page.selectedLabels.sort()).toEqual(["Men"]);
				expect(page.selectAllState).toBe("mixed");
			});

			it("clicking select all when in mixed state selects all options", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, criteria: ["women"] }
					}
				});

				expect(page.selectAllState).toBe("mixed");

				await page.clickSelectAll();

				expect(page.selectedLabels).toEqual(["Adults", "Children", "Men", "Seniors"]);
				expect(page.selectAllState).toBe(true);
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "adults",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "children",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "men",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "seniors",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "women",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "youth",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});
		});

		describe("Compact mode", () => {
			const compactEnumerationOptions: OverviewModel.NewFilter.Enumeration.Item = {
				...baseEnumerationOptions,
				options: { ...baseEnumerationOptions.options, viewMode: "compact" }
			};

			it("renders multiselect widget in compact mode", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: compactEnumerationOptions });

				expect(page.isCompactMode).toBe(true);
				expect(page.multiselectInput).toBeDefined();
			});

			it("opens dropdown when clicking input", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: compactEnumerationOptions });

				expect(page.multiselectDropdown).toBeUndefined();

				await page.openMultiselect();

				expect(page.multiselectDropdown).toBeDefined();
			});

			it("displays all enumeration values in dropdown", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: compactEnumerationOptions });

				await page.openMultiselect();

				expect(page.dropdownItemLabels).toEqual([
					"De/Select all",
					"Adults",
					"Children",
					"Men",
					"Seniors",
					"Women",
					"Youth"
				]);
			});

			it("selecting single option generates filter operator", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: compactEnumerationOptions });

				await page.openMultiselect();
				await page.clickDropdownItem("Women");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/targetGroup",
					    "operator": "exact_match",
					    "value": "women",
					  },
					]
				`);
			});

			it("selecting multiple options generates OR operator", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: compactEnumerationOptions });

				await page.openMultiselect();
				await page.clickDropdownItem("Women");
				await page.clickDropdownItem("Men");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "women",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "men",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);
			});

			it("deselecting option removes it from filter operator", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...compactEnumerationOptions,
						options: { ...compactEnumerationOptions.options, criteria: ["women", "men"] }
					}
				});

				await page.openMultiselect();
				await page.clickDropdownItem("Women");

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/targetGroup",
					    "operator": "exact_match",
					    "value": "men",
					  },
					]
				`);
			});

			it("shows selected values in multiselect input", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...compactEnumerationOptions,
						options: { ...compactEnumerationOptions.options, criteria: ["women", "men"] }
					}
				});

				expect(page.multiselectValue).toEqual("Men, Women");
			});

			it("reset button clears selection", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...compactEnumerationOptions,
						options: { ...compactEnumerationOptions.options, criteria: ["women"] }
					}
				});

				await page.openMultiselect();
				await page.clickDropdownItem("Men");
				await page.closeMultiselect();

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "operands": [
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "women",
					      },
					      {
					        "caseSensitive": true,
					        "field": "/product/targetGroup",
					        "operator": "exact_match",
					        "value": "men",
					      },
					    ],
					    "operator": "or",
					  },
					]
				`);

				expect(page.operator.length).toBeGreaterThan(0);

				await page.clickReset();

				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "caseSensitive": true,
					    "field": "/product/targetGroup",
					    "operator": "exact_match",
					    "value": "women",
					  },
					]
				`);
			});
		});
	});

	describe("UI Configuration", () => {
		describe("criteria option", () => {
			it("renders with no checkboxes selected when criteria is not preset", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

				expect(page.selectedLabels).toEqual([]);
				expect(page.checkboxLabels).toEqual(["Adults", "Children", "Men", "Seniors"]);
			});

			it("renders with defined order even when criteria is provided", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, criteria: ["women", "men"] }
					}
				});

				expect(page.checkboxLabels).toEqual(["Adults", "Children", "Men", "Seniors"]);
				expect(page.isChecked("Adults")).toBe(false);
				expect(page.isChecked("Children")).toBe(false);
				expect(page.isChecked("Men")).toBe(true);
				expect(page.isChecked("Seniors")).toBe(false);
			});
		});

		describe("viewMode option", () => {
			describe("when LIST (default)", () => {
				it("renders checkboxes for each enumeration value", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: { ...baseEnumerationOptions.options, viewMode: "list" }
						}
					});

					expect(page.checkboxLabels).toEqual(["Adults", "Children", "Men", "Seniors"]);
				});
			});

			describe("when COMPACT", () => {
				it("renders multiselect widget instead of checkboxes", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: { ...baseEnumerationOptions.options, viewMode: "compact" }
						}
					});

					expect(page.isCompactMode).toBe(true);
					expect(page.multiselectInput).toBeDefined();
					expect(page.checkboxes.length).toBe(0);
				});
			});
		});

		describe("pinnedValues option", () => {
			it("renders pinned values first", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, pinnedValues: ["children", "adults"] }
					}
				});

				const labels = page.checkboxLabels.filter((l) => l !== "De/Select all");
				expect(labels[0]).toBe("Children");
				expect(labels[1]).toBe("Adults");
			});

			it("shows 'Show more' button when there are non-pinned values", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: { ...baseEnumerationOptions.options, pinnedValues: ["women"] }
					}
				});

				expect(page.showMoreButton).toBeDefined();
			});

			it("renders first 4 values when pinnedValues is empty", async () => {
				const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

				const labels = page.checkboxLabels.filter((l) => l !== "De/Select all");
				expect(labels.length).toBe(4);
			});

			it("renders all pinned values when more than 4 are pinned", async () => {
				const { page } = await renderEnumerationFilter({
					filterItem: {
						...baseEnumerationOptions,
						options: {
							...baseEnumerationOptions.options,
							pinnedValues: ["women", "men", "children", "adults", "seniors"]
						}
					}
				});

				const labels = page.checkboxLabels.filter((l) => l !== "De/Select all");
				expect(labels.length).toBe(5);
				expect(labels).toContain("Women");
				expect(labels).toContain("Men");
				expect(labels).toContain("Children");
				expect(labels).toContain("Adults");
				expect(labels).toContain("Seniors");
			});
		});

		describe("empty option", () => {
			describe("when disabled", () => {
				it("settings portal does not show Empty toggle", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: { ...baseEnumerationOptions.options, empty: { enabled: false } }
						}
					});

					await page.withSettings((settings) => {
						expect(settings.empty()).toBeUndefined();
					});
				});
			});

			describe("when enabled with preset value true", () => {
				it("renders EmptyInput and settings shows Empty selected", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: { ...baseEnumerationOptions.options, empty: { enabled: true, value: true } }
						}
					});

					expect(page.isEmptyMode).toBe(true);
					expect(page.emptyInput).toBeDefined();

					await page.withSettings((settings) => {
						const emptyToggle = settings.empty();
						expect(emptyToggle).toBeDefined();
						expect(emptyToggle?.selectedItem?.textContent).toBe("Yes");
					});
				});
			});

			describe("when enabled with preset value false", () => {
				it("renders checkbox list and settings shows Empty not selected", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: { ...baseEnumerationOptions.options, empty: { enabled: true, value: false } }
						}
					});

					expect(page.isEmptyMode).toBe(false);
					expect(page.checkboxes.length).toBeGreaterThan(0);

					await page.withSettings((settings) => {
						const emptyToggle = settings.empty();
						expect(emptyToggle).toBeDefined();
						expect(emptyToggle?.selectedItem?.textContent).toBe("No");
					});
				});
			});

			describe("when both empty and invert are enabled", () => {
				it("undefined_match operator is wrapped in NOT operator", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: {
								...baseEnumerationOptions.options,
								empty: { enabled: true, value: true },
								invert: { enabled: true, value: true }
							}
						}
					});

					expect(page.isEmptyMode).toBe(true);
					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "operand": {
						      "field": "/product/targetGroup",
						      "operator": "undefined_match",
						    },
						    "operator": "not",
						  },
						]
					`);
				});
			});
		});

		describe("invert option", () => {
			describe("when disabled", () => {
				it("settings portal does not show Invert toggle", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: { ...baseEnumerationOptions.options, invert: { enabled: false } }
						}
					});

					await page.withSettings((settings) => {
						expect(settings.invert()).toBeUndefined();
					});
				});
			});

			describe("when enabled with preset value true", () => {
				it("filter operator is wrapped in NOT operator", async () => {
					const { page } = await renderEnumerationFilter({
						filterItem: {
							...baseEnumerationOptions,
							options: {
								...baseEnumerationOptions.options,
								criteria: ["women"],
								invert: { enabled: true, value: true }
							}
						}
					});

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "operand": {
						      "caseSensitive": true,
						      "field": "/product/targetGroup",
						      "operator": "exact_match",
						      "value": "women",
						    },
						    "operator": "not",
						  },
						]
					`);
				});
			});
		});

		it("hides settings button when all settings are disabled", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: {
						...baseEnumerationOptions.options,
						empty: { enabled: false },
						invert: { enabled: false }
					}
				}
			});

			expect(page.hasSettings()).toBe(false);
		});
	});

	describe("Settings Interaction", () => {
		it("toggling Empty setting switches between checkbox list and Empty mode", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, empty: { enabled: true, value: false } }
				}
			});

			expect(page.isEmptyMode).toBe(false);
			expect(page.checkboxes.length).toBeGreaterThan(0);

			await page.setEmptySetting("Yes");

			expect(page.isEmptyMode).toBe(true);
			expect(page.emptyInput).toBeDefined();
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/targetGroup",
				    "operator": "undefined_match",
				  },
				]
			`);

			await page.setEmptySetting("No");

			expect(page.isEmptyMode).toBe(false);
			expect(page.checkboxes.length).toBeGreaterThan(0);
		});

		it("toggling Invert setting affects filter operator", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: {
						...baseEnumerationOptions.options,
						criteria: ["women"],
						invert: { enabled: true, value: false }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/targetGroup",
				    "operator": "exact_match",
				    "value": "women",
				  },
				]
			`);

			await page.setInvertSetting("Yes");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "caseSensitive": true,
				      "field": "/product/targetGroup",
				      "operator": "exact_match",
				      "value": "women",
				    },
				    "operator": "not",
				  },
				]
			`);

			await page.setInvertSetting("No");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/targetGroup",
				    "operator": "exact_match",
				    "value": "women",
				  },
				]
			`);
		});
	});

	describe("Query Operator", () => {
		it("no selection → undefined (empty array)", async () => {
			const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("single selection → exact_match", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, criteria: ["Adults"] }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": true,
				    "field": "/product/targetGroup",
				    "operator": "exact_match",
				    "value": "Adults",
				  },
				]
			`);
		});

		it("multiple selections → OR(exact_match, ...)", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, criteria: ["Adults", "Children"] }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "caseSensitive": true,
				        "field": "/product/targetGroup",
				        "operator": "exact_match",
				        "value": "Adults",
				      },
				      {
				        "caseSensitive": true,
				        "field": "/product/targetGroup",
				        "operator": "exact_match",
				        "value": "Children",
				      },
				    ],
				    "operator": "or",
				  },
				]
			`);
		});

		it("invert=true + selection → NOT(exact_match)", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: {
						...baseEnumerationOptions.options,
						criteria: ["Adults"],
						invert: { enabled: true, value: true }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "caseSensitive": true,
				      "field": "/product/targetGroup",
				      "operator": "exact_match",
				      "value": "Adults",
				    },
				    "operator": "not",
				  },
				]
			`);
		});

		it("empty=true → undefined_match", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/targetGroup",
				    "operator": "undefined_match",
				  },
				]
			`);
		});

		it("empty=true + invert=true → NOT(undefined_match)", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: {
						...baseEnumerationOptions.options,
						empty: { enabled: true, value: true },
						invert: { enabled: true, value: true }
					}
				}
			});

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "field": "/product/targetGroup",
				      "operator": "undefined_match",
				    },
				    "operator": "not",
				  },
				]
			`);
		});
	});

	describe("Filter Bar Item Label", () => {
		it("displays null when no criteria is selected", async () => {
			const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

			expect(page.filterBarItemLabel).toBe(null);
		});

		it("displays single value when one criterion is selected", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, criteria: ["women"] }
				}
			});

			expect(page.filterBarItemLabel).toBe("Women");
		});

		it("renders all selected values comma-joined when multiple criteria are selected", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, criteria: ["women", "men"] }
				}
			});

			expect(page.filterBarItemLabel).toBe("Women, Men");
		});

		it("displays Empty when empty option is enabled and set to true", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.filterBarItemLabel).toBe("Empty");
		});

		it("updates label after selecting an option", async () => {
			const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

			expect(page.filterBarItemLabel).toBe(null);

			await page.clickCheckbox("Men");

			expect(page.filterBarItemLabel).toBe("Men");
		});

		it("updates label after selecting multiple options", async () => {
			const { page } = await renderEnumerationFilter({ filterItem: baseEnumerationOptions });

			await page.clickCheckbox("Adults");

			expect(page.filterBarItemLabel).toBe("Adults");

			await page.clickCheckbox("Children");

			expect(page.filterBarItemLabel).toBe("Adults, Children");
		});

		it("updates label after toggling empty setting", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: {
						...baseEnumerationOptions.options,
						criteria: ["women"],
						empty: { enabled: true, value: false }
					}
				}
			});

			expect(page.filterBarItemLabel).toBe("Women");

			await page.setEmptySetting("Yes");

			expect(page.filterBarItemLabel).toBe("Empty");
		});
	});

	describe("Show More/Less", () => {
		it("clicking Show more reveals additional options", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, pinnedValues: ["women", "men"] }
				}
			});

			expect(page.checkboxLabels).toEqual(["Women", "Men"]);
			expect(page.showMoreButton).toBeDefined();
			expect(page.showLessButton).toBeUndefined();

			await page.showMore();

			expect(page.checkboxLabels).toEqual(["Women", "Men", "Adults", "Children", "Seniors", "Youth"]);
			expect(page.showMoreButton).toBeUndefined();
			expect(page.showLessButton).toBeDefined();
		});

		it("clicking Show less hides non-pinned options", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: { ...baseEnumerationOptions.options, pinnedValues: ["women", "men"] }
				}
			});

			expect(page.checkboxLabels.length).toEqual(2);

			await page.showMore();

			expect(page.checkboxLabels.length).toBeGreaterThan(2);

			await page.showLess();

			expect(page.checkboxLabels.length).toEqual(2);
		});

		it("Show more button not shown when all values are pinned and count <= 4", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: {
						...baseEnumerationOptions.options,
						pinnedValues: ["women", "men"]
					}
				},
				documentModelModifier: limitEnumValuesToFour("/product/targetGroup")
			});

			expect(page.checkboxLabels.length).toBe(4);
			expect(page.showMoreButton).toBeUndefined();
		});

		it("Show more button shown when more than 4 values exist", async () => {
			const { page } = await renderEnumerationFilter({
				filterItem: {
					...baseEnumerationOptions,
					options: {
						...baseEnumerationOptions.options,
						pinnedValues: ["women", "men", "children", "adults"]
					}
				}
			});

			expect(page.checkboxLabels.length).toBe(4);
			expect(page.showMoreButton).toBeDefined();
		});
	});
});
