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

import { Message, addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";

import { Links } from "../../../../models/index.js";
import { OverviewModel } from "../../../../overview-model.js";
import type { JSONDocument } from "../../../../models/index.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

export namespace TableBodyCell {
	export interface Props {
		row: JSONDocument;
		columnModel: OverviewModel.Column;
	}
}

/** @internal */
export const TableBodyCell: React.ComponentType<TableBodyCell.Props> = React.memo(function TableBodyCell(props) {
	const { columnModel } = props;

	const ExpressionCell = useOverviewEngineContext((context) => context.componentMap.ExpressionCell);
	const ReferenceCell = useOverviewEngineContext((context) => context.componentMap.ReferenceCell);

	if (OverviewModel.BaseLinkedColumn.isAssignableFrom(columnModel)) {
		return <LinkCell {...props} columnModel={columnModel} sourceDocRef={props.row.id} />;
	}

	if (OverviewModel.ExpressionColumn.isAssignableFrom(columnModel)) {
		return <ExpressionCell {...props} columnModel={columnModel} />;
	}

	if (OverviewModel.ReferenceColumn.isAssignableFrom(columnModel)) {
		return <ReferenceCell {...props} columnModel={columnModel} />;
	}

	throw new Error("Unsupported overview column. Got:" + JSON.stringify(columnModel));
});

const LinkCell = React.memo(function LinkCellAdapter(
	props: TableBodyCell.Props & {
		sourceDocRef: string;
		columnModel: OverviewModel.LinkColumn.Reference | OverviewModel.LinkColumn.Expression;
	}
) {
	const { columnModel, sourceDocRef, ...rest } = props;

	const LinkedReferenceCell = useOverviewEngineContext((context) => context.componentMap.LinkedReferenceCell);
	const LinkedExpressionCell = useOverviewEngineContext((context) => context.componentMap.LinkedExpressionCell);
	const links = useOverviewEngineContext((context) => context.links);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const linkId = props.row.linkId;
	const link = React.useMemo(
		() => (links ? Links.resolvePath(sourceDocRef, columnModel.linkReferences, linkId)(links) : undefined),
		[links, columnModel.linkReferences, sourceDocRef, linkId]
	);

	if (!link) {
		return (
			<Message className={addPrefix("h_lightFontWeight", "-u-padding-0")}>
				{localizedResource(RESOURCE_KEYS.overviewEngine.table.linkNotFound)}
			</Message>
		);
	}

	if (OverviewModel.LinkColumn.Reference.isAssignableFrom(columnModel)) {
		return <LinkedReferenceCell {...rest} columnModel={columnModel} link={link} />;
	}

	return <LinkedExpressionCell {...rest} columnModel={columnModel} link={link} />;
});
