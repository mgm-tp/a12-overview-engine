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

import { expect } from "vitest";
import { fireEvent, queryByText } from "@testing-library/react";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewModel } from "../../../../../main/overview-model.js";
import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";

import { assertInputs } from "../assertions.js";
import { renderFilter, getByDataRole, queryAllByDataRole, type FilterRenderResult } from "../setup.js";

import { FilterPage } from "./base-filter-page.js";

export class NumberFilterPage extends FilterPage {
	get rangeInputContainers(): HTMLElement[] {
		return queryAllByDataRole(this.container, "range-filter-input");
	}

	get fromInput(): HTMLInputElement | undefined {
		return this.getInputByLabel("From");
	}

	get toInput(): HTMLInputElement | undefined {
		return this.getInputByLabel("To");
	}

	get exactInput(): HTMLInputElement | undefined {
		return this.getInputByLabel("Exact");
	}

	get fromValue(): string {
		return this.fromInput?.value ?? "";
	}

	get toValue(): string {
		return this.toInput?.value ?? "";
	}

	get exactValue(): string {
		return this.exactInput?.value ?? "";
	}

	get isEmptyMode(): boolean {
		return this.emptyInput !== undefined;
	}

	get errorMessage(): string | null {
		const errorElement = queryAllByDataRole(this.container, DataRoles.Error.Text)[0];

		return errorElement?.textContent ?? null;
	}

	get hasError(): boolean {
		return queryAllByDataRole(this.container, DataRoles.Error.Text).length > 0;
	}

	getInputByLabel(label: string): HTMLInputElement | undefined {
		for (const container of this.rangeInputContainers) {
			if (queryByText(container, label)) {
				return getByDataRole<HTMLInputElement>(container, DataRoles.TextField.Input);
			}
		}

		return undefined;
	}

	assertInputs<T extends string>(inputs: { label: T; value: string }[] | null): Record<T, HTMLInputElement> {
		return assertInputs(this.container, inputs);
	}

	assertError(expectedMessage: string): void {
		const errorElement = getByDataRole(this.container, DataRoles.Error.Text);
		expect(errorElement.textContent).toBe(expectedMessage);
	}

	assertNoError(): void {
		expect(queryAllByDataRole(this.container, DataRoles.Error.Text).length).toBe(0);
	}

	async setFromValue(value: string): Promise<void> {
		const input = this.fromInput;
		assertCondition(!!input, "'From' input not found");
		fireEvent.change(input, { target: { value } });
		fireEvent.blur(input);
	}

	async setToValue(value: string): Promise<void> {
		const input = this.toInput;
		assertCondition(!!input, "'To' input not found");
		fireEvent.change(input, { target: { value } });
		fireEvent.blur(input);
	}

	async setExactValue(value: string): Promise<void> {
		const input = this.exactInput;
		assertCondition(!!input, "'Exact' input not found");
		fireEvent.change(input, { target: { value } });
		fireEvent.blur(input);
	}

	async setRange(from: string, to: string): Promise<void> {
		await this.setFromValue(from);
		await this.setToValue(to);
	}
}

export async function renderNumberFilter(options: {
	filterItem: OverviewModel.NewFilter.Number.Item;
}): Promise<{ page: NumberFilterPage } & FilterRenderResult> {
	const result = await renderFilter(options);

	return { page: new NumberFilterPage(result), ...result };
}
