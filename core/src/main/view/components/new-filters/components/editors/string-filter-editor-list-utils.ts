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

import type { FilterListOption } from "../utilities/use-organized-values.js";

function offPageExtras(candidates: readonly string[], selectedValues: readonly string[]): readonly string[] {
	const candidateSet = new Set(candidates);

	return selectedValues.filter((v) => !candidateSet.has(v));
}

/**
 * Build the visible option list for the list-mode editor.
 *
 * - No active keyword: render off-page selections (`selected \ candidates`)
 *   at the top, in `selectedValues` order, then the candidates partitioned
 *   applied-first. Off-page picks are surfaced where they are most
 *   discoverable so the user can see (and untick) what they have selected
 *   even when those values live on a backend page that has not been loaded.
 * - Active keyword: render candidates only (legacy behavior). Non-matching
 *   selections stay committed in the store and re-surface once the keyword
 *   is cleared.
 *
 * Within the candidates partition, applied values come first, then the
 * remaining candidates in backend response order.
 */
export function buildVisibleOptions(
	candidates: readonly string[],
	appliedSelectedValues: readonly string[],
	selectedValues: readonly string[],
	hasKeyword: boolean
): FilterListOption[] {
	const appliedSet = new Set(appliedSelectedValues);
	const selectedSet = new Set(selectedValues);
	const extras = hasKeyword ? [] : offPageExtras(candidates, selectedValues);

	const ordered = [
		...extras,
		...candidates.filter((value) => appliedSet.has(value)),
		...candidates.filter((value) => !appliedSet.has(value))
	];

	return ordered.map((value) => ({
		value,
		label: value,
		pinned: false,
		selected: selectedSet.has(value)
	}));
}

/**
 * Merge the user's new visible selection back with hidden selections that
 * were not rendered.
 *
 * With no keyword the rendered set already includes all selections (as
 * off-page extras at the top), so the visible selection is the full intent.
 * With an active keyword, hidden = selected \ candidates and must be merged
 * back so toggles never drop prior picks.
 */
export function mergeHiddenSelections(
	selectedValues: readonly string[],
	candidates: readonly string[],
	visibleValues: readonly string[],
	hasKeyword: boolean
): string[] {
	if (!hasKeyword) {
		return [...visibleValues];
	}

	const candidateSet = new Set(candidates);
	const hidden = selectedValues.filter((v) => !candidateSet.has(v));

	return [...hidden, ...visibleValues];
}
