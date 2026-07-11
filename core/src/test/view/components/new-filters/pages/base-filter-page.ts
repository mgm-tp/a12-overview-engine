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
import { waitFor, fireEvent, queryByText } from "@testing-library/react";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { UiStateSelector } from "../../../../../main/store/index.js";
import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";
import { DefaultFilterStateSelectors } from "../../../../../main/store/internal/selectors/filter-selectors.js";
import { NewFieldBasedFiltering } from "../../../../../main/client-extensions/internal/utils/new-field-based-filtering.js";

import {
	type RangeMode,
	findByDataRole,
	queryByDataRole,
	queryAllByDataRole,
	RANGE_MODE_ICON_ROLE,
	type FilterRenderResult
} from "../setup.js";

import { SettingPortalPage } from "./setting-portal-page.js";

export class FilterPage {
	constructor(protected readonly renderResult: FilterRenderResult) {}

	get container() {
		return this.renderResult.container;
	}

	get operator() {
		const filterState = this.renderResult.store.getState().newFilter;

		if (!filterState) {
			throw new Error("Filter state is undefined");
		}

		const operator = NewFieldBasedFiltering.toOperator(
			filterState,
			{ documentModel: this.renderResult.documentModel, overviewModel: this.renderResult.overviewModel },
			DefaultFilterStateSelectors
		);

		return operator ? [operator] : [];
	}

	get isApplyAllEnabled(): boolean {
		return UiStateSelector.NewFilter.isApplicable(DefaultFilterStateSelectors)(this.renderResult.store.getState());
	}

	get isResetAllEnabled(): boolean {
		return UiStateSelector.NewFilter.isFilterSelectorResettable(DefaultFilterStateSelectors)(
			this.renderResult.store.getState()
		);
	}

	get buttons(): HTMLButtonElement[] {
		return queryAllByDataRole<HTMLButtonElement>(this.container, DataRoles.Button);
	}

	get textInputs(): HTMLInputElement[] {
		return queryAllByDataRole<HTMLInputElement>(this.container, DataRoles.TextField.Input);
	}

	get settingsButton(): HTMLButtonElement | undefined {
		return this.buttons.find((button) => queryByText(button, "build"));
	}

	get resetButton(): HTMLButtonElement | undefined {
		return this.buttons.filter((button) => queryByText(button, "replay")).at(-1);
	}

	get filterBarItemLabel(): string | null {
		const labelElement = queryByDataRole(this.container, "filter-options");

		return labelElement?.textContent ?? null;
	}

	get emptyInput(): HTMLInputElement | undefined {
		return this.textInputs.find((input) => input.getAttribute("value") === "Empty");
	}

	hasSettings(): boolean {
		return this.settingsButton !== undefined;
	}

	async withSettings(interact: (settings: SettingPortalPage) => Promise<void> | void): Promise<void> {
		const settingButton = this.settingsButton;
		assertCondition(!!settingButton);

		fireEvent.click(settingButton);

		const attachedPortal = await findByDataRole(this.container, DataRoles.AttachedPortal);
		expect(attachedPortal).toBeInTheDocument();

		await interact(new SettingPortalPage(attachedPortal));

		fireEvent.mouseDown(this.container);
		fireEvent.mouseUp(this.container);
		fireEvent.click(this.container);

		await waitFor(() => {
			expect(queryByDataRole(this.container, DataRoles.AttachedPortal)).toBeNull();
		});
	}

	async clickReset(): Promise<void> {
		const resetBtn = this.resetButton;
		assertCondition(!!resetBtn, "Reset button not found");
		fireEvent.click(resetBtn);
	}

	async setEmptySetting(value: "Yes" | "No"): Promise<void> {
		await this.withSettings(async (settings) => {
			const emptySetting = settings.empty();
			expect(emptySetting).toBeDefined();
			assertCondition(!!emptySetting, "Empty toggle not found in settings portal");

			fireEvent.click(emptySetting.item(value));
		});
	}

	async setInvertSetting(value: "Yes" | "No"): Promise<void> {
		await this.withSettings(async (portal) => {
			const invertToggle = portal.invert();
			expect(invertToggle).toBeDefined();
			assertCondition(!!invertToggle, "Invert toggle not found in settings portal");

			fireEvent.click(invertToggle.item(value));
		});
	}

	async setRangeMode(mode: RangeMode): Promise<void> {
		await this.withSettings(async (portal) => {
			const rangeToggle = portal.range();
			expect(rangeToggle).toBeDefined();
			assertCondition(!!rangeToggle, "Range toggle not found in settings portal");

			fireEvent.click(rangeToggle.itemByDataRole(RANGE_MODE_ICON_ROLE[mode]));
		});
	}
}
