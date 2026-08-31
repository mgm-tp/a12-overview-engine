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

import { RESOURCE_KEYS, LocalizableFactory } from "../../../main/services/localization/index.js";
import { defaultEngineProps } from "../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.services.localization.internal.localizable-factory", () => {
	const basicEngineProps = defaultEngineProps;

	describe("createResourceLocalizables", () => {
		describe("when given an existing resource key", () => {
			it("should resolve the resource properly", () => {
				expect(
					LocalizableFactory.createResourceLocalizables(RESOURCE_KEYS.overviewEngine.filterButton.closeFilter)
				).toEqual([
					{
						args: undefined,
						defaults: { de: "Filter schließen", en: "Close filter" },
						key: "overviewEngine.filterButton.closeFilter"
					},
					{
						args: undefined,
						defaults: { de: "overviewEngine.filterButton.closeFilter", en: "overviewEngine.filterButton.closeFilter" },
						key: "overviewEngine.filterButton.closeFilter"
					}
				]);
			});
		});

		describe("when given an unknown key", () => {
			it("should not be able to resolve", () => {
				expect(LocalizableFactory.createResourceLocalizables("unknown.resource")).toEqual([
					{ args: undefined, defaults: { de: undefined, en: undefined }, key: "unknown.resource" },
					{ args: undefined, defaults: { de: "unknown.resource", en: "unknown.resource" }, key: "unknown.resource" }
				]);
			});
		});
	});

	describe("createOverviewElementLocalizables", () => {
		it("should contain proper prefixes", () => {
			expect(
				LocalizableFactory.createOverviewElementLocalizables(
					["columns", "label"],
					[
						{ locale: "en", text: "label en" },
						{ locale: "de_DE", text: "label [de_DE]" }
					],
					"product"
				)
			).toEqual([
				{
					args: undefined,
					defaults: { de_DE: "label [de_DE]", en: "label en" },
					key: "uiModel.product.columns.label"
				}
			]);
		});

		it("should contain empty defaults if texts are undefined", () => {
			expect(LocalizableFactory.createOverviewElementLocalizables(["columns", "label"], undefined, "product")).toEqual([
				{ args: undefined, defaults: {}, key: "uiModel.product.columns.label" }
			]);
		});
	});

	describe("createFieldLabelLocalizables", () => {
		it("should resolve field elements properly", () => {
			expect(
				LocalizableFactory.createFieldLabelLocalizables(
					[{ elementName: "root" }, { elementName: "string" }],
					basicEngineProps.documentModel
				)
			).toEqual([
				{
					args: undefined,
					defaults: { de: "String DE [DM]", en: "String [DM]" },
					key: "documentModel.label.DomainTest.root.string"
				}
			]);
		});

		it("should resolve multi-select group properly", () => {
			expect(
				LocalizableFactory.createFieldLabelLocalizables(
					[{ elementName: "root" }, { elementName: "multiSelectGroup" }],
					basicEngineProps.documentModel
				)
			).toEqual([
				{
					args: undefined,
					defaults: { de: "MultiSelect DE [DM]", en: "MultiSelect [DM]" },
					key: "documentModel.label.DomainTest.root.multiSelectGroup"
				}
			]);
		});

		it("should throw an error for attachment group", () => {
			expect(() =>
				LocalizableFactory.createFieldLabelLocalizables(
					[{ elementName: "root" }, { elementName: "attachment" }],
					basicEngineProps.documentModel
				)
			).toThrow(/cannot be localized/);
		});
	});

	describe("createFieldValueLocalizables", () => {
		it("should throw an error for group element", () => {
			expect(() =>
				LocalizableFactory.createFieldValueLocalizables(
					false,
					[{ elementName: "root" }, { elementName: "multiSelectGroup" }],
					basicEngineProps.documentModel
				)
			).toThrow(/cannot be localized/);
		});

		it("should throw an error for non-localizable field element", () => {
			expect(() =>
				LocalizableFactory.createFieldValueLocalizables(
					false,
					[{ elementName: "root" }, { elementName: "decimal" }],
					basicEngineProps.documentModel
				)
			).toThrow();
		});

		const booleanTestCases = [
			{
				value: false,
				filterMode: undefined,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.boolean.DomainTest.root.boolean.false"
					},
					{ args: undefined, defaults: { de: "nein", en: "no" }, key: "false" },
					{
						args: undefined,
						defaults: { de: "false", en: "false" },
						key: "documentModel.boolean.DomainTest.root.boolean.false"
					}
				]
			},
			{
				value: false,
				filterMode: true,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.boolean.DomainTest.root.boolean.false"
					},
					{ args: undefined, defaults: { de: "Nein", en: "No" }, key: "overviewEngine.filterOptionView.false" },
					{
						args: undefined,
						defaults: { de: "false", en: "false" },
						key: "documentModel.boolean.DomainTest.root.boolean.false"
					}
				]
			},
			{
				value: true,
				filterMode: undefined,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.boolean.DomainTest.root.boolean.true"
					},
					{ args: undefined, defaults: { de: "ja", en: "yes" }, key: "true" },
					{
						args: undefined,
						defaults: { de: "true", en: "true" },
						key: "documentModel.boolean.DomainTest.root.boolean.true"
					}
				]
			},
			{
				value: true,
				filterMode: true,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.boolean.DomainTest.root.boolean.true"
					},
					{ args: undefined, defaults: { de: "Ja", en: "Yes" }, key: "overviewEngine.filterOptionView.true" },
					{
						args: undefined,
						defaults: { de: "true", en: "true" },
						key: "documentModel.boolean.DomainTest.root.boolean.true"
					}
				]
			},
			{
				value: null,
				filterMode: undefined,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.boolean.DomainTest.root.boolean.null"
					},
					{ args: undefined, defaults: { de: "", en: "" }, key: "null" },
					{
						args: undefined,
						defaults: { de: "null", en: "null" },
						key: "documentModel.boolean.DomainTest.root.boolean.null"
					}
				]
			},
			{
				value: null,
				filterMode: true,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.filter.DomainTest.root.boolean.null"
					},
					{
						args: undefined,
						defaults: { de: "Leer", en: "Empty" },
						key: "overviewEngine.filterOptionView.null"
					},
					{
						args: undefined,
						defaults: { de: "null", en: "null" },
						key: "documentModel.filter.DomainTest.root.boolean.null"
					}
				]
			}
		];

		booleanTestCases.forEach((testCase) => {
			it(`should resolve properly for boolean ${testCase.value} and filterMode is ${testCase.filterMode}`, () => {
				expect(
					LocalizableFactory.createFieldValueLocalizables(
						testCase.value,
						[{ elementName: "root" }, { elementName: "boolean" }],
						basicEngineProps.documentModel,
						{ filterMode: testCase.filterMode }
					)
				).toEqual(testCase.expected);
			});
		});

		const confirmTestCases = [
			{
				value: true,
				filterMode: undefined,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.confirm.DomainTest.root.confirm.true"
					},
					{ args: undefined, defaults: { de: "ja", en: "yes" }, key: "true" },
					{
						args: undefined,
						defaults: { de: "true", en: "true" },
						key: "documentModel.confirm.DomainTest.root.confirm.true"
					}
				]
			},
			{
				value: true,
				filterMode: true,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.confirm.DomainTest.root.confirm.true"
					},
					{ args: undefined, defaults: { de: "Ja", en: "Yes" }, key: "overviewEngine.filterOptionView.true" },
					{
						args: undefined,
						defaults: { de: "true", en: "true" },
						key: "documentModel.confirm.DomainTest.root.confirm.true"
					}
				]
			},
			{
				value: null,
				filterMode: undefined,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.confirm.DomainTest.root.confirm.null"
					},
					{ args: undefined, defaults: { de: "", en: "" }, key: "null" },
					{
						args: undefined,
						defaults: { de: "null", en: "null" },
						key: "documentModel.confirm.DomainTest.root.confirm.null"
					}
				]
			},
			{
				value: null,
				filterMode: true,
				expected: [
					{
						args: undefined,
						defaults: { de: undefined, en: undefined },
						key: "documentModel.filter.DomainTest.root.confirm.null"
					},
					{
						args: undefined,
						defaults: { de: "Leer", en: "Empty" },
						key: "overviewEngine.filterOptionView.null"
					},
					{
						args: undefined,
						defaults: { de: "null", en: "null" },
						key: "documentModel.filter.DomainTest.root.confirm.null"
					}
				]
			}
		];
		confirmTestCases.forEach((testCase) => {
			it(`should resolve properly for confirm ${testCase.value} and filterMode is ${testCase.filterMode}`, () => {
				expect(
					LocalizableFactory.createFieldValueLocalizables(
						testCase.value,
						[{ elementName: "root" }, { elementName: "confirm" }],
						basicEngineProps.documentModel,
						{ filterMode: testCase.filterMode }
					)
				).toEqual(testCase.expected);
			});
		});

		it("should resolve properly for enumeration field", () => {
			expect(
				LocalizableFactory.createFieldValueLocalizables(
					"enum1",
					[{ elementName: "root" }, { elementName: "enumeration" }],
					basicEngineProps.documentModel
				)
			).toEqual([
				{
					args: undefined,
					defaults: { de: "enum1 DE", en: "enum1 EN" },
					key: "documentModel.enumValue.DomainTest.root.enumeration.enum1"
				},
				{
					args: undefined,
					defaults: { de: "enum1", en: "enum1" },
					key: "documentModel.enumValue.DomainTest.root.enumeration.enum1"
				}
			]);

			expect(
				LocalizableFactory.createFieldValueLocalizables(
					"enum99",
					[{ elementName: "root" }, { elementName: "enumeration" }],
					basicEngineProps.documentModel
				)
			).toEqual([
				{
					args: undefined,
					defaults: { de: "", en: "" },
					key: "documentModel.enumValue.DomainTest.root.enumeration.___EMPTY_OPTION___"
				}
			]);
		});
	});

	describe("createTextsLocalizable", () => {
		it("should resolve properly", () => {
			expect(
				LocalizableFactory.createTextsLocalizable(
					["model", "button", "label"],
					[
						{ locale: "en", text: "button label" },
						{ locale: "de_DE", text: "button label [de_DE]" }
					]
				)
			).toEqual({
				args: undefined,
				defaults: { de_DE: "button label [de_DE]", en: "button label" },
				key: "model.button.label"
			});

			expect(LocalizableFactory.createTextsLocalizable(["model", "button", "label"], undefined)).toEqual({
				args: undefined,
				defaults: {},
				key: "model.button.label"
			});
		});
	});

	describe("createResourceLocalizable", () => {
		it("should resolve properly", () => {
			expect(
				LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.overviewEngine.filterButton.closeFilter)
			).toEqual({
				args: undefined,
				defaults: { de: "Filter schließen", en: "Close filter" },
				key: "overviewEngine.filterButton.closeFilter"
			});

			expect(
				LocalizableFactory.createResourceLocalizable(RESOURCE_KEYS.overviewEngine.filterButton.closeFilter, {
					aKey: { value: "aValue", type: "plain" }
				})
			).toEqual({
				args: { aKey: { type: "plain", value: "aValue" } },
				defaults: { de: "Filter schließen", en: "Close filter" },
				key: "overviewEngine.filterButton.closeFilter"
			});
		});
	});

	describe("createSingleTextLocalizable", () => {
		it("should resolve properly", () => {
			expect(LocalizableFactory.createSingleTextLocalizable(["model", "values", "false"], "false")).toEqual({
				args: undefined,
				defaults: { de: "false", en: "false" },
				key: "model.values.false"
			});
		});
	});
});
