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
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { ValueConversionConfig } from "@com.mgmtp.a12.utils/utils-localization";
import { createContext, useContextSelector } from "@com.mgmtp.a12.widgets/widgets-core";

import { type DocumentModelService, createDocumentModelService } from "../../models/internal/shared.js";
import { useConverter, type Converter } from "../../services/converter/internal/shared.js";
import type { OverviewEngine } from "../overview-engine.js";

import { useOverviewEngineContext } from "./overview-engine-context.js";

/** @internal */
export namespace OverviewEngineInternalContext {
	export interface Type {
		readonly converter: Converter;
		readonly documentModelService: DocumentModelService;
		readonly expandedMultiSelection?: boolean;
		readonly timezone: string;
	}
}

const DEFAULT_ERROR_MESSAGE = `OverviewEngineInternalContext is not initiated.`;

const defaultDocumentModelService: DocumentModelService = {
	getByPath() {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	},
	getPathById() {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	},
	getConversionConfig() {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	}
};

const defaultConverter: Converter = {
	formatValue() {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	},
	parseValue() {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	}
};

/** @internal */
export const OverviewEngineInternalContext = createContext<OverviewEngineInternalContext.Type>({
	documentModelService: defaultDocumentModelService,
	timezone: "UTC",
	converter: defaultConverter
});
OverviewEngineInternalContext.displayName = "OverviewEngineInternalContext";

/** @internal */
export function useOverviewEngineInternalContext<T>(selector: (value: OverviewEngineInternalContext.Type) => T): T {
	return useContextSelector(OverviewEngineInternalContext, selector);
}

/** @internal */
export function useInternalContextValue({
	overviewModel,
	documentModel,
	subDocumentModels,
	data
}: OverviewEngine.Props): OverviewEngineInternalContext.Type {
	const { enableInfiniteScroll } = overviewModel.content.configuration;
	const onLatestSelectedDocumentIdChange = useOverviewEngineContext(
		(context) => context.eventHandlers.onLatestSelectedDocumentIdChange
	);
	const timezone = React.useMemo(
		() => documentModel.content.modelConfig.timeZone,
		[documentModel.content.modelConfig.timeZone]
	);

	React.useEffect(() => {
		if (!enableInfiniteScroll) {
			onLatestSelectedDocumentIdChange?.({ latestSelectedDocumentId: null });
		}
	}, [data, enableInfiniteScroll, onLatestSelectedDocumentIdChange]);

	const documentModelService = useDocumentModelService(documentModel, subDocumentModels);
	const converter = useConverter(documentModelService);

	return { converter, documentModelService, timezone };
}

function useDocumentModelService(
	documentModel: DocumentModel,
	subDocumentModels?: DocumentModel[]
): DocumentModelService {
	const pathCache = React.useRef(new Map<string, ModelPath>());
	const elementCache = React.useRef(new Map<string, DocumentModel.Element>());
	const conversionConfigCache = React.useRef(new Map<string, ValueConversionConfig>());

	React.useEffect(() => {
		pathCache.current.clear();
		elementCache.current.clear();
		conversionConfigCache.current.clear();
	}, [documentModel, subDocumentModels]);

	return React.useMemo<DocumentModelService>(() => {
		const documentModelServices = createDocumentModelService(documentModel, subDocumentModels);

		return {
			getPathById: applyCache(pathCache.current, (id, documentModelName) => {
				return documentModelServices.getPathById(id, documentModelName);
			}),
			getByPath: applyCache(elementCache.current, (path, documentModelName) => {
				return documentModelServices.getByPath(path, documentModelName);
			}),
			getConversionConfig: applyCache(conversionConfigCache.current, (path, documentModelName) => {
				return documentModelServices.getConversionConfig(path, documentModelName);
			})
		};
	}, [documentModel, subDocumentModels]);
}

function applyCache<Key extends ModelPath | string, Value>(
	cache: Map<string, Value>,
	fn: (key: Key, documentModelName?: string) => Value
) {
	return (key: Key, documentModelName?: string) => {
		const keyStr = typeof key === "string" ? key : ModelPath.toString(key);
		const cacheKey = documentModelName ? `${keyStr}:${documentModelName}` : keyStr;
		const existed = cache.get(cacheKey);

		if (existed) {
			return existed;
		}

		const result = fn(key, documentModelName);
		cache.set(cacheKey, result);

		return result;
	};
}
