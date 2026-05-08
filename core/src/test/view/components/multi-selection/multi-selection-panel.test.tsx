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

import { OverviewModel } from "../../../../main/overview-model.js";

import { DataRoles } from "../../../test-utils.js";
import { defaultEngineProps } from "../../../basic.spec.js";

import { setupMultiSelection } from "./utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.multi-selection.multi-selection-panel", () => {
	const basicEngineProps = defaultEngineProps;
	const basicMultiSelection: OverviewModel.MultiSelection = {
		counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
		collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED
	};

	describe("when disabled multiSelection", () => {
		it("should not be rendered", () => {
			const wrapper = setupMultiSelection();

			expect(wrapper.queryByDataRole(DataRoles.Contentbox.GroupActionBar).element).not.toBeInTheDocument();
		});
	});

	describe("when nothing is in panel", () => {
		it("should not be rendered", () => {
			const wrapper = setupMultiSelection({
				...basicMultiSelection,
				counterOption: OverviewModel.MultiSelection.CounterOption.NONE,
				collapseOption: OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE
			});

			expect(wrapper.queryByDataRole(DataRoles.Contentbox.GroupActionBar).element).not.toBeInTheDocument();
		});
	});

	describe("when not given onOverallMultiSelectionButtonClick", () => {
		it("should not be rendered", () => {
			const wrapper = setupMultiSelection(basicMultiSelection, {
				eventHandlers: {
					...basicEngineProps.eventHandlers,
					onOverallMultiSelectionButtonClick: undefined
				}
			});

			expect(wrapper.queryByDataRole(DataRoles.Contentbox.GroupActionBar).element).not.toBeInTheDocument();
		});
	});

	describe("when not given onRowsSelect", () => {
		it("should not be rendered", () => {
			const wrapper = setupMultiSelection(basicMultiSelection, {
				eventHandlers: {
					...basicEngineProps,
					onRowsSelect: undefined
				}
			});

			expect(wrapper.queryByDataRole(DataRoles.Contentbox.GroupActionBar).element).not.toBeInTheDocument();
		});
	});

	describe("when not given onMultiSelectionClear", () => {
		it("should not be rendered", () => {
			const wrapper = setupMultiSelection(basicMultiSelection, {
				eventHandlers: {
					...basicEngineProps,
					onMultiSelectionClear: undefined
				}
			});

			expect(wrapper.queryByDataRole(DataRoles.Contentbox.GroupActionBar).element).not.toBeInTheDocument();
		});
	});
});
