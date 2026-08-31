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

import * as TypeMoq from "typemoq";
import { it, vi, expect, describe, afterEach, beforeEach } from "vitest";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../../../../main/models/index.js";
import { DocumentUtils } from "../../../../../main/models/internal/utils/document-utils.js";
import { OverviewModel } from "../../../../../main/overview-model.js";
import type { AttachmentCell } from "../../../../../main/view/components/table/sub-components/attachment-cell.js";
import type { ReferenceCell } from "../../../../../main/view/components/table/sub-components/reference-cell.js";
import { TableBodyCell } from "../../../../../main/view/components/table/sub-components/table-body-cell.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import {
	deLocale,
	NumberColumnModel,
	StringColumnModel,
	BooleanColumnModel,
	defaultEngineProps,
	AttachmentColumnModel,
	MultiSelectColumnModel
} from "../../../../basic.spec.js";
import { render, type QueriableElement } from "../../../../test-utils.js";
import { createComponentMap } from "../../../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.reference-cell", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;
	const rowMock = TypeMoq.Mock.ofType<JSONDocument>();
	const basicColumns = {
		AttachmentColumnModel,
		MultiSelectColumnModel,
		NumberColumnModel,
		StringColumnModel,
		BooleanColumnModel
	} as Record<string, OverviewModel.ReferenceColumn>;

	const overviewModelWithRowHeight: OverviewModel = {
		...basicEngineProps.overviewModel,
		content: {
			...basicEngineProps.overviewModel.content,
			configuration: { ...basicEngineProps.overviewModel.content.configuration, rowHeight: 50 }
		}
	};

	const basicProps: TableBodyCell.Props = { row: rowMock.object, columnModel: StringColumnModel };

	function setupTest(
		props?: Partial<ReferenceCell.Props>,
		engineProps?: Partial<OverviewEngine.Props>,
		locale?: Locale
	): QueriableElement {
		return render(
			<TableBodyCell {...basicProps} {...props} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...basicEngineProps, ...engineProps }
			},
			locale
		);
	}

	const getValueStub = vi.spyOn(DocumentUtils, "getValue");

	afterEach(() => {
		getValueStub.mockReset();
	});

	describe("given a string column model", () => {
		const text = "String type cell";

		beforeEach(() => {
			getValueStub.mockReturnValue(text);
		});

		describe("when rowHeight is undefined", () => {
			it("StringTypeCell should be rendered, directly inside TextOutput", () => {
				const wrapper = setupTest({ columnModel: basicColumns.StringColumnModel });
				const textOutputText = wrapper.getByDataRole(DataRoles.TextOutput).getByDataRole(DataRoles.TextOutput.Text);

				expect(textOutputText.element).toHaveTextContent("String type cell");
				expect(wrapper.queryByDataRole(DataRoles.CssEllipsis).element).not.toBeInTheDocument();
			});

			describe("when has rowHeight", () => {
				it("StringTypeCell should be wrapped by CssEllipsis then TextOutput", () => {
					const wrapper = setupTest(
						{ columnModel: basicColumns.StringColumnModel },
						{ overviewModel: overviewModelWithRowHeight }
					);
					const cssEllipsis = wrapper.getByDataRole(DataRoles.TextOutput).getByDataRole(DataRoles.CssEllipsis);

					expect(cssEllipsis.element).toHaveTextContent("String type cell");
				});
			});
		});
	});

	describe("given a number column model", () => {
		const mockValue = 3.14;
		const expectedText = "3.14";

		beforeEach(() => {
			getValueStub.mockReturnValue(mockValue);
		});

		describe("when given content horizontal alignment", () => {
			it("TextOutput should be rendered with defined alignment and given text", () => {
				const wrapper = setupTest({
					columnModel: {
						...basicColumns.NumberColumnModel,
						alignment: { content: { horizontal: OverviewModel.HorizontalAlignment.LEFT } }
					}
				});

				expect(wrapper.queryByDataRole(DataRoles.CssEllipsis).element).not.toBeInTheDocument();
				expect(wrapper.queryByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent(expectedText);
			});
		});

		describe("when no given content horizontal alignment", () => {
			it("TextOutput should have alignment = right", () => {
				const wrapper = setupTest({
					columnModel: {
						...basicColumns.NumberColumnModel,
						alignment: undefined
					}
				});

				expect(wrapper.getByDataRole(DataRoles.TextOutput).element).toHaveClass("text-output-wrapper--right");
			});
		});

		describe("when has rowHeight", () => {
			it("CssEllipsis should be rendered inside TextOutput", () => {
				const wrapper = setupTest(
					{ columnModel: basicColumns.NumberColumnModel },
					{ overviewModel: overviewModelWithRowHeight }
				);
				const cssEllipsis = wrapper.getByDataRole(DataRoles.TextOutput).getByDataRole(DataRoles.CssEllipsis);

				expect(cssEllipsis.element).toHaveTextContent(expectedText);
			});

			describe("when number column model has suffix", () => {
				beforeEach(() => {
					getValueStub.mockReturnValue(500);
				});

				const BundlePriceColumnModel: OverviewModel.Column = {
					label: [{ text: "Price", locale: "en" }],
					id: "column-ab01f",
					elementRef: "F2",
					sortable: true,
					width: 0.5,
					suffix: [
						{ text: "USD", locale: "en" },
						{ text: "EUR", locale: "de" }
					]
				};

				describe("when given English locale", () => {
					it("should show suffix in English format", () => {
						const wrapper = setupTest({ columnModel: BundlePriceColumnModel }, { ...basicEngineProps });

						expect(wrapper.getByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent("500 USD");
					});
				});

				describe("when given German locale", () => {
					it("should show suffix in German format", () => {
						const wrapper = setupTest({ columnModel: BundlePriceColumnModel }, { ...basicEngineProps }, deLocale);

						expect(wrapper.getByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent("500 EUR");
					});
				});

				describe("when column model does not have suffix field", () => {
					const ColumnModelWithoutSuffix = { ...BundlePriceColumnModel, suffix: undefined };

					it("should not show suffix no matter locale is en_US", () => {
						const wrapper = setupTest({ columnModel: ColumnModelWithoutSuffix }, { ...basicEngineProps });

						expect(wrapper.getByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent("500");
					});

					it("should not show suffix no matter locale is de_DE", () => {
						const wrapper = setupTest({ columnModel: ColumnModelWithoutSuffix }, { ...basicEngineProps }, deLocale);

						expect(wrapper.getByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent("500");
					});
				});
			});
		});
	});

	describe("given a multi-select column model", () => {
		const values = [{ value: "1" }, { value: "2" }];

		beforeEach(() => {
			getValueStub.mockReturnValue(values);
		});

		it("MultiSelectCell should be rendered", () => {
			const wrapper = setupTest({ columnModel: basicColumns.MultiSelectColumnModel });
			const list = wrapper.getByDataRole(DataRoles.UnorderedBulletList);

			expect(list.element).toBeInTheDocument();
			expect(list.getAllByDataRole(DataRoles.BulletList.Item)).toHaveLength(values.length);
		});
	});

	describe("given a attachment column model", () => {
		const values = { attachment_id: "3" };

		beforeEach(() => {
			getValueStub.mockReturnValue(values);
		});

		it("Attachment should be rendered", () => {
			rowMock.setup((row) => row.id).returns(() => "2");
			const AttachmentCellMock: React.ComponentType<AttachmentCell.Props> = () => (
				<div data-role="attachment">attachment</div>
			);

			const wrapper = setupTest(
				{ columnModel: basicColumns.AttachmentColumnModel },
				{ componentMap: createComponentMap({ AttachmentCell: AttachmentCellMock }) }
			);

			expect(wrapper.getByDataRole("attachment").element).toBeInTheDocument();
		});
	});

	describe("given a boolean column model", () => {
		const testCases = [
			{ value: true, expected: "yes" },
			{ value: false, expected: "no" },
			{ value: null, expected: "" }
		];
		testCases.forEach((testCase) => {
			describe(`when the value is ${testCase.value}`, () => {
				beforeEach(() => {
					getValueStub.mockReturnValue(testCase.value);
				});

				it(`should render ${testCase.expected}`, () => {
					const wrapper = setupTest({
						columnModel: basicColumns.BooleanColumnModel
					});

					expect(wrapper.queryByDataRole(DataRoles.TextOutput.Text).element).toHaveTextContent(testCase.expected);
				});
			});
		});
	});

	describe("given a fieldFormatter", () => {
		beforeEach(() => {
			getValueStub.mockReturnValue("String type cell");
		});

		it("should be called with proper params", () => {
			const fieldFormatterSpy = vi.fn();
			const formatterParams = {
				field: {
					type: "Field",
					id: "F1",
					name: "string",
					fieldType: { type: "StringType" },
					label: [
						{ locale: "en", text: "String [DM]" },
						{ locale: "de", text: "String DE [DM]" }
					]
				},
				modelPath: [{ elementName: "root" }, { elementName: "string" }],
				value: "String type cell",
				referenceColumn: {
					label: [{ text: "String [OM]", locale: "en" }],
					id: "column-12345",
					elementRef: "F1",
					sortable: true,
					width: 1
				}
			};
			setupTest({ fieldFormatter: fieldFormatterSpy });

			expect(fieldFormatterSpy).toHaveBeenCalledWith(formatterParams);
		});
	});
});
