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

import { Icon, type TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";

import { OverviewModel } from "../../../../overview-model.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import type { OverviewColumn } from "../../../hooks/use-table-columns.js";

import { useFieldFormatter } from "./field-reference-cell.js";

export namespace TableFootCellContent {
	export type Props = TableRenderPropsType.FootContentProps<OverviewColumn>;
}

/** @internal */
export const TableFootCellContent: React.FC<TableFootCellContent.Props> = React.memo(
	function TableFootCellContent(props) {
		const { columnModel } = props.column;
		const formatSummary = useSummaryFormatter();
		const TextOutput = useOverviewEngineContext((context) => context.widgetMap.TextOutput);
		const alignment: OverviewModel.HorizontalAlignment = React.useMemo(
			() => columnModel?.alignment?.content?.horizontal ?? OverviewModel.HorizontalAlignment.RIGHT,
			[columnModel?.alignment?.content?.horizontal]
		);
		const localizedResource = LocalizerHooks.useLocalizedResource();
		const title = localizedResource(RESOURCE_KEYS.overviewEngine.footer.sumIconTitle);

		if (!columnModel || !OverviewModel.ReferenceColumn.isAssignableFrom(columnModel) || columnModel.suffixRef) {
			return null;
		}

		const formattedSummary = formatSummary(columnModel, OverviewModel.Summary.Operation.SUM);

		if (formattedSummary === undefined) {
			return null;
		}

		return (
			<TextOutput alignment={alignment} disableParagraphWrapping>
				<Icon title={title}>functions</Icon>
				{formattedSummary}
			</TextOutput>
		);
	}
);

export function useSummaryFormatter() {
	const summaryResult = useOverviewEngineContext((context) => context.summaryResult);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const formatField = useFieldFormatter();

	return React.useCallback(
		(
			referenceColumn: OverviewModel.ReferenceColumn,
			operation: OverviewModel.Summary.Operation
		): string | undefined => {
			const modelPath = documentModelService.getPathById(referenceColumn.elementRef);
			const element = documentModelService.getByPath(modelPath);

			if (element.type !== "Field") {
				return undefined;
			}

			const value = summaryResult?.[referenceColumn.id]?.[operation];

			if (value !== undefined) {
				return formatField({ field: element, modelPath, value, referenceColumn });
			}

			return undefined;
		},
		[documentModelService, formatField, summaryResult]
	);
}
