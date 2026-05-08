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
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { type FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import {
	type Localizable,
	type ValueConversion,
	type ValueConversionConfig
} from "@com.mgmtp.a12.utils/utils-localization";

import { DocumentUtils, DocumentModelUtils, type DocumentModelService } from "../../../models/internal/shared.js";

/** @internal */
export interface Converter {
	/**
	 * The method for formatting values in document to UI rendered values
	 */
	formatValue(
		path: ModelPath,
		value: FieldInstanceValue | object,
		configTransformer?: (config: ValueConversionConfig) => ValueConversionConfig,
		modelId?: string
	): string;
	/**
	 * The method for parsing UI values into document values
	 */
	parseValue(
		path: ModelPath,
		uiValue: string,
		configTransformer?: (config: ValueConversionConfig) => ValueConversionConfig,
		modelId?: string
	): { value: FieldInstanceValue | object; readonly error?: Localizable[] };
}

/** @internal */
export function useConverter(documentModelService: DocumentModelService): Converter {
	const { conversion } = React.useContext(LocalizerContext);

	return {
		formatValue: (path, value, configTransformer, modelId) => {
			const element = documentModelService.getByPath(path, modelId);

			if (element.type === "Field" && DocumentUtils.isFieldInstanceValue(value)) {
				const fieldType = element.fieldType.type;

				if (DocumentModelUtils.isLocalizableFieldType(fieldType)) {
					throw new Error(`The element ${ModelPath.toString(path)} should be formatted by a localizer`);
				}

				if (DocumentModelUtils.isFormattableFieldType(fieldType)) {
					const config = documentModelService.getConversionConfig(path, modelId);

					return adaptFormatResult(conversion.formatValue(value, configTransformer?.(config) ?? config));
				}
			}

			throw new Error(`The element ${ModelPath.toString(path)} is not a valid element to be formatted!`);
		},
		parseValue: (path, uiValue, configTransformer, modelId) => {
			if (documentModelService.getByPath(path, modelId).type === "Field") {
				const config = documentModelService.getConversionConfig(path, modelId);

				return adaptParseResult(conversion.parseValue(uiValue, configTransformer?.(config) ?? config));
			}

			throw new Error(`The element ${ModelPath.toString(path)} is not a valid element to be parsed!`);
		}
	};
}

function adaptParseResult(result: ReturnType<ValueConversion["parseValue"]>): ReturnType<Converter["parseValue"]> {
	if (result.parseError?.errorText) {
		return { value: null, error: [result.parseError.errorText] };
	}

	if (result.value !== undefined) {
		return { value: result.value };
	}

	return { value: null };
}

function adaptFormatResult(result: ReturnType<ValueConversion["formatValue"]>): ReturnType<Converter["formatValue"]> {
	return result ?? "";
}
