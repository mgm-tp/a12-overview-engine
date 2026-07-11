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

import { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { useShouldShowFilterBar } from "./use-should-show-filter-bar.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export type FilterTriggerPlacement = "none" | "filter-bar" | "header-suffix" | "search-adjacent" | "action-bar";

/**
 * Resolves Filter Selector trigger placement.
 *
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export function useFilterTriggerPlacement(): FilterTriggerPlacement {
	const enableFilter = useOverviewEngineContext((c) => c.overviewModel.content.configuration.enableFilter);
	const newFilterConfiguration = useOverviewEngineContext(
		(c) => c.overviewModel.content.configuration.newFilterConfiguration
	);
	const subHeaderBox = useOverviewEngineContext((c) => c.overviewModel.content.subHeaderBox);
	const smallView = useOverviewEngineContext((c) => !!c.smallView);
	const embedded = useOverviewEngineContext((c) => !!c.embedded);
	const shouldShowFilterBar = useShouldShowFilterBar();

	if (!enableFilter || !newFilterConfiguration) {
		return "none";
	}

	const triggerConfig = newFilterConfiguration.filterSelector.trigger;

	if (triggerConfig && triggerConfig.enabled === false) {
		return "none";
	}

	if (shouldShowFilterBar) {
		return "filter-bar";
	}

	if (smallView || embedded) {
		return "header-suffix";
	}

	const elements = [...(subHeaderBox?.leftSlot ?? []), ...(subHeaderBox?.rightSlot ?? [])];

	if (elements.length === 0) {
		return "header-suffix";
	}

	if (elements.some(OverviewModel.SearchElement.isAssignableFrom)) {
		return "search-adjacent";
	}

	return "action-bar";
}
