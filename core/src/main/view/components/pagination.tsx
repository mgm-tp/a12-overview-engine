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

import { useIdGenerator } from "../utils.js";
import type { OverviewEngineApi } from "../api.js";
import { UiStateSelector } from "../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

/** @internal */
export const Pagination: React.ComponentType<Pagination.PropsType> = React.memo(function OverviewPagination(props) {
	const { pageNumber, pageCount, onChange } = props;
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const BasePagination = useOverviewEngineContext((context) => context.widgetMap.Pagination);
	const onNextPageClick = useOverviewEngineContext((context) => context.eventHandlers.onNextPageClick);
	const onPreviousPageClick = useOverviewEngineContext((context) => context.eventHandlers.onPreviousPageClick);

	const generateId = useIdGenerator();
	const id = React.useMemo(() => generateId({ id: "pagination" }), [generateId]);

	return (
		<BasePagination
			id={id}
			disabled={disabled}
			alignment="right"
			currentPage={pageNumber + 1}
			pageCount={pageCount}
			onPageChanged={(page) => {
				onChange(page - 1);
			}}
			nextButtonProps={{
				onClick: () => {
					if (pageNumber + 1 < pageCount) {
						if (onNextPageClick) {
							onNextPageClick();
						} else {
							onChange(pageNumber + 1);
						}
					}
				}
			}}
			previousButtonProps={{
				onClick: () => {
					if (pageNumber > 0) {
						if (onPreviousPageClick) {
							onPreviousPageClick();
						} else {
							onChange(pageNumber - 1);
						}
					}
				}
			}}
			pageLabelTemplate="{page} / {total}"
		/>
	);
});

export namespace Pagination {
	export interface PropsType extends OverviewEngineApi.Pagination {
		onChange(page: number): void;
	}
}
