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

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import {
	type Localizable,
	type LocalizableArgs,
	localizableFromModel,
	type LocalizedModelText,
	type LocalizationTreeMap,
	localizableKeyFromSegments,
	segmentsFromLocalizableKey,
	localizableFromLocalizationTreeMap
} from "@com.mgmtp.a12.utils/utils-localization";

import { getDateTimeFormat } from "../../converter/index.js";
import {
	DocumentModelUtils,
	MultiSelectModelUtils,
	createDocumentModelService
} from "../../../models/internal/shared.js";

import { en } from "./languages/en.js";
import { de } from "./languages/de.js";
import { RESOURCE_KEYS } from "./languages/keys.js";
import { DocumentModelKeys } from "./document-model-keys.js";
import { OverviewModelKeys } from "./overview-model-keys.js";

export namespace LocalizableFactory {
	const EMPTY_OPTION = "___EMPTY_OPTION___";

	export function createResourceLocalizables(resourceKey: string, args?: LocalizableArgs): Localizable[] {
		return [
			createResourceLocalizable(resourceKey, args),
			createSingleTextLocalizable(segmentsFromLocalizableKey(resourceKey), resourceKey)
		];
	}

	export function createDateFieldFormatLocalizables(
		path: ModelPath,
		documentModel: DocumentModel,
		modelId?: string
	): Localizable[] {
		const element = createDocumentModelService(documentModel).getByPath(path, modelId);

		if (element.type === "Field") {
			const format = getDateTimeFormat(element.fieldType);

			return createDateFormatLocalizables(format);
		}

		if (MultiSelectModelUtils.isInstance(element)) {
			const format = getDateTimeFormat(MultiSelectModelUtils.getField(element).fieldType);

			return createDateFormatLocalizables(format);
		}

		throw new Error(`${ModelPath.toString(path)} is not a field and cannot have a date format!`);
	}

	/** @internal */
	export function createDateFormatLocalizables(dateFormat: string): Localizable[] {
		const key = "dateFormat" as const;

		return [
			createSingleTextLocalizable([key], `$${key}$`, {
				dateFormat: { type: "dataFormat", value: dateFormat, properties: { type: "date" } }
			})
		];
	}

	export function createOverviewElementLocalizables(
		keys: string[],
		texts: LocalizedModelText | undefined,
		overviewModelId: string
	): Localizable[] {
		return [createTextsLocalizable([...OverviewModelKeys.getPrefixes(overviewModelId), ...keys], texts)];
	}

	export function createFieldLabelLocalizables(path: ModelPath, documentModel: DocumentModel): Localizable[] {
		const keys = DocumentModelKeys.createKeys(documentModel, DocumentModelKeys.LABEL, path);
		const element = createDocumentModelService(documentModel).getByPath(path);

		if (element.type === "Field") {
			return [createTextsLocalizable(keys, element.label)];
		}

		if (MultiSelectModelUtils.isInstance(element)) {
			return [createTextsLocalizable(keys, element.elements[0].label)];
		}

		throw new Error(`${ModelPath.toString(path)} cannot be localized!`);
	}

	export function createFieldValueLocalizables(
		value: FieldInstanceValue | object,
		path: ModelPath,
		documentModel: DocumentModel,
		option?: { filterMode?: boolean }
	): Localizable[] {
		const element = createDocumentModelService(documentModel).getByPath(path);

		if (element.type === "Group") {
			throw new Error(`${ModelPath.toString(path)} is a group and groups cannot be localized!`);
		}

		if (!DocumentModelUtils.isLocalizableFieldType(element.fieldType.type)) {
			throw new Error("Only enumeration, boolean and confirm values can be localized");
		}

		if (element.fieldType.type === "BooleanType") {
			if (typeof value !== "boolean" && value !== null) {
				throw new Error("Boolean values must be either true, false or null");
			}

			const castedValue = String(value) as "true" | "false" | "null";
			const documentModelKeys =
				castedValue === "null" && option?.filterMode ? DocumentModelKeys.FILTER : DocumentModelKeys.BOOLEAN;
			const resourceKey = getResourceKeys({ value: castedValue, filterMode: option?.filterMode });
			const keys = DocumentModelKeys.createKeys(documentModel, documentModelKeys, path, castedValue);

			return [
				createResourceLocalizable(localizableKeyFromSegments(keys)),
				createResourceLocalizable(resourceKey),
				createSingleTextLocalizable(keys, castedValue)
			];
		}

		if (element.fieldType.type === "ConfirmType") {
			const correctedValue = String(value ? true : null) as "true" | "null";
			const documentModelKeys =
				correctedValue === "null" && option?.filterMode ? DocumentModelKeys.FILTER : DocumentModelKeys.CONFIRM;
			const resourceKey = getResourceKeys({ value: correctedValue, filterMode: option?.filterMode });
			const keys = DocumentModelKeys.createKeys(documentModel, documentModelKeys, path, correctedValue);

			return [
				createResourceLocalizable(localizableKeyFromSegments(keys)),
				createResourceLocalizable(resourceKey),
				createSingleTextLocalizable(keys, correctedValue)
			];
		}

		if (element.fieldType.type === "EnumerationType") {
			const localizables: Localizable[] = [];
			let enumValue: DocumentModel.EnumValue | undefined = undefined;

			if (typeof value === "string") {
				enumValue = element.fieldType.values.find((val: DocumentModel.EnumValue) => val.value === value);

				if (enumValue) {
					const keys = DocumentModelKeys.createKeys(documentModel, DocumentModelKeys.ENUM_VALUE, path, enumValue.value);

					if (enumValue.label) {
						localizables.push(createTextsLocalizable(keys, enumValue.label));
					}

					localizables.push(createSingleTextLocalizable(keys, value));
				}
			}

			if (!enumValue) {
				const keys = DocumentModelKeys.createKeys(documentModel, DocumentModelKeys.ENUM_VALUE, path, EMPTY_OPTION);
				localizables.push(createSingleTextLocalizable(keys, ""));
			}

			return localizables;
		}

		throw new Error("Only enumeration, boolean and confirm values can be localized");
	}

	/** @internal */
	export function createTextsLocalizable(
		keys: string[],
		texts: LocalizedModelText | undefined,
		args?: LocalizableArgs
	): Localizable {
		return localizableFromModel(localizableKeyFromSegments(keys), texts, args);
	}

	/** @internal */
	export function createResourceLocalizable(resourceKey: string, args?: LocalizableArgs): Localizable {
		return localizableFromLocalizationTreeMap(resourceKey, DEFAULT_RESOURCES, args);
	}

	/** @internal */
	export function createSingleTextLocalizable(keys: string[], text: string, args?: LocalizableArgs): Localizable {
		const texts: LocalizedModelText = Object.keys(DEFAULT_RESOURCES).map((locale) => ({ locale, text }));

		return createTextsLocalizable(keys, texts, args);
	}
}

const DEFAULT_RESOURCES: LocalizationTreeMap = { en, de };

function getResourceKeys(params: { value: "true" | "false" | "null"; filterMode?: boolean }) {
	const { value, filterMode } = params;

	if (filterMode) {
		return RESOURCE_KEYS.overviewEngine.filterOptionView[value];
	}

	return RESOURCE_KEYS[value];
}
