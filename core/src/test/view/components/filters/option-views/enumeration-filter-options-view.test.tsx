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

import { fireEvent } from "@testing-library/react";
import { it, vi, expect, describe, beforeEach } from "vitest";

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { type OverviewEngineApi } from "../../../../../main/view/api.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { EnumerationFilterOptionsView } from "../../../../../main/view/components/filters/options-views/enumeration-filter-options-view.js";

import { render, DataRoles } from "../../../../test-utils.js";
import { deLocale, enLocale, defaultEngineProps } from "../../../../basic.spec.js";
import { createDocumentModel, createEnumerationField } from "../../../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.enumeration-filter-options-view", () => {
	const onChangeSpy = vi.fn();
	const viewName = "Enumeration";

	const emptyItem: EnumerationFilterOptionsView.UndefinedMatchEnumerationOption = {
		label: "Empty",
		value: null,
		checked: false,
		active: false
	};

	const enEnumItem1: EnumerationFilterOptionsView.EnumerationOption = {
		label: "Apple",
		value: "value1",
		checked: false,
		active: false
	};

	const enEnumItem2: EnumerationFilterOptionsView.EnumerationOption = {
		label: "Banana",
		value: "value2",
		checked: false,
		active: false
	};

	const enEnumItem3: EnumerationFilterOptionsView.EnumerationOption = {
		label: "Cherry",
		value: "value3",
		checked: false,
		active: false
	};

	const deEnumItem1: EnumerationFilterOptionsView.EnumerationOption = {
		label: "Apfel",
		value: "value1",
		checked: false,
		active: false
	};

	const deEnumItem2: EnumerationFilterOptionsView.EnumerationOption = {
		label: "Banane",
		value: "value2",
		checked: false,
		active: false
	};

	const deEnumItem3: EnumerationFilterOptionsView.EnumerationOption = {
		label: "Kirsche",
		value: "value3",
		checked: false,
		active: false
	};

	const basicOptions: EnumerationFilterOptionsView.InternalEnumerationOption[] = [
		emptyItem,
		enEnumItem1,
		enEnumItem2,
		enEnumItem3
	];

	const basicProps: EnumerationFilterOptionsView.Props = {
		path: [{ elementName: "root" }, { elementName: "value" }],
		viewName,
		onChange: onChangeSpy,
		enumerationOptions: basicOptions.filter((op) => op.value !== null),
		uiValue: { undefinedMatch: basicOptions.some((op) => op.value === null && op.checked) }
	};

	function setupTest(
		props?: Partial<EnumerationFilterOptionsView.Props>,
		engineProps?: Partial<OverviewEngine.PaginatedProps>,
		documentParams?: { alphabeticalSorting?: boolean },
		locale?: Locale
	) {
		const mergedEngineProps: OverviewEngine.PaginatedProps = {
			...defaultEngineProps,
			...engineProps
		};

		const documentModel = createDocumentModel([createEnumerationField(documentParams?.alphabeticalSorting)]);

		return render(<EnumerationFilterOptionsView {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...mergedEngineProps, documentModel, locale }
		});
	}

	describe("order", () => {
		function testItems(params: {
			options: EnumerationFilterOptionsView.InternalEnumerationOption[];
			locale: Locale;
			alphabeticalSorting?: boolean;
			expectedResult: EnumerationFilterOptionsView.InternalEnumerationOption[];
		}) {
			const { options, locale, alphabeticalSorting, expectedResult } = params;
			const wrapper = setupTest(
				{
					enumerationOptions: options.filter((op) => op.value !== null),
					uiValue: { undefinedMatch: options.some((op) => op.value === null && op.checked) }
				},
				undefined,
				{ alphabeticalSorting },
				locale
			);
			const items = wrapper.getAllByDataRole(DataRoles.Filter.Selector.List.Item);

			expect(items.length).toBe(expectedResult.length);

			items.forEach((_, index) => {
				const checkingItem = items.get(index);
				const label = checkingItem.element.textContent;
				const checkbox = checkingItem.getByDataRole(DataRoles.Checkbox.Input).element;

				expect(label).toEqual(expectedResult[index].label);
				expect(checkbox.id).toBe(getCheckboxId(expectedResult[index]));

				fireEvent.click(checkbox);

				if (expectedResult[index].value !== null) {
					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
						{
							filterType: "Enumeration",
							criteria: { selectedValues: [expectedResult[index].value] },
							undefinedMatch: false
						},
						undefined
					);
				} else {
					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
						{
							filterType: "Enumeration",
							criteria: undefined,
							undefinedMatch: true
						},
						undefined
					);
				}

				onChangeSpy.mockReset();
			});
		}

		describe("given none selected options", () => {
			describe("given english language", () => {
				const options: EnumerationFilterOptionsView.InternalEnumerationOption[] = [
					emptyItem,
					enEnumItem2,
					enEnumItem1,
					enEnumItem3
				];

				it("should sort by english alphabet only if enabling alphabeticalSorting", () => {
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: undefined,
						expectedResult: options
					});
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: false,
						expectedResult: options
					});
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: true,
						expectedResult: [emptyItem, enEnumItem1, enEnumItem2, enEnumItem3]
					});
				});
			});

			describe("given german language", () => {
				const options: EnumerationFilterOptionsView.InternalEnumerationOption[] = [
					emptyItem,
					deEnumItem2,
					deEnumItem1,
					deEnumItem3
				];

				it("should sort by german alphabet only if enabling alphabeticalSorting", () => {
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: undefined,
						expectedResult: options
					});
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: false,
						expectedResult: options
					});
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: true,
						expectedResult: [emptyItem, deEnumItem1, deEnumItem2, deEnumItem3]
					});
				});
			});
		});

		describe("given a selected option", () => {
			describe("given english language and alphabeticalSorting is enable", () => {
				const enSelectedEnumItem3 = { ...enEnumItem3, active: true };
				const options: EnumerationFilterOptionsView.InternalEnumerationOption[] = [
					emptyItem,
					enEnumItem2,
					enEnumItem1,
					enSelectedEnumItem3
				];

				it("should sort and show selected options above unselected ones", () => {
					testItems({
						options,
						locale: enLocale,
						alphabeticalSorting: true,
						expectedResult: [enSelectedEnumItem3, emptyItem, enEnumItem1, enEnumItem2]
					});
				});
			});

			describe("given german language and alphabeticalSorting is enable", () => {
				const deSelectedEnumItem3 = { ...deEnumItem3, active: true };
				const options: EnumerationFilterOptionsView.InternalEnumerationOption[] = [
					emptyItem,
					enEnumItem2,
					enEnumItem1,
					deSelectedEnumItem3
				];

				it("should sort and show selected options above unselected ones", () => {
					testItems({
						options,
						locale: deLocale,
						alphabeticalSorting: true,
						expectedResult: [deSelectedEnumItem3, emptyItem, enEnumItem1, enEnumItem2]
					});
				});
			});
		});
	});

	describe("onChange", () => {
		describe("when the user selects items from the enumeration", () => {
			it("calls the given onChange callback with the selected values", () => {
				const wrapper = setupTest();
				const targetEnumeration = basicProps.enumerationOptions[0];

				const item1 = wrapper
					.getAllByDataRole(DataRoles.Checkbox.Input)
					.find((item) => item.id === getCheckboxId(targetEnumeration));

				expect(item1).toBeTruthy();

				if (item1) {
					fireEvent.click(item1);
				}

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
					{ filterType: "Enumeration", criteria: { selectedValues: [targetEnumeration.value] }, undefinedMatch: false },
					undefined
				);
			});
		});

		describe("selectAll", () => {
			const expectedSelectedValues: OverviewEngineApi.Filter.EnumerationOptions = {
				filterType: "Enumeration",
				criteria: {
					selectedValues: basicProps.enumerationOptions.map((options) => options.value)
				},
				undefinedMatch: true
			};

			it("selects all enum values", () => {
				const wrapper = setupTest();

				const checkbox = wrapper.getByLabelText(
					en.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
				).element;

				fireEvent.click(checkbox);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(expectedSelectedValues, undefined);
			});

			it("Selects all enum values when there is a selected value in advance", () => {
				const wrapper = setupTest({
					enumerationOptions: basicProps.enumerationOptions.map((item, index) =>
						index === 0 ? { ...item, checked: true } : item
					)
				});

				const checkbox = wrapper.getByLabelText(
					en.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
				).element;

				fireEvent.click(checkbox);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(expectedSelectedValues, undefined);
			});
		});

		describe("clearAll", () => {
			it("resets the filter", () => {
				const wrapper = setupTest({
					enumerationOptions: basicProps.enumerationOptions.map((item) => ({ ...item, checked: true })),
					uiValue: { undefinedMatch: true }
				});

				const checkbox = wrapper.getByLabelText(
					en.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel
				).element;

				fireEvent.click(checkbox);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
					{ filterType: "Enumeration", criteria: undefined, undefinedMatch: false },
					undefined
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
			describe("given initialFilterOptions with selected values", () => {
				it("selects the corresponding check boxes", () => {
					const newProps: Partial<EnumerationFilterOptionsView.Props> = {
						enumerationOptions: [
							...basicProps.enumerationOptions.filter((e) => e.value !== basicProps.enumerationOptions[2].value),
							{
								...basicProps.enumerationOptions[2],
								checked: true
							}
						]
					};

					const wrapper = setupTest(newProps);

					const item1 = wrapper.getByLabelText(basicProps.enumerationOptions[0].label).element;
					const item2 = wrapper.getByLabelText(basicProps.enumerationOptions[1].label).element;
					const item3 = wrapper.getByLabelText(basicProps.enumerationOptions[2].label).element;

					expect(item1).not.toBeChecked();

					expect(item2).not.toBeChecked();

					expect(item3).toBeChecked();
				});
			});
		});

		describe("disabled", () => {
			describe("given true", () => {
				it("disables the check boxes", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: true } });

					const list = wrapper.getByDataRole(DataRoles.Filter.Selector.List);
					const checkBoxes = list.getAllByDataRole(DataRoles.Checkbox.Input);

					expect(checkBoxes).toHaveLength(basicOptions.length);

					Array.from(checkBoxes).forEach((_, index) => {
						expect(checkBoxes.get(index).element).toBeDisabled();
					});
				});
			});

			describe("given false", () => {
				it("enables the check boxes", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: false } });

					const checkBoxes = wrapper.getAllByDataRole(DataRoles.Checkbox.Input);

					expect(checkBoxes.get(0).element).toBeEnabled();
					expect(checkBoxes.get(1).element).toBeEnabled();
					expect(checkBoxes.get(2).element).toBeEnabled();
				});
			});
		});
	});

	describe("search", () => {
		describe("given a search parameter", () => {
			it("just shows options which map this values", async () => {
				const wrapper = setupTest();

				// No matched value
				const searchInput = wrapper.getByDataRole(DataRoles.Textline.Input).element;
				fireEvent.change(searchInput, { target: { value: "Abc" } });
				const noMatchedItems = wrapper
					.getByDataRole(DataRoles.Filter.Selector.List)
					.queryAllByDataRole(DataRoles.Checkbox.Input);

				expect(noMatchedItems).toHaveLength(0);

				// Matched value
				fireEvent.change(searchInput, { target: { value: "App" } });
				const targetEnumeration = basicProps.enumerationOptions[0];
				const matchedItems = wrapper.getAllByDataRole(DataRoles.Filter.Selector.List.Item);

				expect(matchedItems).toHaveLength(1);

				expect(matchedItems.get(0).getByLabelText(targetEnumeration.label).element).toBeInTheDocument();
			});
		});
	});

	describe("hideEmptyValueOption", () => {
		beforeEach(() => {
			onChangeSpy.mockClear();
		});

		it("omits the empty enumeration option when true", () => {
			const wrapper = setupTest({ hideEmptyValueOption: true });

			expect(wrapper.queryByLabelText(emptyItem.label).element).toBeNull();
		});

		it("never emits undefinedMatch while hidden", () => {
			const wrapper = setupTest({ hideEmptyValueOption: true });

			fireEvent.click(wrapper.getByLabelText(enEnumItem1.label).element);

			expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
				{
					filterType: "Enumeration",
					criteria: { selectedValues: [enEnumItem1.value] },
					undefinedMatch: false
				},
				undefined
			);
		});
	});
});

function getCheckboxId(enumeration: EnumerationFilterOptionsView.InternalEnumerationOption) {
	return `BasicOverviewModel-filter-enum-${enumeration.value}`;
}
