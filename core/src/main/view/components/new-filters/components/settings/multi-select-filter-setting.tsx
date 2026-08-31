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

import { memo, type FC } from "react";

import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import type { MultiSelectFilterState } from "../../../../../store/index.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { ToggleSetting } from "../utilities/typed-toggle.js";
import { BooleanToggleSetting } from "../utilities/typed-toggle.js";

import { FilterSettingSection } from "./filter-setting-section.js";

const t = RESOURCE_KEYS.overviewEngine.newFilter.setting;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface MultiSelectFilterSettingProps {
	readonly state: MultiSelectFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const MultiSelectFilterSetting: FC<MultiSelectFilterSettingProps> = memo(function MultiSelectFilterSetting({
	state
}) {
	const { empty, invert, matchOperator } = state.options;

	const onOptionsChange = useDispatchFilterOptions<MultiSelectFilterState>(state.model.id);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const isEmptyActive = empty.enabled && empty.value;

	return (
		<>
			{empty.enabled && (
				<FilterSettingSection label={localizedResource(t.empty)}>
					<BooleanToggleSetting
						selectedValue={empty.value}
						onChange={(value) => onOptionsChange({ empty: { ...empty, value } })}
					/>
				</FilterSettingSection>
			)}

			{matchOperator.enabled && !isEmptyActive && (
				<FilterSettingSection label={localizedResource(t.match)}>
					<ToggleSetting
						items={[
							{ value: "or" as const, label: localizedResource(t.any) },
							{ value: "and" as const, label: localizedResource(t.all) }
						]}
						selectedValue={matchOperator.value}
						onChange={(value) => onOptionsChange({ matchOperator: { ...matchOperator, value } })}
					/>
				</FilterSettingSection>
			)}

			{invert.enabled && (
				<FilterSettingSection label={localizedResource(t.invertResult)}>
					<BooleanToggleSetting
						selectedValue={invert.value}
						onChange={(value) => onOptionsChange({ invert: { ...invert, value } })}
					/>
				</FilterSettingSection>
			)}
		</>
	);
});
