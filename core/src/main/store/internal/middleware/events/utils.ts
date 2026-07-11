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

import type { UiState } from "../../store.js";
import type { Commands } from "../../actions.js";

/** @internal */
export function resetPaginationAndScrolling(params: {
	payload: Commands.SetQueryParametersPayload;
	currentQueryParameters: Pick<UiState, "searchString" | "sorting" | "scrolling" | "activeFilters" | "pagination">;
}): Commands.SetQueryParametersPayload {
	const { currentQueryParameters, payload } = params;
	const { pagination, scrolling } = payload;
	let nextQueryParameters: Commands.SetQueryParametersPayload = { ...currentQueryParameters, ...payload };

	/**
	 * We need to reset the pagination if no pagination is given
	 * in the action.
	 * This needs to be done to reset the page number when the
	 * overview is sorted or filtered
	 */
	if (
		pagination === undefined &&
		currentQueryParameters.pagination !== undefined &&
		currentQueryParameters.pagination.pageNumber !== 0
	) {
		nextQueryParameters = {
			...nextQueryParameters,
			pagination: { ...currentQueryParameters.pagination, pageNumber: 0 }
		};
	}

	/**
	 * We need to reset the scrolling if no scrolling is given in the action.
	 * This needs to be done to reset the scroll start when the overview is sorted or filtered
	 */
	if (
		scrolling === undefined &&
		currentQueryParameters.scrolling !== undefined &&
		currentQueryParameters.scrolling.pageNumbers.length > 0
	) {
		// update visible range to 0 to indicate the reset of scrolling
		nextQueryParameters = {
			...nextQueryParameters,
			scrolling: {
				...currentQueryParameters.scrolling,
				pageNumbers: Array.from({ length: currentQueryParameters.scrolling.pageNumbers.length }, (_, index) => index),
				visibleStart: 0,
				visibleEnd: 0
			}
		};
	}

	return nextQueryParameters;
}
