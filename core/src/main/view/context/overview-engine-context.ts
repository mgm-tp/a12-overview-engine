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

import type { Expression } from "@com.mgmtp.a12.expression/expression-core";
import { createContext, useContextSelector } from "@com.mgmtp.a12.widgets/widgets-core";

import { Links } from "../../models/index.js";
import type { OverviewEngineApi } from "../api.js";
import type { OverviewEngine } from "../overview-engine.js";
import type { OverviewModel } from "../../overview-model.js";
import type { WidgetMap } from "../configuration/widget-map.js";
import type { SelectorMap } from "../configuration/selector-map.js";
import type { ComponentMap } from "../configuration/component-map.js";
import { defaultMapDispatchToEventHandlers } from "../configuration/event-handlers-dispatch-map.js";
import type {
	UiState,
	OverviewEngineState,
	FilterStateSelectors,
	Selector as BaseSelector
} from "../../store/index.js";

import { defaultModelGraph, defaultDocumentModel, defaultOverviewModel } from "./defaults.js";

export type OverviewEngineContextType = OverviewEngineContextType.Paginated | OverviewEngineContextType.InfiniteScroll;

export namespace OverviewEngineContextType {
	export type InfiniteScroll = OverviewEngine.InfiniteScrollProps & Base;

	export namespace InfiniteScroll {
		export function isInstance(props: OverviewEngineContextType): props is InfiniteScroll {
			return "infiniteScrollOptions" in props && !!props.infiniteScrollOptions;
		}
	}

	export type Paginated = OverviewEngine.PaginatedProps & Base;

	export namespace Paginated {
		export function isInstance(props: OverviewEngineContextType): props is Paginated {
			return !InfiniteScroll.isInstance(props);
		}
	}

	export interface Base {
		readonly uiState: UiState;
		readonly eventHandlers: OverviewEngineApi.EventHandlers;
		readonly smallView?: boolean;
		readonly componentMap: ComponentMap;
		readonly widgetMap: WidgetMap;
		/**
		 * @experimental
		 */
		readonly selectorMap: SelectorMap;
		/** @experimental until 40.0.0 - API may change without semver guarantees. */
		readonly filterStateSelectors?: FilterStateSelectors;
		/**
		 * The map between column's id field and the parsed expression tree if exists.
		 */
		readonly expressionTrees?: Record<string, Expression.RootNode | undefined>;
		/**
		 * The map between column's elementRef field and the column itself if exists.
		 */
		readonly referenceColumns?: Record<string, OverviewModel.ReferenceColumn | undefined>;
	}
}

/**
 * The context that provide properties for both Overview Engine's content box and table
 */
export const OverviewEngineContext = createContext<OverviewEngineContextType>({
	uiState: {},
	documentModel: defaultDocumentModel,
	subDocumentModels: undefined,
	overviewModel: defaultOverviewModel,
	modelGraph: defaultModelGraph,
	data: [],
	links: Links.create(),
	eventHandlers: defaultMapDispatchToEventHandlers((anyAction) => anyAction),
	selectorMap: {} as SelectorMap,
	widgetMap: {} as WidgetMap,
	componentMap: {} as ComponentMap,
	smallView: false
});
OverviewEngineContext.displayName = "OverviewEngineContext";

export function useOverviewEngineContext<T>(selector: (value: OverviewEngineContextType) => T): T {
	return useContextSelector(OverviewEngineContext, selector);
}

export function useOverviewEngineState<T>(selector: BaseSelector<T, OverviewEngineState>) {
	return useOverviewEngineContext<T>((context) => selector(context.uiState));
}
