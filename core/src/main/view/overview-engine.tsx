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
import type { FC } from "react";

import type { ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { ExpressionBuilder } from "@com.mgmtp.a12.expression/expression-core";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { useWindowSize, type Container, type RowStyleGetter } from "@com.mgmtp.a12.widgets/widgets-core";

import type { Links, JSONDocument } from "../models/index.js";
import { DocumentUtils } from "../models/internal/shared.js";
import { OverviewModel } from "../overview-model.js";
import { getModelIdFromColumn } from "../services/relationship/index.js";
import { OverviewEngineInternalConstants } from "../shared/constants.js";
import type { UiState } from "../store/index.js";
import { type FilterStateSelectors, DefaultFilterStateSelectors } from "../store/index.js";

import type { OverviewEngineApi } from "./api.js";
import { OverviewDialog } from "./components/dialogs/overview-dialog.js";
import { OverviewContentBox as NewOverviewContentBox } from "./components/new-filters/overview-content-box.js";
import { SearchStatus } from "./components/search-status.js";
import { type ComponentMap, DefaultComponentMap } from "./configuration/component-map.js";
import { type SelectorMap, DefaultSelectorMap } from "./configuration/selector-map.js";
import { type WidgetMap, DefaultWidgetMap } from "./configuration/widget-map.js";
import { OverviewEngineContext } from "./context/overview-engine-context.js";
import { useInternalContextValue, OverviewEngineInternalContext } from "./context/overview-engine-internal-context.js";
import { useRelationshipModels } from "./hooks/use-relationship.js";
import { OverviewContentBox as OldOverviewContentBox } from "./overview-content-box.js";
import { OverviewTable } from "./overview-table.js";

export const OverviewEngine: React.ComponentType<OverviewEngine.Props> = React.memo(function OverviewEngine(props) {
	const eventHandlers: OverviewEngineApi.EventHandlers = React.useMemo(
		() => props.eventHandlers ?? {},
		[props.eventHandlers]
	);
	const widgetMap: WidgetMap = React.useMemo<WidgetMap>(() => props.widgetMap ?? DefaultWidgetMap, [props.widgetMap]);
	const componentMap: ComponentMap = React.useMemo<ComponentMap>(
		() => props.componentMap ?? DefaultComponentMap,
		[props.componentMap]
	);
	const selectorMap: SelectorMap = React.useMemo<SelectorMap>(
		() => props.selectorMap ?? DefaultSelectorMap,
		[props.selectorMap]
	);

	const { breakPoint } = useWindowSize();
	const internalContextValue = useInternalContextValue(props);
	const allRelationshipModels = useRelationshipModels();

	const expressionTrees = React.useMemo(() => {
		const getValueParser: (
			column: OverviewModel.ExpressionColumn | OverviewModel.LinkColumn.Expression
		) => ExpressionBuilder.ValueParser = (column) => (path, uiValue) => {
			let modelId: string | undefined = undefined;

			if (OverviewModel.LinkColumn.Expression.isAssignableFrom(column)) {
				modelId = getModelIdFromColumn(column, allRelationshipModels);
			}

			const parsedValue = internalContextValue.converter.parseValue(path, uiValue, undefined, modelId);

			if (parsedValue.error) {
				throw new Error("Can not parse string: " + uiValue);
			}

			if (!DocumentUtils.isFieldInstanceValue(parsedValue.value)) {
				throw new Error(`Only field instance values are supported. Got: ${JSON.stringify(parsedValue)}`);
			}

			return parsedValue.value;
		};

		return Object.fromEntries(
			props.overviewModel.content.columns
				.filter(
					(column): column is OverviewModel.ExpressionColumn | OverviewModel.LinkColumn.Expression =>
						OverviewModel.ExpressionColumn.isAssignableFrom(column) ||
						OverviewModel.LinkColumn.Expression.isAssignableFrom(column)
				)
				.map((column) => [
					column.id,
					ExpressionBuilder.build(column.expression, { rootPath: [], valueParser: getValueParser(column) })
				])
		);
	}, [internalContextValue.converter, props.overviewModel.content.columns, allRelationshipModels]);

	const referenceColumns = React.useMemo(
		() =>
			Object.fromEntries(
				props.overviewModel.content.columns
					.filter(OverviewModel.ReferenceColumn.isAssignableFrom)
					.map((column) => [column.elementRef, column])
			),
		[props.overviewModel.content.columns]
	);

	const key = React.useMemo(() => {
		return [props.uiIdPrefix, props.overviewModel.header.id].filter(Boolean).join("-");
	}, [props.overviewModel.header.id, props.uiIdPrefix]);

	return (
		<OverviewEngineContext.Provider
			key={key}
			value={{
				...props,
				uiState: props.uiState ?? OverviewEngineInternalConstants.DEFAULT_UI_STATE,
				widgetMap,
				componentMap,
				selectorMap,
				eventHandlers,
				expressionTrees,
				referenceColumns,
				filterStateSelectors: props.filterStateSelectors ?? DefaultFilterStateSelectors,
				smallView: (breakPoint?.size === "sm" || breakPoint?.size === "xs") && !props.embedded
			}}>
			<OverviewEngineInternalContext.Provider value={internalContextValue}>
				{props.children || (
					<>
						<OverviewContentBox
							ariaLevel={props.ariaLevel}
							useNewFilter={!!props.overviewModel.content.configuration.newFilterConfiguration}
						/>
						<OverviewDialog />
					</>
				)}
			</OverviewEngineInternalContext.Provider>
		</OverviewEngineContext.Provider>
	);
});

const OverviewContentBox: FC<{ ariaLevel?: number; useNewFilter: boolean }> = React.memo((props) => {
	const { ariaLevel, useNewFilter } = props;
	const ContentBox = useNewFilter ? NewOverviewContentBox : OldOverviewContentBox;

	return (
		<ContentBox ariaLevel={ariaLevel}>
			<SearchStatus />
			<OverviewTable />
		</ContentBox>
	);
});

export namespace OverviewEngine {
	export type Props = PaginatedProps | InfiniteScrollProps;

	export interface InfiniteScrollProps extends CommonProps {
		/**
		 * The data that is rendered in overview engine.
		 * As this is for infinite-scroll mode, the data can be discontinuous, having empty elements in the middle
		 */
		readonly data: (JSONDocument | undefined)[];

		/**
		 * To control infinite-scroll feature
		 */
		readonly infiniteScrollOptions: OverviewEngineApi.InfiniteScrollOptions;
	}

	export interface PaginatedProps extends CommonProps {
		/**
		 * The data that is rendered in overview engine.
		 */
		readonly data: JSONDocument[];
	}

	export interface CommonProps extends Container {
		/**
		 * The document model which overview model links to
		 */
		readonly documentModel: DocumentModel;

		/**
		 * Sub document models which overview model links to
		 */
		readonly subDocumentModels?: DocumentModel[];

		/**
		 * Resolved relationships across the document and sub-document models. Used by
		 * link/reference columns to traverse data without re-resolving relationships per
		 * row.
		 */
		readonly modelGraph?: ModelGraph;

		/**
		 * The UI model which is used to render overview engine
		 */
		readonly overviewModel: OverviewModel;

		/**
		 * If given, the id document of current active row
		 */
		readonly activeRowId?: string;

		/**
		 * This map is to define state for row actions
		 * @deprecated Use {@link rowActionStyling} instead.
		 */
		readonly rowActionState?: OverviewEngineApi.RowActionState;

		/**
		 * Callback variant of {@link OverviewEngineApi.RowActionState}.
		 * Called per row and per action; returns the action state for that specific row.
		 *
		 * Prefer this over {@link OverviewEngineApi.RowActionState.rows} when rows may share `id` (exclude-mode duplicates).
		 *
		 * @remarks Wrap with `useCallback` to avoid unnecessary re-renders.
		 */
		readonly rowActionStyling?: OverviewEngineApi.RowActionStyling;

		/**
		 * The callback controls the style (e.g: interactive,...) of a row
		 */
		readonly rowStyling?: RowStyleGetter<JSONDocument>;

		/**
		 * To specify aria-level for content box
		 */
		readonly ariaLevel?: number;

		/**
		 * To enable the card view of the overview table. Useful on small screens.
		 */
		readonly cardView?: boolean;

		/**
		 * To display overview engine as an embedded element.
		 */
		readonly embedded?: boolean;

		/**
		 * Event handlers that is used in overview engine
		 */
		readonly eventHandlers?: OverviewEngineApi.EventHandlers;

		/**
		 * A map of components is used to override the components in the overview engine
		 * The components are expected to have rendering logic based on the overview model, overview engine state and so on
		 * If not given, the {@link DefaultComponentMap} will be used
		 */
		readonly componentMap?: ComponentMap;

		/**
		 * A map of Widgets components used in the overview engine
		 * These components are expected to focus on the UI, therefore, they are recommended when some UI customizations need to be applied.
		 * If not given, the {@link DefaultWidgetMap} will be used
		 */
		readonly widgetMap?: WidgetMap;

		/**
		 * @experimental
		 */
		readonly selectorMap?: SelectorMap;

		/**
		 * Filter state selectors. Defaults to {@link DefaultFilterStateSelectors}.
		 *
		 * @experimental until 40.0.0 - API may change without semver guarantees.
		 */
		readonly filterStateSelectors?: FilterStateSelectors;

		/**
		 * The results of statistical operation for each column
		 */
		readonly summaryResult?: OverviewEngineApi.SummaryResult;

		/**
		 * A property which defines the id prefix for Overview Engine component.
		 */
		readonly uiIdPrefix?: string;

		/**
		 * A property which defines the thumbnail map
		 */
		readonly thumbnails?: Record<string, string>;

		/**
		 * UI State
		 */
		readonly uiState?: UiState;

		/**
		 * The total number of documents
		 */
		readonly totalDocumentsCount?: number;

		/**
		 * The accessibility configurations
		 */
		readonly accessibilityConfigurations?: OverviewEngineApi.AccessibilityConfigurations;

		/**
		 * @experimental
		 * Reflect the loading state of a Client activity directly to the engine.
		 * This is an experimental feature, so use it with caution.
		 */
		readonly loadingState?: "without" | "missing" | "loading" | "loaded" | "error";

		/**
		 * Resolved document links and their associated documents for reference columns.
		 */
		readonly links?: Links;
	}
}
