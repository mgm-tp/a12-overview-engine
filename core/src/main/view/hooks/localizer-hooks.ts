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
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import type { FieldInstanceValue } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { Localizable, LocalizableArgs, LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";

import { OverviewModel } from "../../overview-model.js";
import { MultiSelectModelUtils } from "../../models/index.js";
import { useOverviewEngineContext, useOverviewEngineInternalContext } from "../context/index.js";
import { DocumentModelKeys, OverviewModelKeys, LocalizableFactory } from "../../services/index.js";

export namespace LocalizerHooks {
	/**
	 * Public hooks
	 */

	/**
	 * Translate field's label in document model
	 */
	export function useLocalizedFieldLabel() {
		const { localizer } = React.useContext(LocalizerContext);

		const documentModel = useOverviewEngineContext((context) => context.documentModel);
		const subDocumentModels = useOverviewEngineContext((context) => context.subDocumentModels);

		return React.useCallback(
			(path: ModelPath, modelId?: string): string => {
				const subModel = modelId && subDocumentModels?.find((m) => m.header.id === modelId);
				const model = subModel || documentModel;

				return localizer(...LocalizableFactory.createFieldLabelLocalizables(path, model)) || "";
			},
			[documentModel, localizer, subDocumentModels]
		);
	}

	/**
	 * Translate date field's format in document model
	 */
	export function useLocalizedDateFieldFormat() {
		const { localizer } = React.useContext(LocalizerContext);

		const documentModel = useOverviewEngineContext((context) => context.documentModel);
		const subDocumentModels = useOverviewEngineContext((context) => context.subDocumentModels);

		return React.useCallback(
			(path: ModelPath, modelId?: string): string | undefined => {
				const subModel = modelId && subDocumentModels?.find((m) => m.header.id === modelId);
				const model = subModel || documentModel;

				return localizer(...LocalizableFactory.createDateFieldFormatLocalizables(path, model, modelId));
			},
			[documentModel, localizer, subDocumentModels]
		);
	}

	/**
	 * Translate field value in the document
	 */
	export function useLocalizedFieldValue(params?: { filterMode?: boolean }) {
		const { localizer } = React.useContext(LocalizerContext);

		const documentModel = useOverviewEngineContext((context) => context.documentModel);
		const subDocumentModels = useOverviewEngineContext((context) => context.subDocumentModels);

		return React.useCallback(
			(path: ModelPath, value: FieldInstanceValue | object, modelId?: string): string => {
				const subModel = modelId && subDocumentModels?.find((m) => m.header.id === modelId);
				const model = subModel || documentModel;

				return localizer(...LocalizableFactory.createFieldValueLocalizables(value, path, model, params)) || "";
			},
			[documentModel, localizer, params, subDocumentModels]
		);
	}

	/**
	 * Translate overview resource
	 */
	export function useLocalizedResource() {
		const { localizer } = React.useContext(LocalizerContext);

		return React.useCallback(
			(key: string, args?: LocalizableArgs): string => {
				return localizer(...LocalizableFactory.createResourceLocalizables(key, args)) || "";
			},
			[localizer]
		);
	}

	/**
	 * Translate LocalizedModelText in Overview models
	 */
	export function useLocalizedOverviewElement() {
		const { localizer } = React.useContext(LocalizerContext);
		const overviewModelId = useOverviewEngineContext((context) => context.overviewModel.header.id);

		return React.useCallback(
			(keys: string[], texts: LocalizedModelText | undefined): string => {
				return localizer(...LocalizableFactory.createOverviewElementLocalizables(keys, texts, overviewModelId)) || "";
			},
			[localizer, overviewModelId]
		);
	}

	/**
	 * Internal hooks
	 */

	/** @internal */
	export function useLocalizedColumnLabel() {
		const documentModel = useOverviewEngineContext((context) => context.documentModel);
		const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

		const overviewModelId = useOverviewEngineContext((context) => context.overviewModel.header.id);

		const { localizer } = React.useContext(LocalizerContext);

		return React.useCallback(
			(column: OverviewModel.Column, modelId?: string) => {
				const localizables: Localizable[] = [];

				const prefixKeys = OverviewModelKeys.getPrefixes(overviewModelId);
				const modelKeys = [...prefixKeys, OverviewModelKeys.COLUMNS, column.id, OverviewModelKeys.LABEL];

				localizables.push(LocalizableFactory.createTextsLocalizable(modelKeys, column.label));

				if (
					!OverviewModel.ReferenceColumn.isAssignableFrom(column) &&
					!OverviewModel.LinkColumn.Reference.isAssignableFrom(column)
				) {
					return localizer(...localizables) || "";
				}

				const path = documentModelService.getPathById(column.elementRef, modelId);
				const element = documentModelService.getByPath(path, modelId);
				const elementKeys = DocumentModelKeys.createKeys(documentModel, DocumentModelKeys.LABEL, path);

				if (element.type === "Field") {
					localizables.push(LocalizableFactory.createTextsLocalizable(elementKeys, element.label));
				}

				if (MultiSelectModelUtils.isInstance(element)) {
					localizables.push(LocalizableFactory.createTextsLocalizable(elementKeys, element.elements[0].label));
				}

				return localizer(...localizables) || "";
			},
			[documentModel, documentModelService, localizer, overviewModelId]
		);
	}

	/** @internal */
	export function useLocalizedConfirmDialog() {
		const { localizer } = React.useContext(LocalizerContext);

		return React.useCallback(
			(confirmation: OverviewModel.ConfirmationText, keys: string[]): Record<"title" | "message", string> => {
				const { title, message } = confirmation;

				return {
					title: localizer(LocalizableFactory.createTextsLocalizable([...keys, OverviewModelKeys.TITLE], title)) || "",
					message:
						localizer(LocalizableFactory.createTextsLocalizable([...keys, OverviewModelKeys.MESSAGE], message)) || ""
				};
			},
			[localizer]
		);
	}

	/** @internal */
	export function useLocalizedNumberSuffix() {
		const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();

		return React.useCallback(
			(column?: OverviewModel.ReferenceColumn, suffix?: FieldInstanceValue, options?: { withSpace?: true }) => {
				if (!column) {
					return "";
				}

				const keys = [OverviewModelKeys.COLUMNS, column.id, OverviewModelKeys.SUFFIX];
				const columnSuffix = localizedOverviewElement(keys, column.suffix);

				if (!columnSuffix && !suffix) {
					return "";
				}

				return (options?.withSpace ? " " : "") + (suffix ?? columnSuffix);
			},
			[localizedOverviewElement]
		);
	}

	/** @internal */
	export function useLocaleSorter() {
		const { locale } = React.useContext(LocalizerContext);

		return React.useCallback(
			<T>(array: ReadonlyArray<T>, mapper: (element: T) => string): Array<T> => {
				return [...array].sort((x, y) => mapper(x).localeCompare(mapper(y), locale.language));
			},
			[locale.language]
		);
	}
}
