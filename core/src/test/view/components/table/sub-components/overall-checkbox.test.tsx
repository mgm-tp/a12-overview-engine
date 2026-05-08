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

import { OverviewModel } from "../../../../../main/overview-model.js";
import { type OverviewEngineApi } from "../../../../../main/view/api.js";
import { en } from "../../../../../main/services/localization/internal/shared.js";

import { mockType } from "../../../../utils.js";
import { DataRoles } from "../../../../test-utils.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import {
	setupMultiSelection,
	disabledMultiSelection,
	noneClearConfirmationMultiSelection,
	defaultClearConfirmationMultiSelection
} from "../../multi-selection/utils.js";

const multiSelectionTestCases = [
	disabledMultiSelection,
	defaultClearConfirmationMultiSelection,
	noneClearConfirmationMultiSelection
];

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.overall-checkbox", () => {
	describe("when multi selection feature is disable, or enable but user do not click multi selection button", () => {
		multiSelectionTestCases.forEach((multiSelection) => {
			it("should hide", () => {
				const wrapper = setupMultiSelection(multiSelection, {
					asBaseElement: true,
					uiState: { expandedMultiSelection: false }
				});

				expect(wrapper.queryByDataRole(DataRoles.Checkbox.Input).element).not.toBeInTheDocument();
			});
		});
	});

	describe("when user click multi selection button", () => {
		it("should render properly", () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection);

			const multiSelectionButton = wrapper.getByDataRole(DataRoles.Button).element;

			expect(multiSelectionButton).toBeInTheDocument();

			fireEvent.click(multiSelectionButton);

			expect(wrapper.getByDataRoles(DataRoles.Table.Header, DataRoles.Checkbox.Input).element).toBeInTheDocument();
		});
	});

	describe("props", () => {
		it("should be disabled when disabled = true", () => {
			const wrapper = setupMultiSelection(
				{
					...defaultClearConfirmationMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				},
				{ uiState: { disabled: true } }
			);

			expect(wrapper.getByDataRoles(DataRoles.Table.Header, DataRoles.Checkbox.Input).element).toBeDisabled();
		});

		it("should be enabled when disabled = false", () => {
			const wrapper = setupMultiSelection(
				{
					...defaultClearConfirmationMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				},
				{ uiState: { disabled: false } }
			);

			expect(wrapper.getByDataRoles(DataRoles.Table.Header, DataRoles.Checkbox.Input).element).toBeEnabled();
		});

		it("title", () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection);

			const multiSelectionButton = wrapper.getByDataRole(DataRoles.Button).element;

			expect(multiSelectionButton).toBeInTheDocument();

			fireEvent.click(multiSelectionButton);

			expect(wrapper.getByDataRoles(DataRoles.Table.Header, DataRoles.Checkbox.Label).element).toHaveTextContent(
				en.overviewEngine.multiSelection.overallCheckboxTitle
			);
		});

		describe("checked state", () => {
			const testCases: [OverviewEngineApi.RowState, boolean | "mixed", boolean][] = [
				[{}, false, true],
				[
					{
						1: { selected: undefined },
						2: { selected: undefined }
					},
					false,
					true
				],
				[
					{
						1: { selected: false },
						2: { selected: undefined }
					},
					false,
					true
				],
				[
					{
						1: { selected: true }
					},
					"mixed",
					true
				],
				[
					{
						2: { selected: true }
					},
					"mixed",
					true
				],
				[
					{
						1: { selected: false },
						2: { selected: true }
					},
					"mixed",
					true
				],
				[
					{
						1: { selected: true },
						2: { selected: true }
					},
					true,
					false
				]
			];
			testCases.forEach(([rowState, expectCurrentSelected, expectNextSelected]) => {
				it("should render properly and call onOverallMultiSelectionButtonClick with proper arguments when click", () => {
					const onOverallMultiSelectionButtonClick = vi.fn();
					const wrapper = setupMultiSelection(
						{
							collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED,
							counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE
						},
						{
							eventHandlers: { onOverallMultiSelectionButtonClick },
							uiState: { rowState, expandedMultiSelection: true }
						}
					);

					const checkbox = wrapper.getByDataRoles(DataRoles.Table.Header, DataRoles.Checkbox.Input).element;

					expect(checkbox).toHaveAttribute("aria-checked", expectCurrentSelected.toString());

					fireEvent.click(checkbox);

					expect(onOverallMultiSelectionButtonClick).toHaveBeenCalledExactlyOnceWith({
						affectedRowIds: ["1", "2"],
						selected: expectNextSelected
					});
				});
			});
		});
	});

	describe("when infinite-scroll is enabled", () => {
		const overviewModel: OverviewModel = {
			...defaultEngineProps.overviewModel,
			content: {
				...defaultEngineProps.overviewModel.content,
				configuration: {
					...defaultEngineProps.overviewModel.content.configuration,
					enableInfiniteScroll: true,
					rowHeight: 50,
					actionColumnWidth: 1
				}
			}
		};

		it("should not render the checkbox", () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection, {
				overviewModel,
				infiniteScrollOptions: mockType<OverviewEngineApi.InfiniteScrollOptions>({ rowCount: 100 })
			});

			expect(wrapper.queryByDataRoles(DataRoles.Table.Header, DataRoles.Checkbox.Input)).not.toBeInTheDocument();
		});
	});

	describe("when cardView = true", () => {
		it("should render only one checkbox in each row", () => {
			const wrapper = setupMultiSelection(
				{
					...defaultClearConfirmationMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				},
				{
					cardView: true
				}
			);
			const firstRow = wrapper.getAllByDataRole(DataRoles.Table.Body.Row).first();

			expect(firstRow.getAllByDataRole(DataRoles.Checkbox.Input)).toHaveLength(1);
		});
	});

	describe("hidden text", () => {
		it("should not contain text Action", () => {
			const wrapper = setupMultiSelection({
				...defaultClearConfirmationMultiSelection,
				collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
			});

			const headerCells = wrapper.queryAllByDataRole(DataRoles.Table.Header.Cell);
			const multiSelectionHeaderCell = headerCells.first();

			expect(multiSelectionHeaderCell.queryByDataRole(DataRoles.Checkbox.Input).element).toBeInTheDocument();

			expect(multiSelectionHeaderCell.queryByText("Action").element).not.toBeInTheDocument();
		});
	});
});
