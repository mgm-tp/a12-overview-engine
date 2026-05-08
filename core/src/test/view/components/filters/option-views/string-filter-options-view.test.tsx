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

import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { StringFilterOptionsView } from "../../../../../main/view/components/filters/options-views/string-filter-options-view.js";

import { render, DataRoles } from "../../../../test-utils.js";
import { defaultEngineProps } from "../../../../basic.spec.js";

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
				const textLine = setupTest().getByDataRole(DataRoles.Textline.Input);

				fireEvent.change(textLine.element, { target: { value: "Test" } });

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ filterType: "String", criteria: { value: "Test" } });
			});
		});

		describe("when the user delete everything in the input", () => {
			it("call the given onChange callback with no criteria", () => {
				const textLine = setupTest({ uiValue: { value: "initialValue" } }).getByDataRole(DataRoles.Textline.Input);

				fireEvent.change(textLine.element, { target: { value: "" } });

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
					expect(setupTest({ uiValue: { value: "Test" } }).getByDataRole(DataRoles.Textline.Input).element).toHaveValue(
						"Test"
					);
				});
			});

			describe("given initialFilterOptions with empty value", () => {
				it("shows an empty input", () => {
					expect(setupTest({ uiValue: { value: "" } }).getByDataRole(DataRoles.Textline.Input).element).toHaveValue("");
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

					expect(wrapper.getByDataRole(DataRoles.Textline.Input).element).toBeDisabled();
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
						setupTest(undefined, { uiState: { disabled: false } }).getByDataRole(DataRoles.Textline.Input).element
					).toBeEnabled();
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
