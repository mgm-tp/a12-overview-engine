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
import { FilterOperation, type OverviewEngineApi } from "../../../../../main/view/api.js";
import { MultiSelectFilterOptionsView } from "../../../../../main/view/components/filters/options-views/multi-select-filter-options-view.js";
import { type EnumerationFilterOptionsView } from "../../../../../main/view/components/filters/options-views/enumeration-filter-options-view.js";

import { deLocale, enLocale, defaultEngineProps } from "../../../../basic.spec.js";
import { assert, render, DataRoles, QueriableElement } from "../../../../test-utils.js";
import { createGroup, createDocumentModel, createEnumerationField } from "../../../../utils.js";

describe.skip("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.multi-select-filter-options-view", () => {
	const onChangeSpy = vi.fn();
	const viewName = "MultiSelect";
	const multiSelectGroupName = "multi-select-group";

	const enOption1: MultiSelectFilterOptionsView.MultiSelectOption = {
		label: "Apple",
		value: "value1",
		checked: false,
		active: false
	};

	const enOption2: MultiSelectFilterOptionsView.MultiSelectOption = {
		label: "Banana",
		value: "value2",
		checked: false,
		active: false
	};

	const enOption3: MultiSelectFilterOptionsView.MultiSelectOption = {
		label: "Cherry",
		value: "value3",
		checked: false,
		active: false
	};

	const deOption1: MultiSelectFilterOptionsView.MultiSelectOption = {
		label: "Apfel",
		value: "value1",
		checked: false,
		active: false
	};

	const deOption2: MultiSelectFilterOptionsView.MultiSelectOption = {
		label: "Banane",
		value: "value2",
		checked: false,
		active: false
	};

	const deOption3: MultiSelectFilterOptionsView.MultiSelectOption = {
		label: "Kirsche",
		value: "value3",
		checked: false,
		active: false
	};

	const basicOptions: MultiSelectFilterOptionsView.MultiSelectOption[] = [enOption1, enOption2, enOption3];

	const basicProps: MultiSelectFilterOptionsView.Props = {
		path: [{ elementName: "root" }, { elementName: multiSelectGroupName }],
		viewName,
		modelId: undefined,
		onChange: onChangeSpy,
		uiValue: {
			options: basicOptions,
			operation: FilterOperation.AND
		}
	};

	function setupTest(
		props?: Partial<MultiSelectFilterOptionsView.Props>,
		engineProps?: Partial<OverviewEngine.PaginatedProps>,
		documentParams?: { alphabeticalSorting?: boolean },
		locale?: Locale,
		asBaseElement?: boolean
	) {
		const mergedEngineProps: OverviewEngine.PaginatedProps = {
			...defaultEngineProps,
			...engineProps
		};

		const documentModel = createDocumentModel([
			createGroup({
				repeatability: 3,
				id: multiSelectGroupName,
				usageType: "multi-select",
				elements: [createEnumerationField(documentParams?.alphabeticalSorting)]
			})
		]);

		return render(
			<MultiSelectFilterOptionsView {...basicProps} {...props} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...mergedEngineProps, documentModel },
				asBaseElement
			},
			locale
		);
	}

	describe("order", () => {
		function testItems(params: {
			options: MultiSelectFilterOptionsView.MultiSelectOption[];
			locale: Locale;
			alphabeticalSorting?: boolean;
			expectedOptions: EnumerationFilterOptionsView.EnumerationOption[];
		}) {
			const { options, locale, alphabeticalSorting, expectedOptions } = params;
			const wrapper = setupTest(
				{ uiValue: { options, operation: FilterOperation.AND } },
				undefined,
				{ alphabeticalSorting },
				locale
			);
			const items = wrapper.queryAllByDataRole(DataRoles.Filter.Selector.List.Item);

			expect(items.length).toBe(expectedOptions.length);

			items.forEach((item, itemIndex) => {
				const checkbox = new QueriableElement(item).getByDataRole(DataRoles.Checkbox.Input);

				expect(item).toHaveTextContent(expectedOptions[itemIndex].label);
				expect(checkbox.element).toHaveAttribute("id", getCheckboxId(expectedOptions[itemIndex]));

				fireEvent.click(checkbox.element);

				const expectedArguments: Parameters<NonNullable<EnumerationFilterOptionsView.Props["onChange"]>> = [
					{
						filterType: "MultiSelect",
						modelId: undefined,
						criteria: {
							operation: "and",
							selectedValues: [expectedOptions[itemIndex].value]
						}
					},
					{
						operation: "and",
						options: options.map((option) => ({
							...option,
							checked: option.value === expectedOptions[itemIndex].value
						}))
					} as MultiSelectFilterOptionsView.MultiSelectUiValueType
				];

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toStrictEqual(expectedArguments);

				onChangeSpy.mockReset();
			});
		}

		describe("given none selected option", () => {
			describe("given english language", () => {
				const options: MultiSelectFilterOptionsView.MultiSelectOption[] = [enOption2, enOption1, enOption3];

				it("should sort items by label alphabetically only if enabling alphabeticalSorting", () => {
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: undefined,
						expectedOptions: options
					});
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: false,
						expectedOptions: options
					});
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: true,
						expectedOptions: [enOption1, enOption2, enOption3]
					});
				});
			});

			describe("given german language", () => {
				const options: MultiSelectFilterOptionsView.MultiSelectOption[] = [deOption2, deOption1, deOption3];

				it("should sort items by label alphabetically only if enabling alphabeticalSorting", () => {
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: undefined,
						expectedOptions: options
					});
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: false,
						expectedOptions: options
					});
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: true,
						expectedOptions: [deOption1, deOption2, deOption3]
					});
				});
			});
		});

		describe("given a selected option", () => {
			describe("given english language and alphabeticalSorting is enable", () => {
				const enSelectedOption3 = { ...enOption3, active: true };
				const options: MultiSelectFilterOptionsView.MultiSelectOption[] = [enOption2, enOption1, enSelectedOption3];

				it("should sort and show selected options above unselected ones", () => {
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: true,
						expectedOptions: [enSelectedOption3, enOption1, enOption2]
					});
				});
			});

			describe("given german language and alphabeticalSorting is enable", () => {
				const deSelectedOption3 = { ...deOption3, active: true };
				const options: MultiSelectFilterOptionsView.MultiSelectOption[] = [deOption2, deOption1, deSelectedOption3];

				it("should sort and show selected options above unselected ones", () => {
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: true,
						expectedOptions: [deSelectedOption3, deOption1, deOption2]
					});
				});
			});
		});
	});

	describe("onChange", () => {
		describe("when the user selects an option", () => {
			it("calls the given onChange callback with the selected values and correct uiValue", () => {
				expect.assertions(2);

				const wrapper = setupTest();
				const targetOption = basicProps.uiValue.options[0];

				const item1 = wrapper
					.queryAllByDataRole(DataRoles.Checkbox.Input)
					.find((item) => item.id === getCheckboxId(targetOption));
				assert(item1);

				fireEvent.click(item1);

				expect(onChangeSpy).toHaveBeenCalledOnce();

				const expectedSelectedValues: OverviewEngineApi.Filter.MultiSelectOptions = {
					filterType: "MultiSelect",
					modelId: undefined,
					criteria: {
						selectedValues: [targetOption.value],
						operation: basicProps.uiValue.operation
					}
				};

				const expectedUiValue: MultiSelectFilterOptionsView.MultiSelectUiValueType = {
					options: basicProps.uiValue.options.map((option) =>
						option === targetOption ? { ...option, checked: true } : option
					),
					operation: basicProps.uiValue.operation
				};

				expect(onChangeSpy.mock.lastCall).toStrictEqual([expectedSelectedValues, expectedUiValue]);
			});
		});

		describe("when the user change operation", () => {
			const targetOperation = FilterOperation.OR;

			describe("when option list is empty", () => {
				it("should called with undefined criteria and correct uiValue", () => {
					const wrapper = setupTest(
						{ uiValue: { options: [], operation: FilterOperation.AND } },
						undefined,
						undefined,
						undefined,
						true
					);

					fireEvent.click(wrapper.getByDataRoles(DataRoles.Popup, DataRoles.Popup.TriggerElement).element);

					const orListItem = wrapper
						.queryAllByDataRole(DataRoles.Portal)
						.last()
						.queryAllByDataRole(DataRoles.List.Item.Content)
						.first();
					fireEvent.click(orListItem.element);

					expect(orListItem.element).toHaveTextContent("Or");
					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
						{ filterType: "MultiSelect" },
						{ options: [], operation: targetOperation }
					);
				});
			});

			describe("when option list is not empty", () => {
				const options = [enOption1, { ...enOption2, checked: true }, enOption3];

				it("calls the given onChange callback with the selected operation", () => {
					const wrapper = setupTest(
						{
							uiValue: { options, operation: FilterOperation.AND }
						},
						undefined,
						undefined,
						undefined,
						true
					);
					fireEvent.click(wrapper.getByDataRoles(DataRoles.Popup, DataRoles.Popup.TriggerElement).element);

					const orListItem = wrapper
						.queryAllByDataRole(DataRoles.Portal)
						.last()
						.queryAllByDataRole(DataRoles.List.Item.Content)
						.first();
					fireEvent.click(orListItem.element);

					expect(orListItem.element).toHaveTextContent("Or");
					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
						{ filterType: "MultiSelect", criteria: { selectedValues: [enOption2.value], operation: targetOperation } },
						{ options, operation: targetOperation }
					);
				});
			});
		});

		describe("selectAll", () => {
			const expectedSelectedValues: OverviewEngineApi.Filter.MultiSelectOptions = {
				filterType: "MultiSelect",
				criteria: {
					selectedValues: basicProps.uiValue.options.map((options) => options.value),
					operation: basicProps.uiValue.operation
				}
			};

			it("selects all options", () => {
				fireEvent.click(setupTest().getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Checkbox.Input).element);

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toContainEqual(expectedSelectedValues);
			});

			it("Selects all options when there is a selected value in advance", () => {
				const wrapper = setupTest({
					uiValue: {
						...basicProps.uiValue,
						options: basicProps.uiValue.options.map((item, index) => (index === 0 ? { ...item, checked: true } : item))
					}
				});
				fireEvent.click(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Checkbox.Input).element);

				expect(onChangeSpy).toHaveBeenCalledOnce();
				expect(onChangeSpy.mock.lastCall).toContainEqual(expectedSelectedValues);
			});
		});

		describe("clearAll", () => {
			it("resets the filter", () => {
				const wrapper = setupTest({
					uiValue: {
						...basicProps.uiValue,
						options: basicProps.uiValue.options.map((item) => ({ ...item, checked: true }))
					}
				});
				fireEvent.click(wrapper.getByDataRoles(DataRoles.Contentbox.Header, DataRoles.Checkbox.Input).element);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
					{ filterType: "MultiSelect" },
					{ operation: "and", options: basicProps.uiValue.options.map((item) => ({ ...item, checked: false })) }
				);
			});
		});
	});

	describe("props", () => {
		describe("viewName", () => {
			it("is shown correctly in the title", () => {
				const wrapper = setupTest();

				expect(wrapper.getByText(viewName).element).toBeInTheDocument();
			});
		});

		describe("filters", () => {
			describe("given specific selected values", () => {
				it("selects the corresponding check boxes", () => {
					const props: Partial<MultiSelectFilterOptionsView.Props> = {
						uiValue: {
							...basicProps.uiValue,
							options: [
								...basicProps.uiValue.options.filter((e) => e.value !== basicProps.uiValue.options[2].value),
								{
									...basicProps.uiValue.options[2],
									checked: true
								}
							]
						}
					};

					const wrapper = setupTest(props);

					const checkboxes = wrapper.queryAllByDataRoles(DataRoles.Contentbox.Content, DataRoles.Checkbox);

					expect(checkboxes).toHaveLength(3);
					expect(checkboxes.get(0).element).toHaveTextContent(basicProps.uiValue.options[0].label);
					expect(checkboxes.get(0).getByDataRole(DataRoles.Checkbox.Input).element).not.toBeChecked();

					expect(checkboxes.get(1).element).toHaveTextContent(basicProps.uiValue.options[1].label);
					expect(checkboxes.get(1).getByDataRole(DataRoles.Checkbox.Input).element).not.toBeChecked();

					expect(checkboxes.get(2).element).toHaveTextContent(basicProps.uiValue.options[2].label);
					expect(checkboxes.get(2).getByDataRole(DataRoles.Checkbox.Input).element).toBeChecked();
				});
			});

			describe.each([
				[FilterOperation.AND, 1],
				[FilterOperation.OR, 0]
			])(`given target operation is %s`, (operation, selectedItemIndex) => {
				const props: Partial<MultiSelectFilterOptionsView.Props> = { uiValue: { ...basicProps.uiValue, operation } };

				it("operation and should be checked", () => {
					const wrapper = setupTest(props, undefined, undefined, undefined, true);

					fireEvent.click(wrapper.getByDataRoles(DataRoles.Popup, DataRoles.Popup.TriggerElement).element);

					const operations = wrapper
						.queryAllByDataRole(DataRoles.Portal)
						.last()
						.queryAllByDataRole(DataRoles.List.Item);

					expect(operations.get(selectedItemIndex).element).toHaveTextContent(new RegExp(operation, "i"));
					expect(operations.get(selectedItemIndex).element).toHaveClass("list-item--selected");
					expect(operations.get(1 - selectedItemIndex).element).not.toHaveClass("list-item--selected");
				});
			});
		});

		describe("disabled", () => {
			describe("given true", () => {
				it("disables the check boxes", () => {
					setupTest(undefined, { uiState: { disabled: true } })
						.queryAllByDataRoles(DataRoles.Contentbox.Content, DataRoles.Checkbox.Input)
						.forEach((checkBox) => expect(checkBox).toBeDisabled());
				});
			});

			describe("given false", () => {
				it("enables the check boxes", () => {
					setupTest(undefined, { uiState: { disabled: false } })
						.queryAllByDataRoles(DataRoles.Contentbox.Content, DataRoles.Checkbox.Input)
						.forEach((checkBox) => expect(checkBox).toBeEnabled());
				});
			});
		});
	});

	describe("search", () => {
		describe("given a search parameter", () => {
			it("just shows options which map this values", () => {
				const wrapper = setupTest();

				expect(wrapper.queryAllByDataRoles(DataRoles.Filter.Selector.List.Item)).toHaveLength(3);

				fireEvent.change(wrapper.getByDataRole(DataRoles.Textline.Input).element, { target: { value: "Cherr" } });

				expect(wrapper.getByDataRole(DataRoles.Filter.Selector.List.Item).element).toHaveTextContent("Cherry");
			});
		});
	});
});

function getCheckboxId(option: MultiSelectFilterOptionsView.MultiSelectOption) {
	return `BasicOverviewModel-multi-select-option-${option.value}`;
}
