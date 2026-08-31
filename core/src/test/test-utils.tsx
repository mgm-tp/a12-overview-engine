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
import { Provider } from "react-redux";
import { create } from "react-test-renderer";

import {
	render,
	getByRole,
	getByText,
	prettyDOM,
	queryByRole,
	queryByText,
	type Matcher,
	queryHelpers,
	getByLabelText,
	queryByLabelText,
	type ByRoleMatcher,
	type MatcherOptions,
	type SelectorMatcherOptions
} from "@testing-library/react";
import merge from "lodash-es/merge.js";
import { createStore, type Reducer } from "redux";
import { ThemeProvider, StyleSheetManager } from "styled-components";

import { type Locale, defaultDataFormats, defaultValueConversion } from "@com.mgmtp.a12.utils/utils-localization";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import { defaultTheme, shouldForwardProp } from "@com.mgmtp.a12.widgets/widgets-core";

import { enLocale } from "./basic.spec.js";

const queryByDataRole = queryHelpers.queryByAttribute.bind(null, "data-role");

const queryAllByDataRole = queryHelpers.queryAllByAttribute.bind(null, "data-role");

const getAllByDataRole = (container: HTMLElement, id: Matcher, options?: MatcherOptions): HTMLElement[] => {
	const elements = queryAllByDataRole(container, id, options);

	if (!elements.length) {
		throw queryHelpers.getElementError(`Unable to find an element by: [data-role="${id}"]`, container);
	}

	return elements;
};

const getByDataRole = (container: HTMLElement, id: Matcher, options?: MatcherOptions): HTMLElement => {
	const result = getAllByDataRole(container, id, options);

	if (result.length > 1) {
		throw queryHelpers.getElementError(`Found multiple elements with the [data-role="${id}"]`, container);
	}

	return result[0];
};

export interface TestReduxState {
	dataservices: {
		configuration: Record<string, string>;
	};
	models: {
		applicationModel: Record<string, unknown>;
		modelGraph: Record<string, unknown>;
		models: Record<string, unknown>;
	};
}

const DEFAULT_DATASERVICES_CONFIGURATION = {
	"mgmtp.a12.dataservices.query.simpleSearch.minSearchableTokenSize": "0",
	"mgmtp.a12.dataservices.jsonRpc.maxMethodCallsPerRequest": "0",
	"mgmtp.a12.dataservices.query.maxQueryDepth": "0",
	"mgmtp.a12.dataservices.query.maxLinksSize": "0"
} as const;

const DEFAULT_TEST_REDUX_STATE: TestReduxState = {
	dataservices: {
		configuration: { ...DEFAULT_DATASERVICES_CONFIGURATION }
	},
	models: {
		applicationModel: {},
		modelGraph: {},
		models: {}
	}
};

export function createTestReduxState(overrides?: Partial<TestReduxState>): TestReduxState {
	return merge({}, DEFAULT_TEST_REDUX_STATE, overrides ?? {});
}

export function createTestStore(overrides?: Partial<TestReduxState>) {
	const initialState = createTestReduxState(overrides);
	const reducer: Reducer<TestReduxState> = (state = initialState) => state;

	return createStore(reducer);
}

export function shallowRender(element: React.ReactElement, options?: RendererOptions, customLocale?: Locale) {
	const DefinedWrapper = options?.wrappingComponent;
	const testStore = createTestStore(options?.reduxState);

	return React.act(() =>
		create(
			<StyleSheetManager shouldForwardProp={shouldForwardProp}>
				<ThemeProvider theme={defaultTheme}>
					<DefaultLocalizerContextProvider locale={customLocale ?? enLocale}>
						<Provider store={testStore}>
							{DefinedWrapper ? (
								<DefinedWrapper {...options?.wrappingComponentProps}>{element}</DefinedWrapper>
							) : (
								element
							)}
						</Provider>
					</DefaultLocalizerContextProvider>
				</ThemeProvider>
			</StyleSheetManager>
		)
	);
}

function rtlRender(element: React.ReactElement, options?: RendererOptions, customLocale?: Locale): QueriableElement {
	const DefinedWrapper = options?.wrappingComponent;
	const locale = customLocale ?? enLocale;
	const testStore = createTestStore(options?.reduxState);

	return new QueriableElement(
		render(
			<StyleSheetManager shouldForwardProp={shouldForwardProp}>
				<ThemeProvider theme={defaultTheme}>
					<DefaultLocalizerContextProvider
						locale={locale}
						valueConversion={defaultValueConversion(defaultDataFormats(locale))}>
						<Provider store={testStore}>
							{DefinedWrapper ? (
								<DefinedWrapper {...options?.wrappingComponentProps}>{element}</DefinedWrapper>
							) : (
								element
							)}
						</Provider>
					</DefaultLocalizerContextProvider>
				</ThemeProvider>
			</StyleSheetManager>
		)[options?.asBaseElement ? "baseElement" : "container"]
	);
}

interface RendererOptions {
	wrappingComponent?: React.ComponentType<any> | undefined;
	wrappingComponentProps?: {} | undefined;
	asBaseElement?: boolean;
	reduxState?: Partial<TestReduxState>;
}

export interface NullQueriableElement {
	element: null;
}

export class QueriableElement {
	constructor(public readonly element: HTMLElement) {}

	public queryByDataRole(id: Matcher, options?: MatcherOptions): QueriableElement | NullQueriableElement {
		const result = queryByDataRole(this.element, id, options);

		return result ? new QueriableElement(result) : { element: result };
	}

	public queryByDataRoles(...ids: Matcher[]): QueriableElement | null {
		return this.query(ids.map((id) => `[data-role="${id}"]`).join(" "));
	}

	public queryAllByDataRole(id: Matcher, options?: MatcherOptions): QueriableList {
		return new QueriableList(queryAllByDataRole(this.element, id, options));
	}

	public queryAllByDataRoles(...ids: Matcher[]): QueriableList {
		return this.queryAll(ids.map((id) => `[data-role="${id}"]`).join(" "));
	}

	public getAllByDataRole(id: Matcher, options?: MatcherOptions): QueriableList {
		return new QueriableList(getAllByDataRole(this.element, id, options));
	}

	public getByDataRole(id: Matcher, options?: MatcherOptions): QueriableElement {
		return new QueriableElement(getByDataRole(this.element, id, options));
	}

	public getByDataRoles(...ids: Matcher[]): QueriableElement {
		const result = this.query(ids.map((id) => `[data-role="${id}"]`).join(" "));

		if (!result) {
			throw new Error(`No element found with data-roles: ${ids}`);
		}

		return result;
	}

	public query(selector: string): QueriableElement | null {
		const result = this.element.querySelector(selector);

		return result ? new QueriableElement(result as HTMLElement) : result;
	}

	public queryAll(selector: string): QueriableList {
		return new QueriableList(Array.from(this.element.querySelectorAll(selector)));
	}

	public getByText(id: Matcher, options?: SelectorMatcherOptions) {
		return new QueriableElement(getByText(this.element, id, options));
	}

	public getByLabelText(id: Matcher, options?: SelectorMatcherOptions) {
		return new QueriableElement(getByLabelText(this.element, id, options));
	}

	public queryByLabelText(id: Matcher, options?: SelectorMatcherOptions): QueriableElement | NullQueriableElement {
		const result = queryByLabelText(this.element, id, options);

		return result ? new QueriableElement(result) : { element: result };
	}

	public queryByText(id: Matcher, options?: SelectorMatcherOptions): QueriableElement | NullQueriableElement {
		const result = queryByText(this.element, id, options);

		return result ? new QueriableElement(result) : { element: result };
	}

	public getByRole(id: ByRoleMatcher, options?: SelectorMatcherOptions) {
		return new QueriableElement(getByRole(this.element, id, options));
	}

	public queryByRole(id: ByRoleMatcher, options?: SelectorMatcherOptions): QueriableElement | NullQueriableElement {
		const result = queryByRole(this.element, id, options);

		return result ? new QueriableElement(result) : { element: result };
	}

	public debug() {
		console.log(prettyDOM(this.element));
	}
}

export class QueriableList extends Array<HTMLElement> {
	constructor(elements: HTMLElement[] | NodeListOf<HTMLElement>) {
		super();
		this.push(...Array.from(elements));
	}

	public first(): QueriableElement {
		assert(this.length > 0, "No elements found.");

		return new QueriableElement(this[0]);
	}

	public last(): QueriableElement {
		assert(this.length > 0, "No elements found.");

		return new QueriableElement(this[this.length - 1]);
	}

	public get(index: number): QueriableElement {
		const result = this.at(index);
		assert(result, `No element found at index ${index}.`);

		return new QueriableElement(result);
	}

	public debug() {
		this.forEach((element) => console.log(prettyDOM(element)));
	}
}

export function assert(condition: unknown, onFailedMessage = "Condition return a falsely value."): asserts condition {
	if (!condition) {
		throw new Error(onFailedMessage);
	}
}

export { rtlRender as render, DEFAULT_TEST_REDUX_STATE as defaultReduxState };

/**
 * @deprecated Use {@link DataRoles} instead.
 */
export const ClassNames = {
	ButtonGroupContainer: "button-group-container",
	ButtonGroup: "button-group",
	Button: "button",
	TableSortingIcon: "table__sorting-icon",
	TableBodyRow: "table__contentRow",
	TableBodyCell: "table__contentCell",
	TableActionCell: "table__actionCell",
	TableHeadCell: "table__headerCell"
};
