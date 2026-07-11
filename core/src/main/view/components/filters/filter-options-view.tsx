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

import type * as React from "react";

import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { FilterSelectorProps } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewEngineApi } from "../../api.js";

export namespace Filter {
	export interface FilterData extends FilterSelectorProps.FilterData {
		readonly path: ModelPath;
		readonly modelId?: string;
		filterOptions?: OverviewEngineApi.Filter.Options;
		uiValue?: FilterOptionsView.UiValueType;
	}

	export interface SectionData {
		readonly id: string;
		readonly label: string;
		readonly filters: FilterData[];
	}

	export namespace SectionData {
		export function isAssignableFrom(data: object): data is SectionData {
			return (data as SectionData).filters !== undefined;
		}
	}

	export type Filters = (FilterData | SectionData)[];

	/**
	 * Define common props for FilterBar and FilterSelector, since they both contains list of filters
	 */
	export interface FilterListPropType {
		onFilterChange(filters: OverviewEngineApi.FilterMap): void;
	}
}

/**
 * Namespace for the OptionsView
 */
export namespace FilterOptionsView {
	export interface PropsType {
		readonly viewName: React.ReactNode;
		readonly path: ModelPath;
		readonly modelId?: string;
		readonly ariaLevel?: number;
		readonly hideEmptyValueOption?: boolean;

		/**
		 * @param id optional, if not provided, the onChange callback will only apply the change to current filter
		 *                     if provided, the onChange callback will apply the change to specific filter (useful with referenced filter)
		 */
		onChange?(filterOptions: OverviewEngineApi.Filter.Options, uiValue?: UiValueType, id?: string): void;
	}

	export interface UiValueType {
		readonly undefinedMatch?: boolean;
	}
}
