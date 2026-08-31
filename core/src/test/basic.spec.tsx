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

import type { ModelGraph } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";

import type { JSONDocument } from "../main/models/index.js";
import { OverviewModel } from "../main/overview-model.js";
import { OverviewEngineApi } from "../main/view/api.js";
import { DefaultComponentMap } from "../main/view/configuration/component-map.js";
import { DefaultWidgetMap } from "../main/view/configuration/widget-map.js";
import type { OverviewEngine } from "../main/view/overview-engine.js";

import { getDocumentModel } from "./setup/models.js";

export const enLocale: Locale = { language: "en", country: "US" };
export const deLocale: Locale = { language: "de", country: "DE" };

const documents: JSONDocument[] = [
	{
		id: "1",
		modelId: "test-model",
		root: {
			string: "ABC",
			number: 1,
			multiSelectGroup: [{ value: "1" }]
		}
	},
	{
		id: "2",
		modelId: "test-model",
		root: {
			string: "XYZ",
			number: 2,
			multiSelectGroup: [{ value: "1" }, { value: "2" }]
		}
	}
];

export const StringColumnModel: OverviewModel.Column = {
	label: [{ text: "String [OM]", locale: enLocale.language }],
	id: "column-12345",
	elementRef: "F1",
	sortable: true,
	width: 1.0
};

export const NumberColumnModel: OverviewModel.Column = {
	label: [{ text: "Number", locale: enLocale.language }],
	id: "column-23456",
	elementRef: "F2",
	sortable: false,
	width: 2.0
};

export const MultiSelectColumnModel: OverviewModel.Column = {
	label: [{ text: "MultiSelect [OM]", locale: enLocale.language }],
	id: "column-34567",
	elementRef: "F9",
	sortable: false,
	width: 1
};

export const BooleanColumnModel: OverviewModel.Column = {
	label: [{ text: "Boolean [OM]", locale: enLocale.language }],
	id: "column-45678",
	elementRef: "F3",
	sortable: false,
	width: 1
};

export const AttachmentColumnModel: OverviewModel.Column = {
	label: [{ text: "Attachment [OM]", locale: enLocale.language }],
	id: "column-7339a",
	elementRef: "G3",
	sortable: false,
	width: 1.0
};
const defaultOverviewModel: OverviewModel = {
	header: {
		id: "BasicOverviewModel",
		modelType: "overview",
		modelVersion: "23.2.0",
		modelReferences: [],
		locales: [{ code: enLocale.language }],
		labels: [
			{
				locale: enLocale.language,
				text: "Basic Overview Model"
			},
			{
				locale: deLocale.language,
				text: "Basic Overview Model DE"
			}
		]
	},
	content: {
		subHeaderBox: {
			rightSlot: [{ type: OverviewModel.ElementType.FILTER }, { type: OverviewModel.ElementType.SEARCH }]
		},
		columns: [StringColumnModel, NumberColumnModel, MultiSelectColumnModel, AttachmentColumnModel],
		rowActionGroup: {},
		configuration: {
			showFullTextSearch: true,
			enableFilter: true,
			filterConfiguration: {
				showFilterBar: true,
				showFilterButton: true,
				filterMode: OverviewModel.FilterMode.ALL
			}
		}
	}
};
const documentModel = await getDocumentModel("unit-test", "DomainTest");
const defaultModelGraph: ModelGraph = {
	documentModels: [{ modelId: documentModel.header.id, relations: null, subTypes: [] }],
	composeDocumentModels: [],
	genericModels: [{ modelId: defaultOverviewModel.header.id, type: "overview" }],
	relationshipModels: []
};
export const defaultEngineProps: OverviewEngine.PaginatedProps = {
	documentModel,
	overviewModel: defaultOverviewModel,
	modelGraph: defaultModelGraph,
	data: documents,
	widgetMap: DefaultWidgetMap,
	componentMap: DefaultComponentMap,
	uiState: {
		pagination: OverviewEngineApi.Pagination.getInitialValue(defaultOverviewModel),
		sorting: OverviewEngineApi.getUiStateSorting(
			OverviewEngineApi.Sorting.getInitialValue(defaultOverviewModel),
			documentModel,
			defaultOverviewModel,
			defaultModelGraph.relationshipModels,
			[]
		)
	}
};
