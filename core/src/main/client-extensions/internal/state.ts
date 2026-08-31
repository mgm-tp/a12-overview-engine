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

import { OverviewEngineInternalConstants } from "../../constants/overview-engine-internal-constants.js";
import type { OverviewModel } from "../../overview-model.js";
import type { UiState, Scrolling, ModelsState, PaginationState } from "../../store/index.js";
import { OverviewEngineApi } from "../../view/api.js";

/** @internal */
export const SLICE_NAME = "uiState";

/** @internal */
export function getScrolling({
	content: {
		configuration: { enableInfiniteScroll }
	}
}: OverviewModel): Scrolling | undefined {
	return enableInfiniteScroll
		? {
				pageSize: OverviewEngineInternalConstants.DEFAULT_INFINITE_SCROLL_PAGE_SIZE,
				pageNumbers: [],
				visibleStart: 0,
				visibleEnd: 0
			}
		: undefined;
}

/** @internal */
export function getPagination({
	content: {
		configuration: { pagingSize: pageSize = Number.MAX_SAFE_INTEGER }
	}
}: OverviewModel): PaginationState {
	return { pageNumber: 0, pageSize };
}

/** @internal */
export function getSorting(modelsState: ModelsState): UiState["sorting"] | undefined {
	if (modelsState.queryModel?.content.exclude) {
		return undefined;
	}

	const { overviewModel, documentModel, modelGraph, subDocumentModels } = modelsState;
	const initialSorting = OverviewEngineApi.Sorting.getInitialValue(overviewModel);

	return OverviewEngineApi.getUiStateSorting(
		initialSorting,
		documentModel,
		overviewModel,
		modelGraph?.relationshipModels,
		subDocumentModels
	);
}
