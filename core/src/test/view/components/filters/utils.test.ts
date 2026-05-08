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
import { it, expect, describe } from "vitest";
import { renderHook } from "@testing-library/react";

import { type Container } from "@com.mgmtp.a12.widgets/widgets-core";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import { type Locale, type DataFormats, defaultDataFormats } from "@com.mgmtp.a12.utils/utils-localization";

import { useDateTimeFormatString } from "../../../../main/view/components/filters/utils.js";

import { deLocale, enLocale } from "../../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.utils", () => {
	describe("useDateTimeFormatString", () => {
		function setupHook(locale: Locale = enLocale, customDataFormats?: Partial<DataFormats>) {
			const dataFormats = {
				...defaultDataFormats(locale),
				...customDataFormats
			};

			return renderHook(() => useDateTimeFormatString(), {
				wrapper: ({ children }: Container) =>
					React.createElement(DefaultLocalizerContextProvider, { locale, dataFormats }, children)
			}).result.current;
		}

		describe("with default English locale (DAY_MONTH_YEAR)", () => {
			it("should return correct format for 'date' view", () => {
				const getFormatString = setupHook(enLocale);
				expect(getFormatString("date")).toBe("MM/dd/yyyy");
			});

			it("should return correct format for 'time' view", () => {
				const getFormatString = setupHook(enLocale);
				expect(getFormatString("time")).toBe("hh:mm a");
			});

			it("should return correct format for 'year' view", () => {
				const getFormatString = setupHook(enLocale);
				expect(getFormatString("year")).toBe("yyyy");
			});

			it("should return correct format for 'monthYear' view", () => {
				const getFormatString = setupHook(enLocale);
				expect(getFormatString("monthYear")).toBe("MM/yyyy");
			});
		});

		describe("with German locale (DAY_MONTH_YEAR)", () => {
			it("should return correct format for 'date' view", () => {
				const getFormatString = setupHook(deLocale);
				expect(getFormatString("date")).toBe("dd.MM.yyyy");
			});

			it("should return correct format for 'monthYear' view", () => {
				const getFormatString = setupHook(deLocale);
				expect(getFormatString("monthYear")).toBe("MM.yyyy");
			});
		});

		describe("with custom date fragment ordering (YEAR_DAY_MONTH)", () => {
			const customFormats = {
				dateFragmentOrdering: "YEAR_DAY_MONTH" as const,
				dateSeparator: "-"
			};

			it("should return correct format for 'date' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("date")).toBe("yyyy-dd-MM");
			});

			it("should return correct format for 'monthYear' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("monthYear")).toBe("yyyy-MM");
			});

			it("should return correct format for 'time' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("time")).toBe("hh:mm a");
			});

			it("should return correct format for 'year' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("year")).toBe("yyyy");
			});
		});

		describe("with custom date fragment ordering (MONTH_DAY_YEAR)", () => {
			const customFormats = {
				dateFragmentOrdering: "MONTH_DAY_YEAR" as const,
				dateSeparator: "/"
			};

			it("should return correct format for 'date' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("date")).toBe("MM/dd/yyyy");
			});

			it("should return correct format for 'monthYear' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("monthYear")).toBe("MM/yyyy");
			});
		});

		describe("with custom date fragment ordering (YEAR_MONTH_DAY)", () => {
			const customFormats = {
				dateFragmentOrdering: "YEAR_MONTH_DAY" as const,
				dateSeparator: "-"
			};

			it("should return correct format for 'date' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("date")).toBe("yyyy-MM-dd");
			});

			it("should return correct format for 'monthYear' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("monthYear")).toBe("yyyy-MM");
			});
		});

		describe("with custom time format", () => {
			it("should return custom time format for 'time' view", () => {
				const getFormatString = setupHook(enLocale, { timeFormat: "hh:mm a" });
				expect(getFormatString("time")).toBe("hh:mm a");
			});
		});

		describe("with all custom formats", () => {
			const customFormats = {
				dateFragmentOrdering: "YEAR_MONTH_DAY" as const,
				dateSeparator: "/",
				timeFormat: "HH:mm:ss"
			};

			it("should return correct format for 'date' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("date")).toBe("yyyy/MM/dd");
			});

			it("should return correct format for 'monthYear' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("monthYear")).toBe("yyyy/MM");
			});

			it("should return correct format for 'time' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("time")).toBe("HH:mm:ss");
			});

			it("should return correct format for 'year' view", () => {
				const getFormatString = setupHook(enLocale, customFormats);
				expect(getFormatString("year")).toBe("yyyy");
			});
		});

		describe("edge cases", () => {
			it("should throw error for invalid selectedView", () => {
				const getFormatString = setupHook(enLocale);
				// @ts-expect-error - Testing invalid input
				expect(() => getFormatString("invalid")).toThrow("Invalid selectedView invalid");
			});

			it("should handle empty data formats with fallback to defaults", () => {
				const getFormatString = setupHook(enLocale, {});
				expect(getFormatString("date")).toBe("MM/dd/yyyy");
			});

			it("should handle unsupported locale with fallback to English", () => {
				const getFormatString = setupHook({ language: "fr", country: "FR" });
				// Should fallback to English default (DAY_MONTH_YEAR)
				expect(getFormatString("date")).toBe("MM/dd/yyyy");
			});
		});

		describe("monthYear format with DAY removal", () => {
			it("should remove DAY from the beginning (DAY_MONTH_YEAR)", () => {
				const getFormatString = setupHook(enLocale, {
					dateFragmentOrdering: "DAY_MONTH_YEAR",
					dateSeparator: "."
				});
				expect(getFormatString("monthYear")).toBe("MM.yyyy");
			});

			it("should remove DAY from the middle (YEAR_DAY_MONTH)", () => {
				const getFormatString = setupHook(enLocale, {
					dateFragmentOrdering: "YEAR_DAY_MONTH",
					dateSeparator: "-"
				});
				expect(getFormatString("monthYear")).toBe("yyyy-MM");
			});

			it("should remove DAY from the middle (MONTH_DAY_YEAR)", () => {
				const getFormatString = setupHook(enLocale, {
					dateFragmentOrdering: "MONTH_DAY_YEAR",
					dateSeparator: "/"
				});
				expect(getFormatString("monthYear")).toBe("MM/yyyy");
			});

			it("should remove DAY from the end (YEAR_MONTH_DAY)", () => {
				const getFormatString = setupHook(enLocale, {
					dateFragmentOrdering: "YEAR_MONTH_DAY",
					dateSeparator: "-"
				});
				expect(getFormatString("monthYear")).toBe("yyyy-MM");
			});
		});
	});
});
