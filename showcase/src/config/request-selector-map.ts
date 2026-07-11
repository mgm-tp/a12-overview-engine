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

import { ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { QueryIntrospection } from "@com.mgmtp.a12.querymodel/querymodel-core";
import { type RequestSelectorMap, DefaultRequestSelectorMap } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

type ConstraintVariables = Record<string, string | number>;

type SelectorFactory<TConfig extends { activityId: string; query?: unknown }, TResult> = (
	config: TConfig
) => (state: object) => TResult;

function getDescriptorValue(activityId: string, state: object, key: string): string | undefined {
	const activity = ActivitySelectors.activityById(activityId)(state);

	if (activity?.descriptor && key in activity.descriptor) {
		const value = (activity.descriptor as Record<string, unknown>)[key];

		return typeof value === "string" ? value : undefined;
	}

	return undefined;
}

function resolveConstraintVariables(activityId: string, state: object): ConstraintVariables {
	const variables: ConstraintVariables = {};

	const selectedPerson = getDescriptorValue(activityId, state, "selectedPerson");

	if (selectedPerson) {
		variables["PersonDM/__meta/docRef"] = selectedPerson;
	}

	const selectedEmployee = getDescriptorValue(activityId, state, "selectedEmployee");

	if (selectedEmployee) {
		variables["EmployeeDM/__meta/docRef"] = selectedEmployee;
	}

	return variables;
}

function hasConstraintQuery(query: unknown): query is Query.QueryRoot {
	return typeof query === "object" && query !== null && "constraint" in query;
}

function withConstraintVariables<TConfig extends { activityId: string; query?: unknown }, TResult>(
	fn: SelectorFactory<TConfig, TResult>
): SelectorFactory<TConfig, TResult> {
	return (config: TConfig) => {
		const baseSelector = fn(config);

		if (!hasConstraintQuery(config.query)) {
			return baseSelector;
		}

		const queryTemplate = config.query;

		return (state: object) => {
			const variables = resolveConstraintVariables(config.activityId, state);
			const query = QueryIntrospection.replaceVariables(queryTemplate, variables) as TConfig["query"];

			return fn({ ...config, query })(state);
		};
	};
}

export const customRequestSelectorMap: RequestSelectorMap = {
	...DefaultRequestSelectorMap,
	loadListDocuments: withConstraintVariables(DefaultRequestSelectorMap.loadListDocuments),
	loadSummary: withConstraintVariables(DefaultRequestSelectorMap.loadSummary),
	loadListStringFilterOptions: withConstraintVariables(DefaultRequestSelectorMap.loadListStringFilterOptions),
	export: withConstraintVariables(DefaultRequestSelectorMap.export)
};
