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

import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

/** @internal */
export namespace EmptyFilterOptionsView {
	export interface Props {
		readonly ariaLevel?: number;
	}
}

/** @internal */
export const EmptyFilterOptionsView: React.FC<EmptyFilterOptionsView.Props> = React.memo(
	function EmptyFilterOptionsView(props) {
		const FilterSelectorTemplateContent = useOverviewEngineContext(
			(context) => context.widgetMap.FilterSelectorTemplateContent
		);
		const Title = useOverviewEngineContext((context) => context.widgetMap.Title);
		const Message = useOverviewEngineContext((context) => context.widgetMap.Message);

		const localizedResource = LocalizerHooks.useLocalizedResource();
		const { title, noViewSelected } = React.useMemo(
			() => ({
				title: localizedResource(RESOURCE_KEYS.overviewEngine.emptyFilterOptionsView.title),
				noViewSelected: localizedResource(RESOURCE_KEYS.overviewEngine.emptyFilterOptionsView.noViewSelected)
			}),
			[localizedResource]
		);

		return (
			<FilterSelectorTemplateContent
				padding={false}
				headingElements={<Title text={title} ariaLevel={props.ariaLevel} />}>
				<Message>{noViewSelected}</Message>
			</FilterSelectorTemplateContent>
		);
	}
);
