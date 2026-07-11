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

import React from "react";
import { expect } from "vitest";
import { Lens } from "monocle-ts";
import { Provider, useDispatch, useSelector } from "react-redux";
import { ThemeProvider, StyleSheetManager } from "styled-components";
import {
	type Store,
	type Action,
	type Reducer,
	type Dispatch,
	applyMiddleware,
	legacy_createStore as createStore
} from "redux";
import {
	render,
	queries,
	buildQueries,
	type Matcher,
	queryHelpers,
	type RenderResult,
	type RenderOptions,
	type MatcherOptions
} from "@testing-library/react";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import {
	noop,
	WidgetsRoot,
	defaultTheme,
	type Container,
	DateTimeContext,
	shouldForwardProp,
	type DateTimeContextType
} from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewEngineApi } from "../../../../main/view/api.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import { OverviewEngine } from "../../../../main/view/overview-engine.js";
import { FilterFocusContext } from "../../../../main/view/context/filter-focus-context.js";
import { assertCondition } from "../../../../main/client-extensions/internal/utils/assertion.js";
import { useOverviewEngineState } from "../../../../main/view/context/overview-engine-context.js";
import { FilterBarItem } from "../../../../main/view/components/new-filters/components/filter-bar-item.js";
import { FilterSelector } from "../../../../main/view/components/new-filters/components/filter-selector.js";
import { DefaultFilterStateSelectors } from "../../../../main/store/internal/selectors/filter-selectors.js";
import { defaultMapDispatchToEventHandlers } from "../../../../main/view/configuration/event-handlers-dispatch-map.js";
import {
	Commands,
	type UiState,
	uiStateReducer,
	UiStateSelector,
	FilterStateBuilder,
	createEngineMiddlewares
} from "../../../../main/store/index.js";

import { enLocale } from "../../../basic.spec.js";
import { QueriableElement } from "../../../test-utils.js";
import { getDocumentModel, getOverviewModel } from "../../../setup/models.js";

const queryAllByDataRole = <T extends HTMLElement = HTMLElement>(
	container: HTMLElement,
	id: Matcher,
	options?: MatcherOptions | undefined
) => queryHelpers.queryAllByAttribute("data-role", container, id, options) as T[];

const getMultipleError = (container: Element | null, dataRoleValue: string) =>
	`Found multiple elements with the data-role attribute of: ${dataRoleValue}`;
const getMissingError = (container: Element | null, dataRoleValue: string) =>
	`Unable to find an element with the data-role attribute of: ${dataRoleValue}`;

const [queryByDataRole, getAllByDataRole, getByDataRoleOriginal, findAllByDataRole, findByDataRole] = buildQueries(
	queryAllByDataRole,
	getMultipleError,
	getMissingError
);

const getByDataRole = <T extends HTMLElement = HTMLElement>(container: HTMLElement, dataRole: string): T => {
	const el = getByDataRoleOriginal(container, dataRole);
	assertCondition(el !== null, `Unable to find an element with the data-role attribute of: ${dataRole}`);

	return el as T;
};

const allQueries = {
	...queries,
	queryAllByDataRole,
	queryByDataRole,
	getAllByDataRole,
	getByDataRole,
	findAllByDataRole,
	findByDataRole
};

export interface RenderWithStoreResult extends RenderResult {
	store: Store<UiState>;
	locale: Locale;
	queriableElement: QueriableElement;
}

/**
 * Test-only action used to mutate `enumeratedStringFilterMap` from a test
 * without going through the saga/middleware that populates it in production.
 * Handled by `withTestEnumMap` below.
 */
export const TEST_SET_ENUM_STRING_FILTER_MAP = "@@TEST/SET_ENUM_STRING_FILTER_MAP";

interface TestSetEnumMapAction {
	readonly type: typeof TEST_SET_ENUM_STRING_FILTER_MAP;
	readonly payload: OverviewEngineApi.EnumeratedStringFilterMap | undefined;
}

function isTestSetEnumMapAction(action: { type: string }): action is TestSetEnumMapAction {
	return action.type === TEST_SET_ENUM_STRING_FILTER_MAP;
}

function withTestEnumMap(reducer: Reducer<UiState>): Reducer<UiState> {
	return (state, action) => {
		if (isTestSetEnumMapAction(action as { type: string })) {
			const next = (action as unknown as TestSetEnumMapAction).payload;

			return { ...(state ?? ({} as UiState)), enumeratedStringFilterMap: next };
		}

		return reducer(state, action);
	};
}

export function setTestEnumeratedStringFilterMap(
	store: Store<UiState>,
	map: OverviewEngineApi.EnumeratedStringFilterMap | undefined
): void {
	const action: TestSetEnumMapAction = { type: TEST_SET_ENUM_STRING_FILTER_MAP, payload: map };
	store.dispatch(action as unknown as Action);
}

function withDataServicesConfiguration(
	reducer: Reducer<UiState>,
	configuration?: Record<string, string>
): Reducer<UiState> {
	if (!configuration) {
		return reducer;
	}

	return (state, action) => ({ ...reducer(state, action), dataservices: { configuration } }) as UiState;
}

export async function renderWithStore(
	ui: React.ReactElement,
	options: Omit<ProvidersProps, "children"> &
		Omit<RenderOptions, "queries"> & {
			readonly preloadedUiState?: Partial<UiState>;
			readonly dataservicesConfiguration?: Record<string, string>;
		}
): Promise<RenderWithStoreResult> {
	const store = createStore(
		withDataServicesConfiguration(withTestEnumMap(uiStateReducer), options.dataservicesConfiguration),
		(options.preloadedUiState ?? {}) as UiState,
		applyMiddleware(...createEngineMiddlewares({ filterStateSelectors: DefaultFilterStateSelectors }))
	);

	function Wrapper({ children }: Container): React.JSX.Element {
		return (
			<Provider store={store}>
				<Providers {...options}>{children}</Providers>
			</Provider>
		);
	}

	const renderResult = render(ui, { wrapper: Wrapper, queries: allQueries, ...options });

	return {
		store,
		locale: options.locale ?? enLocale,
		queriableElement: new QueriableElement(renderResult.container),
		...renderResult
	};
}

export interface ProvidersProps extends Container {
	engineProps: OverviewEngine.Props;
	locale?: Locale;
	dateTimeContext?: DateTimeContextType;
}
const defaultFilterFocusContextValue: FilterFocusContext.Type = {
	registerRef: noop,
	onFocusedFilterChange: noop
};

export const Providers: React.FC<ProvidersProps> = (props) => {
	const { locale = enLocale, engineProps, dateTimeContext, children } = props;

	const wrappedChildren = (
		<DefaultLocalizerContextProvider locale={locale}>
			<StyleSheetManager shouldForwardProp={shouldForwardProp}>
				<ThemeProvider theme={defaultTheme}>
					<WidgetsRoot>
						<FilterFocusContext.Provider value={defaultFilterFocusContextValue}>
							<OverviewEngineContainer {...engineProps}>{children}</OverviewEngineContainer>
						</FilterFocusContext.Provider>
					</WidgetsRoot>
				</ThemeProvider>
			</StyleSheetManager>
		</DefaultLocalizerContextProvider>
	);

	if (dateTimeContext) {
		return <DateTimeContext.Provider value={dateTimeContext}>{wrappedChildren}</DateTimeContext.Provider>;
	}

	return wrappedChildren;
};

const OverviewEngineContainer: React.FC<OverviewEngine.Props> = (props) => {
	const { children, ...rest } = props;
	const { overviewModel, documentModel } = props;

	const uiState = useSelector<UiState, UiState>((state) => state);
	const dispatch = useDispatch();

	const engineDispatch: Dispatch = React.useCallback(
		(action) => {
			dispatch(action);

			return action;
		},
		[dispatch]
	);

	React.useEffect(() => {
		if (uiState.newFilter) {
			return;
		}

		if (!documentModel) {
			return;
		}

		const newFilter = new FilterStateBuilder(overviewModel, documentModel, [], DefaultFilterStateSelectors).build();

		if (!newFilter) {
			return;
		}

		dispatch(
			Commands.setFilterState({
				state: {
					...newFilter,
					snapshot: UiStateSelector.NewFilter.filtersSnapshot(DefaultFilterStateSelectors)({ newFilter })
				}
			})
		);
	}, [
		uiState.newFilter,
		overviewModel,
		documentModel,
		dispatch,
		overviewModel.content.configuration.newFilterConfiguration
	]);

	return (
		<OverviewEngine {...rest} eventHandlers={defaultMapDispatchToEventHandlers(engineDispatch)} uiState={uiState}>
			{children}
		</OverviewEngine>
	);
};

export const baseFilterConfiguration: OverviewModel.NewFilterConfiguration = {
	filterSelector: {
		viewMode: "docked",
		searchBar: { enabled: false },
		showSetFiltersOnly: { enabled: true, value: false }
	},
	invert: { enabled: false },
	joinOperator: { enabled: true, value: "and" },
	filterGroups: []
};

export const baseFilterGroup: OverviewModel.NewFilter.Group = {
	id: "common",
	name: "common",
	label: [{ locale: "en", text: "Common" }],
	filterItems: []
};

export { queryAllByDataRole, queryByDataRole, getAllByDataRole, getByDataRole, findAllByDataRole, findByDataRole };

const filterConfigurationLens = Lens.fromPath<OverviewModel>()(["content", "configuration", "newFilterConfiguration"]);

export interface FilterRenderResult extends RenderWithStoreResult {
	documentModel: DocumentModel;
	overviewModel: OverviewModel;
}

export interface DocumentModelModifier<T extends DocumentModel.Element = DocumentModel.Element> {
	(element: T): T | null;
}

export function modifyDocumentModel<T extends DocumentModel.Element = DocumentModel.Element>(
	documentModel: DocumentModel,
	modifier: DocumentModelModifier<T>
): DocumentModel {
	const modifyElement = (element: DocumentModel.Element): DocumentModel.Element | null => {
		if (element.type === "Field") {
			return modifier(element as T) ?? element;
		}

		const modifiedGroup = modifier(element as T);

		if (modifiedGroup) {
			return modifiedGroup;
		}

		return { ...element, elements: element.elements.map((e) => modifyElement(e)) as DocumentModel.Element[] };
	};

	return {
		...documentModel,
		content: {
			...documentModel.content,
			modelRoot:
				(modifyElement(documentModel.content.modelRoot as T) as DocumentModel.Group | null) ??
				documentModel.content.modelRoot
		}
	};
}

export async function renderFilter<Item extends OverviewModel.NewFilter.Item>(options: {
	filterItem: Item;
	documentModelModifier?: DocumentModelModifier;
	dateTimeContext?: DateTimeContextType;
	initialEnumeratedStringFilterMap?: OverviewEngineApi.EnumeratedStringFilterMap;
	dataservicesConfiguration?: Record<string, string>;
}): Promise<FilterRenderResult> {
	let documentModel = await getDocumentModel("product", "ProductDM");
	const productOM = await getOverviewModel("product", "ProductOM");

	if (options.documentModelModifier) {
		documentModel = modifyDocumentModel(documentModel, options.documentModelModifier);
	}

	const overviewModel = filterConfigurationLens.set({
		...baseFilterConfiguration,
		filterGroups: [{ ...baseFilterGroup, filterItems: [options.filterItem] }]
	})(productOM);

	const preloadedUiState: Partial<UiState> | undefined = options.initialEnumeratedStringFilterMap
		? { enumeratedStringFilterMap: options.initialEnumeratedStringFilterMap }
		: undefined;

	const renderResult = await renderWithStore(<CombinedFilters />, {
		engineProps: { documentModel, overviewModel, data: [] },
		dateTimeContext: options.dateTimeContext,
		preloadedUiState,
		dataservicesConfiguration: options.dataservicesConfiguration
	});

	return { overviewModel, documentModel, ...renderResult };
}

export type RangeMode = "From To" | "From" | "To" | "Exact";

export const RANGE_MODE_ICON_ROLE: Record<RangeMode, string> = {
	"From To": "range-icon-fromTo",
	From: "range-icon-fromOnly",
	To: "range-icon-toOnly",
	Exact: "range-icon-exact"
};

export async function withFilterSection(
	container: HTMLElement,
	label: string,
	interact: (params: { title: HTMLElement; body: HTMLElement | null }) => Promise<void> | void
) {
	const title = findFilterSection(container, label);
	expect(title).toBeDefined();
	assertCondition(!!title);

	await interact({ title: title, body: title.nextSibling as HTMLElement | null });
}

export function findFilterSection(container: HTMLElement, label: string): HTMLElement | undefined {
	return queryAllByDataRole(container, "typography-headline").find((el) => {
		return getByDataRole(el, "typography-headline-label").textContent === label;
	});
}

export const CombinedFilters = () => {
	const filters = useOverviewEngineState((state) => Object.values(state.newFilter?.filters ?? {}));

	if (filters.length !== 1) {
		return null;
	}

	const filterState = filters[0];

	return (
		<>
			<FilterBarItem filter={filterState} filterRef={noop} />
			<FilterSelector />
		</>
	);
};
