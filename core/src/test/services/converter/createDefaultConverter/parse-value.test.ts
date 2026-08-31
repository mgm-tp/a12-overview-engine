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

import { renderHook } from "@testing-library/react";
import { it, expect, describe } from "vitest";

import {
	defaultDataFormats,
	defaultValueConversion,
	type ValueConversionConfig
} from "@com.mgmtp.a12.utils/utils-localization";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import type { Container } from "@com.mgmtp.a12.widgets/widgets-core";

import { createDocumentModelService } from "../../../../main/models/internal/document-model-service.js";
import { useConverter } from "../../../../main/services/converter/internal/converter.js";
import { deLocale, enLocale } from "../../../basic.spec.js";
import { getDocumentModel } from "../../../setup/models.js";
import { PATHS, type DocumentValue } from "../../shared.js";

describe("com.mgmtp.a12.overview-engine.services.createDefaultConverter.parseValue", () => {
	type UIValue = string;

	async function setupConverter(locale = enLocale) {
		const valueConversion = defaultValueConversion(defaultDataFormats(locale));
		const documentModel = await getDocumentModel("unit-test", "DomainTest");

		return renderHook(() => useConverter(createDocumentModelService(documentModel)), {
			wrapper: ({ children }: Container) =>
				React.createElement(DefaultLocalizerContextProvider, { locale, valueConversion }, children)
		}).result.current;
	}

	describe("given a group", () => {
		it("should throw an error", async () => {
			const converter = await setupConverter();
			const callback = () => converter.parseValue(PATHS.multiSelect, "1");

			expect(callback).toThrow(/is not a valid element/);
		});
	});

	describe("given a field path", () => {
		function testField(params: {
			fieldType: string;
			validCases: [UIValue, UIValue, DocumentValue][];
			invalidCases?: UIValue[];
			options?: { singleDate?: "only" };
		}) {
			const { fieldType, validCases, invalidCases, options } = params;

			const defaultOptions = (o: ValueConversionConfig): ValueConversionConfig =>
				o.type === "DateRangeType" ? { ...o, ...options } : o;

			describe(`when the field is ${fieldType}`, () => {
				describe(`when the passed value is ${fieldType} or null`, () => {
					it("should return the pi-related result, regardless of the locale", () => {
						validCases.forEach(async ([enUIValue, deUIValue, expectedResult]) => {
							const converter = await setupConverter(enLocale);
							expect(converter.parseValue(PATHS[fieldType], enUIValue, defaultOptions)).toEqual({
								value: expectedResult
							});
							const deConverter = await setupConverter(deLocale);

							expect(deConverter.parseValue(PATHS[fieldType], deUIValue, defaultOptions)).toEqual({
								value: expectedResult
							});
						});
					});
				});

				describe("when the passed value is not right format", () => {
					it("should return an object that has an error message string", () => {
						invalidCases?.forEach(async (value) => {
							const converter = await setupConverter();
							const callback = () => converter.parseValue(PATHS[fieldType], value, defaultOptions);

							expect(callback).not.toThrow();
							expect(callback().error).toBeDefined();
						});
					});
				});
			});
		}

		describe("when the field is convertible", () => {
			testField({
				fieldType: "number",
				validCases: [
					["", "", null],
					["-0,", "-0.", -0],
					["-0,0.0", "-0.0.0.0,00", -0],
					["-00,001,0,2,4.4096", "-00.001.0.2.4,4096", -1024.4096],
					["1.", "1,", 1]
				],
				invalidCases: ["1e2", "1.234.5", "0xff", "a12", "12a"]
			});

			testField({
				fieldType: "date",
				validCases: [
					["02/15/2020", "15.02.2020", new Date("2020-02-15T00:00:00Z")],
					["02/05/2020", "05.02.2020", new Date("2020-02-05T00:00:00Z")]
				],
				invalidCases: [
					"2/5/2020",
					"5.2.2020",
					"02-15-2020",
					"02.15.2020",
					"00/15/20",
					"13/02/2020",
					"02/00/2020",
					"02/30/2020",
					"02/15/20",
					"22/5/2020",
					"1",
					"-3.4",
					"24/12"
				]
			});

			testField({
				fieldType: "dateTime",
				validCases: [["02/15/2020 01:45 PM", "15.02.2020 13:45", new Date("2020-02-15T13:45:00Z")]],
				invalidCases: [
					"02/15/2020 01:45",
					"02/15/20 01:45 PM",
					"2/15/2020 01:45 PM",
					"02/5/2020 01:45 PM",
					"15/02/2020 1:45 PM",
					"02/15/2020 01:0 PM",
					"02/15/2020 01:45 pm",
					"02-15-2020 01:45 PM",
					"02/30/2020 01:45 PM",
					"15/02/2020 01:45 PM",
					"02/15/2020 13:45 PM",
					"02/15/2020 01:60 PM",
					"02/15/2020 01:45:04 PM"
				]
			});

			testField({
				fieldType: "time",
				validCases: [["11:45 PM", "23:45", new Date("1970-01-01T23:45:00Z")]],
				invalidCases: ["2:45 PM", "13:45 PM", "12:4 PM", "12:60 PM", " 12:45 PM", "12:45 PM ", "12:45 pm"]
			});

			testField({
				fieldType: "dateRange",
				validCases: [
					["01/01-12/12", "01.01-12.12", [new Date("2000-01-01T00:00:00.000Z"), new Date("2000-12-12T00:00:00.000Z")]]
				],
				invalidCases: ["01/01-", "-01.01", "abc"]
			});

			testField({
				fieldType: "dateRange",
				validCases: [
					["10/11", "11.10", new Date("2000-10-11T00:00:00.000Z")],
					["01/01", "01.01", new Date("2000-01-01T00:00:00.000Z")]
				],
				invalidCases: ["01/01-", "-01.01", "01/01-12/12", "01.01-12.12"],
				options: { singleDate: "only" }
			});
		});

		describe("when the field is localizable", () => {
			testField({
				fieldType: "boolean",
				validCases: [
					["true", "true", true],
					["false", "false", false],
					["yes", "ja", null],
					["null", "null", null]
				]
			});

			testField({
				fieldType: "confirm",
				validCases: [
					["true", "true", true],
					["false", "false", null],
					["null", "null", null],
					["", "", null]
				]
			});

			testField({
				fieldType: "enumeration",
				validCases: [
					["enum1", "enum1", "enum1"],
					["enum2", "enum2", "enum2"]
				]
			});
		});

		describe("when the field is belong the other groups", () => {
			describe("when the field is StringType", () => {
				it("should return the non-empty string value as it", () => {
					const validCases: [UIValue, DocumentValue][] = [
						["0", "0"],
						["null", "null"],
						["false", "false"],
						["-3.14", "-3.14"],
						["", ""]
					];

					validCases.forEach(([value, expectedResult]) => {
						[enLocale, deLocale].forEach(async (locale) => {
							const converter = await setupConverter(locale);
							const result = converter.parseValue(PATHS.string, value);

							expect(result).toEqual({ value: expectedResult });
						});
					});
				});
			});
		});
	});
});
