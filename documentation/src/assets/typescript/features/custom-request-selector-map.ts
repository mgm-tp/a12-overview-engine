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
import { type RequestSelectorMap, DefaultRequestSelectorMap } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

// tag::requestSelectorMap[]
/**
 * Example: customize requests by wrapping the defaults.
 *
 * Always spread DefaultRequestSelectorMap and only override what you need.
 */
export const customRequestSelectorMap: RequestSelectorMap = {
	...DefaultRequestSelectorMap,

	// Add a default constraint for a specific model, then delegate back to the default implementation
	loadListDocuments: (config) => {
		const { documentModel, query } = config;

		if (documentModel.header.id === "ProductDM") {
			const mustHaveSku: Query.Operator = {
				operator: Query.OPERATORS.NOT_OPERATOR,
				operand: { operator: Query.OPERATORS.UNDEFINED_MATCH_OPERATOR, field: "/product/sku" }
			};

			const updatedQuery: typeof query = {
				...query,
				constraint: query.constraint
					? { operator: Query.OPERATORS.AND_OPERATOR, operands: [query.constraint, mustHaveSku] }
					: mustHaveSku
			};

			return DefaultRequestSelectorMap.loadListDocuments({ ...config, query: updatedQuery });
		}

		return DefaultRequestSelectorMap.loadListDocuments(config);
	}
};
// end::requestSelectorMap[]
