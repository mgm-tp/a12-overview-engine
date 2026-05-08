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

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { ExpressionOutput } from "@com.mgmtp.a12.expression/expression-core";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { type EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { type OverviewModel } from "../../../../overview-model.js";
import { DocumentUtils } from "../../../../models/internal/shared.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";

import { type TableBodyCell } from "./table-body-cell.js";
import { useFieldFormatter, type FieldFormatterParams } from "./reference-cell.js";

export namespace ExpressionCell {
	export interface Props extends TableBodyCell.Props {
		columnModel: OverviewModel.ExpressionColumn;
		fieldFormatter?: (params: FieldFormatterParams) => string;
	}
}

/** @internal */
export const ExpressionCell: React.FC<ExpressionCell.Props> = React.memo(function ExpressionCell(props) {
	const { columnModel, row } = props;

	const documentModel = useOverviewEngineContext((context) => context.documentModel);
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);
	const BodyCellContent = useOverviewEngineContext((context) => context.componentMap.TableBodyCellContent);

	const formatField = useFieldFormatter();
	const fieldFormatter = React.useCallback(
		(entityInstancePath: EntityInstancePath) => {
			const field = documentModelService.getByPath(entityInstancePath);

			if (field.type !== "Field") {
				throw new Error("Invalid field path: " + ModelPath.toString(entityInstancePath));
			}

			return (props.fieldFormatter ?? formatField)({
				field,
				modelPath: entityInstancePath,
				value: DocumentUtils.getValue(row, entityInstancePath)
			});
		},
		[documentModelService, formatField, props.fieldFormatter, row]
	);

	const valueGetter = React.useCallback(
		(entityInstancePath: EntityInstancePath) => DocumentUtils.getValue(row, entityInstancePath),
		[row]
	);

	const { localizer } = React.useContext(LocalizerContext);

	const expressionTree = useOverviewEngineContext((context) => context.expressionTrees)?.[columnModel.id];

	if (!expressionTree) {
		throw new Error("Can not resolve expression tree for column: " + columnModel.id);
	}

	return (
		<BodyCellContent alignment={columnModel.alignment?.content?.horizontal}>
			<ExpressionOutput
				localizer={localizer}
				rootPath={[]}
				documentModel={documentModel}
				expressionTree={expressionTree}
				valueGetter={valueGetter}
				fieldFormatter={fieldFormatter}
			/>
		</BodyCellContent>
	);
});
