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

import type { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { QueryBuilder } from "@com.mgmtp.a12.querymodel/querymodel-core";

import { isFieldBasedFilterModelItem } from "../../../models/filter-model-utils.js";
import type { FilterState } from "../../../store/index.js";
import type { ModelsState, FilterItemState, FilterStateSelectors } from "../../../store/index.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export namespace NewFieldBasedFiltering {
	/** Build the combined `Query.Operator` for the new filter state. */
	export function toOperator(
		filterState: FilterState,
		modelsState: ModelsState,
		selectors: FilterStateSelectors
	): Query.Operator | undefined {
		const { filters, queryOptions } = filterState;
		const { invert, joinOperator } = queryOptions;
		const { documentModel, subDocumentModels } = modelsState;

		const filterToOperator = (filter: FilterItemState): Query.Operator | undefined => {
			const subModel = isFieldBasedFilterModelItem(filter.model) ? filter.model.options.subModel : undefined;
			const targetDocumentModel = subModel
				? (subDocumentModels?.find((dm) => dm.header.id === subModel) ?? documentModel)
				: documentModel;

			return selectors.toOperator(filter, { documentModel: targetDocumentModel });
		};

		const resolvedJoin = joinOperator.current.enabled ? joinOperator.current.value : "and";
		const resolvedInvert = invert.current.enabled && invert.current.value;

		return QueryBuilder[resolvedJoin](...Object.values(filters).map(filterToOperator))
			.not(resolvedInvert)
			.build();
	}
}
