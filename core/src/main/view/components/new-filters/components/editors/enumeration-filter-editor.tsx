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

import { memo, type FC, useMemo, useContext, useCallback } from "react";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

import type { DocumentModelTypedField } from "../../../../../models/index.js";
import type { EnumerationFilterState } from "../../../../../store/index.js";
import type { MultiSelectFilterState } from "../../../../../store/index.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { EmptyFilter } from "../utilities/empty-filter.js";
import { MultiSelectCompact } from "../utilities/multi-select-compact.js";
import { MultiSelectList } from "../utilities/multi-select-list.js";
import type { FilterListOption } from "../utilities/use-organized-values.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface EnumerationFilterEditorProps {
	readonly state: EnumerationFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const EnumerationFilterEditor: FC<EnumerationFilterEditorProps> = memo(function EnumerationFilterEditor({
	state
}) {
	const { empty } = state.options;
	const { viewMode } = state.model.options;

	const onOptionsChange = useDispatchFilterOptions<MultiSelectFilterState>(state.model.id);
	const options = useEnumerationValues({
		enumField: state.element,
		modelPath: ModelPath.fromString(state.fieldPath ?? ""),
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

export function useEnumerationValues(params: {
	enumField: DocumentModelTypedField<DocumentModel.EnumerationType>;
	modelPath: ModelPath;
	criteria: readonly string[];
	pinnedValues: readonly string[];
	subModel?: string;
}): FilterListOption[] {
	const { enumField, modelPath, criteria, pinnedValues, subModel } = params;
	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue();
	const { locale } = useContext(LocalizerContext);

	return useMemo(() => {
		return enumField.fieldType.values
			.map(({ value }) => ({
				value,
				label: localizedFieldValue(modelPath, value, subModel),
				pinned: pinnedValues.includes(value),
				selected: criteria.includes(value)
			}))
			.sort((option1, option2) => {
				if (option1.pinned && !option2.pinned) {
					return -1;
				}

				if (!option1.pinned && option2.pinned) {
					return 1;
				}

				if (option1.pinned && option2.pinned) {
					return pinnedValues.indexOf(option1.value) - pinnedValues.indexOf(option2.value);
				}

				return option1.label.localeCompare(option2.label, locale.language);
			});
	}, [criteria, enumField.fieldType.values, locale.language, localizedFieldValue, modelPath, pinnedValues, subModel]);
}
