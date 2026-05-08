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

import * as TypeMoq from "typemoq";

import { noop } from "@com.mgmtp.a12.widgets/widgets-core";
import { type ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import { type DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { type LocalizedModelText } from "@com.mgmtp.a12.utils/utils-localization";

import { OverviewModel } from "../main/overview-model.js";
import { type OverviewEngine } from "../main/view/overview-engine.js";
import { type ComponentMap, DefaultComponentMap } from "../main/view/configuration/component-map.js";

import { deLocale, enLocale } from "./basic.spec.js";

export { noop };

export function mockType<T extends { [key: string]: any }>(config?: RecursivePartial<T>): T {
	const mock = TypeMoq.Mock.ofType<T>();

	if (config === undefined) {
		return mock.object;
	}

	for (const key of Object.keys(config)) {
		mock.setup((e) => e[key]).returns(() => config[key]);
	}

	return mock.object;
}

type RecursivePartial<T> = {
	[K in keyof T]?: T[K] extends string ? string : RecursivePartial<T[K]>;
};

export function createDocumentModel(elements: ReadonlyArray<DocumentModel.Element>): DocumentModel {
	return {
		header: {
			id: "DocumentModelWithLabels",
			locales: [{ code: "en" }, { code: "de" }],
			modelType: "document",
			modelVersion: "24.0.0"
		},
		content: {
			modelConfig: { timeZone: "UTC" },
			modelInfo: {},
			modelRoot: {
				type: "Group",
				id: "RootGroup",
				name: "RootGroup",
				elements: [
					{
						type: "Group",
						id: "G0",
						name: "root",
						repeatability: 1,
						elements: [...elements]
					}
				],
				repeatability: 1
			}
		}
	};
}

export function createOverviewModel(
	columns: ReadonlyArray<OverviewModel.Column>,
	filterConfiguration?: OverviewModel.FilterConfiguration
): OverviewModel {
	return {
		header: {
			id: "OverviewModelWithLabel",
			modelType: "overview",
			modelVersion: "30.0.0",
			locales: [
				{
					code: "en"
				},
				{
					code: "de"
				}
			],
			labels: [
				{
					locale: "en",
					text: ""
				},
				{
					locale: "de",
					text: ""
				}
			],
			modelReferences: [
				{
					purpose: "document-model-for-overview",
					modelType: "document",
					alias: "DM",
					reference: "DocumentModelWithSomeLabels.xml"
				}
			]
		},
		content: {
			subHeaderBox: {
				majorElements: [{ type: OverviewModel.ElementType.SEARCH }, { type: OverviewModel.ElementType.FILTER }]
			},
			footerBox: {},
			columns: [...columns],
			rowActionGroup: {},
			configuration: {
				pagingSize: 10,
				enableFilter: true,
				showFullTextSearch: true,
				filterConfiguration: {
					showFilterButton: true,
					showFilterBar: true,
					filterMode: OverviewModel.FilterMode.ALL,
					...filterConfiguration
				}
			}
		}
	};
}

export function createField(
	type: DocumentModel.Field["fieldType"]["type"],
	id: string,
	hasLabel = false
): DocumentModel.Field {
	const baseField: Omit<DocumentModel.Field, "fieldType"> = {
		type: "Field",
		id,
		name: id,
		label: hasLabel
			? [
					{ locale: "en", text: id + " Field Label en" },
					{ locale: "de", text: id + " Field Label de" }
				]
			: undefined
	};

	switch (type) {
		case "EnumerationType":
			return {
				...baseField,
				fieldType: {
					type,
					values: [
						{ value: "1", label: [{ locale: "en", text: "One" }] },
						{ value: "2", label: [{ locale: "en", text: "Two" }] }
					]
				}
			};
		case "NumberType":
			return {
				...baseField,
				fieldType: { type, zeroNotAllowed: false }
			};
		case "StringType":
			return {
				...baseField,
				fieldType: { type, lineBreaksPermitted: true }
			};
		case "CustomFieldType":
			return { ...baseField, fieldType: { type, name: "CustomFieldType" } };
		case "ConfirmType":
		case "BooleanType":
			return { ...baseField, fieldType: { type } };
		case "DateTimeType":
			return { ...baseField, fieldType: { type, format: "yyyy-MM-dd'T'HH:mm:ss" } };
		case "TimeType":
			return { ...baseField, fieldType: { type, format: "HH:mm:ss" } };
		case "DateType":
			return {
				...baseField,
				fieldType: { type, format: "yyyy-MM-DD" }
			};
		default:
			throw new Error("Unknown Type: " + type);
	}
}

export function createEnumerationField(alphabeticalSorting?: boolean): DocumentModel.Field {
	return {
		type: "Field",
		id: "enum",
		name: "value",
		fieldType: {
			type: "EnumerationType",
			values: [
				{
					value: "1",
					label: [
						{ locale: "en", text: "One" },
						{ locale: "de", text: "Einer" }
					]
				},
				{
					value: "2",
					label: [
						{ locale: "en", text: "Two" },
						{ locale: "de", text: "Zwei" }
					]
				},
				{
					value: "3",
					label: [
						{ locale: "en", text: "Three" },
						{ locale: "de", text: "Drei" }
					]
				}
			],
			alphabeticalSorting
		}
	};
}

export function createGroup(props: {
	repeatability: number;
	elements: ReadonlyArray<DocumentModel.Element>;
	id: string;
	usageType?: string;
}): DocumentModel.Group {
	return {
		type: "Group",
		id: props.id,
		name: props.id,
		repeatability: props.repeatability,
		usageType: props.usageType,
		elements: props.elements
	};
}

export function createColumn(elementRef: string, hasTitle: boolean, id: string): OverviewModel.Column {
	return {
		id,
		elementRef,
		sortable: false,
		width: 1.0,
		label: hasTitle
			? [
					{
						text: elementRef + " Column Title en",
						locale: "en"
					},
					{
						text: elementRef + " Column Title de",
						locale: "de"
					}
				]
			: undefined
	};
}

export function createModelPath(...elements: string[]): ModelPath {
	return elements.map((elementName) => ({ elementName }));
}

export function createComponentMap(componentMap: Partial<ComponentMap>): ComponentMap {
	return { ...DefaultComponentMap, ...componentMap };
}

export function createLocalizedModelText(text: string): LocalizedModelText {
	return [
		{ text: text + " EN", locale: enLocale.language },
		{ text: text + " DE", locale: deLocale.language }
	];
}

export type PartialOEInfiniteScrollProps = Partial<OverviewEngine.InfiniteScrollProps> &
	Pick<OverviewEngine.InfiniteScrollProps, "infiniteScrollOptions">;

export function cartesianProduct<T>(...groups: Partial<T>[][]): T[] {
	let results: Partial<T>[] = [{}];

	for (const group of groups) {
		const nextResult: Partial<T>[] = [];

		for (const base of results) {
			for (const patch of group) {
				nextResult.push({ ...base, ...patch });
			}
		}

		results = nextResult;
	}

	return results as T[];
}
