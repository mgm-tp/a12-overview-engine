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

import * as React from "react";
import { format } from "date-fns/format";
import { it, expect, describe } from "vitest";
import { renderHook } from "@testing-library/react";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import { type Container, convertMomentToDateFnsFormat } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	defaultDataFormats,
	type ValueConversion,
	defaultValueConversion
} from "@com.mgmtp.a12.utils/utils-localization";

import { useConverter } from "../../../../main/services/converter/internal/shared.js";
import { createDocumentModelService } from "../../../../main/models/internal/document-model-service.js";

import { PATHS, type DocumentValue } from "../../shared.js";
import { deLocale, enLocale } from "../../../basic.spec.js";
import { getDocumentModel } from "../../../setup/models.js";

describe("com.mgmtp.a12.overview-engine.services.createDefaultConverter.formatValue", () => {
	const basicDate = new Date(Date.UTC(2020, 1, 15, 17, 45, 14));
	const seeds: DocumentValue[] = [-3.14, 0, "0", "abc", "-1", true, false, basicDate, null];
	const nonNumberValues = seeds.filter((v) => typeof v !== "number" && v !== null);
	const nonDateValues = seeds.filter((v) => !(v instanceof Date) && v !== null);

	async function setupConverter(locale = enLocale, conversion?: ValueConversion) {
		const valueConversion = conversion ?? defaultValueConversion(defaultDataFormats(locale));
		const documentModel = await getDocumentModel("unit-test", "DomainTest");

		return renderHook(() => useConverter(createDocumentModelService(documentModel)), {
			wrapper: ({ children }: Container) =>
				React.createElement(DefaultLocalizerContextProvider, { locale, valueConversion }, children)
		}).result.current;
	}

	const invalidMessage = /is not a valid element/;

	type EnglishExpectedResult = string;
	type GermanExpectedResult = string;
	type UnknownLocaleExpectedResult = string;

	describe("given a group path", async () => {
		it("should throw an invalid message", async () => {
			const converter = await setupConverter();
			expect(() => converter.formatValue(PATHS.multiSelect, 1)).toThrow(invalidMessage);
		});
	});

	describe("given a field path", () => {
		describe("when the passed value is not a JSONPrimitive", () => {
			it("should throw an invalid message", async () => {
				const converter = await setupConverter();

				expect(() => converter.formatValue(PATHS.string, {})).toThrow(invalidMessage);
			});
		});

		describe("when the field is convertible", () => {
			function testConvertibleField(params: {
				fieldType: string;
				validCases: [DocumentValue, EnglishExpectedResult, GermanExpectedResult][];
				invalidCases: DocumentValue[];
			}) {
				const { fieldType, validCases, invalidCases } = params;

				describe(`when the field is ${fieldType}`, () => {
					describe(`when the passed value is ${fieldType} or null`, () => {
						it("should return the pi-related result, regardless of the locale", () => {
							validCases.forEach(([value, ...expectedResults]) => {
								[enLocale, deLocale].forEach(async (locale, piIndex) => {
									const converter = await setupConverter(locale);

									const result = converter.formatValue(PATHS[fieldType], value);

									expect(result).toBe(expectedResults[piIndex]);
								});
							});
						});
					});

					describe(`when the passed value is not a ${fieldType} nor null`, () => {
						it("should throw an error", () => {
							invalidCases.forEach(async (value) => {
								const converter = await setupConverter();

								expect(() => converter.formatValue(PATHS[fieldType], value)).toThrow();
							});
						});
					});
				});
			}

			testConvertibleField({
				fieldType: "number",
				validCases: [
					[-1024.4096, "-1,024.4096", "-1.024,4096"],
					[12.34e5, "1,234,000", "1.234.000"],
					[0.0, "0", "0"],
					[-0.0, "0", "0"],
					[null, "", ""]
				],
				invalidCases: nonNumberValues
			});

			testConvertibleField({
				fieldType: "dateTime",
				validCases: [
					[basicDate, "02/15/2020 05:45 PM", "15.02.2020 17:45"],
					[null, "", ""]
				],
				invalidCases: nonDateValues
			});

			testConvertibleField({
				fieldType: "time",
				validCases: [
					[basicDate, "05:45 PM", "17:45"],
					[null, "", ""]
				],
				invalidCases: nonDateValues
			});

			testConvertibleField({
				fieldType: "date",
				validCases: [
					[basicDate, "02/15/2020", "15.02.2020"],
					[null, "", ""]
				],
				invalidCases: nonDateValues
			});
		});

		describe("when the field is localizable", () => {
			function testLocalizableField(params: { fieldType: string; value: DocumentValue }) {
				const { fieldType, value } = params;

				describe(`when the field is ${fieldType}`, () => {
					it("should throw an error", async () => {
						const converter = await setupConverter();

						expect(() => converter.formatValue(PATHS[fieldType], value)).toThrow(/should be formatted by a localizer/);
					});
				});
			}

			testLocalizableField({ fieldType: "boolean", value: true });
			testLocalizableField({ fieldType: "enumeration", value: "enum1" });
			testLocalizableField({ fieldType: "confirm", value: false });
		});

		describe("when the field is belong the other group", () => {
			describe("when the field is StringType", () => {
				it("should return the non-null value as it, or empty string if null, regardless of the presentationInformation and locale", () => {
					const testCases: [DocumentValue, EnglishExpectedResult, GermanExpectedResult, UnknownLocaleExpectedResult][] =
						[
							["", "", "", ""],
							["0", "0", "0", "0"],
							["null", "null", "null", "null"],
							["false", "false", "false", "false"],

							[null, "", "", ""]
						];

					testCases.forEach(([value, ...expectedResults]) => {
						[enLocale, deLocale].forEach(async (locale, localeIndex) => {
							const converter = await setupConverter(locale);

							const result = converter.formatValue(PATHS.string, value);

							expect(result).toBe(expectedResults[localeIndex]);
						});
					});
				});

				it("should throw an error for non-string values", async () => {
					[0, -3.14, true, false].forEach(async (value) => {
						const converter = await setupConverter();

						expect(() => converter.formatValue(PATHS.string, value)).toThrow(/is not a string/);
					});
				});
			});
		});
	});

	describe("custom conversion", () => {
		const locale = { language: "en", country: "US" };
		const targetFieldPath = [{ elementName: "root" }, { elementName: "date" }];

		const dataFormats = defaultDataFormats(locale);
		const defaultConversion = defaultValueConversion(dataFormats);

		const conversion: ValueConversion = {
			...defaultConversion,
			formatValue(value, outputFormat) {
				if (
					value instanceof Date &&
					outputFormat.modelId === "DomainTest" &&
					outputFormat.modelPath &&
					ModelPath.equal(outputFormat.modelPath, targetFieldPath)
				) {
					// below is a date format using moment's format, to use with date-fns we can use the widgets utility
					return format(value, convertMomentToDateFnsFormat("dd MMM YYYY"));
				}

				return defaultConversion.formatValue(value, outputFormat);
			}
		};

		it("should format date value according to custom conversion logic", async () => {
			const converter = await setupConverter(locale, conversion);

			const dateValue = new Date(Date.UTC(2021, 10, 5));
			const formattedValue = converter.formatValue(targetFieldPath, dateValue);

			expect(formattedValue).toBe("Fri Nov 2021");
		});
	});
});
