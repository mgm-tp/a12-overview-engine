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
import type { DocumentModel, GroupInstance, FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { DocumentUtils, DocumentModelUtils } from "../../../../models/internal/shared.js";
import { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";

import type { ReferenceCell } from "./reference-cell.js";

namespace FieldReferenceCell {
	export interface Props extends ReferenceCell.Props {
		modelId?: string;
		field: DocumentModel.Field;
		modelPath: ModelPath;
		value: ReturnType<typeof DocumentUtils.getValue>;
		fieldFormatter?: (params: FieldFormatterParams) => string;
	}
}

/** @internal */
export const FieldReferenceCell: React.FC<FieldReferenceCell.Props> = React.memo(
	function FieldReferenceBodyCell(props) {
		const { columnModel, field, modelPath, value, row, modelId } = props;

		const StringTypeCell = useOverviewEngineContext((context) => context.componentMap.StringTypeCell);
		const CustomFieldTypeCell = useOverviewEngineContext((context) => context.componentMap.CustomFieldTypeCell);
		const BodyCellContent = useOverviewEngineContext((context) => context.componentMap.TableBodyCellContent);

		const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

		const defaultFieldFormatter = useFieldFormatter();
		const fieldFormatter = props.fieldFormatter ?? defaultFieldFormatter;

		const suffix = React.useMemo(() => {
			if (!columnModel.suffixRef) {
				return undefined;
			}

			const modelPath = documentModelService.getPathById(columnModel.suffixRef, modelId);
			const element = documentModelService.getByPath(modelPath, modelId);
			const value = DocumentUtils.getValue(row, DocumentModelUtils.toEntityInstancePath(element, modelPath));

			if (!DocumentUtils.isFieldInstanceValue(value) || element.type !== "Field") {
				return undefined;
			}

			return fieldFormatter({ field: element, modelPath, value, modelId });
		}, [columnModel.suffixRef, documentModelService, fieldFormatter, modelId, row]);

		const content = React.useMemo(() => {
			const { fieldType } = field;
			const uiValue = fieldFormatter({
				field,
				modelPath,
				value,
				referenceColumn: columnModel,
				suffix,
				modelId
			});

			if (fieldType.type === "StringType") {
				return <StringTypeCell uiValue={uiValue} dataType={fieldType} />;
			}

			if (fieldType.type === "CustomFieldType") {
				return <CustomFieldTypeCell uiValue={uiValue} dataType={fieldType} />;
			}

			return uiValue;
		}, [field, fieldFormatter, modelPath, value, columnModel, suffix, modelId, StringTypeCell, CustomFieldTypeCell]);

		const alignment = React.useMemo(() => {
			return (
				columnModel.alignment?.content?.horizontal ??
				(field.fieldType.type === "NumberType"
					? OverviewModel.HorizontalAlignment.RIGHT
					: OverviewModel.HorizontalAlignment.LEFT)
			);
		}, [columnModel.alignment?.content?.horizontal, field.fieldType.type]);

		return <BodyCellContent alignment={alignment}>{content}</BodyCellContent>;
	}
);

/** @public */
export interface FieldFormatterParams {
	field: DocumentModel.Field;
	modelPath: ModelPath;
	value: GroupInstance[] | GroupInstance | FieldInstanceValue;
	suffix?: FieldInstanceValue;
	referenceColumn?: OverviewModel.ReferenceColumn;
	modelId?: string;
}

/** @public */
export function useFieldFormatter() {
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue();
	const localizedNumberSuffix = LocalizerHooks.useLocalizedNumberSuffix();
	const referenceColumns = useOverviewEngineContext((context) =>
		context.overviewModel.content.columns.filter(OverviewModel.ReferenceColumn.isAssignableFrom)
	);

	const selectReferenceColumn = React.useCallback(
		(field: DocumentModel.Field) => referenceColumns.find((column) => column.elementRef === field.id),
		[referenceColumns]
	);

	return React.useCallback(
		(params: FieldFormatterParams) => {
			const { field, modelPath, value, suffix, modelId } = params;
			const referenceColumn = params.referenceColumn ?? selectReferenceColumn(field);

			const formattedValue = DocumentModelUtils.isLocalizableFieldType(field.fieldType.type)
				? localizedFieldValue(modelPath, value, modelId)
				: converter.formatValue(modelPath, value, undefined, modelId);

			if (field.fieldType.type === "NumberType") {
				return formattedValue + localizedNumberSuffix(referenceColumn, suffix, { withSpace: true });
			}

			return formattedValue;
		},
		[converter, localizedFieldValue, localizedNumberSuffix, selectReferenceColumn]
	);
}
