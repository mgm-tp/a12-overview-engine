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

import type * as OldModel from "../version-39.0.0-pre.6/overview-model.js";

import type * as NewModel from "./overview-model.js";

export default function transform(oldModel: OldModel.OverviewModel): NewModel.OverviewModel {
	const { header, content } = oldModel;
	const { configuration, ...restContent } = content;
	const { newFilterConfiguration, ...restConfiguration } = configuration;

	return {
		header,
		content: {
			...restContent,
			configuration: {
				...restConfiguration,
				...(newFilterConfiguration
					? { newFilterConfiguration: transformNewFilterConfiguration(newFilterConfiguration) }
					: {})
			}
		}
	};
}

function transformNewFilterConfiguration(
	oldConfig: OldModel.OverviewModel.NewFilterConfiguration
): NewModel.OverviewModel.NewFilterConfiguration {
	const { filterGroups, filterSelector } = oldConfig;
	const { invert, joinOperator, ...restFilterSelector } = filterSelector;

	return { filterGroups, filterSelector: restFilterSelector, invert, joinOperator };
}
