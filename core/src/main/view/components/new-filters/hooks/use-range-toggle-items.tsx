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

import { useMemo } from "react";

import type { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { EqualRangeIcon, BoundedRangeIcon } from "../components/utilities/icons.js";

const RANGE_ORDER: readonly OverviewModel.NewFilter.RangeOption[] = ["fromTo", "fromOnly", "toOnly", "exact"];

/** @internal */
export function useRangeToggleItems(
	availableRanges: readonly OverviewModel.NewFilter.RangeOption[]
): { value: OverviewModel.NewFilter.RangeOption; label: React.ReactNode }[] {
	const icons = useRangeIcons();

	return useMemo(
		() =>
			RANGE_ORDER.filter((option) => availableRanges.includes(option)).map((option) => ({
				value: option,
				label: icons[option]
			})),
		[availableRanges, icons]
	);
}

function useRangeIcons() {
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);

	return useMemo(
		() => ({
			fromOnly: (
				<span data-role="range-icon-fromOnly">
					<Icon>start</Icon>
				</span>
			),
			toOnly: (
				<span data-role="range-icon-toOnly">
					<Icon>keyboard_tab</Icon>
				</span>
			),
			fromTo: <BoundedRangeIcon dataRole="range-icon-fromTo" />,
			exact: <EqualRangeIcon dataRole="range-icon-exact" />
		}),
		[Icon]
	);
}
