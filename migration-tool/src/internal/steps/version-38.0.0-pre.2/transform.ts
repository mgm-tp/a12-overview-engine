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

import type * as OldModel from "../version-38.0.0-pre.1/overview-model.js";

import type * as NewModel from "./overview-model.js";

export default function transform(oldModel: OldModel.OverviewModel): NewModel.OverviewModel {
	const { header, content } = oldModel;
	const { filterConfiguration, ...rest } = content.configuration;

	if (!filterConfiguration) {
		return { header, content: { ...content, configuration: { ...rest } } };
	}

	const { fieldIDs, ...restFilterConfiguration } = filterConfiguration;

	const transformedFilterConfiguration: NewModel.FilterConfiguration = {
		...restFilterConfiguration,
		fields: filterConfiguration?.fieldIDs?.map(transformFieldID),
		sectionData: transformSectionData(filterConfiguration?.sectionData),
		enumeratedStringFilter: transformEnumeratedStringFilter(filterConfiguration?.enumeratedStringFilter)
	};

	return {
		header,
		content: {
			...content,
			configuration: { ...rest, filterConfiguration: transformedFilterConfiguration }
		}
	};
}

function transformFieldID(fieldID: string): NewModel.FieldConfiguration {
	return { fieldId: fieldID };
}

function transformSectionData(
	sectionData: OldModel.FilterConfiguration["sectionData"]
): NewModel.FilterConfiguration["sectionData"] {
	if (!sectionData) {
		return undefined;
	}

	return sectionData.map((sectionItem) => {
		const { fieldIDs, ...restSectionItem } = sectionItem;

		return {
			...restSectionItem,
			fields: sectionItem.fieldIDs.map(transformFieldID)
		};
	});
}

function transformEnumeratedStringFilter(
	enumeratedStringFilter: OldModel.FilterConfiguration["enumeratedStringFilter"]
): NewModel.FilterConfiguration["enumeratedStringFilter"] {
	if (!enumeratedStringFilter) {
		return undefined;
	}

	const { fieldIDs, ...restEnumeratedStringFilter } = enumeratedStringFilter;

	return {
		...restEnumeratedStringFilter,
		fields: enumeratedStringFilter.fieldIDs.map(transformFieldID)
	};
}
