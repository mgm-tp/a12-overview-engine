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
import { it, vi, expect, describe } from "vitest";
import { type ReactTestRenderer } from "react-test-renderer";

import { Pagination as BasePagination } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewEngine } from "../../../main/view/overview-engine.js";
import { Pagination } from "../../../main/view/components/pagination.js";

import { shallowRender } from "../../test-utils.js";
import { defaultEngineProps } from "../../basic.spec.js";

import { multiSelectionCallbacks, defaultClearConfirmationMultiSelection } from "./multi-selection/utils.js";

describe("com.mgmtp.a12.overview-engine.view.components.pagination", () => {
	const onChangeSpy = vi.fn();

	const paginationProps = {
		pageCount: 5,
		pageNumber: 2,
		pageSize: 100,
		disabled: true
	};

	async function setupTest(engineProps?: Partial<OverviewEngine.PaginatedProps>): Promise<ReactTestRenderer> {
		const mergedEngineProps = { ...defaultEngineProps, ...engineProps };

		return shallowRender(
			<OverviewEngine {...mergedEngineProps}>
				<Pagination
					pageCount={paginationProps.pageCount}
					pageNumber={paginationProps.pageNumber}
					pageSize={paginationProps.pageSize}
					onChange={onChangeSpy}
				/>
			</OverviewEngine>
		);
	}

	it("renders the Pagination correctly", async () => {
		const result = await setupTest();
		const pagination = result.root.findByType(BasePagination);

		expect(pagination.props.alignment).toEqual("right");
		expect(pagination.props.currentPage).toEqual(3);
		expect(pagination.props.pageCount).toEqual(5);

		React.act(() => {
			pagination.props.onPageChanged(5);
		});

		expect(onChangeSpy).toHaveBeenCalledExactlyOnceWith(4);
	});

	it("should not call onMultiSelectionClear when changing page", async () => {
		const onMultiSelectionClear = vi.fn();
		const engineProps: Partial<OverviewEngine.PaginatedProps> = {
			...defaultEngineProps,
			overviewModel: {
				...defaultEngineProps.overviewModel,
				content: {
					...defaultEngineProps.overviewModel.content,
					configuration: {
						...defaultEngineProps.overviewModel.content.configuration,
						multiSelection: defaultClearConfirmationMultiSelection
					}
				}
			},
			uiState: { rowState: { "0": { selected: true } } },
			eventHandlers: { ...defaultEngineProps.eventHandlers, ...multiSelectionCallbacks, onMultiSelectionClear }
		};

		const pagination = (await setupTest(engineProps)).root.findByType(BasePagination);

		React.act(() => {
			pagination.props.onPageChanged(5);
		});

		expect(onMultiSelectionClear).not.toHaveBeenCalled();
	});
});
