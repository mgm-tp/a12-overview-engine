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

import { addPrefix, DefaultTableComponentRenderers } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../../../models/index.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { UiStateSelector } from "../../../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";

export namespace TableBody {
	export interface Props {
		data: JSONDocument[];
	}
}

/** @internal */
export const TableBody: React.ComponentType<TableBody.Props> = React.memo(function TableBody(props) {
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const Message = useOverviewEngineContext((context) => context.widgetMap.Message);
	const skipInitialLoad = useOverviewEngineContext(
		(context) => context.overviewModel.content.configuration.skipInitialLoad
	);
	const dataLoadTriggered = useOverviewEngineState(UiStateSelector.dataLoadTriggered());

	if (props.data.length === 0) {
		if (skipInitialLoad && !dataLoadTriggered) {
			return (
				<Message className={addPrefix("-u-height-full -u-flex -u-justify-center")}>
					{localizedResource(RESOURCE_KEYS.overviewEngine.noInitQuery)}
				</Message>
			);
		}

		return (
			<Message className={addPrefix("-u-height-full -u-flex -u-justify-center")}>
				{localizedResource(RESOURCE_KEYS.overviewEngine.noResultFound)}
			</Message>
		);
	}

	return <>{DefaultTableComponentRenderers.bodyRenderer(props)}</>;
});
