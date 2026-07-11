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

import type { JSONDocument } from "../../../../models/index.js";
import type { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import hooks from "./hooks.js";

export namespace RowActionGroup {
	export interface Props {
		readonly row: JSONDocument;
		readonly rowActionGroupModel?: OverviewModel.RowActionGroup;
		readonly contextMenuModel?: OverviewModel.ContextMenu;
	}
}

/** @internal */
export const RowActionGroup: React.ComponentType<RowActionGroup.Props> = React.memo(function RowActionGroup(props) {
	const { row, rowActionGroupModel, contextMenuModel } = props;
	const RowAction = useOverviewEngineContext((context) => context.componentMap.RowAction);
	const ContextMenu = useOverviewEngineContext((context) => context.componentMap.ContextMenu);
	const ButtonGroup = useOverviewEngineContext((context) => context.widgetMap.ButtonGroup);

	const isHidden = hooks.useRowActionStateGetter("hidden");
	const visibleRowActions = React.useMemo(
		() => rowActionGroupModel?.actions?.filter((action) => !isHidden(row, action)) ?? [],
		[isHidden, row, rowActionGroupModel?.actions]
	);

	return (
		<ButtonGroup alignment="right">
			{visibleRowActions.map((action, index) => (
				<RowAction key={index} row={row} rowActionModel={action} />
			))}
			{contextMenuModel && <ContextMenu row={row} contextMenuModel={contextMenuModel} />}
		</ButtonGroup>
	);
});
