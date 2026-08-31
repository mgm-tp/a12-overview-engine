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

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../../../../main/models/index.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import type { OverviewEngineApi } from "../../../../../main/view/api.js";
import { RowActionGroup } from "../../../../../main/view/components/table/sub-components/row-action-group.js";
import { RowAction } from "../../../../../main/view/components/table/sub-components/row-action.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { render, type QueriableElement } from "../../../../test-utils.js";
import { noop, mockType } from "../../../../utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.row-action-styling", () => {
	const rowMock = mockType<JSONDocument>({ id: "1023", linkId: "link-1" });

	const rowActionModel: OverviewModel.Button = {
		event: "test",
		icon: { name: "add" },
		label: [{ text: "Button Label Test", locale: "en" }]
	};

	const basicEngineProps: OverviewEngine.PaginatedProps = {
		...defaultEngineProps,
		eventHandlers: {
			...defaultEngineProps.eventHandlers,
			onRowButtonClick: noop
		}
	};

	const basicProps: RowAction.PropsType = {
		row: rowMock,
		rowActionModel
	};

	function setupRowActionTest(engineProps?: Partial<OverviewEngine.PaginatedProps>): QueriableElement {
		const mergedEngineProps: OverviewEngine.Props = {
			...basicEngineProps,
			...engineProps
		};

		return render(
			<OverviewEngine {...mergedEngineProps}>
				<RowAction {...basicProps} />
			</OverviewEngine>
		);
	}

	const rowActionGroupModel: OverviewModel.RowActionGroup = {
		actions: [rowActionModel]
	};

	function setupRowActionGroupTest(engineProps?: Partial<OverviewEngine.PaginatedProps>): QueriableElement {
		const mergedEngineProps: OverviewEngine.Props = {
			...basicEngineProps,
			...engineProps
		};

		return render(<RowActionGroup row={rowMock} rowActionGroupModel={rowActionGroupModel} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: mergedEngineProps
		});
	}

	describe("existing map-based behavior unchanged", () => {
		it("should hide an action via rowActionState.rows[id]", () => {
			const wrapper = setupRowActionGroupTest({
				rowActionState: {
					rows: {
						[rowMock.id]: {
							[rowActionModel.event]: { hidden: true }
						}
					}
				}
			});

			expect(wrapper.queryByDataRole(DataRoles.Button).element).not.toBeInTheDocument();
		});

		it("should disable an action via rowActionState.rowActions", () => {
			const wrapper = setupRowActionTest({
				rowActionState: {
					rowActions: {
						[basicProps.rowActionModel.event]: { disabled: true }
					}
				}
			});

			const button = wrapper.getByDataRole(DataRoles.Button);
			expect(button.element).toBeDisabled();
		});
	});

	describe("rowActionStyling callback overrides map", () => {
		it("should use rowActionStyling disabled when it returns a value", () => {
			const rowActionStyling: OverviewEngineApi.RowActionStyling = vi.fn(() => ({
				disabled: true
			}));

			const wrapper = setupRowActionTest({
				rowActionStyling,
				rowActionState: {
					rowActions: {
						[basicProps.rowActionModel.event]: { disabled: false }
					}
				}
			});

			const button = wrapper.getByDataRole(DataRoles.Button);
			expect(button.element).toBeDisabled();
			expect(rowActionStyling).toHaveBeenCalled();
		});

		it("should hide via rowActionStyling even when map says visible", () => {
			const rowActionStyling: OverviewEngineApi.RowActionStyling = () => ({
				hidden: true
			});

			const wrapper = setupRowActionGroupTest({
				rowActionStyling,
				rowActionState: {
					rows: {
						[rowMock.id]: {
							[rowActionModel.event]: { hidden: false }
						}
					}
				}
			});

			expect(wrapper.queryByDataRole(DataRoles.Button).element).not.toBeInTheDocument();
		});
	});

	describe("rowActionStyling returning undefined falls back to map", () => {
		it("should fall back to rowActionState.rows when callback returns undefined", () => {
			const rowActionStyling: OverviewEngineApi.RowActionStyling = () => undefined;

			const wrapper = setupRowActionTest({
				rowActionStyling,
				rowActionState: {
					rows: {
						[rowMock.id]: {
							[basicProps.rowActionModel.event]: { disabled: true }
						}
					}
				}
			});

			const button = wrapper.getByDataRole(DataRoles.Button);
			expect(button.element).toBeDisabled();
		});

		it("should fall back to rowActionState.rowActions when callback returns undefined and no row-specific state", () => {
			const rowActionStyling: OverviewEngineApi.RowActionStyling = () => undefined;

			const wrapper = setupRowActionTest({
				rowActionStyling,
				rowActionState: {
					rowActions: {
						[basicProps.rowActionModel.event]: { disabled: true }
					}
				}
			});

			const button = wrapper.getByDataRole(DataRoles.Button);
			expect(button.element).toBeDisabled();
		});

		it("should fall back when callback returns a state with undefined property value", () => {
			const rowActionStyling: OverviewEngineApi.RowActionStyling = () => ({
				disabled: undefined
			});

			const wrapper = setupRowActionTest({
				rowActionStyling,
				rowActionState: {
					rowActions: {
						[basicProps.rowActionModel.event]: { disabled: true }
					}
				}
			});

			const button = wrapper.getByDataRole(DataRoles.Button);
			// callback returned { disabled: undefined }, so it falls back to the map
			expect(button.element).toBeDisabled();
		});
	});
});
