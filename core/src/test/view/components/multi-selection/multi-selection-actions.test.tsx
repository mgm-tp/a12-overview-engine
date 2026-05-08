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

import "../../../setup/jsdom.js";

import { it, vi, expect, describe } from "vitest";
import { fireEvent } from "@testing-library/react";

import { OverviewModel } from "../../../../main/overview-model.js";
import { en } from "../../../../main/services/localization/internal/languages/en.js";
import { de } from "../../../../main/services/localization/internal/languages/de.js";

import { DataRoles } from "../../../test-utils.js";
import { deLocale, enLocale } from "../../../basic.spec.js";

import { setupMultiSelection } from "./utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.multi-selection.multi-selection-actions", () => {
	const actionBarGroupRole = "toolbar";
	const buttonA = {
		event: "merge_event",
		label: [
			{
				locale: "en",
				text: "Merge"
			},
			{
				locale: "de",
				text: "Verschmelzen"
			}
		],
		title: [
			{
				locale: "en",
				text: "Merge"
			},
			{
				locale: "de",
				text: "Verschmelzen"
			}
		]
	};

	const buttonB = {
		event: "b_event",
		label: [
			{
				locale: "en",
				text: "Cancel"
			},
			{
				locale: "de",
				text: "Abbrechen"
			}
		]
	};

	const basicMultiSelection = {
		collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED,
		counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
		buttons: [buttonA, buttonB]
	} as OverviewModel.MultiSelection;

	describe("display", () => {
		describe("given multiSelection = undefined", () => {
			it("should not be rendered", () => {
				const wrapper = setupMultiSelection();

				expect(wrapper.queryByLabelText(buttonA.label[0].text).element).not.toBeInTheDocument();
				expect(wrapper.queryByLabelText(buttonB.label[0].text).element).not.toBeInTheDocument();
			});
		});

		describe("given actions = undefined", () => {
			it("should not be rendered", () => {
				const wrapper = setupMultiSelection({
					...basicMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE,
					buttons: undefined
				});

				expect(wrapper.queryByLabelText(buttonA.label[0].text).element).not.toBeInTheDocument();
				expect(wrapper.queryByLabelText(buttonB.label[0].text).element).not.toBeInTheDocument();
			});
		});

		describe("given empty actions", () => {
			it("should not be rendered", () => {
				const wrapper = setupMultiSelection({
					...basicMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE,
					buttons: []
				});

				expect(wrapper.queryByLabelText(buttonA.label[0].text).element).not.toBeInTheDocument();
				expect(wrapper.queryByLabelText(buttonB.label[0].text).element).not.toBeInTheDocument();
			});
		});

		describe("given collapseOption = collapsible_collapsed", () => {
			it("should not be rendered initially", () => {
				const wrapper = setupMultiSelection(
					{
						...basicMultiSelection,
						collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED
					},
					{ uiState: { expandedMultiSelection: false } }
				);

				expect(wrapper.queryByLabelText(buttonA.label[0].text).element).not.toBeInTheDocument();
				expect(wrapper.queryByLabelText(buttonB.label[0].text).element).not.toBeInTheDocument();
			});

			describe("when click multi-selection button", () => {
				it("should call onExpandedMultiSelectionChange", () => {
					const onMultiSelectionButtonClick = vi.fn();
					const wrapper = setupMultiSelection(
						{
							...basicMultiSelection,
							collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED
						},
						{
							uiState: { expandedMultiSelection: false },
							eventHandlers: { onMultiSelectionButtonClick }
						}
					);

					fireEvent.click(
						wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.expandTitle).element
					);

					expect(onMultiSelectionButtonClick).toHaveBeenCalledOnce();
				});
			});
		});

		describe("given collapseOption = collapsible_expanded", () => {
			it("should be rendered initially", () => {
				const wrapper = setupMultiSelection({
					...basicMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				});

				expect(wrapper.getByLabelText(buttonA.label[0].text).element).toBeInTheDocument();
				expect(wrapper.getByLabelText(buttonB.label[0].text).element).toBeInTheDocument();
			});

			describe("buttons labels", () => {
				it("should be rendered initially when given English locale", () => {
					const wrapper = setupMultiSelection(
						{
							...basicMultiSelection,
							collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
						},
						undefined,
						enLocale
					);

					fireEvent.click(
						wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
					);

					expect(wrapper.queryByLabelText(buttonA.label[0].text).element).toBeInTheDocument();
					expect(wrapper.queryByLabelText(buttonB.label[0].text).element).toBeInTheDocument();
				});

				it("should be rendered initially when given German locale", () => {
					const wrapper = setupMultiSelection(
						{
							...basicMultiSelection,
							collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
						},
						undefined,
						deLocale
					);

					fireEvent.click(
						wrapper.getByLabelText(de.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
					);

					expect(wrapper.queryByLabelText(buttonA.label[1].text).element).toBeInTheDocument();
					expect(wrapper.queryByLabelText(buttonB.label[1].text).element).toBeInTheDocument();
				});
			});
		});

		describe("given collapseOption = non_collapsible", () => {
			it("should be rendered", () => {
				const wrapper = setupMultiSelection({
					...basicMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
				});

				expect(wrapper.getByLabelText(buttonA.label[0].text).element).toBeInTheDocument();
				expect(wrapper.getByLabelText(buttonB.label[0].text).element).toBeInTheDocument();
			});
		});
	});

	describe("actionBarGroup", () => {
		it("should display the correct number of buttons", () => {
			const wrapper = setupMultiSelection(basicMultiSelection);

			expect(
				wrapper.getByRole(actionBarGroupRole).getByDataRole(DataRoles.ButtonGroup).getAllByDataRole(DataRoles.Button)
			).toHaveLength(2);
		});
	});

	describe("disability", () => {
		describe("when none of rows are selected", () => {
			it("should be render but disabled initially", () => {
				const wrapper = setupMultiSelection(basicMultiSelection);

				expect(wrapper.getByLabelText(buttonA.label[0].text).element).toBeDisabled();
				expect(wrapper.getByLabelText(buttonB.label[0].text).element).toBeDisabled();
			});
		});

		describe("when some rows are selected", () => {
			it("should be enabled", () => {
				const wrapper = setupMultiSelection(basicMultiSelection, {
					uiState: {
						rowState: {
							1: { selected: true }
						},
						expandedMultiSelection: true
					}
				});

				expect(wrapper.getByLabelText(buttonA.label[0].text).element).toBeEnabled();
				expect(wrapper.getByLabelText(buttonB.label[0].text).element).toBeEnabled();
			});
		});

		describe("when some rows are selected but context disabled = true", () => {
			it("should be disabled", () => {
				const wrapper = setupMultiSelection(basicMultiSelection, {
					uiState: {
						rowState: {
							1: { selected: true }
						},
						expandedMultiSelection: true,
						disabled: true
					}
				});

				expect(wrapper.getByLabelText(buttonA.label[0].text).element).toBeDisabled();
				expect(wrapper.getByLabelText(buttonB.label[0].text).element).toBeDisabled();
			});
		});
	});

	describe("divider", () => {
		describe("when actions is empty", () => {
			it("should not be rendered", () => {
				const wrapper = setupMultiSelection({ ...basicMultiSelection, buttons: [] });

				expect(wrapper.queryByDataRole(DataRoles.Contentbox.ActionBarGroupDivider).element).not.toBeInTheDocument();
			});
		});

		describe("when actions is not empty but no multiSelection and counter", () => {
			it("should not be rendered", () => {
				const wrapper = setupMultiSelection({
					...basicMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE,
					counterOption: OverviewModel.MultiSelection.CounterOption.NONE,
					buttons: [buttonA]
				});

				expect(wrapper.queryByDataRole(DataRoles.Contentbox.ActionBarGroupDivider).element).not.toBeInTheDocument();
			});

			describe("when actions is not empty and has counter", () => {
				it("should be rendered", () => {
					const wrapper = setupMultiSelection({ ...basicMultiSelection, buttons: [buttonA] });

					expect(wrapper.getByDataRole(DataRoles.Contentbox.ActionBarGroupDivider).element).toBeInTheDocument();
				});
			});

			describe("when actions is not empty and has multiSelectionButton", () => {
				it("should be rendered", () => {
					const wrapper = setupMultiSelection({
						...basicMultiSelection,
						counterOption: OverviewModel.MultiSelection.CounterOption.NONE,
						buttons: [buttonA]
					});

					expect(wrapper.getByDataRole(DataRoles.Contentbox.ActionBarGroupDivider).element).toBeInTheDocument();
				});
			});
		});
	});
});
