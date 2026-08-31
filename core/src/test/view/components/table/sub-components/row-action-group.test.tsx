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

import type { JSONDocument } from "../../../../../main/models/index.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import { RowActionGroup } from "../../../../../main/view/components/table/sub-components/row-action-group.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { render, type QueriableElement } from "../../../../test-utils.js";
import { mockType } from "../../../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.row-action-group", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;

	const basicRow = mockType<JSONDocument>({ id: "1023" });

	const rowActionModels: OverviewModel.Button[] = ["add", "delete", "edit"].map((item) => ({
		event: item,
		icon: { name: item },
		label: [{ text: "Test", locale: "en" }],
		confirmation: {
			title: [{ text: "Confirmation title", locale: "en" }],
			message: [{ text: "Confirmation message", locale: "en" }]
		}
	}));

	const rowActionGroupModel: OverviewModel.RowActionGroup = { actions: rowActionModels };

	const basicProps: RowActionGroup.Props = {
		row: basicRow,
		rowActionGroupModel
	};

	function setupTest(engineProps?: Partial<OverviewEngine.Props>): QueriableElement {
		const mergedEngineProps = { ...basicEngineProps, ...engineProps };

		return render(<RowActionGroup {...basicProps} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: mergedEngineProps
		});
	}

	describe("given a row action group", () => {
		it("should render all defined actions", () => {
			const wrapper = setupTest();
			const rowActions = wrapper.getAllByDataRole(DataRoles.Button);

			expect(rowActions).toHaveLength(3);

			rowActions.forEach((rowAction) => {
				expect(rowAction).toHaveAttribute("aria-label", "Test");
				expect(rowAction.querySelector("[data-role='plasma-icon']")).toBeInTheDocument();
			});
		});
	});

	describe("given rowActionState", () => {
		describe("when specifically given defined hidden values for the row events", () => {
			it("row actions should be hidden/visible according to those values, regardless the overall event state", () => {
				const wrapper = setupTest({
					rowActionState: {
						rows: {
							[basicProps.row.id]: {
								add: { hidden: false },
								delete: { hidden: true },
								edit: {}
							}
						},
						rowActions: {
							add: { hidden: true },
							delete: { hidden: false }
						}
					}
				});

				const rowActions = wrapper.getAllByDataRole(DataRoles.Button);

				expect(rowActions).toHaveLength(2);
			});
		});

		describe("when no given hidden values for the row events specifically", () => {
			it("row actions should be hidden/visible according the overall event state", () => {
				const wrapper = setupTest({
					rowActionState: {
						rowActions: {
							add: { hidden: true },
							delete: { hidden: false },
							edit: { hidden: undefined }
						}
					}
				});

				const rowActions = wrapper.getAllByDataRole(DataRoles.Button);

				expect(rowActions).toHaveLength(2);
			});
		});
	});
});
