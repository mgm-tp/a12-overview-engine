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

import { Provider } from "react-redux";

import { renderHook } from "@testing-library/react";
import { it, expect, describe } from "vitest";

import {
	type Locale,
	defaultDataFormats,
	type TranslationFinder,
	defaultValueConversion,
	type LocalizedModelText,
	defaultLocalizerFactory,
	type LocalizationTreeMap
} from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import type { Container } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../main/services/localization/index.js";
import { LocalizerHooks } from "../../../main/view/hooks/localizer-hooks.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";
import { deLocale, enLocale, defaultEngineProps } from "../../basic.spec.js";
import { createTestStore } from "../../test-utils.js";
import { PATHS } from "../shared.js";

describe("com.mgmtp.a12.overview-engine.services.localization.internal.localizer-hooks", () => {
	const basicEngineProps = defaultEngineProps;

	function testHook<Hook extends (...args: never[]) => any = (...args: never[]) => any>(
		hook: Hook,
		args: Parameters<Hook>,
		engineProps?: Partial<OverviewEngine.PaginatedProps>,
		locale?: Locale,
		translationSource?: TranslationFinder | LocalizationTreeMap
	): ReturnType<Hook> {
		const currentLocale = locale ?? enLocale;
		const testStore = createTestStore();
		const { result } = renderHook(() => hook(...args), {
			wrapper: ({ children }: Container) => (
				<Provider store={testStore}>
					<LocalizerContext.Provider
						value={{
							locale: currentLocale,
							conversion: defaultValueConversion(defaultDataFormats(currentLocale)),
							dataFormats: defaultDataFormats(currentLocale),
							localizer: defaultLocalizerFactory({
								locale: currentLocale,
								translationSource
							})
						}}>
						<OverviewEngine {...basicEngineProps} {...engineProps}>
							{children}
						</OverviewEngine>
					</LocalizerContext.Provider>
				</Provider>
			)
		});

		return result.current;
	}

	describe("useLocalizedFieldLabel", () => {
		it("should work properly with different locale", () => {
			const localizedFieldLabel = testHook(LocalizerHooks.useLocalizedFieldLabel, []);

			expect(localizedFieldLabel(PATHS.boolean)).toBe("Boolean");
			expect(localizedFieldLabel(PATHS.string)).toBe("String [DM]");
			expect(localizedFieldLabel(PATHS.multiSelect)).toBe("MultiSelect [DM]");

			const localizedFieldGermanLabel = testHook(LocalizerHooks.useLocalizedFieldLabel, [], undefined, deLocale);

			expect(localizedFieldGermanLabel(PATHS.boolean)).toBe("Boolean DE");
			expect(localizedFieldGermanLabel(PATHS.string)).toBe("String DE [DM]");
			expect(localizedFieldGermanLabel(PATHS.multiSelect)).toBe("MultiSelect DE [DM]");
		});
	});

	describe("useLocalizedFieldValue", () => {
		const localizedFieldValue = testHook(LocalizerHooks.useLocalizedFieldValue, []);
		const localizedFieldValueFilterMode = testHook(LocalizerHooks.useLocalizedFieldValue, [{ filterMode: true }]);
		const localizedGermanFieldValue = testHook(LocalizerHooks.useLocalizedFieldValue, [], undefined, deLocale);
		const localizedGermanFieldValueFilterMode = testHook(
			LocalizerHooks.useLocalizedFieldValue,
			[{ filterMode: true }],
			undefined,
			deLocale
		);

		describe("when value cannot be localized", () => {
			it("should throw error with English locale", () => {
				expect(() => localizedFieldValue(PATHS.string, "text")).toThrow();
			});

			it("should throw error with German locale", () => {
				expect(() => localizedGermanFieldValue(PATHS.string, "text")).toThrow();
			});
		});

		describe("when value has enumeration type", () => {
			it("should work properly with English locale", () => {
				const enumTestCases: { input: string; expect: string }[] = [
					{ input: "enum1", expect: "enum1 EN" },
					{ input: "enum2", expect: "enum2 EN" },
					{ input: "enum99", expect: "" }
				];

				enumTestCases.forEach((enumTestCase) => {
					expect(localizedFieldValue(PATHS.enumeration, enumTestCase.input)).toBe(enumTestCase.expect);
				});
			});

			it("should work properly with German locale", () => {
				const enumGermanTestCases: { input: string; expect: string }[] = [
					{ input: "enum1", expect: "enum1 DE" },
					{ input: "enum2", expect: "enum2 DE" },
					{ input: "enum99", expect: "" }
				];

				enumGermanTestCases.forEach((enumGermanTestCase) => {
					expect(localizedGermanFieldValue(PATHS.enumeration, enumGermanTestCase.input)).toBe(
						enumGermanTestCase.expect
					);
				});
			});
		});

		describe("when value has Boolean or Confirm types", () => {
			describe("when document model keys are not defined", () => {
				describe("when user does not override any keys", () => {
					it("should use resource keys with English locale", () => {
						const booleanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "yes" },
							{ input: false, expect: "no" },
							{ input: null, expect: "" }
						];

						const booleanFilterModeTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "Yes" },
							{ input: false, expect: "No" },
							{ input: null, expect: "Empty" }
						];

						const confirmTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "yes" },
							{ input: 2, expect: "yes" },
							{ input: true, expect: "yes" },
							{ input: null, expect: "" }
						];

						const confirmFilterModeTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "Yes" },
							{ input: 2, expect: "Yes" },
							{ input: true, expect: "Yes" },
							{ input: null, expect: "Empty" }
						];

						booleanTestCases.forEach((booleanTestCase) => {
							expect(localizedFieldValue(PATHS.boolean, booleanTestCase.input)).toBe(booleanTestCase.expect);
						});

						booleanFilterModeTestCases.forEach((booleanTestCase) => {
							expect(localizedFieldValueFilterMode(PATHS.boolean, booleanTestCase.input)).toBe(booleanTestCase.expect);
						});

						confirmTestCases.forEach((confirmTestCase) => {
							expect(localizedFieldValue(PATHS.confirm, confirmTestCase.input)).toBe(confirmTestCase.expect);
						});

						confirmFilterModeTestCases.forEach((confirmTestCase) => {
							expect(localizedFieldValueFilterMode(PATHS.confirm, confirmTestCase.input)).toBe(confirmTestCase.expect);
						});
					});

					it("should use resource keys with German locale", () => {
						const booleanGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "ja" },
							{ input: false, expect: "nein" },
							{ input: null, expect: "" }
						];

						const booleanFilterModeGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "Ja" },
							{ input: false, expect: "Nein" },
							{ input: null, expect: "Leer" }
						];

						const confirmGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "ja" },
							{ input: 2, expect: "ja" },
							{ input: true, expect: "ja" },
							{ input: null, expect: "" }
						];

						const confirmFilterModeGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "Ja" },
							{ input: 2, expect: "Ja" },
							{ input: true, expect: "Ja" },
							{ input: null, expect: "Leer" }
						];

						booleanGermanTestCases.forEach((booleanGermanTestCase) => {
							expect(localizedGermanFieldValue(PATHS.boolean, booleanGermanTestCase.input)).toBe(
								booleanGermanTestCase.expect
							);
						});

						booleanFilterModeGermanTestCases.forEach((booleanGermanTestCase) => {
							expect(localizedGermanFieldValueFilterMode(PATHS.boolean, booleanGermanTestCase.input)).toBe(
								booleanGermanTestCase.expect
							);
						});

						confirmGermanTestCases.forEach((confirmGermanTestCase) => {
							expect(localizedGermanFieldValue(PATHS.confirm, confirmGermanTestCase.input)).toBe(
								confirmGermanTestCase.expect
							);
						});

						confirmFilterModeGermanTestCases.forEach((confirmGermanTestCase) => {
							expect(localizedGermanFieldValueFilterMode(PATHS.confirm, confirmGermanTestCase.input)).toBe(
								confirmGermanTestCase.expect
							);
						});
					});
				});

				describe("when user overrides resource key", () => {
					it("should use the configured resource keys with English locale", () => {
						const customEnglishResourceKeys = {
							true: "positive",
							false: "negative",
							null: "none"
						};

						const booleanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "positive" },
							{ input: false, expect: "negative" },
							{ input: null, expect: "none" }
						];

						const confirmTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "positive" },
							{ input: 2, expect: "positive" },
							{ input: true, expect: "positive" },
							{ input: null, expect: "none" }
						];

						const customLocalizedFieldValue = testHook(LocalizerHooks.useLocalizedFieldValue, [], undefined, enLocale, {
							en_US: customEnglishResourceKeys
						});

						booleanTestCases.forEach((booleanTestCase) => {
							expect(customLocalizedFieldValue(PATHS.boolean, booleanTestCase.input)).toBe(booleanTestCase.expect);
						});

						confirmTestCases.forEach((confirmTestCase) => {
							expect(customLocalizedFieldValue(PATHS.confirm, confirmTestCase.input)).toBe(confirmTestCase.expect);
						});
					});

					it("should use the configured resource keys with German locale", () => {
						const customGermanResourceKeys = {
							true: "positive",
							false: "negative",
							null: "keiner"
						};

						const booleanGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "positive" },
							{ input: false, expect: "negative" },
							{ input: null, expect: "keiner" }
						];

						const confirmGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "positive" },
							{ input: 2, expect: "positive" },
							{ input: true, expect: "positive" },
							{ input: null, expect: "keiner" }
						];

						const customLocalizedGermanFieldValue = testHook(
							LocalizerHooks.useLocalizedFieldValue,
							[],
							undefined,
							deLocale,
							{
								de_DE: customGermanResourceKeys
							}
						);

						booleanGermanTestCases.forEach((booleanGermanTestCase) => {
							expect(customLocalizedGermanFieldValue(PATHS.boolean, booleanGermanTestCase.input)).toBe(
								booleanGermanTestCase.expect
							);
						});

						confirmGermanTestCases.forEach((confirmGermanTestCase) => {
							expect(customLocalizedGermanFieldValue(PATHS.confirm, confirmGermanTestCase.input)).toBe(
								confirmGermanTestCase.expect
							);
						});
					});
				});
			});

			describe("when document model keys are defined", () => {
				describe("when only document model keys are defined", () => {
					it("should use document model keys with English locale", () => {
						const customEnglishResourceKeys = {
							documentModel: {
								boolean: { DomainTest: { root: { boolean: { true: "pass", false: "fail", null: "null value" } } } },
								confirm: { DomainTest: { root: { confirm: { true: "pass", null: "unidentified" } } } }
							}
						};

						const booleanEnglishTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "pass" },
							{ input: false, expect: "fail" },
							{ input: null, expect: "null value" }
						];

						const confirmEnglishTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "pass" },
							{ input: 2, expect: "pass" },
							{ input: true, expect: "pass" },
							{ input: null, expect: "unidentified" }
						];

						const customLocalizedFieldValue = testHook(LocalizerHooks.useLocalizedFieldValue, [], undefined, enLocale, {
							en_US: customEnglishResourceKeys
						});

						booleanEnglishTestCases.forEach((booleanEnglishTestCase) => {
							expect(customLocalizedFieldValue(PATHS.boolean, booleanEnglishTestCase.input)).toBe(
								booleanEnglishTestCase.expect
							);
						});

						confirmEnglishTestCases.forEach((confirmEnglishTestCase) => {
							expect(customLocalizedFieldValue(PATHS.confirm, confirmEnglishTestCase.input)).toBe(
								confirmEnglishTestCase.expect
							);
						});
					});

					it("should use document model keys with German locale", () => {
						const customGermanResourceKeys = {
							documentModel: {
								boolean: {
									DomainTest: { root: { boolean: { true: "passieren", false: "scheitern", null: "keine Daten" } } }
								},
								confirm: { DomainTest: { root: { confirm: { true: "passieren", null: "unbekannt" } } } }
							}
						};

						const booleanGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "passieren" },
							{ input: false, expect: "scheitern" },
							{ input: null, expect: "keine Daten" }
						];

						const confirmGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "passieren" },
							{ input: 2, expect: "passieren" },
							{ input: true, expect: "passieren" },
							{ input: null, expect: "unbekannt" }
						];

						const customLocalizedGermanFieldValue = testHook(
							LocalizerHooks.useLocalizedFieldValue,
							[],
							undefined,
							deLocale,
							{
								de_DE: customGermanResourceKeys
							}
						);

						booleanGermanTestCases.forEach((booleanGermanTestCase) => {
							expect(customLocalizedGermanFieldValue(PATHS.boolean, booleanGermanTestCase.input)).toBe(
								booleanGermanTestCase.expect
							);
						});

						confirmGermanTestCases.forEach((confirmGermanTestCase) => {
							expect(customLocalizedGermanFieldValue(PATHS.confirm, confirmGermanTestCase.input)).toBe(
								confirmGermanTestCase.expect
							);
						});
					});
				});

				describe("when resource keys and document model keys are defined", () => {
					it("should use document model keys with English locale", () => {
						const customEnglishResourceKeys = {
							true: "positive",
							false: "negative",
							null: "none",
							documentModel: {
								boolean: { DomainTest: { root: { boolean: { true: "pass", false: "fail", null: "null value" } } } },
								confirm: { DomainTest: { root: { confirm: { true: "pass", null: "unidentified" } } } }
							}
						};

						const booleanEnglishTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "pass" },
							{ input: false, expect: "fail" },
							{ input: null, expect: "null value" }
						];

						const confirmEnglishTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "pass" },
							{ input: 2, expect: "pass" },
							{ input: true, expect: "pass" },
							{ input: null, expect: "unidentified" }
						];

						const customLocalizedFieldValue = testHook(LocalizerHooks.useLocalizedFieldValue, [], undefined, enLocale, {
							en_US: customEnglishResourceKeys
						});

						booleanEnglishTestCases.forEach((booleanEnglishTestCase) => {
							expect(customLocalizedFieldValue(PATHS.boolean, booleanEnglishTestCase.input)).toBe(
								booleanEnglishTestCase.expect
							);
						});

						confirmEnglishTestCases.forEach((confirmEnglishTestCase) => {
							expect(customLocalizedFieldValue(PATHS.confirm, confirmEnglishTestCase.input)).toBe(
								confirmEnglishTestCase.expect
							);
						});
					});

					it("should use document model keys with German locale", () => {
						const customGermanResourceKeys = {
							true: "positiv",
							false: "negativ",
							null: "keiner",
							documentModel: {
								boolean: {
									DomainTest: { root: { boolean: { true: "passieren", false: "scheitern", null: "keine Daten" } } }
								},
								confirm: { DomainTest: { root: { confirm: { true: "passieren", null: "unbekannt" } } } }
							}
						};

						const booleanGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: true, expect: "passieren" },
							{ input: false, expect: "scheitern" },
							{ input: null, expect: "keine Daten" }
						];

						const confirmGermanTestCases: { input: string | number | boolean | null; expect: string }[] = [
							{ input: "text", expect: "passieren" },
							{ input: 2, expect: "passieren" },
							{ input: true, expect: "passieren" },
							{ input: null, expect: "unbekannt" }
						];

						const customLocalizedGermanFieldValue = testHook(
							LocalizerHooks.useLocalizedFieldValue,
							[],
							undefined,
							deLocale,
							{
								de_DE: customGermanResourceKeys
							}
						);

						booleanGermanTestCases.forEach((booleanGermanTestCase) => {
							expect(customLocalizedGermanFieldValue(PATHS.boolean, booleanGermanTestCase.input)).toBe(
								booleanGermanTestCase.expect
							);
						});

						confirmGermanTestCases.forEach((confirmGermanTestCase) => {
							expect(customLocalizedGermanFieldValue(PATHS.confirm, confirmGermanTestCase.input)).toBe(
								confirmGermanTestCase.expect
							);
						});
					});
				});
			});
		});
	});

	describe("useLocalizedResource", () => {
		it("should work properly with exist and non-exist key", () => {
			const localizedResource = testHook(LocalizerHooks.useLocalizedResource, []);

			expect(localizedResource(RESOURCE_KEYS.overviewEngine.filterButton.closeFilter)).toBe("Close filter");
			expect(localizedResource("RESOURCE_KEYS.unknown")).toBe("RESOURCE_KEYS.unknown");
		});

		it("should resolve placeholders when args are provided", () => {
			const localizedResource = testHook(LocalizerHooks.useLocalizedResource, []);

			expect(
				localizedResource(RESOURCE_KEYS.overviewEngine.searchBar.searchButtonMinLengthTitle, {
					count: { type: "plain", value: "3" }
				})
			).toBe("Enter at least 3 characters");
		});
	});

	describe("useLocalizedOverviewElement", () => {
		it("should work properly with exist and non-exist key", () => {
			const texts: LocalizedModelText = [
				{ locale: "en", text: "Column label en" },
				{ locale: "de", text: "Column label de" }
			];
			const keys = ["columns", "label"];

			const localizedOverviewElement = testHook(LocalizerHooks.useLocalizedOverviewElement, []);

			expect(localizedOverviewElement(keys, undefined)).toBe("");
			expect(localizedOverviewElement(keys, texts)).toBe("Column label en");

			const localizedGermanOverviewElement = testHook(
				LocalizerHooks.useLocalizedOverviewElement,
				[],
				undefined,
				deLocale
			);

			expect(localizedGermanOverviewElement(keys, texts)).toBe("Column label de");
		});
	});
});
