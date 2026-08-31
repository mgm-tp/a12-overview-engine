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

import type { ReactTestRenderer } from "react-test-renderer";

import { it, expect, describe } from "vitest";

import type { RowStyleGetter } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../main/models/index.js";
import type { OverviewEngineApi } from "../../main/view/api.js";
import { OverviewDialog } from "../../main/view/components/dialogs/overview-dialog.js";
import { DefaultComponentMap } from "../../main/view/configuration/component-map.js";
import { DefaultWidgetMap } from "../../main/view/configuration/widget-map.js";
import { OverviewEngineContext } from "../../main/view/context/overview-engine-context.js";
import { OverviewEngine } from "../../main/view/overview-engine.js";
import { OverviewTable } from "../../main/view/overview-table.js";
import { defaultEngineProps } from "../basic.spec.js";
import { render, shallowRender, type QueriableElement } from "../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.overview-engine", () => {
	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;
	function setupTest(engineProps?: Partial<OverviewEngine.PaginatedProps>): QueriableElement;
	function setupTest(
		engineProps?: Partial<OverviewEngine.PaginatedProps>,
		renderOptions?: { shallow: true }
	): Promise<ReactTestRenderer>;
	function setupTest(
		engineProps?: Partial<OverviewEngine.PaginatedProps>,
		renderOptions?: { shallow: boolean }
	): Promise<ReactTestRenderer> | QueriableElement {
		if (renderOptions?.shallow) {
			return shallowRender(<OverviewEngine {...basicEngineProps} {...engineProps} />);
		}

		return render(<OverviewEngine {...basicEngineProps} {...engineProps} />);
	}

	describe("Basic", () => {
		it("should render basic OE", async () => {
			const result = await setupTest(undefined, { shallow: true });
			const contextProvider = result.root.findByType(OverviewEngineContext.Provider);
			const overviewTable = result.root.findAllByType(OverviewTable);
			const dialog = result.root.findAllByType(OverviewDialog);

			expect(dialog).toHaveLength(1);
			expect(overviewTable).toHaveLength(1);
			expect(contextProvider.props.value.componentMap).toEqual(DefaultComponentMap);
			expect(contextProvider.props.value.widgetMap).toEqual(DefaultWidgetMap);
		});
	});

	describe("EventHandler", () => {
		describe("no given eventHandler", () => {
			it("should use empty eventHandler", async () => {
				const result = await setupTest(undefined, { shallow: true });
				const contextProvider = result.root.findByType(OverviewEngineContext.Provider);

				expect(Object.keys(contextProvider.props.value.eventHandlers)).toHaveLength(0);
			});
		});

		describe("given eventHandler", () => {
			it("should use eventHandler", async () => {
				const eventHandlers: OverviewEngineApi.EventHandlers = {};

				const result = await setupTest({ eventHandlers }, { shallow: true });
				const contextProvider = result.root.findByType(OverviewEngineContext.Provider);

				expect(contextProvider.props.value.eventHandlers).toEqual(eventHandlers);
			});
		});
	});

	describe("OverviewContentBox", () => {
		describe("given no aria level", () => {
			it("ContentBox title should have aria level 1", () => {
				const result = setupTest(undefined);

				expect(result.queryByDataRole("contentbox-title").element).toHaveAttribute("aria-level", "1");
			});
		});

		describe("given aria level = 2", () => {
			it("ContentBox title should have aria level 2", () => {
				const result = setupTest({ ariaLevel: 2 });

				expect(result.queryByDataRole("contentbox-title").element).toHaveAttribute("aria-level", "2");
			});
		});
	});

	describe("rowStyling", () => {
		describe("given no rowStyling", () => {
			it("should have undefined rowStyling", async () => {
				const result = await setupTest(undefined, { shallow: true });
				const contextProvider = result.root.findByType(OverviewEngineContext.Provider);

				expect(contextProvider.props.value.rowStyling).toBeUndefined();
			});
		});

		describe("given rowStyling", () => {
			it("should use rowStyling", async () => {
				const rowStyling: RowStyleGetter<JSONDocument> = () => ({ interactive: true });

				const result = await setupTest({ rowStyling }, { shallow: true });
				const contextProvider = result.root.findByType(OverviewEngineContext.Provider);

				expect(contextProvider.props.value.rowStyling).toEqual(rowStyling);
			});
		});
	});
	// describe("uiIdPrefix", () => {
	// 	it("should render key properly", () => {
	// 		const prefixes = ["Sample-Prefix", undefined];
	// 		const keys = ["Sample-Prefix-BasicOverviewModel", "BasicOverviewModel"];
	// 		prefixes.forEach((prefix, index) => {
	// 			const result = setupTest({ uiIdPrefix: prefix });
	// 			const contextProvider = result.find(OverviewEngineContext.Provider);
	// 			expect(contextProvider.key()).to.be.equal(keys[index]);
	// 		});
	// 	});
	// });
});
