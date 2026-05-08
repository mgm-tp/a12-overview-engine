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
import { en } from "../../../../../main/services/localization/internal/shared.js";
import { SectionType } from "../../../../../main/view/components/filters/options-views/section-template.js";
import { TimeFilterOptionsView } from "../../../../../main/view/components/filters/options-views/time-filter-options-view.js";

import { getDocumentModel } from "../../../../setup/models.js";
import { deLocale, enLocale, defaultEngineProps } from "../../../../basic.spec.js";
import { render, DataRoles, type QueriableElement } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.time-filter-options-view", () => {
	const onChangeSpy = vi.fn();
	const viewName = "Time";

	const basicProp: TimeFilterOptionsView.Props = {
		path: [{ elementName: "root" }, { elementName: "time" }],
		viewName,
		modelId: "DomainTest",
		onChange: onChangeSpy,
		uiValue: { start: { input: "" }, end: { input: "" } }
	};

	async function createEngineProps(dirName: string, documentModelName: string): Promise<OverviewEngine.Props> {
		return { ...defaultEngineProps, documentModel: await getDocumentModel(dirName, documentModelName) };
	}

	async function setupTest(
		props?: Partial<TimeFilterOptionsView.Props>,
		engineProps?: Partial<OverviewEngine.Props>,
		locale?: Locale,
		asBaseElement = false
	) {
		return render(
			<TimeFilterOptionsView {...basicProp} {...props} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...(await createEngineProps("unit-test", "DomainTest")), ...engineProps },
				asBaseElement
			},
			locale
		);
	}

	function changeInput(wrapper: QueriableElement): Record<SectionType, (value: string) => void> {
		const createFireEvent = (sectionType: SectionType) => (value: string) => {
			const func = sectionType === SectionType.START ? "first" : "last";
			fireEvent.change(
				wrapper.getAllByDataRole(DataRoles.TimePicker.Input)[func]().getByDataRole(DataRoles.Textline.Input).element,
				{ target: { value } }
			);
		};

		return { start: createFireEvent(SectionType.START), end: createFireEvent(SectionType.END) };
	}

	describe("onChange", () => {
		describe("when the user enters something in the start input", () => {
			it("calls the given onChange callback with start = input value", async () => {
				const wrapper = await setupTest();

				changeInput(wrapper).start("06:17 AM");

				expect(onChangeSpy.mock.calls.length).toBeLessThanOrEqual(2);
				expect(onChangeSpy.mock.calls[0]).toContainEqual({
					filterType: "Date",
					modelId: "DomainTest",
					type: "Time",
					criteria: { start: new Date("1970-01-01T06:17:00.000Z"), end: undefined }
				});
			});
		});

		describe("when the user enters something in the end input", () => {
			it("calls the given onChange callback with end = input value", async () => {
				const wrapper = await setupTest();

				changeInput(wrapper).end("07:34 PM");

				expect(onChangeSpy.mock.calls.length).toBeLessThanOrEqual(2);
				expect(onChangeSpy.mock.calls[0]).toContainEqual({
					modelId: "DomainTest",
					filterType: "Date",
					type: "Time",
					criteria: { start: undefined, end: new Date("1970-01-01T19:34:00.000Z") }
				});
			});
		});

		describe("when the user enters something in the start, while end has a value", () => {
			it("calls the given onChange callback with current end and new start value", async () => {
				const endValue = new Date("1970-01-01T22:00:00.000Z");
				const wrapper = await setupTest({
					uiValue: {
						start: { input: "" },
						end: {
							value: endValue,
							input: String(endValue)
						}
					}
				});

				changeInput(wrapper).start("07:34 PM");

				expect(onChangeSpy.mock.calls.length).toBeLessThanOrEqual(2);
				expect(onChangeSpy.mock.calls[0]).toContainEqual({
					filterType: "Date",
					modelId: "DomainTest",
					type: "Time",
					criteria: { start: new Date("1970-01-01T19:34:00.000Z"), end: endValue }
				});
			});
		});

		describe("when the user enters something in the end, while start has a value", () => {
			it("calls the given onChange callback with current start and new end value", async () => {
				const startValue = new Date("1970-01-01T11:00:00.000Z");
				const wrapper = await setupTest({
					uiValue: {
						start: { value: startValue, input: String(startValue) },
						end: { input: "" }
					}
				});

				changeInput(wrapper).end("11:00 PM");

				expect(onChangeSpy.mock.calls.length).toBeLessThanOrEqual(2);
				expect(onChangeSpy.mock.calls[0]).toContainEqual({
					filterType: "Date",
					modelId: "DomainTest",
					type: "Time",
					criteria: { start: startValue, end: new Date("1970-01-01T23:00:00.000Z") }
				});
			});
		});

		describe("when the user enters not a date in the start input", () => {
			it("call the given onChange callback and with an error uiValue.start", async () => {
				const wrapper = await setupTest();

				changeInput(wrapper).start("abc");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toEqual([
					{ filterType: "Date", type: "Time", error: true, modelId: "DomainTest" },
					{
						start: {
							value: undefined,
							input: "abc",
							errorMessage: "Only dates in the format 'hh:mm AM/PM' are allowed."
						},
						end: { input: "" }
					}
				]);
			});
		});

		describe("when the user enters not a date in the end input", () => {
			it("call the given onChange callback and with an error uiValue.end", async () => {
				const wrapper = await setupTest();

				changeInput(wrapper).end("def");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toEqual([
					{
						filterType: "Date",
						type: "Time",
						modelId: "DomainTest",
						error: true
					},
					{
						start: { input: "" },
						end: {
							value: undefined,
							input: "def",
							errorMessage: "Only dates in the format 'hh:mm AM/PM' are allowed."
						}
					}
				]);
			});
		});

		describe("when the user enters not a date in the start, while end's value is not a date", () => {
			it("call the given onChange callback with errors in both uiValue.start and uiValue.end", async () => {
				const wrapper = await setupTest({
					uiValue: {
						start: { input: "" },
						end: { value: undefined, input: "def", errorMessage: "Invalid format" }
					}
				});

				changeInput(wrapper).start("abc");

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toEqual([
					{ filterType: "Date", type: "Time", modelId: "DomainTest", error: true },
					{
						start: {
							value: undefined,
							input: "abc",
							errorMessage: "Only dates in the format 'hh:mm AM/PM' are allowed."
						},
						end: {
							value: undefined,
							input: "def",
							errorMessage: "Invalid format"
						}
					}
				]);
			});
		});

		describe("when the user enters an a bigger start value than end value", () => {
			it("call the given onChange callback with errors in uiValue parameter", async () => {
				const startValue = new Date("1970-01-01T17:00:00.000Z");
				const wrapper = await setupTest({
					uiValue: {
						start: { value: startValue, input: String(startValue) },
						end: {
							input: ""
						}
					}
				});

				changeInput(wrapper).end("04:00 PM");

				expect(onChangeSpy.mock.calls.length).toBeLessThanOrEqual(2);
				expect(onChangeSpy.mock.calls[0]).toEqual([
					{ filterType: "Date", type: "Time", modelId: "DomainTest", error: true },
					{
						start: { value: startValue, input: String(startValue) },
						end: { value: new Date("1970-01-01T16:00:00.000Z"), input: "04:00 PM", errorMessage: undefined }
					}
				]);
			});
		});

		describe("when timezone is set in document model", () => {
			it("call the given onChange with timezone adjusted value", async () => {
				const wrapper = await setupTest(
					{ path: [{ elementName: "product" }, { elementName: "timeField" }], modelId: "ProductDM" },
					await createEngineProps("product", "ProductDM")
				);

				changeInput(wrapper).start("06:17 AM");

				expect(onChangeSpy.mock.calls.length).toBeLessThanOrEqual(2);
				expect(onChangeSpy.mock.calls[0][0].criteria.start.toJSON()).toEqual("1970-01-01T11:17:00.000Z");

				onChangeSpy.mockReset();

				const startInput = wrapper.getAllByDataRole(DataRoles.TimePicker.Input).first();
				fireEvent.change(startInput.getByDataRole(DataRoles.Textline.Input).element, {
					target: { value: "03:34 PM" }
				});

				expect(onChangeSpy.mock.calls.length).toEqual(2);
				expect(onChangeSpy.mock.calls[0][0].criteria.start.toJSON()).toEqual("1970-01-01T20:34:00.000Z");
			});
		});

		describe("when locale is de_DE", () => {
			describe("when the user enters wrong locale time format", () => {
				it("call the given onChange callback and with a localized error", async () => {
					const wrapper = await setupTest(undefined, await createEngineProps("unit-test", "DomainTest"), deLocale);

					changeInput(wrapper).end("06:34 PM");

					expect(onChangeSpy).toHaveBeenCalledOnce();
					expect(onChangeSpy.mock.lastCall).toEqual([
						{ filterType: "Date", type: "Time", modelId: "DomainTest", error: true },
						{
							start: { input: "" },
							end: {
								value: undefined,
								errorMessage: "Es sind nur Daten im Format HH:mm erlaubt.",
								input: "06:34 PM"
							}
						}
					]);
				});
			});

			describe("when the user enters correct locale time format", () => {
				it("call the given onChange callback and with a proper values", async () => {
					const wrapper = await setupTest(undefined, await createEngineProps("unit-test", "DomainTest"), deLocale);

					changeInput(wrapper).end("15:34");

					expect(onChangeSpy.mock.calls.length).toBeLessThanOrEqual(2);
					expect(onChangeSpy.mock.calls[0]).toEqual([
						{
							filterType: "Date",
							modelId: "DomainTest",
							type: "Time",
							criteria: { end: new Date("1970-01-01T15:34:00.000Z"), start: undefined }
						},
						{
							start: { input: "" },
							end: { value: new Date("1970-01-01T15:34:00.000Z"), input: "15:34", errorMessage: undefined }
						}
					]);
				});
			});
		});
	});

	describe("clearAll", () => {
		it("resets the filter values to an initial state", async () => {
			const startValue = new Date("2001-01-31T13:00:00.000Z");
			const endValue = new Date("2001-03-31T17:00:00.000Z");
			const wrapper = await setupTest({
				uiValue: {
					start: { value: startValue, input: String(startValue) },
					end: { value: endValue, input: String(endValue) }
				}
			});

			fireEvent.click(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element);

			expect(onChangeSpy).toHaveBeenCalledOnce();
			expect(onChangeSpy.mock.lastCall).toEqual([
				{ filterType: "Date", type: "Time", modelId: "DomainTest", criteria: undefined },
				{ start: { input: "" }, end: { input: "" } }
			]);
		});
	});

	describe("props", () => {
		describe("viewName", () => {
			it("is shown correctly in the title", async () => {
				const wrapper = await setupTest();

				expect(wrapper.getByText(viewName).element).toBeInTheDocument();
			});
		});

		describe("initialFilterOptions", () => {
			describe("given initial filter options", () => {
				it("sets them in the inputs", async () => {
					const startValue = new Date("1970-01-01T11:00:00.000Z");
					const endValue = new Date("1970-01-01T13:00:00.000Z");

					const wrapper = await setupTest({
						uiValue: {
							start: { value: startValue, input: String(startValue) },
							end: { value: endValue, input: String(endValue) }
						}
					});

					const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

					expect(inputs).toHaveLength(2);

					expect(inputs.first().element).toHaveValue("11:00 AM");
					expect(inputs.last().element).toHaveValue("01:00 PM");
				});
			});

			describe("given no initial filterOption", () => {
				it("sets nothing in the inputs", async () => {
					const wrapper = await setupTest();

					const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

					expect(inputs).toHaveLength(2);

					expect(inputs.first().element).toHaveValue("");
					expect(inputs.last().element).toHaveValue("");
				});
			});
		});

		describe("disabled", () => {
			describe("given true", () => {
				it("disables the clear button", async () => {
					const wrapper = await setupTest(undefined, { uiState: { disabled: true } });

					expect(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element).toBeDisabled();
				});

				it("disables the time picker buttons", async () => {
					const wrapper = await setupTest({ enableTimePicker: true }, { uiState: { disabled: true } });
					const timePickers = wrapper.getAllByDataRole(DataRoles.TimePicker.Input);

					expect(timePickers).toHaveLength(2);

					expect(timePickers.first().getByDataRole(DataRoles.Button).element).toBeDisabled();
					expect(timePickers.last().getByDataRole(DataRoles.Button).element).toBeDisabled();
				});
			});

			describe("given false", () => {
				describe("given all inputs are empty", () => {
					it("disable the clear button", async () => {
						const wrapper = await setupTest(undefined, { uiState: { disabled: false } });

						expect(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element).toBeDisabled();
					});
				});

				describe("given not all input are empty", () => {
					it("enables the clear button", async () => {
						const wrapper = await setupTest(
							{ uiValue: { start: { input: new Date().toString() }, end: { input: new Date().toString() } } },
							{ uiState: { disabled: false } }
						);

						expect(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Button).element).toBeEnabled();
					});
				});

				it("enables the time picker buttons", async () => {
					const wrapper = await setupTest({ enableTimePicker: true }, { uiState: { disabled: false } });
					const timePickers = wrapper.getAllByDataRole(DataRoles.TimePicker.Input);

					expect(timePickers).toHaveLength(2);

					expect(timePickers.first().getByDataRole(DataRoles.Button).element).toBeEnabled();
					expect(timePickers.last().getByDataRole(DataRoles.Button).element).toBeEnabled();
				});
			});
		});

		describe("uiValue", () => {
			describe("given that the start value have an error", () => {
				it("show an error message in start time input", async () => {
					const wrapper = await setupTest({
						uiValue: {
							start: {
								value: undefined,
								input: "abc",
								errorMessage: "Invalid date format in start input"
							},
							end: {
								input: ""
							}
						}
					});
					const inputs = wrapper.getAllByDataRole(DataRoles.TimePicker.Input);

					expect(inputs).toHaveLength(2);

					expect(inputs.first().getByDataRole(DataRoles.Textline.ErrorMessage).element).toHaveTextContent(
						"Invalid date format in start input"
					);
				});
			});

			describe("given that the end value have an error", () => {
				it("show an error message in start time input", async () => {
					const wrapper = await setupTest({
						uiValue: {
							start: {
								input: ""
							},
							end: {
								value: undefined,
								input: "abc",
								errorMessage: "Invalid date format in end input"
							}
						}
					});
					const inputs = wrapper.getAllByDataRole(DataRoles.TimePicker.Input);

					expect(inputs).toHaveLength(2);

					expect(inputs.last().getByDataRole(DataRoles.Textline.ErrorMessage).element).toHaveTextContent(
						"Invalid date format in end input"
					);
				});
			});

			describe("given that the start value is bigger than end value", () => {
				it("show an error message in start time input", async () => {
					const startValue = new Date("2001-03-31T17:00:00.000Z");
					const endValue = new Date("2001-01-31T11:00:00.000Z");
					const wrapper = await setupTest({
						uiValue: {
							start: {
								value: startValue,
								input: String(startValue)
							},
							end: {
								value: endValue,
								input: String(endValue)
							}
						}
					});

					expect(wrapper.getByDataRole(DataRoles.Messagebox).element).toHaveTextContent(
						en.overviewEngine.filterOptionView.error.startGreaterThanEnd
					);
				});
			});
		});
	});

	describe("TimePicker", () => {
		describe("props", () => {
			describe("value", () => {
				describe("given an initial date", () => {
					it("sets the initial date in the start and end picker", async () => {
						const date = new Date("2001-03-31T17:00:00.000Z");
						const wrapper = await setupTest({
							initialDate: date
						});
						const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

						expect(inputs.first().element).toHaveValue("05:00 PM");
						expect(inputs.last().element).toHaveValue("05:00 PM");
					});
				});

				describe("given initial values", () => {
					it("sets the initial date in the start and end picker", async () => {
						const startValue = new Date("2001-03-31T17:00:00.000Z");
						const endValue = new Date("2001-03-31T18:00:00.000Z");
						const wrapper = await setupTest({
							uiValue: {
								start: { value: startValue, input: String(startValue) },
								end: { value: endValue, input: String(endValue) }
							}
						});
						const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

						expect(inputs.first().element).toHaveValue("05:00 PM");
						expect(inputs.last().element).toHaveValue("06:00 PM");
					});
				});

				describe("given no initial date or values", () => {
					it("leaves the current date in the pickers undefined", async () => {
						const wrapper = await setupTest();
						const inputs = wrapper.getAllByDataRole(DataRoles.Textline.Input);

						expect(inputs.first().element).toHaveValue("");
						expect(inputs.last().element).toHaveValue("");
					});
				});
			});

			describe("initialValue", () => {
				it("sets the start typed value from the start value in the state", async () => {
					const startValue = new Date("2001-03-31T18:00:00.000Z");
					const wrapper = await setupTest({
						uiValue: {
							start: {
								value: startValue,
								input: String(startValue)
							},
							end: {
								input: ""
							}
						}
					});

					expect(wrapper.getAllByDataRole(DataRoles.Textline.Input).first().element).toHaveValue("06:00 PM");
				});

				it("sets the end typed value from the end value in the state", async () => {
					const endValue = new Date("2001-03-31T18:00:00.000Z");
					const wrapper = await setupTest({
						uiValue: { start: { input: "" }, end: { value: endValue, input: String(endValue) } }
					});

					expect(wrapper.getAllByDataRole(DataRoles.Textline.Input).last().element).toHaveValue("06:00 PM");
				});
			});

			describe("errorMessage", () => {
				it("sets the error message for the start input", async () => {
					const endValue = new Date("2001-03-31T17:00:00.000Z");
					const wrapper = await setupTest({
						uiValue: {
							start: { input: "abc", errorMessage: "MyFancyError" },
							end: { value: endValue, input: String(endValue) }
						}
					});

					expect(
						wrapper.getAllByDataRole(DataRoles.TimePicker.Input).first().getByDataRole(DataRoles.Textline.ErrorMessage)
							.element
					).toHaveTextContent("MyFancyError");
				});

				it("sets the error message for the end input", async () => {
					const startValue = new Date("2001-01-31T11:00:00.000Z");
					const wrapper = await setupTest({
						uiValue: {
							start: { input: "" },
							end: { value: startValue, input: String(startValue), errorMessage: "MyFancyError" }
						}
					});

					expect(
						wrapper.getAllByDataRole(DataRoles.TimePicker.Input).last().getByDataRole(DataRoles.Textline.ErrorMessage)
							.element
					).toHaveTextContent("MyFancyError");
				});
			});

			it("id", async () => {
				const wrapper = await setupTest();

				expect(wrapper.query(`#BasicOverviewModel-filter-time-start`)?.element).toBeInTheDocument();
				expect(wrapper.query(`#BasicOverviewModel-filter-time-end`)?.element).toBeInTheDocument();
			});

			it.each([true, false])("hidePickerButton given enableTimePicker = %s", async (enableTimePicker) => {
				const wrapper = await setupTest({ enableTimePicker });

				const timePickerButtons = wrapper.queryAllByDataRoles(DataRoles.TimePicker.Input, DataRoles.Button);

				expect(timePickerButtons).toHaveLength(enableTimePicker ? 2 : 0);
			});

			it.each([
				[undefined, createEngineProps("unit-test", "DomainTest"), "05:00 PM"],
				[
					{ path: [{ elementName: "product" }, { elementName: "timeField" }], modelId: "ProductDM" },
					createEngineProps("product", "ProductDM"),
					"12:00 PM"
				]
			])("timezone", async (props, engineProps, expectedTime) => {
				const date = new Date("2001-03-31T17:00:00.000Z");
				const wrapper = await setupTest({ ...props, initialDate: date }, await engineProps);

				expect(wrapper.getAllByDataRole(DataRoles.Textline.Input).first().element).toHaveValue(expectedTime);
				expect(wrapper.getAllByDataRole(DataRoles.Textline.Input).last().element).toHaveValue(expectedTime);
			});

			it.each([
				[enLocale, "Start Filter Value", "End Filter Value"],
				[deLocale, "Startwert für Filter", "Endwert für Filter"]
			])("placeholder given locale = %j", async (locale, startPlaceholder, endPlaceholder) => {
				const wrapper = await setupTest(undefined, undefined, locale);

				const timePickers = wrapper.getAllByDataRole(DataRoles.TimePicker.Input);

				expect(timePickers.first().element).toHaveTextContent(startPlaceholder);
				expect(timePickers.last().element).toHaveTextContent(endPlaceholder);
			});

			it.each([
				[enLocale, "Ok"],
				[deLocale, "Ok"]
			])("okLabel given locale = %j", async (locale, okLabel) => {
				const wrapper = await setupTest({ enableTimePicker: true }, undefined, locale, true);

				fireEvent.click(
					wrapper.getAllByDataRole(DataRoles.TimePicker.Input).first().getByDataRole(DataRoles.Button).element
				);

				expect(wrapper.getByDataRoles(DataRoles.Portal, DataRoles.Button).element).toHaveTextContent(okLabel);
			});

			it.each([
				[enLocale, "Clear"],
				[deLocale, "Löschen"]
			])("clearLabel given locale = %j", async (locale, clearLabel) => {
				const wrapper = await setupTest({ enableTimePicker: true }, undefined, locale, true);

				fireEvent.click(
					wrapper.getAllByDataRole(DataRoles.TimePicker.Input).first().getByDataRole(DataRoles.Button).element
				);

				fireEvent.click(
					wrapper.getByDataRole(DataRoles.Portal).queryAllByDataRole(DataRoles.TimePicker.Clock.Num).first().element
				);

				expect(wrapper.queryAllByDataRoles(DataRoles.Portal, DataRoles.Button).last().element).toHaveTextContent(
					clearLabel
				);
			});

			it.each([
				[true, "toBeDisabled"],
				[false, "toBeEnabled"],
				[undefined, "toBeEnabled"]
			] as const)("disabled = %s", async (disabled, matcher) => {
				const wrapper = await setupTest(undefined, { uiState: { disabled } });

				const timePickers = wrapper.getAllByDataRole(DataRoles.Textline.Input);

				expect(timePickers.first().element)[matcher]();
				expect(timePickers.last().element)[matcher]();
			});

			it.each([
				[true, ""],
				[false, null],
				[undefined, null]
			] as const)("readonly = %s", async (readonly, expectedReadonly) => {
				const wrapper = await setupTest({ readonly });

				const timePickers = wrapper.getAllByDataRole(DataRoles.Textline.Input);

				expect(timePickers.first().element.getAttribute("readonly")).toBe(expectedReadonly);
				expect(timePickers.last().element.getAttribute("readonly")).toBe(expectedReadonly);
			});
		});
	});

	describe("hideEmptyValueOption", () => {
		it("renders the empty switch by default", async () => {
			const wrapper = await setupTest();

			expect(wrapper.getByText(en.overviewEngine.filterOptionView.null).element).toBeInTheDocument();
		});

		it("hides the empty switch when true", async () => {
			const wrapper = await setupTest({ hideEmptyValueOption: true });

			expect(wrapper.queryByText(en.overviewEngine.filterOptionView.null).element).toBeNull();
		});
	});
});
