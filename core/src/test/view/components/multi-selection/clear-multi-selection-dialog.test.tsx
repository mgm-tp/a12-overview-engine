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

import type { OverviewModel } from "../../../../main/overview-model.js";
import { en } from "../../../../main/services/localization/internal/languages/en.js";

import { noop } from "../../../utils.js";
import { deLocale, enLocale } from "../../../basic.spec.js";
import { DataRoles, type QueriableElement } from "../../../test-utils.js";

import {
	setupMultiSelection,
	disabledMultiSelection,
	multiSelectionToString,
	noneClearConfirmationMultiSelection,
	customClearConfirmationMultiSelection,
	defaultClearConfirmationMultiSelection
} from "./utils.js";

const submitInput = (result: QueriableElement) => {
	const input = result.getByDataRole(DataRoles.Textline.Input).element;
	const keyDownEvent = { key: "Enter", target: { value: "Hello" } };
	fireEvent.keyDown(input, keyDownEvent);
};

describe("com.mgmtp.a12.overview-engine.view.components.multi-selection.clear-multi-selection-dialog", () => {
	const testCases = [
		[disabledMultiSelection, true, false],
		[disabledMultiSelection, false, false],
		[noneClearConfirmationMultiSelection, true, false],
		[noneClearConfirmationMultiSelection, false, false],
		[defaultClearConfirmationMultiSelection, false, false],
		[customClearConfirmationMultiSelection, false, false],
		[defaultClearConfirmationMultiSelection, true, true],
		[customClearConfirmationMultiSelection, true, true]
	] as [OverviewModel.MultiSelection | undefined, boolean, boolean][];

	describe("Search bar", () => {
		testCases.forEach(([multiSelection, selected, shouldShowDialog]) => {
			describe(multiSelectionToString(multiSelection), () => {
				describe(`given ${selected ? "one" : "none"} selected document`, () => {
					it(`should ${selected ? "" : "not "}show Confirmation Dialog`, () => {
						const wrapper = setupMultiSelection(multiSelection, {
							eventHandlers: { onSearch: noop },
							uiState: { rowState: { 0: { selected } } },
							asBaseElement: true
						});

						submitInput(wrapper);

						expect(wrapper.queryAllByDataRole(DataRoles.Modal.Overlay)).toHaveLength(shouldShowDialog ? 1 : 0);
					});
				});
			});
		});

		describe("props", () => {
			const englishLabels = ["Clear selection", "Cancel"];
			const germanLabels = ["Auswahl Löschen", "Abbrechen"];
			const propsTestCases = [
				{
					multiSelection: defaultClearConfirmationMultiSelection,
					locale: enLocale,
					label: englishLabels,
					title: "Warning",
					message:
						"If you filter, search or collapse the multi-selection panel, all selected documents will be cleared. Do you want to continue?"
				},
				{
					multiSelection: customClearConfirmationMultiSelection,
					locale: enLocale,
					label: englishLabels,
					title: "Delete Title",
					message: "Delete?"
				},
				{
					multiSelection: defaultClearConfirmationMultiSelection,
					locale: deLocale,
					label: germanLabels,
					title: "Warnung",
					message:
						"Durch Filtern, Suchen oder Einklappen des Mehrfachauswahlfelds wird die Auswahl der Dokumente zurückgesetzt. Sind Sie sicher, dass Sie fortfahren möchten?"
				},
				{
					multiSelection: customClearConfirmationMultiSelection,
					locale: deLocale,
					label: germanLabels,
					title: "Titel löschen",
					message: "Löschen?"
				}
			];

			propsTestCases.forEach(({ multiSelection, locale, label, title, message }) => {
				describe(multiSelectionToString(multiSelection), () => {
					describe("given locale = " + locale.language, () => {
						it("should render props properly", () => {
							const wrapper = setupMultiSelection(
								multiSelection,
								{
									eventHandlers: { onSearch: noop, onMultiSelectionClear: noop },
									uiState: { rowState: { 0: { selected: true } } },
									asBaseElement: true
								},
								locale
							);

							submitInput(wrapper);

							const dialog = wrapper.getByDataRole(DataRoles.Modal.Overlay);

							expect(dialog.getByDataRole(DataRoles.Contentbox.Title).element).toHaveTextContent(title);
							expect(dialog.getByDataRole(DataRoles.Contentbox.Content).element).toHaveTextContent(message);
							expect(dialog.getByText(label[0]).element).toBeInTheDocument();
							expect(dialog.getByText(label[1]).element).toBeInTheDocument();
						});
					});
				});
			});
		});

		describe("when user cancels to clear selected documents", () => {
			it("should hide dialog, not perform clear selected documents and search operation", () => {
				const onMultiSelectionClear = vi.fn();
				const onSearch = vi.fn();
				const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
					eventHandlers: {
						onSearch,
						onMultiSelectionClear
					},
					uiState: { rowState: { 0: { selected: true } } },
					asBaseElement: true
				});
				submitInput(wrapper);

				const cancelButton = wrapper.getByText(en.overviewEngine.multiSelection.clearConfirmation.cancel).element;

				expect(cancelButton).toBeInTheDocument();
				expect(wrapper.getByDataRole(DataRoles.Modal.Overlay).element).toBeInTheDocument();

				fireEvent.click(cancelButton);

				expect(onMultiSelectionClear).not.toHaveBeenCalled();
				expect(onSearch).not.toHaveBeenCalled();
				expect(wrapper.queryByDataRole(DataRoles.Modal.Overlay).element).not.toBeInTheDocument();
			});
		});

		describe("when user confirms to clear selected documents", () => {
			it("should hide dialog, perform clear selected documents and search operation", () => {
				const onMultiSelectionClear = vi.fn();
				const onSearch = vi.fn();
				const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
					eventHandlers: {
						onSearch,
						onMultiSelectionClear
					},
					uiState: { rowState: { 0: { selected: true } } },
					asBaseElement: true
				});

				submitInput(wrapper);

				const confirmButton = wrapper.getByText(en.overviewEngine.multiSelection.clearConfirmation.ok).element;

				expect(confirmButton).toBeInTheDocument();
				expect(wrapper.getByDataRole(DataRoles.Modal.Overlay).element).toBeInTheDocument();

				fireEvent.click(confirmButton);

				expect(onMultiSelectionClear).toHaveBeenCalledOnce();
				expect(onSearch).toHaveBeenCalledOnce();
				expect(wrapper.queryByDataRole(DataRoles.Modal.Overlay).element).not.toBeInTheDocument();
			});
		});
	});
});
