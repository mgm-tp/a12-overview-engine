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

import { DateFilterOptionsView } from "./options-views/date-filter-options-view.js";
import { TimeFilterOptionsView } from "./options-views/time-filter-options-view.js";
import { NumberFilterOptionsView } from "./options-views/number-filter-options-view.js";
import { StringFilterOptionsView } from "./options-views/string-filter-options-view.js";
import { BooleanFilterOptionsView } from "./options-views/boolean-filter-options-view.js";
import { ConfirmFilterOptionsView } from "./options-views/confirm-filter-options-view.js";
import { DateTimeFilterOptionsView } from "./options-views/date-time-filter-options-view.js";
import { DateRangeFilterOptionsView } from "./options-views/date-range-filter-options-view.js";
import { EnumerationFilterOptionsView } from "./options-views/enumeration-filter-options-view.js";
import { CustomFieldFilterOptionsView } from "./options-views/custom-field-filter-options-view.js";
import { MultiSelectFilterOptionsView } from "./options-views/multi-select-filter-options-view.js";
import { DateFragmentFilterOptionsView } from "./options-views/date-fragment-filter-options-view.js";
import { EnumeratedStringFilterOptionsView } from "./options-views/enumerated-string-filter-options-view.js";

export interface FilterOptionsViews {
	readonly StringFilterOptionsView: React.ComponentType<StringFilterOptionsView.Props>;
	readonly EnumeratedStringFilterOptionsView: React.ComponentType<EnumeratedStringFilterOptionsView.Props>;
	readonly CustomFieldFilterOptionsView: React.ComponentType<CustomFieldFilterOptionsView.Props>;
	readonly EnumerationFilterOptionsView: React.ComponentType<EnumerationFilterOptionsView.Props>;
	readonly MultiSelectFilterOptionsView: React.ComponentType<MultiSelectFilterOptionsView.Props>;
	readonly BooleanFilterOptionsView: React.ComponentType<BooleanFilterOptionsView.Props>;
	readonly ConfirmFilterOptionsView: React.ComponentType<ConfirmFilterOptionsView.Props>;
	readonly NumberFilterOptionsView: React.ComponentType<NumberFilterOptionsView.Props>;
	readonly DateFilterOptionsView: React.ComponentType<DateFilterOptionsView.Props>;
	readonly DateFragmentFilterOptionsView: React.ComponentType<DateFragmentFilterOptionsView.Props>;
	readonly DateTimeFilterOptionsView: React.ComponentType<DateTimeFilterOptionsView.Props>;
	readonly DateRangeFilterOptionsView: React.ComponentType<DateRangeFilterOptionsView.Props>;
	readonly TimeFilterOptionsView: React.ComponentType<TimeFilterOptionsView.Props>;
}

export namespace FilterOptionsViews {
	export const defaultInstance: FilterOptionsViews = {
		StringFilterOptionsView,
		EnumeratedStringFilterOptionsView,
		CustomFieldFilterOptionsView,
		EnumerationFilterOptionsView,
		MultiSelectFilterOptionsView,
		BooleanFilterOptionsView,
		ConfirmFilterOptionsView,
		NumberFilterOptionsView,
		DateFilterOptionsView,
		DateFragmentFilterOptionsView,
		DateTimeFilterOptionsView,
		DateRangeFilterOptionsView,
		TimeFilterOptionsView
	};
}
