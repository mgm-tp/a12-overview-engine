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

import { fireEvent } from "@testing-library/react";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import { queryByDataRole, queryAllByDataRole, renderFilter, type FilterRenderResult } from "../setup.js";

import { FilterPage } from "./base-filter-page.js";

export class QueryFilterPage extends FilterPage {
	get checkbox(): HTMLInputElement | undefined {
		return queryAllByDataRole<HTMLInputElement>(this.container, DataRoles.Checkbox.Input).at(0);
	}

	get isChecked(): boolean {
		return this.checkbox?.checked ?? false;
	}

	get helperText(): HTMLElement | null {
		return queryByDataRole(this.container, DataRoles.Checkbox.HelperText);
	}

	/** Text of the checkbox helper text, or `null` when no helper text is rendered. */
	get helperTextContent(): string | null {
		return this.helperText?.textContent ?? null;
	}

	/**
	 * `true` when the checkbox points at the helper text via `aria-describedby`,
	 * which is what makes the description reachable for screen readers.
	 */
	get isHelperTextAnnounced(): boolean {
		const helperTextId = this.helperText?.parentElement?.id;

		if (!helperTextId) {
			return false;
		}

		return (this.checkbox?.getAttribute("aria-describedby") ?? "").split(" ").includes(helperTextId);
	}

	async clickCheckbox(): Promise<void> {
		const checkbox = this.checkbox;
		assertCondition(!!checkbox, "Query filter checkbox not found");
		fireEvent.click(checkbox);
	}
}

export async function renderQueryFilter(options: {
	filterItem: OverviewModel.NewFilter.Query.Item;
	locale?: Locale;
}): Promise<{ page: QueryFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new QueryFilterPage(result), ...result };
}
