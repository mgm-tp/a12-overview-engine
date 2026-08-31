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

import { OverviewModel } from "../../../../../main/overview-model.js";
import { TableBodyCell } from "../../../../../main/view/components/table/sub-components/table-body-cell.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { getDocumentModel, getOverviewModel } from "../../../../setup/models.js";
import { render, type QueriableElement } from "../../../../test-utils.js";
import { createComponentMap } from "../../../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.table-body-cell", async () => {
	const expressionCellDataRole = "expression-cell-test";
	const referentCellDataRole = "referent-cell-test";

	const basicEngineProps: OverviewEngine.Props = {
		...defaultEngineProps,
		documentModel: await getDocumentModel("product", "ProductDM"),
		overviewModel: await getOverviewModel("product", "ProductOM"),
		componentMap: createComponentMap({
			ExpressionCell: () => <div data-role={expressionCellDataRole} />,
			ReferenceCell: () => <div data-role={referentCellDataRole} />
		})
	};
	const basicRow = basicEngineProps.data[0];

	function setupTest(column: OverviewModel.Column): QueriableElement {
		return render(<TableBodyCell row={basicRow} columnModel={column} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: basicEngineProps
		});
	}

	describe("given reference column", () => {
		it("should render ReferenceCell", () => {
			const referenceColumn = basicEngineProps.overviewModel.content.columns[1];
			const result = setupTest(referenceColumn);

			expect(OverviewModel.ReferenceColumn.isAssignableFrom(referenceColumn)).toBe(true);
			expect(result.queryByDataRole(expressionCellDataRole).element).toBeNull();
			expect(result.queryByDataRole(referentCellDataRole).element).toBeInTheDocument();
		});
	});

	describe("given expression column", () => {
		it("should render ExpressionCell", () => {
			const expressionColumn = basicEngineProps.overviewModel.content.columns[2];
			const result = setupTest(expressionColumn);

			expect(OverviewModel.ExpressionColumn.isAssignableFrom(expressionColumn)).toBe(true);
			expect(result.queryByDataRole(expressionCellDataRole).element).toBeInTheDocument();
			expect(result.queryByDataRole(referentCellDataRole).element).toBeNull();
		});
	});
});
