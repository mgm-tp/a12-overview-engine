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

import { memo, type FC, useCallback } from "react";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";

import { MultiSelectModelUtils } from "../../../../../models/internal/shared.js";
import type { MultiSelectFilterState } from "../../../../../store/index.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { EmptyFilter } from "../utilities/empty-filter.js";
import { MultiSelectCompact } from "../utilities/multi-select-compact.js";
import { MultiSelectList } from "../utilities/multi-select-list.js";

import { useEnumerationValues } from "./enumeration-filter-editor.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface MultiSelectFilterEditorProps {
	readonly state: MultiSelectFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const MultiSelectFilterEditor: FC<MultiSelectFilterEditorProps> = memo(function MultiSelectFilterEditor({
	state
}) {
	const { empty } = state.options;
	const { viewMode } = state.model.options;

	const onOptionsChange = useDispatchFilterOptions<MultiSelectFilterState>(state.model.id);
	const enumField = MultiSelectModelUtils.getField(state.element);
	const options = useEnumerationValues({
		enumField,
		modelPath: [...ModelPath.fromString(state.fieldPath ?? ""), { elementName: enumField.name }],
		criteria: state.options.criteria,
		pinnedValues: state.model.options.pinnedValues ?? [],
		subModel: state.model.options.subModel
	});

	const onValuesChange = useCallback((criteria: string[]) => onOptionsChange({ criteria }), [onOptionsChange]);

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	switch (viewMode) {
		case "compact":
			return <MultiSelectCompact id={state.model.id} options={options} onValuesChange={onValuesChange} />;
		case "list":
			return <MultiSelectList id={state.model.id} options={options} onValuesChange={onValuesChange} />;
	}
});
