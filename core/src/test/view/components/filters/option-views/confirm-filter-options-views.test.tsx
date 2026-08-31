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
import { it, vi, expect, describe } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { ConfirmFilterOptionsView } from "../../../../../main/view/components/filters/options-views/confirm-filter-options-view.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { render } from "../../../../test-utils.js";

import { getClearAllButton } from "./shared.js";

describe("com.mgmtp.a12.overview-engine.view.components.filters.optionsViews.confirm-filter-options-view", () => {
	const onChangeSpy = vi.fn();
	const viewName = "Confirm";
	const filterType = "Confirm";

	const basicProps: ConfirmFilterOptionsView.Props = {
		path: [{ elementName: "root" }, { elementName: "confirm" }],
		viewName,
		onChange: onChangeSpy,
		uiValue: {}
	};

	function setupTest(props?: Partial<ConfirmFilterOptionsView.Props>, engineProps?: Partial<OverviewEngine.Props>) {
		return render(<ConfirmFilterOptionsView {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...defaultEngineProps, ...engineProps }
		});
	}

	describe("onChange", () => {
		describe("when the user clicks the `yes` radio button", () => {
			it("calls the given onChange callback with value: true", () => {
				const wrapper = setupTest();

				const radioButton = wrapper.getByLabelText(en.overviewEngine.filterOptionView.true).element;

				expect(radioButton).toBeInTheDocument();

				fireEvent.click(radioButton);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ filterType, criteria: { value: true } });
			});
		});

		describe("when the user clicks the `null` radio button", () => {
			it("calls the given onChange callback with value: null", () => {
				const wrapper = setupTest();

				const radioButton = wrapper.getByLabelText(en.overviewEngine.filterOptionView.null).element;

				expect(radioButton).toBeInTheDocument();

				fireEvent.click(radioButton);

				expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ filterType, criteria: { value: null } });
			});
		});
	});

	describe("clearAll", () => {
		it("call the onChange callback with empty criteria", () => {
			const wrapper = setupTest({ uiValue: { value: true } });

			const clearAllButton = getClearAllButton(wrapper);
			fireEvent.click(clearAllButton);

			expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith({ filterType });
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
			describe("given initialFilterOptions with value `true`", () => {
				it("the `yes` radio item should be selected initially", () => {
					const wrapper = setupTest({ uiValue: { value: true } });

					expect(wrapper.getByLabelText(en.overviewEngine.filterOptionView.true).element).toBeChecked();
				});
			});

			describe("given initialFilterOptions with value `null`", () => {
				it("the `null` radio item should be selected initially", () => {
					const wrapper = setupTest({ uiValue: { value: null } });

					expect(wrapper.getByLabelText(en.overviewEngine.filterOptionView.null).element).toBeChecked();
				});
			});

			describe("given no initialFilterOptions", () => {
				it("no option is selected", () => {
					const wrapper = setupTest();

					expect(wrapper.getByLabelText(en.overviewEngine.filterOptionView.true).element).not.toBeChecked();
					expect(wrapper.getByLabelText(en.overviewEngine.filterOptionView.null).element).not.toBeChecked();
				});
			});
		});

		describe("disabled", () => {
			describe("given true", () => {
				it("disables the clear button and radio options", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: true } });

					expect(getClearAllButton(wrapper)).toBeDisabled();

					wrapper.getAllByDataRole(DataRoles.Radio.Input).forEach((radio) => {
						expect(radio).toBeDisabled();
					});
				});
			});

			describe("given false", () => {
				describe("given no radio button is checked", () => {
					it("disables the clear button", () => {
						const wrapper = setupTest(undefined, { uiState: { disabled: false } });

						expect(getClearAllButton(wrapper)).toBeDisabled();
					});
				});

				describe("given a radio is checked", () => {
					it("enables the clear button", () => {
						const wrapper = setupTest({ uiValue: { value: true } }, { uiState: { disabled: false } });

						expect(getClearAllButton(wrapper)).toBeEnabled();
					});
				});

				it("enables the radio widgets", () => {
					const wrapper = setupTest(undefined, { uiState: { disabled: false } });

					wrapper.getAllByDataRole(DataRoles.Radio.Input).forEach((radio) => {
						expect(radio).toBeEnabled();
					});
				});
			});
		});

		it("renders radio options of Confirm field filter in the correct order: null, true", () => {
			const wrapper = setupTest();

			const radioInputs = wrapper.getAllByDataRole(DataRoles.Radio.Input);
			const expectedOrder = [en.overviewEngine.filterOptionView.null, en.overviewEngine.filterOptionView.true];

			expect(radioInputs).toHaveLength(2);

			expectedOrder.forEach((expectedLabel, index) => {
				const radioInput = radioInputs[index];
				const labelElement = wrapper.getByLabelText(expectedLabel).element;
				expect(radioInput).toBe(labelElement);
			});
		});

		describe("hideEmptyValueOption", () => {
			it("removes the null option when true", () => {
				const wrapper = setupTest({ hideEmptyValueOption: true });

				expect(wrapper.queryByLabelText(en.overviewEngine.filterOptionView.null).element).toBeNull();

				const radioInputs = wrapper.getAllByDataRole(DataRoles.Radio.Input);
				expect(radioInputs).toHaveLength(1);
				expect(wrapper.getByLabelText(en.overviewEngine.filterOptionView.true).element).toBe(radioInputs[0]);
			});
		});
	});
});
