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

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { de } from "../../../main/services/localization/internal/languages/de.js";
import { en } from "../../../main/services/localization/internal/languages/en.js";
import { OverviewEngineInternalConstants } from "../../../main/shared/constants.js";
import { deLocale, enLocale } from "../../basic.spec.js";
import type { QueriableElement } from "../../test-utils.js";

import { setupMultiSelection, defaultClearConfirmationMultiSelection } from "./multi-selection/utils.js";

const findInput = (wrapper: QueriableElement) => {
	return wrapper.getByDataRole(DataRoles.TextField.Input).element;
};

describe("com.mgmtp.a12.overview-engine.view.components.search-bar", () => {
	const onSearchSpy = vi.fn();
	const onMultiSelectionClear = vi.fn();

	beforeEach(() => {
		onSearchSpy.mockReset();
		onMultiSelectionClear.mockReset();
	});

	describe(`When user uses keyboard to start a search with key "Enter"`, () => {
		it(`should trigger search event when search field has no data`, () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
				eventHandlers: { onSearch: onSearchSpy },
				uiState: { rowState: {} }
			});

			fireEvent.keyDown(findInput(wrapper), { key: "Enter", currentTarget: { value: "" } });

			expect(onSearchSpy).toHaveBeenCalledOnce();
		});

		it(`should trigger search event when search field has data`, () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
				eventHandlers: { onSearch: onSearchSpy },
				uiState: { rowState: {} }
			});

			fireEvent.keyDown(findInput(wrapper), { key: "Enter", currentTarget: { value: "Tennis" } });

			expect(onSearchSpy).toHaveBeenCalledOnce();
		});
	});

	describe("minimum search token size", () => {
		const minSearchableTokenSize = 3;
		const reduxState = {
			dataservices: {
				configuration: {
					[OverviewEngineInternalConstants.MIN_SEARCH_TOKEN_SIZE_KEY]: String(minSearchableTokenSize)
				}
			}
		};

		it("disables search interactions when the keyword is shorter than required", () => {
			const wrapper = setupMultiSelection(
				defaultClearConfirmationMultiSelection,
				{
					eventHandlers: { onSearch: onSearchSpy },
					uiState: { rowState: {} }
				},
				undefined,
				undefined,
				{ reduxState }
			);

			fireEvent.change(findInput(wrapper), { target: { value: "ab" } });
			fireEvent.keyDown(findInput(wrapper), { key: "Enter", currentTarget: { value: "ab" } });

			expect(onSearchSpy).not.toHaveBeenCalled();

			const minLengthLabel = en.overviewEngine.searchBar.searchButtonMinLengthTitle.replace(
				"$count$",
				String(minSearchableTokenSize)
			);
			const searchButton = wrapper.getByLabelText(minLengthLabel, {
				selector: "button"
			}).element;

			expect(searchButton).toBeDisabled();

			fireEvent.click(searchButton);
			expect(onSearchSpy).not.toHaveBeenCalled();
		});

		it("enables search when the minimum keyword length is met", () => {
			const wrapper = setupMultiSelection(
				defaultClearConfirmationMultiSelection,
				{
					eventHandlers: { onSearch: onSearchSpy },
					uiState: { rowState: {} }
				},
				undefined,
				undefined,
				{ reduxState }
			);

			fireEvent.change(findInput(wrapper), { target: { value: "able" } });

			const searchButton = wrapper.getByLabelText(en.overviewEngine.searchBar.searchButtonTitle, {
				selector: "button"
			}).element;

			expect(searchButton).not.toBeDisabled();

			fireEvent.click(searchButton);

			expect(onSearchSpy).toHaveBeenCalledOnce();
		});
	});

	describe("When user triggers search by clicking search button", () => {
		it("should trigger search when search field has no data", () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
				eventHandlers: { onSearch: onSearchSpy },
				uiState: { rowState: {} }
			});

			fireEvent.click(
				wrapper.getByLabelText(en.overviewEngine.searchBar.searchButtonTitle, {
					selector: "button"
				}).element
			);

			expect(onSearchSpy).toHaveBeenCalledOnce();
		});

		it("should trigger search when search field has data", () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
				eventHandlers: { onSearch: onSearchSpy },
				uiState: { rowState: {} }
			});
			fireEvent.change(findInput(wrapper), { target: { value: "Hello" } });

			fireEvent.click(
				wrapper.getByLabelText(en.overviewEngine.searchBar.searchButtonTitle, {
					selector: "button"
				}).element
			);

			expect(onSearchSpy).toHaveBeenCalledOnce();
		});
	});

	describe("confirmation dialog", () => {
		it(`should show the confirmation dialog when there is any selected document`, () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
				uiState: {
					rowState: { 0: { selected: true } }
				},
				eventHandlers: {
					onSearch: onSearchSpy,
					onMultiSelectionClear: onMultiSelectionClear
				},
				asBaseElement: true
			});

			fireEvent.keyDown(findInput(wrapper), { key: "Enter", currentTarget: { value: "Tennis" } });

			expect(wrapper.getByDataRole(DataRoles.Modal.Overlay).element).toBeInTheDocument();
			expect(onSearchSpy).not.toHaveBeenCalled();

			fireEvent.click(wrapper.getByText(en.overviewEngine.multiSelection.clearConfirmation.ok).element);

			expect(wrapper.queryByDataRole(DataRoles.Modal.Overlay).element).not.toBeInTheDocument();
			expect(onSearchSpy).toHaveBeenCalledOnce();
		});
	});

	describe("given different locale", () => {
		describe("title, aria-label of search button and label of input field", () => {
			it(`should be equal to "Search" label when locale is English`, () => {
				const wrapper = setupMultiSelection(
					defaultClearConfirmationMultiSelection,
					{ eventHandlers: { onSearch: onSearchSpy } },
					enLocale
				);

				expect(
					wrapper.getByLabelText(en.overviewEngine.searchBar.searchButtonTitle, {
						selector: "button"
					}).element
				).toBeInTheDocument();
			});

			it(`should be equal to "Suche" label when locale is German`, () => {
				const wrapper = setupMultiSelection(
					defaultClearConfirmationMultiSelection,
					{ eventHandlers: { onSearch: onSearchSpy } },
					deLocale
				);

				expect(
					wrapper.getByLabelText(de.overviewEngine.searchBar.searchButtonTitle, {
						selector: "button"
					}).element
				).toBeInTheDocument();
			});
		});
	});
});
