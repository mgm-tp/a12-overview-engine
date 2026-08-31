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

import * as TypeMoq from "typemoq";
import { it, vi, expect, afterAll, describe, beforeAll } from "vitest";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";
import { type InfiniteScrollOptions, DefaultTableComponentRenderers } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../../../../main/models/index.js";
import { en } from "../../../../../main/services/localization/internal/languages/en.js";
import { InfiniteScrollTableBody } from "../../../../../main/view/components/table/sub-components/infinite-scroll-table-body.js";
import { OverviewEngine } from "../../../../../main/view/overview-engine.js";
import { defaultEngineProps } from "../../../../basic.spec.js";
import { render } from "../../../../test-utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.table.sub-components.infinite-scroll-table-body", () => {
	const jsonDocument = TypeMoq.Mock.ofType<JSONDocument>();
	const infiniteScrollOptions: InfiniteScrollOptions = {
		rowCount: 0,
		rowHeight: 150,
		rowLoadingStatus: () => undefined,
		loadData: vi.fn()
	};

	const basicEngineProps: OverviewEngine.Props = defaultEngineProps;

	const basicProps: InfiniteScrollTableBody.Props = {
		data: [jsonDocument.object],
		infiniteScrollOptions
	};

	function setupTest(props?: Partial<InfiniteScrollTableBody.Props>, engineProps?: Partial<OverviewEngine.Props>) {
		return render(<InfiniteScrollTableBody {...basicProps} {...props} />, {
			wrappingComponent: OverviewEngine,
			wrappingComponentProps: { ...basicEngineProps, ...engineProps }
		});
	}

	describe("given a table body", () => {
		describe("given no data", () => {
			it("should use localizer with resource key noResultFound", () => {
				const wrapper = setupTest({
					data: [],
					infiniteScrollOptions: {
						...infiniteScrollOptions,
						rowCount: 0
					}
				});

				expect(wrapper.getByDataRole(DataRoles.Message).element).toHaveTextContent(en.overviewEngine.noResultFound);
			});
		});

		describe("given data", () => {
			const text = "rendered correctly";

			beforeAll(() => {
				vi.spyOn(DefaultTableComponentRenderers, "infiniteScrollBodyRenderer").mockReturnValue(text);
			});

			afterAll(() => {
				vi.resetAllMocks();
			});

			it("should render using default infiniteScrollBodyRenderer", () => {
				const wrapper = setupTest({
					data: [{ id: "1", modelId: "test-model" }],
					infiniteScrollOptions: { ...infiniteScrollOptions, rowCount: 1 }
				});

				expect(wrapper.element).toHaveTextContent(text);
			});
		});
	});
});
