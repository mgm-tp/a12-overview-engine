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

import { it, expect, describe } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../main/overview-model.js";
import { OverviewEngineApi } from "../../main/view/api.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";
import { OverviewTable } from "../../main/view/overview-table.js";
import { enLocale, defaultEngineProps } from "../basic.spec.js";
import { getDocumentModel, getOverviewModel } from "../setup/models.js";
import { render, ClassNames } from "../test-utils.js";
import { noop } from "../utils.js";

describe("com.mgmtp.a12.overview-engine.view.table", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;

	function setupTest(props: OverviewEngine.Props) {
		return render(<OverviewTable />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...props }
		});
	}

	describe("when activeRowId = undefined", () => {
		it("noRowIsSelected", () => {
			const wrapper = setupTest(basicEngineProps);

			expect(
				wrapper.queryAll(`[data-role="${DataRoles.Table.Body.Row}"].${ClassNames.TableBodyRow}--selected`)
			).toHaveLength(0);
		});
	});

	describe("when activeRowId equals one of document ids", () => {
		for (let rowIndex = 0; rowIndex < basicEngineProps.data.length; rowIndex++) {
			it("that row should be selected", () => {
				const wrapper = setupTest({ ...basicEngineProps, activeRowId: String(rowIndex + 1) });

				wrapper.queryAllByDataRole(DataRoles.Table.Body.Row).forEach((row, index) => {
					expect(row.classList.contains(`${ClassNames.TableBodyRow}--selected`) === (index === rowIndex)).toBe(true);
				});
			});
		}
	});

	it("columnWidthIsSetInProps", () => {
		const columnsFromModel = basicEngineProps.overviewModel.content.columns;
		const columnsFromProps = basicEngineProps.overviewModel.content.columns;

		for (let i = 0; i < columnsFromModel.length; i++) {
			expect(columnsFromModel[i].width).toEqual(columnsFromProps[i].width);
		}
	});

	it("columnWidthIsSetInWidget", () => {
		const { columns } = basicEngineProps.overviewModel.content;

		setupTest(basicEngineProps)
			.getAllByDataRole(DataRoles.Table.Body.Cell)
			.forEach((cell, cellIndex) => {
				expect(cell).toHaveClass(`${ClassNames.TableBodyCell}--${columns[cellIndex % columns.length].width * 10}`);
			});
	});

	it("renders row actions in an action column", () => {
		const actions: OverviewModel.Button[] = [
			{ event: "A", label: [{ locale: enLocale.language, text: "A" }], styles: ["styleA"] },
			{ event: "B", label: [{ locale: enLocale.language, text: "B" }], styles: ["styleB1", "styleB2"] }
		];

		const wrapper = setupTest({
			...basicEngineProps,
			overviewModel: {
				...basicEngineProps.overviewModel,
				content: { ...basicEngineProps.overviewModel.content, rowActionGroup: { actions } }
			}
		});

		expect(
			wrapper.queryAllByDataRoles(DataRoles.Table.Header.Row, DataRoles.Table.Header.Cell).last().element
		).toHaveClass(ClassNames.TableActionCell);

		expect(wrapper.queryAllByDataRoles(DataRoles.Table.Body.Row, DataRoles.Table.Body.Cell).last().element).toHaveClass(
			ClassNames.TableActionCell
		);

		expect(
			wrapper.queryAllByDataRoles(DataRoles.Table.Footer.Row, DataRoles.Table.Footer.Cell).last().element
		).toHaveClass(ClassNames.TableActionCell);
	});

	describe("sortOptions", () => {
		describe("sortState", () => {
			const customProps: OverviewEngine.Props = {
				...basicEngineProps,
				uiState: {
					sorting: OverviewEngineApi.getUiStateSorting(
						[{ columnIndex: 0, order: "asc" }],
						basicEngineProps.documentModel,
						basicEngineProps.overviewModel,
						basicEngineProps.modelGraph?.relationshipModels,
						basicEngineProps.subDocumentModels
					)
				},
				eventHandlers: { onColumnClick: noop }
			};

			describe("when both props.sorting and props.eventHandlers.onColumnClick are defined", () => {
				it("should return correct state", () => {
					setupTest(customProps)
						.getAllByDataRole(DataRoles.Table.Header.Cell)
						.forEach((headCell, headCellIndex) => {
							const sortingProps = OverviewEngineApi.getSortingProps(
								customProps.uiState?.sorting,
								customProps.documentModel,
								customProps.overviewModel,
								customProps.modelGraph?.relationshipModels,
								customProps.subDocumentModels
							);

							expect(headCell.querySelectorAll(`.${ClassNames.TableSortingIcon}`)).toHaveLength(
								headCellIndex === sortingProps?.[0].columnIndex ? 1 : 0
							);
						});
				});
			});

			describe("when props.sorting is undefined", () => {
				it("should return undefined", () => {
					expect(
						setupTest({ ...customProps, uiState: { sorting: undefined } }).queryAll(
							`[data-role="${DataRoles.Table.Header.Cell}"] .${ClassNames.TableSortingIcon}`
						)
					).toHaveLength(0);
				});
			});

			describe("when props.eventHandlers.onColumnClick is undefined", () => {
				it("should return undefined", () => {
					expect(
						setupTest({ ...customProps, eventHandlers: { onColumnClick: undefined } }).queryAll(
							`[data-role="${DataRoles.Table.Header.Cell}"] .${ClassNames.TableSortingIcon}`
						)
					).toHaveLength(0);
				});
			});
		});

		describe("onSort", () => {
			describe("when the engine is disabled", () => {
				it("should be undefined", () => {
					expect(
						setupTest({ ...basicEngineProps, uiState: { disabled: true }, eventHandlers: { onColumnClick: noop } })
							.queryAllByDataRole(DataRoles.Table.Header.Cell)
							.first().element
					).not.toHaveClass(`${ClassNames.TableHeadCell}--sortable`);
				});
			});

			describe("when the engine is enabled", () => {
				it("should be defined", () => {
					expect(
						setupTest({
							...basicEngineProps,
							uiState: { disabled: false },
							eventHandlers: { onColumnClick: noop }
						}).query(`[data-role="${DataRoles.Table.Header.Cell}"]`)?.element
					).toHaveClass(`${ClassNames.TableHeadCell}--sortable`);
				});
			});
		});
	});

	describe("column.pinning", () => {
		it("columnsArePinned", async () => {
			const customEngineProps: OverviewEngine.Props = {
				...basicEngineProps,
				documentModel: await getDocumentModel("employee", "EmployeeDM"),
				overviewModel: await getOverviewModel("employee", "EmployeeOM"),
				data: []
			};

			const columns = setupTest(customEngineProps).queryAll(
				`[data-role="${DataRoles.Table.Header.Cell}"]:not(.table__actionCell)`
			);

			expect(columns.first().element).toHaveTextContent("Salary (pinned to the left)");
			expect(columns.last().element).toHaveTextContent("Actual Salary");
		});
	});

	describe("column.sortable", () => {
		const stringColumn = basicEngineProps.overviewModel.content.columns[0];
		const sortableProps: OverviewEngine.Props = {
			...basicEngineProps,
			uiState: { disabled: false },
			eventHandlers: { onColumnClick: noop },
			overviewModel: {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					columns: [{ ...stringColumn, sortable: true }]
				}
			}
		};

		describe("when the engine has onColumnClick, disabled = true, the column is model sortable and is not multi select one", () => {
			it("should be sortable", () => {
				expect(setupTest(sortableProps).queryByDataRole(DataRoles.Table.Header.Cell)?.element).toHaveClass(
					`${ClassNames.TableHeadCell}--sortable`
				);
			});
		});

		describe("when the engine does not receive the onColumnClick callback", () => {
			it("should not be sortable", () => {
				expect(
					setupTest({ ...sortableProps, eventHandlers: { onColumnClick: undefined } }).queryByDataRole(
						DataRoles.Table.Header.Cell
					)?.element
				).not.toHaveClass(`${ClassNames.TableHeadCell}--sortable`);
			});
		});

		describe("when the column model is not sortable", () => {
			it("should not be sortable", () => {
				const props: OverviewEngine.Props = {
					...sortableProps,
					overviewModel: {
						...sortableProps.overviewModel,
						content: { ...sortableProps.overviewModel.content, columns: [{ ...stringColumn, sortable: false }] }
					}
				};

				expect(setupTest(props).queryByDataRole(DataRoles.Table.Header.Cell)?.element).not.toHaveClass(
					`${ClassNames.TableHeadCell}--sortable`
				);
			});
		});

		describe("when the column data type is not sortable", () => {
			it("should not be sortable", () => {
				const multiSelectColumn = basicEngineProps.overviewModel.content.columns[2];
				const props: OverviewEngine.Props = {
					...sortableProps,
					overviewModel: {
						...sortableProps.overviewModel,
						content: {
							...sortableProps.overviewModel.content,
							columns: [multiSelectColumn]
						}
					}
				};

				expect(setupTest(props).queryByDataRole(DataRoles.Table.Header.Cell)?.element).not.toHaveClass(
					`${ClassNames.TableHeadCell}--sortable`
				);
			});
		});

		describe("when the engine is disabled", () => {
			it("should not be sortable", () => {
				expect(
					setupTest({ ...sortableProps, uiState: { disabled: true } }).queryByDataRole(DataRoles.Table.Header.Cell)
						?.element
				).not.toHaveClass(`${ClassNames.TableHeadCell}--sortable`);
			});
		});
	});
});
