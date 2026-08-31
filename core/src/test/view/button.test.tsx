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

import { it, expect, describe, beforeEach } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../main/overview-model.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";
import { enLocale, defaultEngineProps } from "../basic.spec.js";
import { render, ClassNames, type QueriableElement } from "../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.button", () => {
	const basicEngineProps = defaultEngineProps;

	const subHeaderBoxButtons: OverviewModel.ButtonElement[] = [
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "A",
			label: [{ locale: enLocale.language, text: "A" }],
			styles: ["styleA"],
			primary: true,
			destructive: false
		},
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "B",
			label: [{ locale: enLocale.language, text: "B" }],
			styles: ["styleB1", "styleB2"],
			primary: false,
			destructive: true
		},
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "C",
			label: [{ locale: enLocale.language, text: "C" }],
			confirmation: {
				title: [{ text: "Confirmation Title Test", locale: enLocale.language }],
				message: [{ text: "Confirmation Message Test", locale: enLocale.language }]
			},
			styles: [],
			primary: true,
			destructive: false
		}
	];

	const footerBoxButtons: OverviewModel.ButtonElement[] = [
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "D",
			label: [{ locale: enLocale.language, text: "D" }],
			styles: ["styleD"],
			primary: true,
			destructive: false
		},
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "E",
			label: [{ locale: enLocale.language, text: "E" }],
			confirmation: {
				title: [{ text: "Confirmation Title Test", locale: enLocale.language }],
				message: [{ text: "Confirmation Message Test", locale: enLocale.language }]
			},
			styles: ["styleE1", "styleE2"],
			primary: false,
			destructive: true
		},
		{
			type: OverviewModel.ElementType.BUTTON,
			event: "F",
			label: [{ locale: enLocale.language, text: "F" }],
			styles: [],
			primary: true,
			destructive: false
		}
	];

	function setupTest(
		headerButtons = subHeaderBoxButtons,
		footerButtons = footerBoxButtons,
		multiSelection?: OverviewModel.MultiSelection
	): QueriableElement {
		const overviewModel = {
			...basicEngineProps.overviewModel,
			content: {
				...basicEngineProps.overviewModel.content,
				subHeaderBox: { leftSlot: headerButtons },
				footerBox: { leftSlot: footerButtons },
				multiSelection
			}
		};

		const props = {
			...basicEngineProps,
			overviewModel
		};

		return render(<OverviewEngine {...props} />);
	}

	let wrapper: QueriableElement;

	beforeEach(() => {
		wrapper = setupTest();
	});

	it("isStylable", () => {
		const testButton = (buttonInput: OverviewModel.ButtonElement) => {
			const actualButton = wrapper
				.getAllByDataRole("button")
				.find((button) => button.textContent === buttonInput.label?.[0].text);

			buttonInput.styles?.forEach((style) => {
				expect(actualButton).toHaveClass(style);
			});
		};

		subHeaderBoxButtons.forEach(testButton);
		footerBoxButtons.forEach(testButton);
	});

	it("hasCorrectProps", () => {
		const testButton = (buttonInput: OverviewModel.ButtonElement) => {
			const actualButton = wrapper
				.getAllByDataRole(DataRoles.Button)
				.find((button) => button.textContent === buttonInput.label?.[0].text);

			expect(actualButton).toBeDefined();
			expect(actualButton?.classList.contains(`${ClassNames.Button}--primary`)).toEqual(buttonInput.primary);
			expect(actualButton?.classList.contains(`${ClassNames.Button}--destructive`)).toEqual(buttonInput.destructive);
		};

		subHeaderBoxButtons.forEach(testButton);
		footerBoxButtons.forEach(testButton);
	});

	describe("Confirmation Dialog", () => {
		it("should work properly with subheader and footer buttons", () => {
			const checkButtonConfirmationDialog = (buttonInput: OverviewModel.ButtonElement) => {
				const actualButton = wrapper
					.getAllByDataRole(DataRoles.Button)
					.find((button) => button.textContent === buttonInput.label?.[0].text);

				expect(actualButton).toBeDefined();

				if (actualButton) {
					actualButton.click();
				}

				const modal = wrapper.query(`[data-role="${DataRoles.Modal.OverlayContent}"]`);

				if (buttonInput.confirmation) {
					expect(modal?.element).not.toBeNull();

					if (modal) {
						const modalButtons = modal.getAllByDataRole(DataRoles.Button);

						if (modalButtons?.length) {
							modalButtons[0].click();
						}
					}
				} else {
					expect(modal).toBeNull();
				}
			};

			subHeaderBoxButtons.forEach(checkButtonConfirmationDialog);
			footerBoxButtons.forEach(checkButtonConfirmationDialog);
		});
	});

	describe("label, description and aria-label", () => {
		type ExpectedButton = { label: string; ariaLabel: string | null };
		type TestCase = { inputButtons: OverviewModel.ButtonElement[]; expectedButtons: ExpectedButton[] };

		const testButton = (actualButton: HTMLElement, expectedButton: ExpectedButton) => {
			expect(actualButton).toHaveTextContent(expectedButton.label);
			expect(actualButton.getAttribute("aria-label")).toEqual(expectedButton.ariaLabel);
		};

		it("when labelHidden = undefined", () => {
			const basedHeaderButton: OverviewModel.ButtonElement = {
				...subHeaderBoxButtons[1],
				description: [{ locale: enLocale.language, text: "description B" }],
				labelHidden: undefined
			};

			const testCase: TestCase = {
				inputButtons: [
					{ ...basedHeaderButton },
					{ ...basedHeaderButton, event: "B2", label: undefined },
					{ ...basedHeaderButton, event: "B3", description: undefined },
					{ ...basedHeaderButton, event: "B4", label: undefined, description: undefined }
				],
				expectedButtons: [
					{ label: "B", ariaLabel: "B - description B" },
					{ label: "", ariaLabel: "description B" },
					{ label: "B", ariaLabel: "B" },
					{ label: "", ariaLabel: null }
				]
			};

			setupTest(
				[testCase.inputButtons[0], testCase.inputButtons[1]],
				[testCase.inputButtons[2], testCase.inputButtons[3]]
			)
				.getAllByDataRole(DataRoles.Button)
				.forEach((button, buttonIndex) => testButton(button, testCase.expectedButtons[buttonIndex]));
		});

		it("when labelHidden = true", () => {
			const basedHeaderButton: OverviewModel.ButtonElement = {
				...subHeaderBoxButtons[1],
				description: [{ locale: enLocale.language, text: "description B" }],
				labelHidden: true
			};

			const testCase: TestCase = {
				inputButtons: [
					{ ...basedHeaderButton },
					{ ...basedHeaderButton, event: "B2", label: undefined },
					{ ...basedHeaderButton, event: "B3", description: undefined },
					{ ...basedHeaderButton, event: "B4", label: undefined, description: undefined }
				],
				expectedButtons: [
					{ label: "", ariaLabel: "B - description B" },
					{ label: "", ariaLabel: "description B" },
					{ label: "", ariaLabel: "B" },
					{ label: "", ariaLabel: null }
				]
			};

			setupTest(
				[testCase.inputButtons[0], testCase.inputButtons[1]],
				[testCase.inputButtons[2], testCase.inputButtons[3]]
			)
				.getAllByDataRole(DataRoles.Button)
				.forEach((button, buttonIndex) => testButton(button, testCase.expectedButtons[buttonIndex]));
		});
	});
});
