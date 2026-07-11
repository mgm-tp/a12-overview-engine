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

import type { Middleware } from "redux";

import { type FilterStateSelectors, DefaultFilterStateSelectors } from "../selectors/filter-selectors.js";

import { onSorted } from "./events/on-sorted.js";
import { onSearched } from "./events/on-searched.js";
import { onPageClicked } from "./events/on-page-clicked.js";
import { onRowsSelected } from "./events/on-row-selected.js";
import { onScrollToRow } from "./events/on-scroll-to-row.js";
import { onDialogClosed } from "./events/on-dialog-closed.js";
import { onFilterChanged } from "./events/on-filter-changed.js";
import { onDialogConfirmed } from "./events/on-dialog-confirmed.js";
import { onNextPageClicked } from "./events/on-next-page-clicked.js";
import { onInfiniteScrolled } from "./events/on-infinite-scrolled.js";
import { onColumnWidthsChanged } from "./events/on-column-widths-changed.js";
import { onPreviousPageClicked } from "./events/on-previous-page-clicked.js";
import { onMultiSelectionCleared } from "./events/on-multi-selection-cleared.js";
import { onMobileSearchBarToggle } from "./events/on-mobile-search-bar-toggle.js";
import { createOnFilterBarReset } from "./events/new-filter/on-reset-filter-bar.js";
import { onRowButtonClickedRequest } from "./events/on-row-button-clicked-request.js";
import { createOnSingleFilterReset } from "./events/new-filter/on-filter-item-reset.js";
import { onEventButtonClickedRequest } from "./events/on-event-button-clicked-request.js";
import { onFilterOptionsChanged } from "./events/new-filter/on-filter-options-changed.js";
import { onFilterItemEditStarted } from "./events/new-filter/on-filter-item-edit-started.js";
import { onFilterItemEditApplied } from "./events/new-filter/on-filter-item-edit-applied.js";
import { createOnFilterSelectorReset } from "./events/new-filter/on-reset-filter-selector.js";
import { onMultiSelectionButtonClicked } from "./events/on-multi-selection-button-clicked.js";
import { onFilterCollapsedChanged } from "./events/new-filter/on-filter-collapsed-changed.js";
import { onFilterItemEditCanceled } from "./events/new-filter/on-filter-item-edit-canceled.js";
import { createOnSelectorApplyAll } from "./events/new-filter/on-filter-selector-all-applied.js";
import { onFilterItemSettingsOpened } from "./events/new-filter/on-filter-item-settings-opened.js";
import { onFilterItemSettingsClosed } from "./events/new-filter/on-filter-item-settings-closed.js";
import { onFilterItemOptionsChanged } from "./events/new-filter/on-filter-item-options-changed.js";
import { onLatestSelectedDocumentIdChanged } from "./events/on-latest-selected-document-id-changed.js";
import { createOnFilterBarItemsOverflowed } from "./events/new-filter/on-filter-bar-items-overflowed.js";
import { onLatestSelectedDocumentIdsChanged } from "./events/on-latest-selected-document-ids-changed.js";
import { onFilterSelectorOptionsChanged } from "./events/new-filter/on-filter-selector-options-changed.js";
import { onOverallMultiSelectionButtonClicked } from "./events/on-overall-multi-selection-button-clicked.js";
import { onFilterSelectorVisibilityChanged } from "./events/new-filter/on-filter-selector-visibility-changed.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface MiddlewareOptions {
	readonly filterStateSelectors?: FilterStateSelectors;
}

export function createEngineMiddlewares(options?: MiddlewareOptions): Middleware[] {
	const filterStateSelectors = options?.filterStateSelectors ?? DefaultFilterStateSelectors;

	return [
		onRowsSelected,
		onSearched,
		onInfiniteScrolled,
		onPageClicked,
		onNextPageClicked,
		onPreviousPageClicked,
		onFilterChanged,
		onSorted,
		onMultiSelectionButtonClicked,
		onOverallMultiSelectionButtonClicked,
		onMultiSelectionCleared,
		onLatestSelectedDocumentIdChanged,
		onLatestSelectedDocumentIdsChanged,
		onEventButtonClickedRequest,
		onRowButtonClickedRequest,
		onDialogConfirmed,
		onDialogClosed,
		onColumnWidthsChanged,
		onScrollToRow,

		onFilterSelectorOptionsChanged,
		onFilterOptionsChanged,
		onFilterSelectorVisibilityChanged,
		createOnFilterBarItemsOverflowed({ filterStateSelectors }),
		onMobileSearchBarToggle,
		onFilterItemOptionsChanged,
		onFilterCollapsedChanged,
		createOnSelectorApplyAll({ filterStateSelectors }),
		onFilterItemEditApplied,
		createOnSingleFilterReset({ filterStateSelectors }),
		createOnFilterSelectorReset({ filterStateSelectors }),
		createOnFilterBarReset({ filterStateSelectors }),
		onFilterItemEditStarted,
		onFilterItemEditCanceled,
		onFilterItemSettingsOpened,
		onFilterItemSettingsClosed
	];
}
