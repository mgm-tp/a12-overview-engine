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
import { it, vi, expect, describe, type Mock } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../../../main/overview-model.js";
import type { OverviewEngine } from "../../../../main/view/overview-engine.js";
import { en } from "../../../../main/services/localization/internal/languages/en.js";

import { defaultEngineProps } from "../../../basic.spec.js";
import type { QueriableElement } from "../../../test-utils.js";

import { setupMultiSelection, defaultClearConfirmationMultiSelection } from "./utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.multi-selection.multi-selection-button", () => {
	const basicMultiSelection: OverviewModel.MultiSelection = defaultClearConfirmationMultiSelection;

	function queryExpandedPanel(wrapper: QueriableElement) {
		return wrapper.queryByDataRole(DataRoles.Counter).element;
	}

	describe("visibility", () => {
		it("should show only when collapseOption = COLLAPSIBLE_COLLAPSED)", () => {
			const wrapper = setupMultiSelection(basicMultiSelection, {
				uiState: { expandedMultiSelection: false }
			});

			expect(
				wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.expandTitle).element
			).toBeInTheDocument();
		});

		it("should show only when collapseOption = COLLAPSIBLE_EXPANDED)", () => {
			const wrapper = setupMultiSelection({
				...basicMultiSelection,
				collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
			});

			expect(
				wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
			).toBeInTheDocument();
		});

		it("should not show only when collapseOption = NON_COLLAPSIBLE)", () => {
			const wrapper = setupMultiSelection({
				...basicMultiSelection,
				collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
			});

			expect(
				wrapper.queryByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.expandTitle).element
			).not.toBeInTheDocument();
			expect(
				wrapper.queryByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
			).not.toBeInTheDocument();
		});
	});

	describe("collapseOption", () => {
		describe("given collapseOption = COLLAPSIBLE_COLLAPSED", () => {
			it("the panel should be collapsed in initial state", () => {
				const wrapper = setupMultiSelection(basicMultiSelection, {
					uiState: { expandedMultiSelection: false }
				});

				expect(queryExpandedPanel(wrapper)).not.toBeInTheDocument();
			});
		});

		describe("given collapseOption = COLLAPSIBLE_EXPANDED", () => {
			it("the panel should be expanded in initial state", () => {
				const wrapper = setupMultiSelection({
					...basicMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				});

				expect(queryExpandedPanel(wrapper)).toBeInTheDocument();
			});

			describe("given collapseOption = NON_COLLAPSIBLE", () => {
				it("the panel should be expanded in initial state", () => {
					const wrapper = setupMultiSelection({
						...basicMultiSelection,
						collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
					});

					expect(queryExpandedPanel(wrapper)).toBeInTheDocument();
				});
			});
		});

		describe("onClick", () => {
			let onMultiSelectionButtonClick: Mock;

			describe("when the panel is collapsed", () => {
				it("should be expanded after clicking", () => {
					onMultiSelectionButtonClick = vi.fn();
					const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
						uiState: { expandedMultiSelection: false },
						eventHandlers: { onMultiSelectionButtonClick }
					});

					fireEvent.click(
						wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.expandTitle).element
					);

					expect(onMultiSelectionButtonClick).toHaveBeenCalledOnce();
				});
			});

			describe("when the panel is expanded", () => {
				const initialExpandedMultiSelection: OverviewModel.MultiSelection = {
					...basicMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				};
				const customOverviewEngineProps: Partial<OverviewEngine.PaginatedProps> = {
					uiState: { rowState: { "1": { selected: true } } }
				};

				describe("when no given clearConfirmation in model", () => {
					it("should collapse silently", () => {
						onMultiSelectionButtonClick = vi.fn();
						const wrapper = setupMultiSelection(
							{ ...initialExpandedMultiSelection, clearConfirmation: undefined },
							{ ...customOverviewEngineProps, eventHandlers: { onMultiSelectionButtonClick } }
						);

						fireEvent.click(
							wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
						);

						expect(onMultiSelectionButtonClick).toHaveBeenCalledOnce();
					});
				});

				describe("when no selected rows", () => {
					it("should collapse silently", () => {
						onMultiSelectionButtonClick = vi.fn();
						const wrapper = setupMultiSelection(initialExpandedMultiSelection, {
							...customOverviewEngineProps,
							uiState: { rowState: undefined },
							eventHandlers: { onMultiSelectionButtonClick }
						});

						fireEvent.click(
							wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
						);

						expect(onMultiSelectionButtonClick).toHaveBeenCalledOnce();
					});
				});

				describe.skip("when given clearMultiSelection config in model AND has selected rows", () => {
					it("should show the confirmation dialog", () => {
						const wrapper = setupMultiSelection(initialExpandedMultiSelection, {
							...customOverviewEngineProps,
							asBaseElement: true
						});

						fireEvent.click(
							wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
						);

						expect(queryExpandedPanel(wrapper)).toBeInTheDocument();

						expect(wrapper.getByDataRole(DataRoles.Modal.Overlay).element).toBeInTheDocument();
					});

					it("should still be expanded if clicking the Cancel button", () => {
						const clearConfirmationSpy = vi.fn();
						const wrapper = setupMultiSelection(initialExpandedMultiSelection, {
							...customOverviewEngineProps,
							eventHandlers: { onMultiSelectionClear: clearConfirmationSpy },
							asBaseElement: true
						});

						fireEvent.click(
							wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
						);
						fireEvent.click(wrapper.getByText(en.overviewEngine.multiSelection.clearConfirmation.cancel).element);

						expect(queryExpandedPanel(wrapper)).toBeInTheDocument();
						expect(wrapper.queryByDataRole(DataRoles.Modal.Overlay).element).not.toBeInTheDocument();
						expect(clearConfirmationSpy).not.toHaveBeenCalled();
					});

					it("should be collapsed if clicking the Confirm button", () => {
						const clearConfirmationSpy = vi.fn();
						const wrapper = setupMultiSelection(initialExpandedMultiSelection, {
							...customOverviewEngineProps,
							eventHandlers: { onMultiSelectionClear: clearConfirmationSpy },
							asBaseElement: true
						});

						fireEvent.click(
							wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
						);
						fireEvent.click(wrapper.getByText(en.overviewEngine.multiSelection.clearConfirmation.ok).element);

						expect(queryExpandedPanel(wrapper)).not.toBeInTheDocument();
						expect(wrapper.queryByDataRole(DataRoles.Modal.Overlay).element).not.toBeInTheDocument();
						expect(clearConfirmationSpy).toHaveBeenCalledOnce();
					});
				});
			});
		});

		describe("disabled", () => {
			it("should disable button when disabled = true", () => {
				const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
					uiState: { disabled: true, expandedMultiSelection: false }
				});

				expect(
					wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.expandTitle).element
				).toBeDisabled();
			});

			it("should enable button when disabled = false", () => {
				const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
					uiState: { disabled: false, expandedMultiSelection: false }
				});

				expect(
					wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.expandTitle).element
				).toBeEnabled();
			});
		});

		describe("title", () => {
			it("should render proper title in collapsed state", () => {
				const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
					uiState: { expandedMultiSelection: false }
				});

				expect(
					wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.expandTitle).element
				).toBeInTheDocument();
			});

			it("should render proper title in expanded state", () => {
				const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
					uiState: { expandedMultiSelection: true }
				});

				expect(
					wrapper.getByLabelText(en.overviewEngine.multiSelection.multiSelectionButton.collapseTitle).element
				).toBeInTheDocument();
			});
		});
	});

	describe("confirmation", () => {
		const basicButton: OverviewModel.Button = {
			event: "A"
		};
		const nonConfirmationButton = { ...basicButton };
		const basicEngineProps: OverviewEngine.Props = {
			...defaultEngineProps,
			uiState: { rowState: { "1": { selected: true } } }
		};
		const basicMultiSelection = {
			counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
			collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
		} as OverviewModel.MultiSelection;
		const onEventButtonClickSpy = vi.fn();

		describe.skip("given button without confirmation", () => {
			it("should call the callback and not be rendered dialog", () => {
				const wrapper = setupMultiSelection(
					{ ...basicMultiSelection, buttons: [nonConfirmationButton] },
					{
						...basicEngineProps,
						eventHandlers: {
							...basicEngineProps.eventHandlers,
							onEventButtonClick: onEventButtonClickSpy
						}
					}
				);

				const overviewButton = wrapper.getByDataRole(DataRoles.ButtonGroup).getByDataRole(DataRoles.Button).element;

				expect(overviewButton).toBeInTheDocument();

				fireEvent.click(overviewButton);

				expect(wrapper.queryByDataRole(DataRoles.Modal.Overlay).element).not.toBeInTheDocument();
				expect(onEventButtonClickSpy).toHaveBeenCalledExactlyOnceWith(
					nonConfirmationButton.event,
					nonConfirmationButton
				);
			});
		});

		describe.skip("given button with confirmation", () => {
			it("should not call the callback and rendered dialog", () => {
				const customConfirmationButton = {
					...basicButton,
					confirmation: {
						title: [{ text: "Confirmation Title Test", locale: "en" }],
						message: [{ text: "Confirmation Message Test", locale: "en" }]
					}
				};
				const wrapper = setupMultiSelection(
					{ ...basicMultiSelection, buttons: [customConfirmationButton] },
					{
						...basicEngineProps,
						eventHandlers: {
							...basicEngineProps.eventHandlers,
							onEventButtonClick: onEventButtonClickSpy
						},
						asBaseElement: true
					}
				);

				const overviewButton = wrapper.getByDataRole(DataRoles.ButtonGroup).getByDataRole(DataRoles.Button).element;

				expect(overviewButton).toBeInTheDocument();

				fireEvent.click(overviewButton);

				expect(wrapper.getByDataRole(DataRoles.Modal.Overlay).element).toBeInTheDocument();
				expect(onEventButtonClickSpy).not.toHaveBeenCalled();
			});
		});
	});
});
