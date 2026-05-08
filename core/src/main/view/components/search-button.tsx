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

import { UiStateSelector } from "../../store/index.js";
import { RESOURCE_KEYS, LocalizerHooks } from "../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

export const SearchButton: React.ComponentType<SearchButton.PropsType> = React.memo(function SearchButton(
	props: SearchButton.PropsType
) {
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const Button = useOverviewEngineContext((context) => context.widgetMap.ActionButton);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);
	const Badge = useOverviewEngineContext((context) => context.widgetMap.Badge);

	const localizedResource = LocalizerHooks.useLocalizedResource();

	const title = React.useMemo(
		() => localizedResource(RESOURCE_KEYS.overviewEngine.searchButton[props.active ? "hideSearch" : "openSearch"]),
		[props.active, localizedResource]
	);

	return (
		<Button
			onClick={props.onClick}
			icon={<Icon>search</Icon>}
			active={props.active}
			badge={<Badge tiny light variant="info" hidden={!props.showBadge} />}
			disabled={disabled}
			title={title}
		/>
	);
});

export namespace SearchButton {
	export interface PropsType {
		active?: boolean;
		showBadge?: boolean;
		onClick(): void;
	}
}
