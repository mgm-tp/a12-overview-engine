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

import { memo, type FC } from "react";
import { styled } from "styled-components";

import { UiStateSelector } from "../../../../store/index.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterResetButtonProps {
	readonly filterId: string;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterResetButton: FC<FilterResetButtonProps> = memo(function FilterResetButton({ filterId }) {
	const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const onReset = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterItemReset);
	const filterStateSelectors = useFilterSelectors();
	const resettable = useOverviewEngineState(UiStateSelector.NewFilter.isResettableById(filterId, filterStateSelectors));

	return (
		<StyledResetButtonWrapper>
			<Button
				icon={<Icon iconTheme="outlined">replay</Icon>}
				disabled={!resettable}
				onClick={(e) => {
					e.stopPropagation();
					onReset?.({ filterId });
				}}
			/>
		</StyledResetButtonWrapper>
	);
});

/** @deprecated Redundant styled-component — single property (margin-left: auto). */
const StyledResetButtonWrapper = styled.div`
	margin-left: auto;
`;
