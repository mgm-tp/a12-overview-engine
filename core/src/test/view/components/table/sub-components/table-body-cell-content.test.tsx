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

import { type Column } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { TableBodyCellContent } from "../../../../../main/view/components/table/sub-components/table-body-cell-content.js";

import { render, DataRoles } from "../../../../test-utils.js";
import { defaultEngineProps } from "../../../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.table-body-cell-content", () => {
	const basicEngineProps = defaultEngineProps;

	function setupTest(props: TableBodyCellContent.Props, engineProps?: Partial<OverviewEngine.Props>) {
		return render(<TableBodyCellContent {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: {
				...basicEngineProps,
				...engineProps
			}
		});
	}

	describe("alignment", () => {
		it("should apply correctly alignment", () => {
			const alignments: Column.HorizontalAlignment[] = ["center", "right"];

			alignments.forEach((alignment) => {
				const wrapper = setupTest({ alignment });

				expect(wrapper.getByDataRole(DataRoles.TextOutput).element).toHaveClass(`text-output-wrapper--${alignment}`);
			});
		});
	});

	describe("when given model rowHeight", () => {
		it("should render CssEllipsis", () => {
			const result = setupTest(
				{},
				{
					...basicEngineProps,
					overviewModel: {
						...basicEngineProps.overviewModel,
						content: {
							...basicEngineProps.overviewModel.content,
							configuration: { ...basicEngineProps.overviewModel.content.configuration, rowHeight: 80 }
						}
					}
				}
			);

			expect(result.getByDataRole(DataRoles.CssEllipsis).element).toBeInTheDocument();
		});
	});

	describe("when no given model rowHeight", () => {
		it("should not render CssEllipsis", () => {
			const result = setupTest(
				{},
				{
					...basicEngineProps,
					overviewModel: {
						...basicEngineProps.overviewModel,
						content: {
							...basicEngineProps.overviewModel.content,
							configuration: { ...basicEngineProps.overviewModel.content.configuration, rowHeight: undefined }
						}
					}
				}
			);

			expect(result.getByDataRole(DataRoles.TextOutput.Text).element).toBeEmptyDOMElement();
		});
	});
});
