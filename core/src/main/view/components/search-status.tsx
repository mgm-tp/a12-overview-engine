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

import { RESOURCE_KEYS } from "../../services/localization/index.js";
import { UiStateSelector } from "../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";
import { LocalizerHooks } from "../hooks/localizer-hooks.js";
import { useRowCount, useShouldAllowSearch } from "../utils.js";

/** @internal */
export const SearchStatus = React.memo(function SearchStatus() {
	const HiddenText = useOverviewEngineContext((context) => context.widgetMap.HiddenText);
	const searchStatus = useSearchStatus();

	if (searchStatus) {
		return <HiddenText role={"status"}>{searchStatus}</HiddenText>;
	}

	return null;
});

function useSearchStatus(): string | undefined {
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const [allEntriesShownText, searchResultsForText] = React.useMemo(
		() => [
			localizedResource(RESOURCE_KEYS.overviewEngine.searchStatus.allEntriesShown),
			localizedResource(RESOURCE_KEYS.overviewEngine.searchStatus.searchResultsFor)
		],
		[localizedResource]
	);

	const shouldAllowSearch = useShouldAllowSearch();

	const searchString = useOverviewEngineState(UiStateSelector.searchString());
	const rowCount = useRowCount();

	return React.useMemo(() => {
		if (!shouldAllowSearch) {
			return undefined;
		}

		if (!searchString) {
			return allEntriesShownText;
		}

		const searchStatus = `${rowCount ?? ""} ${searchResultsForText} ${searchString}`;

		return searchStatus.trim();
	}, [shouldAllowSearch, searchString, rowCount, searchResultsForText, allEntriesShownText]);
}
