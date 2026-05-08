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

import * as React from "react";
import { fireEvent } from "@testing-library/react";
import { it, vi, expect, describe, afterEach, type Mock, beforeEach } from "vitest";

import { type Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { OverviewModel } from "../../main/overview-model.js";
import { type JSONDocument } from "../../main/models/index.js";
import { type OverviewEngineApi } from "../../main/view/api.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";
import { type ComponentMap } from "../../main/view/configuration/component-map.js";
import { type WidgetMap, DefaultWidgetMap } from "../../main/view/configuration/widget-map.js";

import { getDocumentModel, getOverviewModel } from "../setup/models.js";
import { render, DataRoles, type QueriableElement } from "../test-utils.js";
import { cartesianProduct, createComponentMap, type PartialOEInfiniteScrollProps } from "../utils.js";
import { deLocale, enLocale, NumberColumnModel, defaultEngineProps, MultiSelectColumnModel } from "../basic.spec.js";

import { setupMultiSelection, defaultClearConfirmationMultiSelection } from "./components/multi-selection/utils.js";

describe("com.mgmtp.a12.overview-engine.view.OverviewTable", () => {
	const basicOverviewModel: OverviewModel = {
		...defaultEngineProps.overviewModel,
		content: {
			...defaultEngineProps.overviewModel.content,
			rowActionGroup: {
				actions: [
					{
						event: "E",
						label: [{ locale: enLocale.language, text: "E" }]
					}
				]
			}
		}
	};

	const basicEngineProps: OverviewEngine.PaginatedProps = {
		...defaultEngineProps,
		overviewModel: basicOverviewModel
	};

	function TestElement() {
		return <CustomWidget />;
	}

	function setupTest(
		engineProps?: Partial<OverviewEngine.PaginatedProps> | PartialOEInfiniteScrollProps,
		locale?: Locale
	) {
		return render(<OverviewEngine {...basicEngineProps} {...engineProps} />, undefined, locale);
	}

	const attachmentValues = [
		{
			internal_filename: "new.jpg",
			original_filename: null,
			mime_type: "image/jpeg",
			category: null,
			description: null,
			attachment_id: "1",
			content: null,
			size: null
		},
		null,
		undefined
	];

	async function getData(): Promise<{
		documentModel: DocumentModel;
		overviewModel: OverviewModel;
		documents: JSONDocument[];
	}> {
		const documentModel = await getDocumentModel("attachment", "DomainAttachment");
		const overviewModel = await getOverviewModel("attachment", "Attachment-overview");

		const documents = attachmentValues.map(
			(item, index) => ({ id: String(index), root: { attachment: item } }) as JSONDocument
		);

		return { documentModel, overviewModel, documents };
	}

	describe("resize columns", () => {
		describe("when the overview model has no field enableColumnsResize", () => {
			it("Widget Table should have undefined columnResizingOptions props", () => {
				const wrapper = setupTest();

				const column = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell)[1].firstElementChild;

				expect(column).not.toHaveAttribute("data-resizable");
			});
		});

		describe("when the overview model has field enableColumnsResize = true", () => {
			const resizingColumnOverviewModel: OverviewModel = {
				...basicOverviewModel,
				content: {
					...basicOverviewModel.content,
					configuration: {
						...basicOverviewModel.content.configuration,
						enableColumnsResize: true
					}
				}
			};

			it("Widget Table should have defined columnResizingOptions", () => {
				const wrapper = setupTest({ overviewModel: resizingColumnOverviewModel });
				const column = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell)[1].firstElementChild;

				expect(column).toHaveAttribute("data-resizable");
			});
		});
	});

	describe("given no factory", () => {
		it("renders default Row Action", () => {
			const wrapper = setupTest();

			const baseRowAction = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

			expect(baseRowAction).toHaveLength(2);
		});

		it("renders a default Table", () => {
			const wrapper = setupTest();
			const baseTable = wrapper.getAllByDataRole(DataRoles.Table);

			expect(baseTable).toHaveLength(1);
		});

		describe("AttachmentComponent", () => {
			it("renders a default Attachment", async () => {
				const data = await getData();
				const wrapper = setupTest({
					documentModel: data.documentModel,
					overviewModel: data.overviewModel,
					data: data.documents
				});
				const baseAttachmentComponent = wrapper.getAllByDataRole(DataRoles.Table.Body.Cell);

				expect(baseAttachmentComponent).toHaveLength(data.documents.length);
			});
		});
	});

	describe("Alignment", () => {
		const alignment = {
			header: {
				horizontal: OverviewModel.HorizontalAlignment.LEFT,
				vertical: OverviewModel.VerticalAlignment.MIDDLE
			},
			content: {
				horizontal: OverviewModel.HorizontalAlignment.CENTER,
				vertical: OverviewModel.VerticalAlignment.BOTTOM
			}
		};

		describe("for NumberDataType", () => {
			it("renders default alignment", () => {
				const wrapper = setupTest();

				const numberCell = wrapper.getAllByDataRole(DataRoles.Table.Body.Cell)[1];

				expect(numberCell.className).toContain(OverviewModel.HorizontalAlignment.RIGHT);
			});

			it("renders custom alignment", () => {
				const overviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						columns: basicEngineProps.overviewModel.content.columns.map((column) => {
							if (column?.label?.[0]?.text === "Number") {
								return {
									...column,
									alignment
								};
							}

							return column;
						})
					}
				};

				const wrapper = setupTest({ overviewModel });

				const tableBodyCell = wrapper.getAllByDataRole(DataRoles.Table.Body.Cell)[1];

				expect(tableBodyCell.className).toContain(alignment.content.horizontal);
				expect(tableBodyCell.className).toContain(alignment.content.vertical);
			});
		});

		describe("for StringDataType", () => {
			it("renders default alignment", () => {
				const wrapper = setupTest();

				const stringColumn = wrapper.getAllByDataRole(DataRoles.Table.Body.Cell)[0];

				expect(stringColumn.className).not.toContain(OverviewModel.HorizontalAlignment.RIGHT);
			});

			it("renders custom alignment", () => {
				const overviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						columns: basicEngineProps.overviewModel.content.columns.map((column) => {
							if (column?.label?.[0]?.text === "String [OM]") {
								return {
									...column,
									alignment
								};
							}

							return column;
						})
					}
				};

				const wrapper = setupTest({ overviewModel });

				const tableBodyCell = wrapper.getAllByDataRole(DataRoles.Table.Body.Cell)[0];

				expect(tableBodyCell.className).toContain(alignment.content.horizontal);
				expect(tableBodyCell.className).toContain(alignment.content.vertical);
			});
		});
	});

	describe("given a factory", () => {
		describe("with a custom Row Action", () => {
			it("renders the custom Row Action", () => {
				const componentMap: ComponentMap = createComponentMap({ RowAction: TestElement });

				const wrapper = setupTest({ componentMap });
				const baseButton = wrapper.getAllByDataRole("custom-widget");

				expect(baseButton).toHaveLength(2);
			});
		});

		describe("with no custom Row Action", () => {
			it("renders default Row Action", () => {
				const wrapper = setupTest();

				const baseButton = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

				expect(baseButton).toHaveLength(2);
			});
		});

		describe("with a custom Table", () => {
			it("renders the custom Table", () => {
				const widgetMap: WidgetMap = {
					...DefaultWidgetMap,
					Table: TestElement
				};

				const wrapper = setupTest({ widgetMap });
				const baseButton = wrapper.getAllByDataRole("custom-widget");

				expect(baseButton).toHaveLength(1);
			});
		});

		describe("with no custom Table", () => {
			it("renders a default Table", () => {
				const wrapper = setupTest();
				const baseTable = wrapper.getAllByDataRole(DataRoles.Table);

				expect(baseTable).toHaveLength(1);
			});
		});

		describe("with no custom Attachment", () => {
			it("renders a default Attachment", async () => {
				const data = await getData();
				const engineProps = {
					documentModel: data.documentModel,
					overviewModel: data.overviewModel,
					data: data.documents
				};

				const wrapper = setupTest(engineProps);
				const baseAttachmentComponent = wrapper.getAllByDataRole(DataRoles.Table.Body.Cell);

				expect(baseAttachmentComponent).toHaveLength(data.documents.length);
			});
		});

		describe("with a custom Attachment", () => {
			it("renders the custom Attachment", async () => {
				const componentMap: ComponentMap = createComponentMap({ AttachmentCell: TestElement });

				const data = await getData();
				const engineProps = {
					documentModel: data.documentModel,
					overviewModel: data.overviewModel,
					data: data.documents,
					componentMap
				};

				const wrapper = setupTest(engineProps);
				const attachmentCells = wrapper.getAllByDataRole("custom-widget");

				expect(attachmentCells).toHaveLength(1);
			});
		});
	});

	describe("Attachment", () => {
		describe("props", async () => {
			const data = await getData();
			const engineProps = {
				documentModel: data.documentModel,
				overviewModel: data.overviewModel,
				data: data.documents
			};

			describe("attachment", () => {
				it("render default empty attachment", () => {
					const attachmentCell = setupTest(engineProps).getByDataRole(DataRoles.Table.Header.Cell.Content);

					expect(attachmentCell.element.childElementCount).toEqual(0);
				});
			});
		});

		describe("MultiSelectCell", () => {
			it("should render MultiSelectCell", () => {
				const wrapper = setupTest();

				const multiSelectCell = wrapper.queryByText(MultiSelectColumnModel.label?.[0].text as string);

				expect(multiSelectCell.element).toBeInTheDocument();
			});
		});

		describe("StringDataTypeCell", () => {
			it("should render StringDataTypeCell", () => {
				const wrapper = setupTest();

				const stringTypeCell = wrapper.queryByText(NumberColumnModel.label?.[0].text as string);

				expect(stringTypeCell.element).toBeInTheDocument();
			});
		});
	});

	describe("CSS styling", () => {
		it("should render CSS class specified in model for table header and content cell", () => {
			const overviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					columns: basicEngineProps.overviewModel.content.columns.map((column, index) => {
						if (index === 0) {
							return {
								...column,
								styles: { header: ["headerClass", "headerClass2"], content: ["contentClass", "contentClass2"] }
							};
						}

						return column;
					})
				}
			};
			const wrapper = setupTest({ overviewModel });

			const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

			tableRows.forEach((row) => {
				const baseTableCells = row.querySelectorAll(`[data-role=${DataRoles.Table.Body.Cell}]`);

				expect(baseTableCells[0].className).toContain("contentClass");
				expect(baseTableCells[0].className).toContain("contentClass2");
			});

			const tableHeadCells = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);

			expect(tableHeadCells[0].className).toContain("headerClass");
			expect(tableHeadCells[0].className).toContain("headerClass2");
		});
	});

	describe("Row style", () => {
		it("should render corresponding to row state", async () => {
			const data = await getData();
			const wrapper = setupTest({
				data: data.documents,
				uiState: {
					rowState: { [0]: { disabled: true }, [1]: { useSecondaryColor: true }, [2]: { selected: true } }
				}
			});

			const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

			expect(tableRows).toHaveLength(3);

			expect(tableRows[0].className).toContain("disabled");
			expect(tableRows[1].className).not.toContain("disabled");
			expect(tableRows[2].className).not.toContain("disabled");
			expect([...tableRows].map((row) => row.className)).not.toContain("highlighted");

			const tableCells = tableRows[1].querySelectorAll(`[data-role=${DataRoles.Table.Body.Cell}]`);

			tableCells.forEach((item) => expect(item.className).toContain("table__contentCell--secondary"));
		});
	});

	describe("ariaLabel", () => {
		it("should render defined label", () => {
			const wrapper = setupTest();
			const baseTable = wrapper.getByDataRole(DataRoles.Table);

			expect(baseTable.element).toHaveAttribute("aria-label", basicOverviewModel.header.labels?.[0].text);
		});
	});

	describe("given no row action and context menu", () => {
		it("should not render action column", () => {
			const testCases: {
				rowActionGroup: OverviewModel.RowActionGroup;
				contextMenu?: OverviewModel.ContextMenu;
			}[] = [
				{
					rowActionGroup: {}
				},
				{
					rowActionGroup: {
						actions: []
					}
				},
				{
					rowActionGroup: {},
					contextMenu: {
						groups: []
					}
				},
				{
					rowActionGroup: {
						actions: []
					},
					contextMenu: {
						groups: []
					}
				}
			];

			testCases.forEach((testCase) => {
				const model: OverviewModel = {
					...defaultEngineProps.overviewModel,
					content: {
						...defaultEngineProps.overviewModel.content,
						rowActionGroup: testCase.rowActionGroup,
						contextMenu: testCase.contextMenu
					}
				};

				const wrapper = setupTest({
					overviewModel: model
				});

				const columns = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);

				expect(columns).toHaveLength(model.content.columns.length);

				const lastColumn = columns[columns.length - 1];

				expect(lastColumn).not.toHaveTextContent("Action");
			});
		});
	});

	describe("infinite-scroll", () => {
		const loadDataSpy = vi.fn();
		const rowLoadingStatusSpy = vi.fn();

		const basicInfiniteScrollOptions: OverviewEngineApi.InfiniteScrollOptions = {
			rowCount: 100,
			minimumBatchSize: 40,
			threshold: 20,
			rowLoadingStatus: rowLoadingStatusSpy,
			loadData: loadDataSpy
		};

		const engineProps: OverviewEngine.InfiniteScrollProps = {
			...basicEngineProps,
			overviewModel: {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					rowActionGroup: { actions: [{ event: "event_A" }] },
					configuration: {
						...basicEngineProps.overviewModel.content.configuration,
						enableInfiniteScroll: true,
						rowHeight: 50,
						actionColumnWidth: 1
					}
				}
			},
			infiniteScrollOptions: basicInfiniteScrollOptions
		};

		vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(1500);
		vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1500);

		afterEach(() => {
			vi.resetAllMocks();
		});

		it("should render infinity table when providing enableInfiniteScroll and rowHeight", () => {
			const wrapper = setupTest(engineProps);

			expect(wrapper.getByDataRole(DataRoles.Table.Body).element.className).toContain("StyledTableVirtualizedBody");

			const tableRows = wrapper
				.getAllByDataRole(DataRoles.Table.Body.Row)
				.filter((el) => el.getAttribute("role") !== "presentation");

			tableRows.forEach((tableRow) => {
				expect(tableRow).toHaveStyle({ height: "50px" });
			});
		});

		describe("loadData", () => {
			it("should be called with correct params", async () => {
				setupTest(engineProps);

				await basicInfiniteScrollOptions.loadData({ startPage: 5, endPage: 7 });

				expect(loadDataSpy.mock.calls[0][0]).toEqual({ startPage: 5, endPage: 7 });
			});
		});
	});

	describe("checkbox column", () => {
		const testCasesForNoWidth: {
			enableInfiniteScroll: true | undefined;
			cardView: true | undefined;
		}[] = [
			{
				enableInfiniteScroll: undefined,
				cardView: undefined
			},
			{
				enableInfiniteScroll: undefined,
				cardView: true
			},
			{
				enableInfiniteScroll: true,
				cardView: true
			}
		];

		const setUpWithInfiniteScrollAndCardView = (options: {
			enableInfiniteScroll: true | undefined;
			cardView: boolean | undefined;
		}) => {
			const defaultOverviewModel = defaultEngineProps.overviewModel;
			const overviewModel: OverviewModel = {
				...defaultOverviewModel,
				content: {
					...defaultOverviewModel.content,
					rowActionGroup: { actions: [{ event: "event_A" }] },
					configuration: {
						...defaultOverviewModel.content.configuration,
						enableInfiniteScroll: options.enableInfiniteScroll
					}
				}
			};

			return setupMultiSelection(
				{
					...defaultClearConfirmationMultiSelection,
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED
				},
				{
					overviewModel,
					cardView: options.cardView
				}
			);
		};

		describe("when enableInfiniteScroll is true and cardView is not set", () => {
			it("checkbox column should be an action column and data-width is 0.3", () => {
				const wrapper = setUpWithInfiniteScrollAndCardView({ enableInfiniteScroll: true, cardView: undefined });

				const tableColumns = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);
				const firstCell = tableColumns[0];

				expect(tableColumns).toHaveLength(defaultEngineProps.overviewModel.content.columns.length + 2);
				expect(firstCell).toHaveAttribute("data-type", "table-action-cell");
				expect(firstCell).toHaveAttribute("data-width", "0.3");
			});
		});

		testCasesForNoWidth.forEach((testCase) => {
			describe(`when enableInfiniteScroll = ${testCase.enableInfiniteScroll} and cardView = ${testCase.cardView}`, () => {
				it("checkbox column should be an action column and data-width is not set", () => {
					const wrapper = setUpWithInfiniteScrollAndCardView(testCase);

					const tableColumns = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);
					const firstCell = tableColumns[0];

					expect(tableColumns).toHaveLength(defaultEngineProps.overviewModel.content.columns.length + 2);
					expect(firstCell).toHaveAttribute("data-type", "table-action-cell");
					expect(firstCell).not.toHaveAttribute("data-width");
				});
			});
		});
	});

	describe("fixedWidth", () => {
		it("should render properly", () => {
			const columns: OverviewModel.Column[] = [
				{
					...basicEngineProps.overviewModel.content.columns[0],
					fixedWidth: undefined
				},
				{
					...basicEngineProps.overviewModel.content.columns[1],
					fixedWidth: true
				}
			];
			const overviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					columns
				}
			};
			const wrapper = setupTest({ overviewModel });

			const baseColumns = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);

			expect(baseColumns[0].className).not.toContain("fixedWidth");
			expect(baseColumns[1].className).toContain("fixedWidth");
		});
	});

	describe("rowHeight", () => {
		describe("when the overview model does not has rowHeight", () => {
			it("row style should not have height", () => {
				const wrapper = setupTest();

				const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);
				tableRows.forEach((tableRow) => {
					expect(tableRow.style.height).toHaveLength(0);
				});
			});
		});

		describe("when the overview model has rowHeight", () => {
			it("row style should have configured height", () => {
				const overviewModel = {
					...basicEngineProps.overviewModel,
					content: {
						...basicEngineProps.overviewModel.content,
						configuration: {
							...basicEngineProps.overviewModel.content.configuration,
							rowHeight: 50
						}
					}
				};
				const wrapper = setupTest({ overviewModel });

				const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

				tableRows.forEach((tableRow) => {
					expect(tableRow).toHaveStyle({ height: "50px" });
				});
			});
		});
	});

	describe("actionColumnWidth", () => {
		it("should use actionColumnWidth for table action column width", () => {
			const overviewModel: OverviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					configuration: {
						...basicEngineProps.overviewModel.content.configuration,
						actionColumnWidth: 1
					}
				}
			};
			const wrapper = setupTest({ overviewModel });

			const tableColumns = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);
			const actionColumn = tableColumns[tableColumns.length - 1];

			expect(tableColumns).toHaveLength(overviewModel.content.columns.length + 1);
			expect(actionColumn).toHaveClass("table__headerCell--10");
		});
	});

	describe("rowTitle", () => {
		describe("when the overview model does not has rowTitle", () => {
			it("rows should not have title", () => {
				const wrapper = setupTest();
				const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

				tableRows.forEach((tableRow) => {
					expect(tableRow.title).toHaveLength(0);
				});
			});
		});

		describe("when the overview model has rowTitle", () => {
			const rowTitle = [
				{
					locale: enLocale.language,
					text: "Select this row to see details"
				},
				{
					locale: deLocale.language,
					text: "Select this row to see details [de]"
				}
			];
			const overviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					configuration: {
						...basicEngineProps.overviewModel.content.configuration,
						rowTitle
					}
				}
			};

			describe("interactive rows should have title = configured rowTitle", () => {
				it("locale = en", () => {
					const wrapper = setupTest({ overviewModel }, enLocale);

					const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

					tableRows.forEach((tableRow) => {
						expect(tableRow.title).toBe(rowTitle[0].text);
					});
				});

				it("locale = de", () => {
					const wrapper = setupTest({ overviewModel }, deLocale);
					const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

					tableRows.forEach((tableRow) => {
						expect(tableRow.title).toBe(rowTitle[1].text);
					});
				});
			});

			describe("non-interactive rows should not have title", () => {
				it("row is disabled by rowState", () => {
					const wrapper = setupTest({
						overviewModel,
						uiState: { rowState: { 1: { disabled: true } } }
					});
					const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

					expect(tableRows[0].title).toHaveLength(0);
					expect(tableRows[1].title).toBe(rowTitle[0].text);
				});

				it("overview engine is disabled", () => {
					const wrapper = setupTest({ overviewModel, uiState: { disabled: true } });
					const tableRows = wrapper.getAllByDataRole(DataRoles.Table.Body.Row);

					tableRows.forEach((tableRow) => {
						expect(tableRow.title).toHaveLength(0);
					});
				});
			});
		});
	});

	describe("when sortable column has icon and label is hidden", () => {
		it("should have title with the same content as the hidden label", () => {
			const columns: OverviewModel.Column[] = [
				{
					...basicEngineProps.overviewModel.content.columns[0],
					labelHidden: true,
					icon: {
						name: "test_icon"
					}
				}
			];
			const overviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					columns
				}
			};
			const wrapper = setupTest({ overviewModel }, enLocale);
			const tableColumns = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);
			const label = basicEngineProps.overviewModel.content.columns[0].label?.[0].text;

			expect(tableColumns[0]?.title).toBe(label);

			const icon = tableColumns[0].querySelector(`[data-role=${DataRoles.Icon}]`);

			expect(icon?.querySelector(`[data-role=${DataRoles.HiddenText}]`)?.textContent).toBe(label);
		});
	});

	describe("when sortable column has no icon and label is hidden", () => {
		it("should have title with the same content as the hidden label", () => {
			const columns: OverviewModel.Column[] = [
				{
					...basicEngineProps.overviewModel.content.columns[0],
					labelHidden: true
				}
			];
			const overviewModel = {
				...basicEngineProps.overviewModel,
				content: {
					...basicEngineProps.overviewModel.content,
					columns
				}
			};
			const wrapper = setupTest({ overviewModel }, enLocale);
			const tableColumns = wrapper.getAllByDataRole(DataRoles.Table.Header.Cell);

			const label = basicEngineProps.overviewModel.content.columns[0].label?.[0].text;

			expect(tableColumns[0]?.title).toBe(label);
			expect(tableColumns[0].querySelector(`[data-role=${DataRoles.HiddenText}]`)?.textContent).toBe(label);
		});
	});

	describe("rowEventHandler", () => {
		let rowEventHandlersMock: Mock;

		beforeEach(() => {
			rowEventHandlersMock = vi.fn().mockReturnValue({ onClick: vi.fn() });
			// vi.mock("../../main/view/overviewTable", async () => {
			// 	const mod = await import("../../main/view/overviewTable.js");

			// 	return {
			// 		...mod,
			// 		useRowEventHandlers: vi.fn().mockImplementation(() => rowEventHandlersMock)
			// 	};
			// });
		});

		afterEach(() => {
			// vi.resetAllMocks();
		});

		function createRowEventHandlerMock() {
			return rowEventHandlersMock?.({ row: defaultEngineProps.data[0], rowIndex: 0 }) || {};
		}

		it("should not call onClick while rows are disabled", () => {
			const wrapper = setupTest({ uiState: { disabled: true } });

			const tableRow = wrapper.getAllByDataRole(DataRoles.Table.Body.Row)[0];

			const { onClick: rowClickHandler } = createRowEventHandlerMock();

			fireEvent.click(tableRow);

			expect(rowClickHandler).not.toHaveBeenCalled();
		});

		it("should not call onClick while onRowClick is undefined", () => {
			const wrapper = setupTest({ eventHandlers: { onRowClick: undefined } });
			const tableRow = wrapper.getAllByDataRole(DataRoles.Table.Body.Row)[0];
			const { onClick: rowClickHandler } = createRowEventHandlerMock();

			fireEvent.click(tableRow);

			expect(rowClickHandler).not.toHaveBeenCalled();
		});

		it("should not call onClick while rows are non-interactive", () => {
			const wrapper = setupTest({
				rowStyling: () => ({ interactive: false }),
				eventHandlers: {
					onRowClick: () => {}
				}
			});

			const tableRow = wrapper.getAllByDataRole(DataRoles.Table.Body.Row)[0];
			const { onClick: rowClickHandler } = createRowEventHandlerMock();

			fireEvent.click(tableRow);

			expect(rowClickHandler).not.toHaveBeenCalled();
		});

		describe("Enable multi-selection", () => {
			let wrapper: QueriableElement;
			let onRowClick: Mock;
			let onRowsSelect: Mock;

			function clickRow(index: number) {
				fireEvent.click(wrapper.queryAllByDataRole(DataRoles.Table.Body.Row)[index]);
			}

			interface TestCase {
				readonly expandedMultiSelection: boolean;
				readonly collapseOption: OverviewModel.MultiSelection.CollapseOption;
				readonly selectionArea: OverviewModel.MultiSelection.SelectionArea;
				readonly hasSelectedRow: boolean;
				readonly expectedTriggerEvent: "onRowClick" | "onRowsSelect";
			}

			const testCases: TestCase[] = [
				// When selectionArea is the checkbox, onRowClick is always triggered
				...cartesianProduct<TestCase>(
					[{ selectionArea: OverviewModel.MultiSelection.SelectionArea.CHECKBOX }],
					[{ expandedMultiSelection: true }, { expandedMultiSelection: false }],
					[
						{ collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED },
						{ collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED }
					],
					[{ hasSelectedRow: true }, { hasSelectedRow: false }],
					[{ expectedTriggerEvent: "onRowClick" }]
				),
				...cartesianProduct<TestCase>(
					[
						{
							selectionArea: OverviewModel.MultiSelection.SelectionArea.CHECKBOX,
							expandedMultiSelection: true,
							collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
						}
					],
					[{ hasSelectedRow: true }, { hasSelectedRow: false }],
					[{ expectedTriggerEvent: "onRowClick" }]
				),
				// When multi-selection is turn-off and, selectionArea is the checkbox and row, onRowClick is always triggered
				...cartesianProduct<TestCase>(
					[
						{
							expandedMultiSelection: false,
							hasSelectedRow: false,
							selectionArea: OverviewModel.MultiSelection.SelectionArea.CHECKBOX_AND_ROW
						}
					],
					[
						{ collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED },
						{ collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED }
					],
					[{ expectedTriggerEvent: "onRowClick" }]
				),
				// When multi-selection is turned-on and can be collapsed, selectionArea is the checkbox and row, onRowsSelect is always triggered
				...cartesianProduct<TestCase>(
					[
						{
							expandedMultiSelection: true,
							selectionArea: OverviewModel.MultiSelection.SelectionArea.CHECKBOX_AND_ROW
						}
					],
					[
						{ collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED },
						{ collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED }
					],
					[{ hasSelectedRow: true }, { hasSelectedRow: false }],
					[{ expectedTriggerEvent: "onRowsSelect" }]
				),
				// When multi-selection is turned-on and cannot be collapsed, selectionArea is the checkbox and row, onRowClick is triggered when no row is selected, otherwise onRowsSelect is triggered
				...cartesianProduct<TestCase>(
					[
						{
							expandedMultiSelection: true,
							selectionArea: OverviewModel.MultiSelection.SelectionArea.CHECKBOX_AND_ROW,
							collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
						}
					],
					[
						{ hasSelectedRow: true, expectedTriggerEvent: "onRowsSelect" },
						{ hasSelectedRow: false, expectedTriggerEvent: "onRowClick" }
					]
				)
			];

			describe.each(testCases)(
				`When expandedMultiSelection = $expandedMultiSelection, collapseOption = $collapseOption, selectionArea = $selectionArea, hasSelectedRow = $hasSelectedRow`,
				(testCase) => {
					const { expandedMultiSelection, collapseOption, selectionArea, hasSelectedRow, expectedTriggerEvent } =
						testCase;
					it("should trigger $expectedTriggerEvent on row click", () => {
						onRowClick = vi.fn();
						onRowsSelect = vi.fn();
						wrapper = setupMultiSelection(
							{
								counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
								collapseOption,
								selectionArea
							},
							{
								eventHandlers: { onRowClick, onRowsSelect },
								uiState: {
									rowState: hasSelectedRow ? { "0": { selected: true } } : undefined,
									expandedMultiSelection: expandedMultiSelection
								}
							},
							undefined,
							false
						);

						clickRow(1);

						if (expectedTriggerEvent === "onRowClick") {
							expect(onRowClick).toHaveBeenCalled();
							expect(onRowsSelect).not.toHaveBeenCalled();
						} else if (expectedTriggerEvent === "onRowsSelect") {
							expect(onRowsSelect).toHaveBeenCalled();
							expect(onRowClick).not.toHaveBeenCalled();
						} else {
							throw new Error("Unexpected expectedTriggerEvent value");
						}
					});
				}
			);
		});
	});

	describe("hasFootContent", () => {
		it("should have footer aria-attributes when hasFootContent is true or summaryResult is set", () => {
			const testCases: (Partial<OverviewEngine.PaginatedProps> | PartialOEInfiniteScrollProps)[] = [
				{ accessibilityConfigurations: { hasFootContent: true } },
				{ summaryResult: { sampleId: { sum: 100 } } }
			];
			testCases.forEach((testCase) => {
				const wrapper = setupTest(testCase);

				expect(wrapper.getByDataRole(DataRoles.Table.Footer).element).toHaveAttribute("aria-label", "Footer");
			});
		});

		it("should not have footer aria-attributes when hasFootContent is false or undefined and summaryRow is not set", () => {
			const testCases: (Partial<OverviewEngine.PaginatedProps> | PartialOEInfiniteScrollProps)[] = [
				{ accessibilityConfigurations: { hasFootContent: false } },
				{ accessibilityConfigurations: { hasFootContent: false }, summaryResult: { sampleId: { sum: 100 } } },
				{ summaryResult: {} }
			];

			testCases.forEach((testCase) => {
				const wrapper = setupTest(testCase);

				expect(wrapper.getByDataRole(DataRoles.Table.Footer).element).not.toHaveAttribute("aria-label");
			});
		});
	});

	describe.skip("range selection with proper params", () => {
		let wrapper: QueriableElement;

		function selectRow(index: number) {
			fireEvent.click(wrapper.getAllByDataRole(DataRoles.Table.Body.Row)[index]);
		}

		function shiftSelectRow(index: number) {
			fireEvent.click(wrapper.getAllByDataRole(DataRoles.Table.Body.Row)[index], { shiftKey: true });
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

		beforeEach(() => {
			wrapper = setupMultiSelection(
				{
					collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED,
					counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE
				},
				{
					data: customData,
					eventHandlers: { onRowClick: () => {} }
				},
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

const CustomWidget: React.FC = () => <div data-role="custom-widget" />;
