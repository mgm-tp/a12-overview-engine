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

import { it, vi, expect, describe, afterEach } from "vitest";

import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { DocumentUtils } from "../../../../../main/models/internal/shared.js";
import { OverviewModel } from "../../../../../main/overview-model.js";
import { ExpressionCell } from "../../../../../main/view/components/table/sub-components/expression-cell.js";
import type { FieldFormatterParams } from "../../../../../main/view/components/table/sub-components/field-reference-cell.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { getDocumentModel, getOverviewModel } from "../../../../setup/models.js";
import { render, type QueriableElement } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.expression-cell", async () => {
	const basicEngineProps = {
		...defaultEngineProps,
		documentModel: await getDocumentModel("product", "ProductDM"),
		overviewModel: await getOverviewModel("product", "ProductOM")
	};

	const basicProps: ExpressionCell.Props = {
		row: {
			id: "1024",
			modelId: "test-model",
			product: {
				number: 42,
				name: 'Pro Touch Basketball "Harlem"',
				dateTimeField: "2018-03-28T18:20:00",
				dateField: new Date("2018-03-17T11:00:00Z"),
				timeField: "21:20:00",
				description: "**to be determined**",
				meta: [{ value: "1" }, { value: "2" }, { value: "3" }],
				searchKeywords: {
					searchKeyword: ""
				},
				logistics: {
					weight: {
						weightValue: 0.7,
						weightUnit: "kg"
					}
				},
				targetGroup: "men",
				inStock: true,
				limitedOffer: null,
				sellerEmail: "mglee@optonline.net"
			}
		},
		columnModel: basicEngineProps.overviewModel.content.columns[2] as OverviewModel.ExpressionColumn
	};

	function setupTest(
		props?: ExpressionCell.Props,
		engineProps?: Partial<OverviewEngine.Props>,
		locale?: Locale
	): QueriableElement {
		return render(
			<ExpressionCell {...basicProps} {...props} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...basicEngineProps, ...engineProps }
			},
			locale
		);
	}

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("ExpressionOutput", () => {
		it("should throw an error if no find the expression tree", () => {
			vi.spyOn(globalThis.console, "error").mockImplementation(() => {});

			expect(() => setupTest({ ...basicProps, columnModel: { ...basicProps.columnModel, id: "1" } })).toThrow();
		});

		it("should exist if find the expression tree", () => {
			const wrapper = setupTest();

			const expressionOutput = wrapper.getByDataRole(DataRoles.CssEllipsis).element.firstElementChild;

			expect(expressionOutput).toBeInTheDocument();
			expect(expressionOutput).toHaveTextContent("03/17/2018");
		});

		it("should use DocumentUtils.getValue as valueGetter", () => {
			const mockGetValue = vi.fn().mockImplementation(() => new Date());
			const path: EntityInstancePath = [
				{ elementName: "product", index: 1 },
				{ elementName: "number", index: 1 }
			];

			vi.spyOn(DocumentUtils, "getValue").mockImplementation(() => mockGetValue(basicProps.row, path));

			setupTest();

			expect(mockGetValue).toHaveBeenCalledWith(basicProps.row, path);
		});

		it("should call fieldFormatter with proper params", () => {
			const CUSTOM_VALUE = "Mar 2018";
			const customFieldFormatter = vi.fn().mockImplementation(() => CUSTOM_VALUE);
			const path: EntityInstancePath = [
				{ elementName: "product", index: 1 },
				{ elementName: "dateField", index: 1 }
			];
			const formatterParams: FieldFormatterParams = {
				field: {
					id: "F50",
					type: "Field",
					name: "dateField",
					label: [
						{ locale: "de", text: "[D] Date" },
						{ locale: "en", text: "[D] Date" }
					],
					requirednessConfig: { mode: "absoluteOrRelativeToNextRepAncestor" },
					fieldType: { type: "DateType", format: "yyyy-MM-dd", datePrecision: "FULL" }
				},
				modelId: "ProductDM",
				modelPath: path,
				value: new Date("2018-03-17T11:00:00.000Z")
			};

			const wrapper = setupTest({ ...basicProps, fieldFormatter: customFieldFormatter });

			expect(customFieldFormatter).toHaveBeenCalledExactlyOnceWith(formatterParams);

			const expressionOutput = wrapper.getByDataRole(DataRoles.CssEllipsis).element.firstElementChild;

			expect(expressionOutput).toHaveTextContent(CUSTOM_VALUE);
		});
	});

	describe("alignment", () => {
		it("should use default left alignment", () => {
			const wrapper = setupTest({
				...basicProps,
				columnModel: {
					...basicProps.columnModel,
					alignment: {
						...basicProps.columnModel.alignment,
						content: {
							...basicProps.columnModel.alignment?.content,
							horizontal: OverviewModel.HorizontalAlignment.LEFT
						}
					}
				}
			});

			expect(wrapper.getByDataRole(DataRoles.TextOutput).element.classList).not.toContain("text-output-wrapper");
		});

		it("should use center alignment", () => {
			const wrapper = setupTest({
				...basicProps,
				columnModel: {
					...basicProps.columnModel,
					alignment: {
						...basicProps.columnModel.alignment,
						content: {
							...basicProps.columnModel.alignment?.content,
							horizontal: OverviewModel.HorizontalAlignment.CENTER
						}
					}
				}
			});

			expect(wrapper.getByDataRole(DataRoles.TextOutput).element).toHaveClass("text-output-wrapper--center");
		});

		it("should use right alignment", () => {
			const wrapper = setupTest({
				...basicProps,
				columnModel: {
					...basicProps.columnModel,
					alignment: {
						...basicProps.columnModel.alignment,
						content: {
							...basicProps.columnModel.alignment?.content,
							horizontal: OverviewModel.HorizontalAlignment.RIGHT
						}
					}
				}
			});

			expect(wrapper.getByDataRole(DataRoles.TextOutput).element).toHaveClass("text-output-wrapper--right");
		});
	});
});
