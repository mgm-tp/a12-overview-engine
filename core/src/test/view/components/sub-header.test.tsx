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
import { it, expect, describe } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../../main/overview-model.js";
import { OverviewEngine } from "../../../main/view/overview-engine.js";
import { SubHeader } from "../../../main/view/components/sub-header.js";
import { getElementSegments } from "../../../main/view/components/sub-header-elements.js";

import { render } from "../../test-utils.js";
import { defaultEngineProps } from "../../basic.spec.js";

describe("com.mgmtp.a12.overview-engine.view.components.sub-header", () => {
	const filterElement: OverviewModel.Element = { type: OverviewModel.ElementType.FILTER };
	const searchElement: OverviewModel.Element = { type: OverviewModel.ElementType.SEARCH };
	const multiSelectionElement: OverviewModel.Element = { type: OverviewModel.ElementType.MULTI_SELECTION };
	const buttonElements: OverviewModel.Element[] = ["event_1", "event_2", "event_3"].map((event) => ({
		type: OverviewModel.ElementType.BUTTON,
		event
	}));

	const searchBarMock: React.ReactElement = (
		<div key="searchBar" data-role="search-bar-test">
			searchBarMock
		</div>
	);
	const filterSelectorMock: React.ReactElement = (
		<div key="filterSelector" data-role="filter-selector-test">
			filterSelectorMock
		</div>
	);
	const multiSelectionPanelMock: React.ReactElement = (
		<div key="multiSelectionPanel" data-role="multi-selection-panel-test">
			multiSelectionPanelMock
		</div>
	);
	const filterBarMock: React.ReactElement = (
		<div key="filterBar" data-role="filter-bar-test">
			filterBarMock
		</div>
	);

	const overviewModel: OverviewModel = {
		...defaultEngineProps.overviewModel,
		content: {
			...defaultEngineProps.overviewModel.content,
			subHeaderBox: {
				rightSlot: [...buttonElements, filterElement, searchElement, multiSelectionElement]
			}
		}
	};

	const basicEngineProps: OverviewEngine.Props = {
		...defaultEngineProps,
		overviewModel
	};

	function setupTest(props?: Partial<SubHeader.PropsType>) {
		return render(<SubHeader {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: basicEngineProps
		});
	}

	describe("given all kind of elements passed to sub-header", () => {
		it("they should be all rendered in sub-header", () => {
			const result = setupTest({
				searchBar: searchBarMock,
				filterSelector: filterSelectorMock,
				multiSelectionPanel: multiSelectionPanelMock,
				filterBar: filterBarMock
			});
			const buttons = result.queryAllByDataRole(DataRoles.Button);

			expect(buttons).toHaveLength(3);
			expect(result.queryAllByDataRole("search-bar-test")).toHaveLength(1);
			expect(result.queryAllByDataRole("filter-selector-test")).toHaveLength(1);
			expect(result.queryAllByDataRole("multi-selection-panel-test")).toHaveLength(1);
			expect(result.queryAllByDataRole("filter-bar-test")).toHaveLength(1);
		});
	});

	describe("getElementSegments", () => {
		describe("given lists of elements", () => {
			const testCases: { input: OverviewModel.Element[]; output: OverviewModel.Element[][] }[] = [
				{
					input: [filterElement, searchElement, buttonElements[0], multiSelectionElement],
					output: [[filterElement, searchElement], [buttonElements[0]], [multiSelectionElement]]
				},
				{
					input: [filterElement, buttonElements[0], buttonElements[1], multiSelectionElement, searchElement],
					output: [[filterElement], [buttonElements[0], buttonElements[1]], [multiSelectionElement], [searchElement]]
				},
				{
					input: [
						buttonElements[0],
						buttonElements[1],
						buttonElements[2],
						multiSelectionElement,
						searchElement,
						filterElement
					],
					output: [buttonElements, [multiSelectionElement], [searchElement, filterElement]]
				}
			];

			it.each(testCases)("the function should return segments with the correct order", (testCase) => {
				const result = getElementSegments(testCase.input);

				expect(result.map((s) => s.elements)).toStrictEqual(testCase.output);
			});

			it("assigns stable keys derived from the first element of each segment", () => {
				const result = getElementSegments([filterElement, searchElement, buttonElements[0], multiSelectionElement]);

				expect(result.map((s) => s.key)).toStrictEqual([
					`type:${filterElement.type}`,
					"button:event_1",
					`type:${multiSelectionElement.type}`
				]);
			});

			it("disambiguates duplicate segment bases with a numeric suffix", () => {
				const result = getElementSegments([buttonElements[0], multiSelectionElement, buttonElements[0]]);

				expect(result.map((s) => s.key)).toStrictEqual([
					"button:event_1",
					`type:${multiSelectionElement.type}`,
					"button:event_1#1"
				]);
			});
		});
	});
});
