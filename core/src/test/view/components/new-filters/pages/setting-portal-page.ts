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

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { assertCondition } from "../../../../../main/client-extensions/internal/utils/assertion.js";

import { getByDataRole, queryAllByDataRole } from "../setup.js";

export class SettingPortalPage {
	constructor(public readonly portal: HTMLElement) {}

	section(label: string) {
		return queryAllByDataRole(this.portal, "typography-body").find((el) => {
			return getByDataRole(el, "label").textContent === label;
		});
	}

	empty() {
		return this.toggleSection("Empty");
	}

	invert() {
		return this.toggleSection("Invert Result");
	}

	range() {
		return this.toggleSection("Range");
	}

	period() {
		return this.radioGroupSection("Period");
	}

	match() {
		const section = this.section("Match");

		if (!section) {
			return undefined;
		}

		return new MatchSectionPage(section);
	}

	public toggleSection(label: string) {
		const section = this.section(label);

		if (!section) {
			return undefined;
		}

		return new TogglePage(section);
	}

	public radioGroupSection(label: string) {
		const section = this.section(label);

		if (!section) {
			return undefined;
		}

		return new RadioGroupPage(section);
	}
}

export class MatchSectionPage {
	constructor(public readonly section: HTMLElement) {}

	case(): TogglePage | undefined {
		return this.findLabeledToggle("Case");
	}

	exact(): TogglePage | undefined {
		return this.findLabeledToggle("Exact");
	}

	private findLabeledToggle(label: string): TogglePage | undefined {
		const toggleGroups = queryAllByDataRole(this.section, DataRoles.Toggle.Wrapper);

		for (const group of toggleGroups) {
			const labelElement = group.previousElementSibling;

			if (labelElement?.textContent?.trim() === label) {
				return new TogglePage(group.parentElement ?? group);
			}
		}

		return undefined;
	}
}

export class TogglePage {
	constructor(public readonly toggle: HTMLElement) {}

	get items(): HTMLButtonElement[] {
		return queryAllByDataRole(this.toggle, DataRoles.Toggle.Item) as HTMLButtonElement[];
	}

	get selectedItem(): HTMLButtonElement | undefined {
		const selected = this.items.find((item) => item.getAttribute("aria-pressed") === "true");
		expect(selected).toBeDefined();

		return selected;
	}

	get itemLabels(): string[] {
		return this.items.map((item) => item.textContent?.trim() || "");
	}

	public item(label: string) {
		const item = this.items.find((item) => (item.textContent?.trim() || "") === label);

		expect(item).toBeDefined();
		assertCondition(!!item);

		return item as HTMLButtonElement;
	}

	public itemByDataRole(role: string) {
		const item = this.items.find((item) => item.querySelector(`[data-role="${role}"]`) !== null);

		expect(item).toBeDefined();
		assertCondition(!!item);

		return item as HTMLButtonElement;
	}
}

export class RadioGroupPage {
	constructor(public readonly section: HTMLElement) {}

	private get radioControls(): HTMLElement[] {
		return queryAllByDataRole(this.section, "radio-control") as HTMLElement[];
	}

	private get radioInputs(): HTMLInputElement[] {
		return queryAllByDataRole(this.section, "radio-input") as HTMLInputElement[];
	}

	get selectedItem(): HTMLInputElement | undefined {
		return this.radioInputs.find((input) => input.checked);
	}

	get itemLabels(): string[] {
		return this.radioControls.map((control) => {
			const label = queryAllByDataRole(control, "radio-label")[0];

			return label?.textContent?.trim() || "";
		});
	}

	public item(label: string): HTMLInputElement {
		for (const control of this.radioControls) {
			const labelEl = queryAllByDataRole(control, "radio-label")[0];

			if (labelEl?.textContent?.trim() === label) {
				const input = queryAllByDataRole(control, "radio-input")[0] as HTMLInputElement;
				expect(input).toBeDefined();
				assertCondition(!!input);

				return input;
			}
		}

		throw new Error(`Radio item with label "${label}" not found. Available: ${this.itemLabels.join(", ")}`);
	}
}
