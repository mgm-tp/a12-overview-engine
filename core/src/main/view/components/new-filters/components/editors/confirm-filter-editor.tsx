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

import { EmptyFilter } from "../utilities/empty-filter.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import type { ConfirmFilterState } from "../../../../../store/index.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { useOverviewEngineContext } from "../../../../context/overview-engine-context.js";

const t = RESOURCE_KEYS.overviewEngine.newFilter.setting;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface ConfirmFilterEditorProps {
	readonly state: ConfirmFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const ConfirmFilterEditor: FC<ConfirmFilterEditorProps> = memo(function ConfirmFilterEditor({ state }) {
	const Checkbox = useOverviewEngineContext((c) => c.widgetMap.Checkbox);
	const onValueChange = useDispatchFilterOptions<ConfirmFilterState>(state.model.id);
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const { empty } = state.options;

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	return (
		<Checkbox
			checked={!!state.options.criteria}
			onChange={(newValue) => onValueChange({ criteria: newValue || null })}
			label={localizedResource(t.yes)}
		/>
	);
});
