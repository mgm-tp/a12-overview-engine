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
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { TextOutput, type TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import type { OverviewColumn } from "../../../../../main/view/hooks/use-table-columns.js";
import { TableFootCellContent } from "../../../../../main/view/components/table/sub-components/table-foot-cell-content.js";

import { render, shallowRender } from "../../../../test-utils.js";
import {
	deLocale,
	enLocale,
	NumberColumnModel,
	StringColumnModel,
	defaultEngineProps
} from "../../../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.table-foot-cell-content", () => {
	const basicEngineProps: OverviewEngine.PaginatedProps = {
		...defaultEngineProps,
		summaryResult: {
			[NumberColumnModel.id]: {
				sum: 123456789
			}
		}
	};

	const basicProps: OverviewColumn = {
		label: "NumberColumnModel label",
		columnModel: {
			...NumberColumnModel,
			summary: [{ operation: OverviewModel.Summary.Operation.SUM }]
		}
	};

	function setupTest(
		props: TableRenderPropsType.FootContentProps<OverviewColumn>,
		engineProps?: Partial<OverviewEngine.Props>,
		locale?: Locale
	) {
		return render(
			<TableFootCellContent {...basicProps} {...props} />,
			{
				wrappingComponent: OverviewEngine,
				wrappingComponentProps: { ...basicEngineProps, ...engineProps }
			},
			locale
		);
	}

	describe("given a number column model with the sum operation", () => {
		describe("TextOutPut and sum sign icon", () => {
			const testCases = [
				{ locale: enLocale, expectedTitle: "Total" },
				{ locale: deLocale, expectedTitle: "Gesamtbetrag" }
			];
			testCases.forEach((testCase) => {
				it(`should render to display a summary row with title = ${testCase.expectedTitle}`, () => {
					const wrapper = setupTest({ column: basicProps }, undefined, testCase.locale);
					const textOutput = wrapper.queryByDataRole(DataRoles.TextOutput);

					expect(textOutput).toBeDefined();

					const icon = wrapper.queryByDataRole(DataRoles.Icon);

					expect(icon?.element).toHaveAttribute("title", testCase.expectedTitle);
				});
			});

			it("should display the exact sum result", () => {
				const wrapper = setupTest({ column: basicProps });

				expect(wrapper.queryByDataRole(DataRoles.TextOutput.Text)?.element).toHaveTextContent("123,456,789");
			});
		});

		describe("when the number column model includes a suffix", () => {
			it("the suffix should be displayed alongside the sum result", () => {
				const columnWithSuffix: OverviewColumn = {
					...basicProps,
					columnModel: {
						...NumberColumnModel,
						summary: [{ operation: OverviewModel.Summary.Operation.SUM }],
						suffix: [{ locale: "en", text: "USD" }]
					}
				};
				const wrapper = setupTest({ column: columnWithSuffix });

				expect(wrapper.queryByDataRole(DataRoles.TextOutput.Text)?.element).toHaveTextContent("123,456,789 USD");
			});
		});

		describe("Given sum result is more than 15 digits", () => {
			it("should render properly", () => {
				const wrapper = setupTest(
					{ column: basicProps },
					{
						...basicEngineProps,
						summaryResult: {
							...basicEngineProps.summaryResult,
							[NumberColumnModel.id]: { sum: 1_111_111_111_111_111 }
						}
					}
				);

				expect(wrapper.queryByDataRole(DataRoles.TextOutput.Text)?.element).toHaveTextContent("1,111,111,111,111,111");
			});
		});

		describe("when given content horizontal alignment", () => {
			it("TextOutput should be rendered with defined alignment", async () => {
				const columnWithDefinedAlignment: OverviewColumn = {
					...basicProps,
					columnModel: {
						...NumberColumnModel,
						summary: [{ operation: OverviewModel.Summary.Operation.SUM }],
						alignment: { content: { horizontal: OverviewModel.HorizontalAlignment.LEFT } }
					}
				};
				const wrapper = await shallowRender(<TableFootCellContent column={columnWithDefinedAlignment} />, {
					wrappingComponent: OverviewEngine,
					wrappingComponentProps: basicEngineProps
				});

				expect(wrapper.root.findByType(TextOutput).props.alignment).toBe("left");
			});
		});

		describe("when no given content horizontal alignment", () => {
			it("TextOutput should have alignment = right", async () => {
				const wrapper = await shallowRender(
					<TableFootCellContent
						column={{
							...basicProps,
							columnModel: {
								...NumberColumnModel,
								summary: [{ operation: OverviewModel.Summary.Operation.SUM }],
								alignment: undefined
							}
						}}
					/>,
					{
						wrappingComponent: OverviewEngine,
						wrappingComponentProps: basicEngineProps
					}
				);

				expect(wrapper.root.findByType(TextOutput).props.alignment).toBe("right");
			});
		});
	});

	describe("given a string column model", () => {
		it("should not render text output", () => {
			const column: OverviewColumn = {
				label: "Label",
				columnModel: { ...StringColumnModel }
			};
			const wrapper = setupTest({ column });

			expect(wrapper.element).toBeEmptyDOMElement();
		});
	});
});
