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

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DataOperation } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

// @ts-expect-error documentation
// tag::ListDocuments[]
const listDocumentsQuery: DataOperation.ListDocuments.Query = {
	id: "OverviewEngineDataProvider-0",
	type: "LIST_DOCUMENTS",
	paging: {
		pageNumbers: [0],
		pageSize: 10
	},
	sort: [
		{
			field: "/Person/PersonalData/PlaceOfBirth",
			direction: Query.Direction.ASC,
			nullHandling: Query.NullHandling.NULLS_LAST,
			ignoreCase: true
		}
	],
	constraint: {
		operator: "or",
		operands: [
			{
				operator: "exact_match",
				field: "/Person/PersonalData/FirstName",
				value: "Aaron",
				caseSensitive: true
			},
			{
				operator: "exact_match",
				field: "/Person/PersonalData/FirstName",
				value: "Allen",
				caseSensitive: true
			}
		]
	},
	fields: [
		"/Person/PersonalData/FirstName",
		"/Person/PersonalData/LastName",
		"/Person/PersonalData/PlaceOfBirth",
		"/Person/PersonalData/Nationality",
		"/Person/PersonalData/Salary"
	],
	aggregation: {
		aggregations: [
			{
				field: "/Person/PersonalData/Salary",
				function: "sum"
			}
		],
		group: [
			{
				field: "/__meta/modelReference",
				alias: "model"
			}
		]
	}
};
// end::ListDocuments[]

// @ts-expect-error documentation
// tag::ListStringFilterOptions[]
const enumeratedStringFilterQuery: DataOperation.ListStringFilterOptions.Query = {
	id: "EnumeratedStringDataProvider-2",
	type: "LIST_STRING_FILTER_OPTIONS",
	paging: {
		pageNumber: 0,
		pageSize: 5
	},
	constraint: {
		operator: "simple_search",
		fields: ["/Person/PersonalData/FirstName"],
		value: "Allen"
	},
	aggregation: {
		aggregations: [
			{
				function: "count",
				field: "/Person/PersonalData/FirstName"
			}
		],
		group: [
			{
				field: "/Person/PersonalData/FirstName",
				alias: "name"
			}
		]
	}
};
// end::ListStringFilterOptions[]

// @ts-expect-error documentation
// tag::Export[]
const exportQuery: DataOperation.Export.Query = {
	id: "export",
	type: "EXPORT",
	sort: [
		{
			field: "/businessPartner/name",
			direction: Query.Direction.DESC,
			nullHandling: Query.NullHandling.NULLS_FIRST,
			ignoreCase: true
		}
	]
};
// end::Export[]
