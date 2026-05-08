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

import { createContext, useContextSelector } from "@com.mgmtp.a12.widgets/widgets-core";

export namespace OverviewContentBoxContext {
	export interface Type {
		readonly showFilterSelector: boolean;
		readonly showMobileFilterBar: boolean;
		readonly showMobileSearchBar: boolean;
		readonly setShowMobileSearchBar: (showMobileSearchBar: boolean) => void;
		readonly toggleMobileFilterBar: (isVisible?: boolean) => void;
		readonly onFilterSelectorVisibilityChange: (isVisible: boolean) => void;
		readonly getTriggerElementRef: (ref: HTMLButtonElement) => void;
	}
}

const DEFAULT_ERROR_MESSAGE = "OverviewContentBoxContext is not initiated.";
const defaultValue: OverviewContentBoxContext.Type = {
	showFilterSelector: false,
	showMobileFilterBar: false,
	showMobileSearchBar: false,
	setShowMobileSearchBar: () => {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	},
	toggleMobileFilterBar: () => {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	},
	onFilterSelectorVisibilityChange: () => {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	},
	getTriggerElementRef: () => {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	}
};

export const OverviewContentBoxContext = createContext<OverviewContentBoxContext.Type>(defaultValue);
OverviewContentBoxContext.displayName = "OverviewContentBoxContext";

export function useOverviewContentBoxContext<T>(selector: (value: OverviewContentBoxContext.Type) => T): T {
	return useContextSelector(OverviewContentBoxContext, selector);
}
