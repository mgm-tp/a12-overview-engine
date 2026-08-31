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

import { fireEvent, queryByText } from "@testing-library/react";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";
import type { OverviewModel } from "../../../../../main/overview-model.js";
import { assertCheckboxes } from "../assertions.js";
import { renderFilter, getByDataRole, queryAllByDataRole, type FilterRenderResult } from "../setup.js";

import { FilterPage } from "./base-filter-page.js";

export class ConfirmFilterPage extends FilterPage {
	get checkboxInputs(): HTMLInputElement[] {
		return queryAllByDataRole<HTMLInputElement>(this.container, DataRoles.Checkbox.Input);
	}

	get checkboxControls(): HTMLElement[] {
		return queryAllByDataRole(this.container, DataRoles.Checkbox.Control);
	}

	get yesCheckbox(): HTMLInputElement | undefined {
		return this.getCheckboxByLabel("Yes");
	}

	get isChecked(): boolean {
		return this.yesCheckbox?.checked ?? false;
	}

	get isShowingCheckbox(): boolean {
		return this.checkboxInputs.length > 0;
	}

	get isEmptyMode(): boolean {
		return this.emptyInput !== undefined;
	}

	getCheckboxByLabel(label: string): HTMLInputElement | undefined {
		for (const control of this.checkboxControls) {
			if (queryByText(control, label)) {
				return getByDataRole<HTMLInputElement>(control, DataRoles.Checkbox.Input);
			}
		}

		return undefined;
	}

	assertCheckbox(options: { label: string; checked?: boolean }): HTMLInputElement {
		const result = assertCheckboxes(this.container, [options]);

		return result[options.label as keyof typeof result];
	}

	async clickYes(): Promise<void> {
		const checkbox = this.yesCheckbox;
		assertCondition(!!checkbox, "'Yes' checkbox not found");
		fireEvent.click(checkbox);
	}
}

export async function renderConfirmFilter(options: {
	filterItem: OverviewModel.NewFilter.Confirm.Item;
}): Promise<{ page: ConfirmFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new ConfirmFilterPage(result), ...result };
}
