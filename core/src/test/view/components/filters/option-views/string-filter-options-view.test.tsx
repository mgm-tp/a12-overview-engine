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

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { StringFilterOptionsView } from "../../../../../main/view/components/filters/options-views/string-filter-options-view.js";

import { render } from "../../../../test-utils.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { modifyDocumentModel, type DocumentModelModifier } from "../../new-filters/setup.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.string-filter-options-view", () => {
	const onChangeSpy = vi.fn();
	const viewName = "String";

	const basicProps: StringFilterOptionsView.Props = {
		path: [],
		viewName,
		onChange: onChangeSpy,
		uiValue: { value: "" }
	};

	function setupTest(props?: Partial<StringFilterOptionsView.Props>, engineProps?: Partial<OverviewEngine.Props>) {
		return render(<StringFilterOptionsView {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps, ...engineProps }
		});
	}

	describe("onChange", () => {
		describe("when the user enters something in the input", () => {
			it("calls the given onChange callback with value: ['input value']", () => {
				const textField = setupTest().getByDataRole(DataRoles.TextField.Input);

				fireEvent.change(textField.element, { target: { value: "Test" } });

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ filterType: "String", criteria: { value: "Test" } });
			});
		});

		describe("when the user delete everything in the input", () => {
			it("call the given onChange callback with no criteria", () => {
				const textField = setupTest({ uiValue: { value: "initialValue" } }).getByDataRole(DataRoles.TextField.Input);

				fireEvent.change(textField.element, { target: { value: "" } });

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ filterType: "String" });
			});
		});
	});

	describe("clearAll", () => {
		it("resets the filter to contain value with an empty array", () => {
			const clearAllButton = setupTest({ uiValue: { value: "Test" } }).getByDataRoles(
				DataRoles.Filter.Selector.ActionElement,
				DataRoles.Button
			);

			fireEvent.click(clearAllButton.element);

			expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ filterType: "String" });
		});
	});

	describe("props", () => {
		describe("viewName", () => {
			it("is shown correctly in the title", () => {
				expect(setupTest().getByDataRole(DataRoles.Contentbox.Title).element).toHaveTextContent(viewName);
			});
		});

		describe("filters", () => {
			describe("given initialFilterOptions with a value", () => {
				it("shows the string in the input", () => {
					expect(
						setupTest({ uiValue: { value: "Test" } }).getByDataRole(DataRoles.TextField.Input).element
					).toHaveValue("Test");
				});
			});

			describe("given initialFilterOptions with empty value", () => {
				it("shows an empty input", () => {
					expect(setupTest({ uiValue: { value: "" } }).getByDataRole(DataRoles.TextField.Input).element).toHaveValue(
						""
					);
				});
			});
		});

		describe("disabled", () => {
			describe("given true", () => {
				it("disables the clear button and input", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: true } });

					expect(
						wrapper.getByDataRoles(DataRoles.Filter.Selector.ActionElement, DataRoles.Button).element
					).toBeDisabled();

					expect(wrapper.getByDataRole(DataRoles.TextField.Input).element).toBeDisabled();
				});
			});

			describe("given false", () => {
				describe("given the input is empty", () => {
					it("disables the clear button", () => {
						expect(
							setupTest(undefined, { uiState: { disabled: false } }).getByDataRoles(
								DataRoles.Filter.Selector.ActionElement,
								DataRoles.Button
							).element
						).toBeDisabled();
					});
				});

				describe("given the input is not empty", () => {
					it("enables the clear button", () => {
						expect(
							setupTest({ uiValue: { value: "abc" } }, { uiState: { disabled: false } }).getByDataRoles(
								DataRoles.Filter.Selector.ActionElement,
								DataRoles.Button
							).element
						).toBeEnabled();
					});
				});

				it("enables the input", () => {
					expect(
						setupTest(undefined, { uiState: { disabled: false } }).getByDataRole(DataRoles.TextField.Input).element
					).toBeEnabled();
				});
			});
		});

		describe("minimum searchable token size", () => {
			const stringFieldPath = [{ elementName: "root" }, { elementName: "string" }];
			const minTokenSizeState = {
				dataservices: {
					configuration: {
						"mgmtp.a12.dataservices.query.simpleSearch.minSearchableTokenSize": "3"
					}
				}
			};

			const withApproximateMatchSearch: DocumentModelModifier = (element) =>
				element.type === "Field" && element.name === "string"
					? { ...element, annotations: [{ name: "enable_approximate_match_search", value: "true" }] }
					: null;

			function setupMinTokenSizeTest(annotated: boolean) {
				const documentModel = annotated
					? modifyDocumentModel(defaultEngineProps.documentModel, withApproximateMatchSearch)
					: defaultEngineProps.documentModel;

				return render(<StringFilterOptionsView {...basicProps} path={stringFieldPath} />, {
					wrappingComponent: OverviewEngine,
					wrappingComponentProps: { ...defaultEngineProps, documentModel },
					reduxState: minTokenSizeState
				});
			}

			describe("given the field uses approximate match search", () => {
				it("flags the option as errored for a value shorter than the minimum and shows a hint", () => {
					const wrapper = setupMinTokenSizeTest(true);

					fireEvent.change(wrapper.getByDataRole(DataRoles.TextField.Input).element, { target: { value: "te" } });

					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
						{ filterType: "String", error: true, modelId: undefined },
						{ value: "te" }
					);
					expect(wrapper.getByText("Enter at least 3 characters").element).toBeInTheDocument();
				});

				it("flags the option as errored when any word is shorter than the minimum", () => {
					const wrapper = setupMinTokenSizeTest(true);

					fireEvent.change(wrapper.getByDataRole(DataRoles.TextField.Input).element, {
						target: { value: "test a" }
					});

					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
						{ filterType: "String", error: true, modelId: undefined },
						{ value: "test a" }
					);
					expect(wrapper.getByText("Enter at least 3 characters").element).toBeInTheDocument();
				});

				it("propagates a value meeting the minimum", () => {
					const wrapper = setupMinTokenSizeTest(true);

					fireEvent.change(wrapper.getByDataRole(DataRoles.TextField.Input).element, { target: { value: "test" } });

					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({
						filterType: "String",
						criteria: { value: "test" }
					});
					expect(wrapper.queryByText("Enter at least 3 characters").element).toBeNull();
				});

				it("does not show the hint while typing, only after submitting the value", () => {
					const wrapper = setupMinTokenSizeTest(true);
					const input = wrapper.getByDataRole(DataRoles.TextField.Input).element;

					input.focus();
					fireEvent.change(input, { target: { value: "te" } });

					expect(wrapper.queryByText("Enter at least 3 characters").element).toBeNull();

					fireEvent.blur(input);

					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(
						{ filterType: "String", error: true, modelId: undefined },
						{ value: "te" }
					);
					expect(wrapper.getByText("Enter at least 3 characters").element).toBeInTheDocument();
				});

				it("clears the hint when the corrected value is submitted", () => {
					const wrapper = setupMinTokenSizeTest(true);
					const input = wrapper.getByDataRole(DataRoles.TextField.Input).element;

					input.focus();
					fireEvent.change(input, { target: { value: "te" } });
					fireEvent.blur(input);

					expect(wrapper.getByText("Enter at least 3 characters").element).toBeInTheDocument();

					input.focus();
					fireEvent.change(input, { target: { value: "test" } });
					fireEvent.blur(input);

					expect(wrapper.queryByText("Enter at least 3 characters").element).toBeNull();
					expect(onChangeSpy).toHaveBeenLastCalledWith({
						filterType: "String",
						criteria: { value: "test" }
					});
				});
			});

			describe("given the field does not use approximate match search", () => {
				it("propagates a value shorter than the minimum", () => {
					const wrapper = setupMinTokenSizeTest(false);

					fireEvent.change(wrapper.getByDataRole(DataRoles.TextField.Input).element, { target: { value: "te" } });

					expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({
						filterType: "String",
						criteria: { value: "te" }
					});
				});
			});
		});

		describe("hideEmptyValueOption", () => {
			it("removes the empty state toggle when true", () => {
				const wrapper = setupTest({ hideEmptyValueOption: true });

				expect(wrapper.queryByText(en.overviewEngine.filterOptionView.null).element).toBeNull();
			});

			it("renders the empty state toggle by default", () => {
				const wrapper = setupTest();

				expect(wrapper.getByText(en.overviewEngine.filterOptionView.null).element).toBeInTheDocument();
			});
		});
	});
});
