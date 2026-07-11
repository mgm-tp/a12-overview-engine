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

import { memo, type FC, useMemo, useCallback } from "react";

import { Multiselect, type MultiselectProps } from "@com.mgmtp.a12.widgets/widgets-core";

import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../../services/localization/index.js";

import type { MultiSelectListProps } from "./multi-select-list.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const MultiSelectCompact: FC<MultiSelectListProps> = memo(function MultiSelectCompact(props) {
	const { onValuesChange, options } = props;
	const localizedResource = LocalizerHooks.useLocalizedResource();

	const items: MultiselectProps.Item[] = useMemo(
		() => options.map((option) => ({ ...option, id: option.value })),
		[options]
	);

	const handleChange = useCallback(
		(selectedItems: MultiselectProps.Item[]) => {
			onValuesChange(selectedItems.map((item) => item.id));
		},
		[onValuesChange]
	);

	return (
		<Multiselect
			id={`${props.id}-multiselect`}
			placeholder={localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel)}
			selectAllText={localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.selectDeselectAllCheckboxLabel)}
			onChange={handleChange}
			items={items}
		/>
	);
});
