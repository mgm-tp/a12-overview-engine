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

import { it, vi, expect, describe } from "vitest";
import { fireEvent } from "@testing-library/react";

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { NumberFilterOptionsView } from "../../../../../main/view/components/filters/options-views/number-filter-options-view.js";

import { deLocale, enLocale, defaultEngineProps } from "../../../../basic.spec.js";
import { render, DataRoles, type QueriableElement } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.number-filter-options-view", () => {
	const onChangeSpy = vi.fn();
	const basicProps: NumberFilterOptionsView.Props = {
		path: [{ elementName: "root" }, { elementName: "integer" }],
		viewName: "Number",
		modelId: undefined,
		onChange: onChangeSpy,
		uiValue: { start: { input: "" }, end: { input: "" } }
	};

	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;

	function setupTest(
		props?: Partial<NumberFilterOptionsView.Props>,
		engineProps?: Partial<OverviewEngine.Props>,
		locale?: Locale
	) {
		return render(
			<NumberFilterOptionsView {...basicProps} {...props} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...basicEngineProps, ...engineProps }
			},
			locale
		);
	}

	function changeInput(wrapper: QueriableElement) {
		const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

		return {
			start: (value: string) => fireEvent.change(inputs.first().element, { target: { value } }),
			end: (value: string) => fireEvent.change(inputs.last().element, { target: { value } })
		};
	}

	describe("onChange", () => {
		describe("when the user enters something in the start input", () => {
			it("calls the given onChange callback with start = input value", () => {
				const wrapper = setupTest();

				changeInput(wrapper).start("4");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toContainEqual({
					filterType: "Number",
					criteria: { start: 4, end: undefined }
				});
			});
		});

		describe("when the user enters something in the end input", () => {
			it("calls the given onChange callback with end = input value", () => {
				const wrapper = setupTest();

				changeInput(wrapper).end("4");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toContainEqual({
					filterType: "Number",
					criteria: { start: undefined, end: 4 }
				});
			});
		});

		describe("when the user enters something in the end input, while start has value", () => {
			it("calls the given onChange callback with current start and new end value", () => {
				const wrapper = setupTest({
					uiValue: { start: { input: "2", value: 2 }, end: { input: "" } }
				});

				changeInput(wrapper).end("4");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toContainEqual({ filterType: "Number", criteria: { start: 2, end: 4 } });
			});
		});

		describe("when the user enters something in the start input, while end has value", () => {
			it("calls the given onChange callback with current end and new start value", () => {
				const wrapper = setupTest({
					uiValue: { start: { input: "" }, end: { input: "4", value: 4 } }
				});

				changeInput(wrapper).start("2");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toContainEqual({ filterType: "Number", criteria: { start: 2, end: 4 } });
			});
		});

		describe("when the user enters not a number in the start input", () => {
			it("call the given onChange callback and shows an error", () => {
				const wrapper = setupTest();

				changeInput(wrapper).start("abc");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toStrictEqual([
					{ filterType: "Number", error: true, modelId: undefined },
					{ start: { errorMessage: "Only numbers are allowed.", input: "abc", value: null }, end: { input: "" } }
				]);
			});
		});

		describe("when the user enters not a number in the end input", () => {
			it("call the given onChange callback and shows an error", () => {
				const wrapper = setupTest();

				changeInput(wrapper).end("abc");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toStrictEqual([
					{ filterType: "Number", error: true, modelId: undefined },
					{ start: { input: "" }, end: { errorMessage: "Only numbers are allowed.", input: "abc", value: null } }
				]);
			});
		});

		describe("when the user enters a bigger start value than end value", () => {
			it("shows an error message box", () => {
				const wrapper = setupTest({
					uiValue: { start: { input: "2", value: 2 }, end: { input: "4", value: 4 } }
				});
				changeInput(wrapper).start("10");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toContainEqual({ filterType: "Number", error: true });
			});
		});

		describe("when the user delete the input", () => {
			it("call the given onChange callback with no criteria", () => {
				const wrapper = setupTest({
					uiValue: { start: { input: "4", value: 4 }, end: { input: "" } }
				});
				changeInput(wrapper).start("");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toStrictEqual([
					{ criteria: undefined, filterType: "Number", modelId: undefined },
					{ end: { input: "" }, start: { input: "", value: null } }
				]);
			});
		});
	});

	describe("clearAll", () => {
		it("resets the filter values to the initial state", () => {
			const wrapper = setupTest({
				uiValue: {
					start: { value: 2, input: "2" },
					end: { value: 4, input: "4" }
				}
			});

			fireEvent.click(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element);

			expect(onChangeSpy).toHaveBeenCalledOnce();
			expect(onChangeSpy.mock.lastCall).toContainEqual({ filterType: "Number" });
		});
	});

	describe("props", () => {
		describe("viewName", () => {
			it("is shown correctly in the title", () => {
				const wrapper = setupTest();

				expect(wrapper.getByText("Number").element).toBeInTheDocument();
			});
		});

		describe("initialFilterOptions", () => {
			describe("given initial filter options", () => {
				it("sets them in the inputs", () => {
					const wrapper = setupTest({ uiValue: { start: { value: 2, input: "2" }, end: { value: 4, input: "4" } } });

					const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

					expect(inputs).toHaveLength(2);
					expect(inputs.first().element).toHaveValue("2");
					expect(inputs.last().element).toHaveValue("4");
				});
			});

			describe("given no initial filterOption", () => {
				it("sets nothing in the inputs", () => {
					const wrapper = setupTest();

					const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

					expect(inputs).toHaveLength(2);
					expect(inputs.first().element).toHaveValue("");
					expect(inputs.last().element).toHaveValue("");
				});
			});
		});

		describe("rangeErrorMessage", () => {
			describe("given bigger start than end", () => {
				it("shows an error message box", () => {
					const wrapper = setupTest({
						uiValue: { start: { input: "10", value: 10 }, end: { input: "4", value: 4 } }
					});

					expect(wrapper.getByDataRole(DataRoles.Messagebox).element).toHaveTextContent(
						en.overviewEngine.filterOptionView.error.startGreaterThanEnd
					);
				});
			});
		});

		describe("disabled", () => {
			describe("given true", () => {
				it("disables the clear button", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: true } });

					expect(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element).toBeDisabled();
				});

				it("disables the inputs", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: true } });

					const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

					expect(inputs).toHaveLength(2);

					expect(inputs.first().element).toBeDisabled();
					expect(inputs.last().element).toBeDisabled();
				});
			});

			describe("given false", () => {
				describe("given all inputs are empty", () => {
					it("disables the clear button", () => {
						const wrapper = setupTest(undefined, { uiState: { disabled: false } });

						expect(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element).toBeDisabled();
					});
				});

				describe("given not all inputs are empty", () => {
					it("enables the clear button", () => {
						const wrapper = setupTest(
							{ uiValue: { start: { input: "123" }, end: { input: "" } } },
							{ uiState: { disabled: false } }
						);

						expect(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element).toBeEnabled();
					});
				});

				it("enables the inputs", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: false } });

					const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

					expect(inputs).toHaveLength(2);
					expect(inputs.first().element).toBeEnabled();
					expect(inputs.last().element).toBeEnabled();
				});
			});
		});

		describe("hideEmptyValueOption", () => {
			it("renders the empty switch by default", () => {
				const wrapper = setupTest();

				expect(wrapper.getByText(en.overviewEngine.filterOptionView.null).element).toBeInTheDocument();
			});

			it("hides the empty switch when true", () => {
				const wrapper = setupTest({ hideEmptyValueOption: true });

				expect(wrapper.queryByText(en.overviewEngine.filterOptionView.null).element).toBeNull();
			});
		});
	});

	describe("removeLeadingZeros", () => {
		function setupOnSubmit(elementName: string, locale: Locale) {
			const wrapper = setupTest({ path: [{ elementName: "root" }, { elementName }] }, undefined, locale);

			return changeInput(wrapper).start;
		}

		type TestCase = [input: string, expectedNextInput: string, expectedNumber: number];

		function testInput(onSubmit: (value: string) => void, testCases: TestCase[]) {
			testCases.forEach(([input, expectedNextInput, expectedNumber], testCaseIndex) => {
				onSubmit(input);

				expect(onChangeSpy.mock.calls[testCaseIndex]).toEqual([
					{ filterType: "Number", criteria: { start: expectedNumber, end: undefined } },
					{ start: { input: expectedNextInput, value: expectedNumber, errorMessage: undefined }, end: { input: "" } }
				]);
			});
		}

		const elementNames = ["integer", "leadingZerosInteger", "decimal", "leadingZerosDecimal"];

		describe("given US locale", () => {
			it("should work properly when element field can be integer or float, and allowed leading zeros or not", () => {
				elementNames.forEach((elementName) => {
					const onSubmit = setupOnSubmit(elementName, enLocale);

					const testCases: TestCase[] = [
						["1020", "1,020", 1020],
						["-1020.0030400", "-1,020.00304", -1020.00304],

						["0", "0", 0],
						["0000", "0", 0],
						["0001020", "1,020", 1020],
						["0,0,,010,20,", "1,020", 1020],

						["0.0", "0", 0],
						["0000.000", "0", 0],
						["0001020.0030400", "1,020.00304", 1020.00304],
						["00,010,20.0030400", "1,020.00304", 1020.00304],

						["-0", "0", 0],
						["-0000", "0", 0],
						["-0001020", "-1,020", -1020],
						["-0,0,,010,20,", "-1,020", -1020],

						["-0.0", "0", 0],
						["-0000.000", "0", 0],
						["-0001020.0030400", "-1,020.00304", -1020.00304],
						["-00,010,20.0030400", "-1,020.00304", -1020.00304]
					];

					testInput(onSubmit, testCases);
				});
			});
		});

		describe("given DE locale", () => {
			it("should work properly when element field can be integer or float, and allowed leading zeros or not", () => {
				elementNames.forEach((elementName) => {
					const onSubmit = setupOnSubmit(elementName, deLocale);

					const testCases: TestCase[] = [
						["1020", "1.020", 1020],
						["-1020,0030400", "-1.020,00304", -1020.00304],

						["0", "0", 0],
						["0000", "0", 0],
						["0001020", "1.020", 1020],
						["0.0..010.20.", "1.020", 1020],

						["0,0", "0", 0],
						["0000,000", "0", 0],
						["0001020,0030400", "1.020,00304", 1020.00304],
						["00.010.20,0030400", "1.020,00304", 1020.00304],

						["-0", "0", 0],
						["-0000", "0", 0],
						["-0001020", "-1.020", -1020],
						["-0.0..010.20.", "-1.020", -1020],

						["-0,0", "0", 0],
						["-0000,000", "0", 0],
						["-0001020,0030400", "-1.020,00304", -1020.00304],
						["-00.010.20,0030400", "-1.020,00304", -1020.00304]
					];

					testInput(onSubmit, testCases);
				});
			});
		});
	});

	describe("existence of suffix for number filter option", () => {
		it("should show suffix in TextAffix component", () => {
			const wrapper = setupTest({
				uiValue: { start: { input: "500", value: 500 }, end: { input: "600", value: 600 } },
				suffix: "USD"
			});

			expect(wrapper.element).toHaveTextContent("USD");
		});
	});
});
