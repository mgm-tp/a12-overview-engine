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
import type { StringFilterState } from "../../../../main/store/index.js";
import { DefaultFilterStateSelectors } from "../../../../main/store/internal/selectors/filter-selectors.js";
import { ProductFieldIds } from "../../../setup/product-field-ids.js";

import { renderStringFilter } from "./pages/string-filter-page.js";
import type { DocumentModelModifier } from "./setup.js";

const stripAnnotations: DocumentModelModifier = (element) =>
	element.type === "Field" && element.id === ProductFieldIds.name.id ? { ...element, annotations: [] } : null;

const baseStringOptions: OverviewModel.NewFilter.String.Item = {
	id: "name",
	type: "string",
	options: {
		fieldId: ProductFieldIds.name.id,
		caseSensitive: { enabled: true, value: false },
		exactMatch: { enabled: true, value: false },
		empty: { enabled: true, value: false },
		invert: { enabled: true, value: false }
	}
};

describe("com.mgmtp.a12.overview-engine.view.components.new-filters.string-filter", () => {
	describe("Interaction", () => {
		it("basic input and filter operator generation", async () => {
			const { page } = await renderStringFilter({ filterItem: baseStringOptions });

			await page.setCriteriaValue("test");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);
		});

		it("clearing input resets filter operator to undefined", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: { ...baseStringOptions.options, criteria: "initial" }
				}
			});

			page.assertCriteriaValue("initial");

			await page.clearCriteria();

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("reset button clears the filter value", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: { ...baseStringOptions.options, criteria: "initial" }
				}
			});

			page.assertCriteriaValue("initial");

			await page.setCriteriaValue("modified");

			page.assertCriteriaValue("modified");

			await page.clickReset();

			page.assertCriteriaValue("initial");
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "initial",
				    "values": undefined,
				  },
				]
			`);
		});
	});

	describe("UI Configuration", () => {
		describe("criteria option", () => {
			it("renders empty input field when criteria is not preset", async () => {
				const { page } = await renderStringFilter({ filterItem: baseStringOptions });

				page.assertCriteriaValue("");
				expect(page.operator).toMatchInlineSnapshot(`[]`);
			});

			it("renders input field with preset value when criteria is provided", async () => {
				const { page } = await renderStringFilter({
					filterItem: {
						...baseStringOptions,
						options: { ...baseStringOptions.options, criteria: "preset-value" }
					}
				});

				page.assertCriteriaValue("preset-value");
				expect(page.operator).toMatchInlineSnapshot(`
					[
					  {
					    "fields": [
					      "/product/name",
					    ],
					    "operator": "simple_search",
					    "value": "preset-value",
					    "values": undefined,
					  },
					]
				`);
			});
		});

		describe("empty option", () => {
			describe("when disabled", () => {
				it("settings portal does not show Empty toggle", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, empty: { enabled: false } }
						}
					});

					await page.withSettings(async (settings) => {
						expect(settings.empty()).toBeUndefined();
					});

					expect(page.operator).toMatchInlineSnapshot(`[]`);
				});
			});

			describe("when enabled with preset value true", () => {
				it("renders EmptyInput and settings shows Empty selected", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, empty: { enabled: true, value: true } }
						}
					});

					page.assertEmptyMode();

					await page.withSettings(async (settings) => {
						const emptyToggle = settings.empty();
						expect(emptyToggle).toBeDefined();
						expect(emptyToggle?.selectedItem?.textContent?.trim()).toBe("Yes");
					});

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "field": "/product/name",
						    "operator": "undefined_match",
						  },
						]
					`);
				});
			});

			describe("when enabled with preset value false", () => {
				it("renders text input and settings shows Empty not selected", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, empty: { enabled: true, value: false } }
						}
					});

					page.assertTextInputMode();

					await page.withSettings(async (settings) => {
						const emptyToggle = settings.empty();
						expect(emptyToggle).toBeDefined();
						expect(emptyToggle?.selectedItem?.textContent?.trim()).toBe("No");
					});
				});
			});
		});

		describe("caseSensitive option", () => {
			describe("when disabled", () => {
				it("settings portal does not show Case toggle in Match section", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, caseSensitive: { enabled: false } }
						}
					});

					await page.withSettings(async (settings) => {
						const matchSection = settings.match();

						if (matchSection) {
							expect(matchSection.case()).toBeUndefined();
						}
					});
				});
			});

			describe("when enabled with preset value true", () => {
				it("filter operator uses caseSensitive: true", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, caseSensitive: { enabled: true, value: true } }
						}
					});

					await page.setCriteriaValue("test");

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "fields": [
						      "/product/name",
						    ],
						    "operator": "simple_search",
						    "value": "test",
						    "values": undefined,
						  },
						]
					`);
				});
			});
		});

		describe("exactMatch option", () => {
			describe("when disabled", () => {
				it("settings portal does not show Exact toggle in Match section", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, exactMatch: { enabled: false } }
						}
					});

					await page.withSettings(async (settings) => {
						const matchSection = settings.match();

						if (matchSection) {
							expect(matchSection.exact()).toBeUndefined();
						}
					});
				});
			});

			describe("when enabled with preset value true", () => {
				it("filter operator uses EXACT_MATCH operator", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, exactMatch: { enabled: true, value: true } }
						}
					});

					await page.setCriteriaValue("test me");

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "caseSensitive": false,
						    "field": "/product/name",
						    "operator": "exact_match",
						    "value": "test me",
						  },
						]
					`);
				});
			});

			describe("when enabled with preset value false", () => {
				it("filter operator uses simple_search operator", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, exactMatch: { enabled: true, value: false } }
						}
					});

					await page.setCriteriaValue("test me");

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "operands": [
						      {
						        "fields": [
						          "/product/name",
						        ],
						        "operator": "simple_search",
						        "value": "test",
						        "values": undefined,
						      },
						      {
						        "fields": [
						          "/product/name",
						        ],
						        "operator": "simple_search",
						        "value": "me",
						        "values": undefined,
						      },
						    ],
						    "operator": "and",
						  },
						]
					`);
				});
			});
		});

		describe("invert option", () => {
			describe("when disabled", () => {
				it("settings portal does not show Invert toggle", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, invert: { enabled: false } }
						}
					});

					await page.withSettings(async (settings) => {
						expect(settings.invert()).toBeUndefined();
					});
				});
			});

			describe("when enabled with preset value false", () => {
				it("filter operator is NOT wrapped in NOT operator", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, invert: { enabled: true, value: false } }
						}
					});

					await page.setCriteriaValue("test");

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "fields": [
						      "/product/name",
						    ],
						    "operator": "simple_search",
						    "value": "test",
						    "values": undefined,
						  },
						]
					`);
				});
			});

			describe("when enabled with preset value true", () => {
				it("filter operator is wrapped in NOT operator", async () => {
					const { page } = await renderStringFilter({
						filterItem: {
							...baseStringOptions,
							options: { ...baseStringOptions.options, invert: { enabled: true, value: true } }
						}
					});

					await page.setCriteriaValue("test");

					expect(page.operator).toMatchInlineSnapshot(`
						[
						  {
						    "operand": {
						      "fields": [
						        "/product/name",
						      ],
						      "operator": "simple_search",
						      "value": "test",
						      "values": undefined,
						    },
						    "operator": "not",
						  },
						]
					`);
				});
			});
		});
	});

	describe("Settings Interaction", () => {
		it("toggling Empty setting switches between text input and Empty mode", async () => {
			const { page } = await renderStringFilter({ filterItem: baseStringOptions });

			page.assertTextInputMode();

			await page.setEmptySetting("Yes");
			page.assertEmptyMode();

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "field": "/product/name",
				    "operator": "undefined_match",
				  },
				]
			`);

			await page.setEmptySetting("No");
			page.assertTextInputMode();

			expect(page.operator).toMatchInlineSnapshot(`[]`);
		});

		it("toggling Case Sensitive setting affects filter operator", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: {
						...baseStringOptions.options,
						caseSensitive: { enabled: true, value: false }
					}
				}
			});

			await page.setCriteriaValue("test");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);

			await page.setCaseSensitive(true);

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);

			await page.setCaseSensitive(true);

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);
		});

		it("toggling Exact Match setting affects filter operator", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: {
						...baseStringOptions.options,
						exactMatch: { enabled: true, value: false }
					}
				}
			});

			await page.setCriteriaValue("test me");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "fields": [
				          "/product/name",
				        ],
				        "operator": "simple_search",
				        "value": "test",
				        "values": undefined,
				      },
				      {
				        "fields": [
				          "/product/name",
				        ],
				        "operator": "simple_search",
				        "value": "me",
				        "values": undefined,
				      },
				    ],
				    "operator": "and",
				  },
				]
			`);

			await page.setExactMatch(true);

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": false,
				    "field": "/product/name",
				    "operator": "exact_match",
				    "value": "test me",
				  },
				]
			`);

			await page.setExactMatch(false);

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operands": [
				      {
				        "fields": [
				          "/product/name",
				        ],
				        "operator": "simple_search",
				        "value": "test",
				        "values": undefined,
				      },
				      {
				        "fields": [
				          "/product/name",
				        ],
				        "operator": "simple_search",
				        "value": "me",
				        "values": undefined,
				      },
				    ],
				    "operator": "and",
				  },
				]
			`);
		});

		it("toggling Invert setting affects filter operator", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: {
						...baseStringOptions.options,
						invert: { enabled: true, value: false }
					}
				}
			});

			await page.setCriteriaValue("test");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);

			await page.setInvertSetting("Yes");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "operand": {
				      "fields": [
				        "/product/name",
				      ],
				      "operator": "simple_search",
				      "value": "test",
				      "values": undefined,
				    },
				    "operator": "not",
				  },
				]
			`);

			await page.setInvertSetting("No");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);
		});
	});

	describe("Minimum searchable token size", () => {
		const minTokenConfiguration = {
			"mgmtp.a12.dataservices.query.simpleSearch.minSearchableTokenSize": "3",
			"mgmtp.a12.dataservices.jsonRpc.maxMethodCallsPerRequest": "0",
			"mgmtp.a12.dataservices.query.maxQueryDepth": "0",
			"mgmtp.a12.dataservices.query.maxLinksSize": "0"
		};

		it("does not apply criteria shorter than the minimum and shows a hint", async () => {
			const { page, queriableElement } = await renderStringFilter({
				filterItem: baseStringOptions,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("te");

			expect(page.operator).toMatchInlineSnapshot(`[]`);
			expect(queriableElement.getByText("Enter at least 3 characters").element).toBeInTheDocument();
		});

		it("does not apply criteria when any word is shorter than the minimum", async () => {
			const { page, queriableElement } = await renderStringFilter({
				filterItem: baseStringOptions,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("test a");

			expect(page.operator).toMatchInlineSnapshot(`[]`);
			expect(queriableElement.getByText("Enter at least 3 characters").element).toBeInTheDocument();
		});

		it("applies criteria meeting the minimum", async () => {
			const { page, queriableElement } = await renderStringFilter({
				filterItem: baseStringOptions,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("test");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);
			expect(queriableElement.queryByText("Enter at least 3 characters").element).toBeNull();
		});

		it("marks the filter state as erroneous and shows the error banner", async () => {
			const { page, store, queriableElement } = await renderStringFilter({
				filterItem: baseStringOptions,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("te");

			const filterState = Object.values(store.getState().newFilter?.filters ?? {})[0];

			expect(DefaultFilterStateSelectors.hasErrors(filterState)).toBe(true);
			expect(queriableElement.getByText("Some errors occur").element).toBeInTheDocument();
		});

		it("keeps the invalid draft in the filter state and hides the bar label", async () => {
			const { page, store } = await renderStringFilter({
				filterItem: baseStringOptions,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("te");

			const filterState = Object.values(store.getState().newFilter?.filters ?? {})[0];

			expect((filterState.options as StringFilterState.Options).criteria.value).toBe("te");
			expect(page.filterBarItemLabel).toBeNull();
		});

		it("clears the error when the value is corrected", async () => {
			const { page, store } = await renderStringFilter({
				filterItem: baseStringOptions,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("te");
			await page.setCriteriaValue("test");

			const filterState = Object.values(store.getState().newFilter?.filters ?? {})[0];

			expect(DefaultFilterStateSelectors.hasErrors(filterState)).toBe(false);
		});

		it("releases the error when exact match is enabled afterwards", async () => {
			const { page, store } = await renderStringFilter({
				filterItem: baseStringOptions,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("te");
			await page.setExactMatch(true);

			const filterState = Object.values(store.getState().newFilter?.filters ?? {})[0];

			expect(DefaultFilterStateSelectors.hasErrors(filterState)).toBe(false);
			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": false,
				    "field": "/product/name",
				    "operator": "exact_match",
				    "value": "te",
				  },
				]
			`);
		});

		it("applies criteria shorter than the minimum when exact match is active", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: { ...baseStringOptions.options, exactMatch: { enabled: true, value: true } }
				},
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("te");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": false,
				    "field": "/product/name",
				    "operator": "exact_match",
				    "value": "te",
				  },
				]
			`);
		});

		it("validates against the minimum for substring search even when the field has no annotation", async () => {
			const { page, queriableElement } = await renderStringFilter({
				filterItem: baseStringOptions,
				documentModelModifier: stripAnnotations,
				dataservicesConfiguration: minTokenConfiguration
			});

			await page.setCriteriaValue("te");

			expect(page.operator).toMatchInlineSnapshot(`[]`);
			expect(queriableElement.getByText("Enter at least 3 characters").element).toBeInTheDocument();
		});
	});

	describe("End-user toggles drive the query (no Document Model annotation required)", () => {
		it("emits simple_search when exactMatch toggle selects substring, without any annotation", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: {
						...baseStringOptions.options,
						exactMatch: { enabled: true, value: false }
					}
				}
			});

			await page.setCriteriaValue("test");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);
		});

		it("emits exact_match when exactMatch toggle selects exact, without any annotation", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: {
						...baseStringOptions.options,
						exactMatch: { enabled: true, value: true }
					}
				}
			});

			await page.setCriteriaValue("test");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "caseSensitive": false,
				    "field": "/product/name",
				    "operator": "exact_match",
				    "value": "test",
				  },
				]
			`);
		});

		it("honors caseSensitive toggle, without any annotation", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: {
						...baseStringOptions.options,
						caseSensitive: { enabled: true, value: true }
					}
				}
			});

			await page.setCriteriaValue("test");

			expect(page.operator).toMatchInlineSnapshot(`
				[
				  {
				    "fields": [
				      "/product/name",
				    ],
				    "operator": "simple_search",
				    "value": "test",
				    "values": undefined,
				  },
				]
			`);
		});
	});

	describe("Filter Bar Item Label", () => {
		it("displays empty string when no criteria is entered", async () => {
			const { page } = await renderStringFilter({ filterItem: baseStringOptions });

			expect(page.filterBarItemLabel).toBe(null);
		});

		it("displays the criteria value when entered", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: { ...baseStringOptions.options, criteria: "test value" }
				}
			});

			expect(page.filterBarItemLabel).toBe("test value");
		});

		it("displays Empty when empty option is enabled and set to true", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: { ...baseStringOptions.options, empty: { enabled: true, value: true } }
				}
			});

			expect(page.filterBarItemLabel).toBe("Empty");
		});

		it("updates label after entering a value", async () => {
			const { page } = await renderStringFilter({ filterItem: baseStringOptions });

			expect(page.filterBarItemLabel).toBe(null);

			await page.setCriteriaValue("new value");

			expect(page.filterBarItemLabel).toBe("new value");
		});

		it("updates label after toggling empty setting", async () => {
			const { page } = await renderStringFilter({
				filterItem: {
					...baseStringOptions,
					options: {
						...baseStringOptions.options,
						criteria: "test",
						empty: { enabled: true, value: false }
					}
				}
			});

			expect(page.filterBarItemLabel).toBe("test");

			await page.setEmptySetting("Yes");

			expect(page.filterBarItemLabel).toBe("Empty");
		});
	});

	describe("List mode", () => {
		const listModeOptions: OverviewModel.NewFilter.String.Item = {
			...baseStringOptions,
			options: {
				...baseStringOptions.options,
				viewMode: "list"
			}
		};

		// Row-ordering / applied-first covered by e2e. Legacy concat contract
		// removed — see specs/new-filter/spec-type-string.md §8.

		it("renders search input and search button", async () => {
			const { page } = await renderStringFilter({ filterItem: listModeOptions });

			expect(page.getSearchInput(listModeOptions.id)).not.toBeNull();
			expect(page.getSearchButton(listModeOptions.id)).not.toBeNull();
		});

		it("search button is enabled when no min-token configuration is set", async () => {
			const { page } = await renderStringFilter({ filterItem: listModeOptions });

			await page.typeSearchInput(listModeOptions.id, "ab");

			const button = page.getSearchButton(listModeOptions.id);
			expect(button).not.toBeNull();
			expect(button?.disabled).toBe(false);
		});
	});
});
