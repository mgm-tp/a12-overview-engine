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

import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { Attachment } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { JSONLink } from "../../../../models/index.js";
import type { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import {
	DocumentUtils,
	MultiSelectUtils,
	DocumentModelUtils,
	MultiSelectModelUtils
} from "../../../../models/internal/shared.js";

import type { TableBodyCell } from "./table-body-cell.js";
import { FieldReferenceCell, type FieldFormatterParams } from "./field-reference-cell.js";

export namespace ReferenceCell {
	export interface Props extends TableBodyCell.Props {
		columnModel: OverviewModel.ReferenceColumn;
		fieldFormatter?: (params: FieldFormatterParams) => string;
	}
}

/** @internal */
export const ReferenceCell: React.FC<ReferenceCell.Props> = React.memo(function ReferenceCell(props) {
	const { row, columnModel } = props;

	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

	const { modelPath, element, value } = React.useMemo(() => {
		const modelPath = documentModelService.getPathById(columnModel.elementRef);
		const element = documentModelService.getByPath(modelPath);
		const value = DocumentUtils.getValue(row, DocumentModelUtils.toEntityInstancePath(element, modelPath));

		return { modelPath, element, value };
	}, [columnModel.elementRef, documentModelService, row]);

	return (
		<ElementCellByType
			columnModel={columnModel}
			row={row}
			element={element}
			modelPath={modelPath}
			value={value}
			documentId={row.id}
			fieldFormatter={props.fieldFormatter}
		/>
	);
});

export namespace LinkedReferenceCell {
	export interface Props {
		columnModel: OverviewModel.LinkColumn.Reference;
		link: JSONLink;
		fieldFormatter?: (params: FieldFormatterParams) => string;
	}
}

/** @internal */
export const LinkedReferenceCell: React.FC<LinkedReferenceCell.Props> = React.memo(function LinkedReferenceCell(props) {
	const { columnModel, link } = props;

	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

	const { row, modelPath, element, value } = React.useMemo(() => {
		const modelPath = documentModelService.getPathById(columnModel.elementRef, link.documentModelName);
		const element = documentModelService.getByPath(modelPath, link.documentModelName);
		const value = DocumentUtils.getValue(link.document, DocumentModelUtils.toEntityInstancePath(element, modelPath));

		return { row: { ...link.document, id: link.linkId }, modelPath, element, value };
	}, [columnModel.elementRef, documentModelService, link]);

	return (
		<ElementCellByType
			columnModel={columnModel}
			row={row}
			element={element}
			modelPath={modelPath}
			value={value}
			documentId={link.documentModelName}
			modelId={link.documentModelName}
			fieldFormatter={props.fieldFormatter}
		/>
	);
});

interface ElementCellByTypeProps {
	columnModel: OverviewModel.ReferenceColumn | OverviewModel.LinkColumn.Reference;
	row: TableBodyCell.Props["row"];
	element: DocumentModel.Element;
	modelPath: ModelPath;
	value: ReturnType<typeof DocumentUtils.getValue>;
	documentId: string;
	modelId?: string;
	fieldFormatter?: (params: FieldFormatterParams) => string;
}

/**
 * Renders the appropriate cell component based on the resolved document model element type:
 * - Field -> FieldReferenceCell
 * - Attachment -> AttachmentCell
 * - MultiSelect -> MultiSelectCell
 *
 * Shared by both {@link ReferenceCell} and {@link LinkedReferenceCell} to avoid duplicating
 * the element-type branching logic.
 */
function ElementCellByType(props: ElementCellByTypeProps) {
	const { columnModel, element, modelPath, value } = props;

	const AttachmentCell = useOverviewEngineContext((context) => context.componentMap.AttachmentCell);
	const MultiSelectCell = useOverviewEngineContext((context) => context.componentMap.MultiSelectCell);

	if (element.type === "Field") {
		return <FieldReferenceCell {...props} field={element} />;
	}

	if (DocumentModelUtils.isAttachment(element)) {
		const attachment = value ?? {};

		if (Attachment.isInstance(attachment)) {
			return <AttachmentCell {...props} attachment={attachment} />;
		}

		return null;
	}

	if (MultiSelectModelUtils.isInstance(element)) {
		if (DocumentUtils.isGroupInstanceArray(value)) {
			return (
				<MultiSelectCell
					elementPath={modelPath}
					data={MultiSelectUtils.from(value)}
					alignment={columnModel.alignment?.content?.horizontal}
					displayMode={columnModel.multiSelectDisplayMode}
				/>
			);
		}

		return null;
	}

	throw new Error("Unsupported element in cell content" + element);
}
