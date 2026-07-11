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

import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface EmptyFilterProps {}

/** @internal */
export const EmptyFilter: FC<EmptyFilterProps> = memo(function EmptyFilter() {
	const TextField = useOverviewEngineContext((c) => c.widgetMap.TextField);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	return (
		<StyledItalicWrapper>
			<TextField value={localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.emptyValue)} readonly />
		</StyledItalicWrapper>
	);
});

/** @deprecated Redundant styled-component — single property (font-style: italic). */
const StyledItalicWrapper = styled.div`
	font-style: italic;
`;
