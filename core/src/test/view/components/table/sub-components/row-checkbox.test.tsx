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

import { OverviewModel } from "../../../../../main/overview-model.js";
import { type OverviewEngineApi } from "../../../../../main/view/api.js";
import { en } from "../../../../../main/services/localization/internal/shared.js";

import { DataRoles, type QueriableElement } from "../../../../test-utils.js";
import { StringColumnModel, NumberColumnModel, defaultEngineProps } from "../../../../basic.spec.js";
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

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.row-checkbox", () => {
	describe("when multi selection feature is disable, or enable but user do not click multi selection button", () => {
		multiSelectionTestCases.forEach((multiSelection) => {
			it("should hide", () => {
				const wrapper = setupMultiSelection(multiSelection, {
					uiState: { expandedMultiSelection: false }
				});

				expect(wrapper.queryByDataRole(DataRoles.Checkbox.Input).element).not.toBeInTheDocument();
			});
		});
	});

	describe("when user clicks multi selection button", () => {
		it("should render properly", () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection);

			const multiSelectionButton = wrapper.getByDataRole(DataRoles.Button).element;

			expect(multiSelectionButton).toBeInTheDocument();

			fireEvent.click(multiSelectionButton);

			expect(wrapper.getByDataRole(DataRoles.Table.Body).getAllByDataRole(DataRoles.Checkbox.Input)).toHaveLength(2);
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

			wrapper
				.getByDataRole(DataRoles.Table.Body)
				.getAllByDataRole(DataRoles.Checkbox.Input)
				.forEach((checkbox) => {
					expect(checkbox).toBeDisabled();
				});
		});

		it("should be enabled when disabled = false", () => {
			const wrapper = setupMultiSelection(
				{
					...defaultClearConfirmationMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				},
				{ uiState: { disabled: false } }
			);

			wrapper
				.getByDataRole(DataRoles.Table.Body)
				.getAllByDataRole(DataRoles.Checkbox.Input)
				.forEach((checkbox) => {
					expect(checkbox).toBeEnabled();
				});
		});

		it("title", () => {
			const wrapper = setupMultiSelection(defaultClearConfirmationMultiSelection);

			const multiSelectionButton = wrapper.getByDataRole(DataRoles.Button).element;

			expect(multiSelectionButton).toBeInTheDocument();

			fireEvent.click(multiSelectionButton);

			wrapper
				.getByDataRole(DataRoles.Table.Body)
				.getAllByDataRole(DataRoles.Checkbox.Label)
				.forEach((checkbox) => {
					expect(checkbox).toHaveTextContent(en.overviewEngine.multiSelection.rowCheckboxTitle);
				});
		});

		describe("checked state", () => {
			const testCases: [OverviewEngineApi.RowState, boolean, boolean][] = [
				[{}, false, true],
				[{ 1: { selected: undefined } }, false, true],
				[{ 1: { selected: false } }, false, true],
				[{ 1: { selected: true } }, true, false]
			];

			testCases.forEach(([rowState, expectCurrentSelected, expectNextSelected]) => {
				it("should render properly and call the callback with proper arguments when click", () => {
					const onRowsSelect = vi.fn();
					const wrapper = setupMultiSelection(
						{
							collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED,
							counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE
						},
						{
							eventHandlers: { onRowsSelect },
							uiState: { rowState, expandedMultiSelection: true }
						}
					);

					const checkboxWidget = wrapper
						.getByDataRole(DataRoles.Table.Body)
						.getAllByDataRole(DataRoles.Checkbox.Input)[0];

					expect(checkboxWidget).toHaveAttribute("aria-checked", expectCurrentSelected.toString());

					fireEvent.click(checkboxWidget);

					expect(onRowsSelect).toHaveBeenCalledExactlyOnceWith([{ documentId: "1", selected: expectNextSelected }]);
				});
			});
		});

		describe.skip("range selection", () => {
			function selectRow(index: number) {
				fireEvent.click(wrapper.getByDataRole(DataRoles.Table.Body).getAllByDataRole(DataRoles.Checkbox.Input)[index]);
			}

			function shiftSelectRow(index: number) {
				fireEvent.click(wrapper.getByDataRole(DataRoles.Table.Body).getAllByDataRole(DataRoles.Checkbox.Input)[index], {
					shiftKey: true
				});
			}

			function getSelectedRows() {
				const selectedRows: number[] = [];

				wrapper
					.getByDataRole(DataRoles.Table.Body)
					.getAllByDataRole(DataRoles.Checkbox.Input)
					.forEach((checkbox, index) => {
						if (checkbox.getAttribute("aria-checked") === "true") {
							selectedRows.push(index);
						}
					});

				return selectedRows;
			}

			const customData = Array.from({ length: 10 }, (_, id) => ({
				id: String(id),
				root: { string: "ABC", number: 1, multiSelectGroup: [{ value: "1" }] }
			}));
			let wrapper: QueriableElement;

			beforeEach(() => {
				wrapper = setupMultiSelection(
					{
						collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED,
						counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE
					},
					{ data: customData },
					undefined,
					true
				);
			});

			describe("Shift-select row 5", () => {
				it("Selected rows should be 5", () => {
					shiftSelectRow(5);

					expect(getSelectedRows()).toEqual([5]);
				});
			});

			describe("Select row 5 then shift-select row 7", () => {
				it("Selected rows should be 5, 6, 7", () => {
					selectRow(5);
					shiftSelectRow(7);

					expect(getSelectedRows()).toEqual([5, 6, 7]);
				});
			});

			describe("Select row 5 and shift-select row 3", () => {
				it("Selected rows should be 3, 4, 5", () => {
					selectRow(5);
					shiftSelectRow(3);

					expect(getSelectedRows()).toEqual([3, 4, 5]);
				});
			});

			describe("Select row 5, shift-select row 7 then select row 1", () => {
				it("Selected rows should be 1, 5, 6, 7", () => {
					selectRow(5);
					shiftSelectRow(7);
					selectRow(1);

					expect(getSelectedRows()).toEqual([1, 5, 6, 7]);
				});
			});

			describe("Select row 5, shift-select row 7 then de-select 5", () => {
				it("Selected rows should be 6,7 and rows 5 should not be checked", () => {
					selectRow(5);
					shiftSelectRow(7);
					selectRow(5);

					expect(getSelectedRows()).toEqual([6, 7]);
				});
			});

			describe("Select row 5, shift-select row 7 and shift-select 9", () => {
				it("Selected rows should be 5, 6, 7, 8, 9", () => {
					selectRow(5);
					shiftSelectRow(7);
					shiftSelectRow(9);

					expect(getSelectedRows()).toEqual([5, 6, 7, 8, 9]);
				});
			});

			describe("Select row 5, shift-select row 7 and shift-select 3", () => {
				it("Selected rows should be 3, 4, 5", () => {
					selectRow(5);
					shiftSelectRow(7);
					shiftSelectRow(3);

					expect(getSelectedRows()).toEqual([3, 4, 5]);
				});
			});

			describe("Select row 5, shift-select row 7, shift-select 3 and shift-select row 7", () => {
				it("Selected rows should be 5, 6, 7", () => {
					selectRow(5);
					shiftSelectRow(7);
					shiftSelectRow(3);
					shiftSelectRow(7);

					expect(getSelectedRows()).toEqual([5, 6, 7]);
				});
			});

			describe("Select row 5, shift-select row 7 and shift-select 6", () => {
				it("Selected rows should be 5, 6", () => {
					selectRow(5);
					shiftSelectRow(7);
					shiftSelectRow(6);

					expect(getSelectedRows()).toEqual([5, 6]);
				});
			});

			describe("Select row 5, re-select row 5 and shift-select 7", () => {
				it("Selected rows should be 7", () => {
					selectRow(5);
					selectRow(5);
					shiftSelectRow(7);

					expect(getSelectedRows()).toEqual([7]);
				});
			});

			describe("Select row 5, shift-select row 7, select row 3 then shift-select row 9", () => {
				it("Selected rows should be 3, 4, 5, 6, 7, 8, 9", () => {
					selectRow(5);
					shiftSelectRow(7);
					selectRow(3);
					shiftSelectRow(9);

					expect(getSelectedRows()).toEqual([3, 4, 5, 6, 7, 8, 9]);
				});
			});

			describe("Select row 1, shift-select row 3, select row 6 then shift-select row 8", () => {
				it("Selected rows should be 1, 2, 3, 6, 7, 8", () => {
					selectRow(1);
					shiftSelectRow(3);
					selectRow(6);
					shiftSelectRow(8);

					expect(getSelectedRows()).toEqual([1, 2, 3, 6, 7, 8]);
				});
			});

			describe("Select row 6, shift-select row 8, select row 1 then shift-select row 3", () => {
				it("Selected rows should be 1, 2, 3, 6, 7, 8", () => {
					selectRow(6);
					shiftSelectRow(8);
					selectRow(1);
					shiftSelectRow(3);

					expect(getSelectedRows()).toEqual([1, 2, 3, 6, 7, 8]);
				});
			});

			describe("Select row 3, shift-select row 6, de-select row 5 then shift-select row 8", () => {
				it("Selected rows should be 5, 6, 7, 8", () => {
					selectRow(3);
					shiftSelectRow(6);
					selectRow(5);
					shiftSelectRow(8);

					expect(getSelectedRows()).toEqual([3, 4, 6, 8]);
				});
			});

			describe("Select row 1, shift-select row 4, de-select row 4, select row 4 then shift-select row 7", () => {
				it("Selected rows should be 1, 2, 3, 4, 5, 6, 7", () => {
					selectRow(1);
					shiftSelectRow(4);
					selectRow(4);
					selectRow(4);
					shiftSelectRow(7);

					expect(getSelectedRows()).toEqual([1, 2, 3, 4, 5, 6, 7]);
				});
			});
		});
	});

	describe("readable column value", () => {
		const screenReaderColumn: OverviewModel.ColumnRef = {
			idref: StringColumnModel.id
		};

		const expandedMultiSelection: OverviewModel.MultiSelection = {
			collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED,
			counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE
		};

		it("should set aria-labelledby on checkbox input referencing checkbox id and cell", () => {
			const overviewModel: OverviewModel = {
				...defaultEngineProps.overviewModel,
				content: {
					...defaultEngineProps.overviewModel.content,
					configuration: {
						...defaultEngineProps.overviewModel.content.configuration,
						screenReaderColumn
					},
					columns: [StringColumnModel, NumberColumnModel]
				}
			};

			const wrapper = setupMultiSelection(expandedMultiSelection, { overviewModel });

			const checkboxInputs = wrapper.getByDataRole(DataRoles.Table.Body).getAllByDataRole(DataRoles.Checkbox.Input);

			checkboxInputs.forEach((input) => {
				const ariaLabelledBy = input.getAttribute("aria-labelledby");
				expect(ariaLabelledBy).toBeTruthy();

				const ids = (ariaLabelledBy ?? "").split(" ");
				expect(ids).toHaveLength(2);

				const checkboxElement = document.getElementById(ids[0] ?? "");
				expect(checkboxElement).toBeTruthy();

				const cellElement = document.getElementById(ids[1] ?? "");
				expect(cellElement).toBeTruthy();
			});
		});

		it("should show base title without enrichment in checkbox label", () => {
			const overviewModel: OverviewModel = {
				...defaultEngineProps.overviewModel,
				content: {
					...defaultEngineProps.overviewModel.content,
					configuration: {
						...defaultEngineProps.overviewModel.content.configuration,
						screenReaderColumn
					},
					columns: [StringColumnModel, NumberColumnModel]
				}
			};

			const wrapper = setupMultiSelection(expandedMultiSelection, { overviewModel });

			wrapper
				.getByDataRole(DataRoles.Table.Body)
				.getAllByDataRole(DataRoles.Checkbox.Label)
				.forEach((checkbox) => {
					expect(checkbox).toHaveTextContent(en.overviewEngine.multiSelection.rowCheckboxTitle);
				});
		});

		it("should not set aria-labelledby when no screenReaderColumn is configured", () => {
			const wrapper = setupMultiSelection(expandedMultiSelection);

			wrapper
				.getByDataRole(DataRoles.Table.Body)
				.getAllByDataRole(DataRoles.Checkbox.Label)
				.forEach((checkbox) => {
					expect(checkbox).toHaveTextContent(en.overviewEngine.multiSelection.rowCheckboxTitle);
				});

			const checkboxInputs = wrapper.getByDataRole(DataRoles.Table.Body).getAllByDataRole(DataRoles.Checkbox.Input);

			checkboxInputs.forEach((input) => {
				expect(input).not.toHaveAttribute("aria-labelledby");
			});
		});
	});
});
