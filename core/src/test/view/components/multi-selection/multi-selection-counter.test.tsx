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

import "../../../setup/jsdom.js";

import { it, expect, describe } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../../../main/overview-model.js";
import type { OverviewEngineApi } from "../../../../main/view/api.js";

import { setupMultiSelection } from "./utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.multi-selection.multi-selection-counter", () => {
	const basicMultiSelection = {
		counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
		collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED
	} as OverviewModel.MultiSelection;

	describe("given counterOption = none", () => {
		it("should not be rendered when the panel is collapsed", () => {
			const wrapper = setupMultiSelection({
				...basicMultiSelection,
				counterOption: OverviewModel.MultiSelection.CounterOption.NONE
			});

			expect(wrapper.queryByDataRole(DataRoles.Counter).element).not.toBeInTheDocument();
		});

		it("should not be rendered when the panel is expanded", () => {
			const wrapper = setupMultiSelection(
				{ ...basicMultiSelection, counterOption: OverviewModel.MultiSelection.CounterOption.NONE },
				{ uiState: { expandedMultiSelection: true } }
			);

			expect(wrapper.queryByDataRole(DataRoles.Counter).element).not.toBeInTheDocument();
		});
	});

	describe("given counterOption = simple", () => {
		it("should not be rendered when the panel is collapsed", () => {
			const wrapper = setupMultiSelection(basicMultiSelection, {
				uiState: { expandedMultiSelection: false }
			});

			expect(wrapper.queryByDataRole(DataRoles.Counter).element).not.toBeInTheDocument();
		});

		it("should be rendered when the panel is expanded", () => {
			const wrapper = setupMultiSelection(basicMultiSelection);

			expect(wrapper.getByDataRole(DataRoles.Counter).element).toBeInTheDocument();
		});
	});

	describe("with various rowState values", () => {
		const testCases: [OverviewEngineApi.RowState, number][] = [
			[{}, 0],
			[
				{
					0: { selected: undefined },
					1: { selected: undefined }
				},
				0
			],
			[
				{
					0: { selected: false },
					1: { selected: undefined }
				},
				0
			],
			[
				{
					0: { selected: true }
				},
				1
			],
			[
				{
					1: { selected: true }
				},
				1
			],
			[
				{
					0: { selected: false },
					1: { selected: true }
				},
				1
			],
			[
				{
					0: { selected: true },
					1: { selected: true }
				},
				2
			]
		];

		testCases.forEach(([rowState, expectValue]) => {
			it("should render proper value", () => {
				const wrapper = setupMultiSelection(
					{ ...basicMultiSelection, collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_EXPANDED },
					{ uiState: { rowState, expandedMultiSelection: true } }
				);

				expect(wrapper.getByDataRole(DataRoles.Counter).element).toHaveTextContent(expectValue.toString());
			});
		});
	});
});
