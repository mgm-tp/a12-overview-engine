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
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import { TextField, BufferedInput, HTMLInputAdapter } from "@com.mgmtp.a12.widgets/widgets-core";

import { EmptyFilter } from "../utilities/empty-filter.js";
import { NumberFilterState } from "../../../../../store/index.js";
import type { SegmentOption } from "../../../../../store/index.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { useFilterSelectors } from "../../hooks/use-filter-selectors.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { RangeFilterEditorTemplate } from "../utilities/range-filter-editor-template.js";
import { PeriodCriteria } from "../../../../../store/internal/filter-controllers/criteria.js";
import { useLocalizedLabels } from "../../../filters/options-views/date-time-common-hooks.js";
import { useOverviewEngineInternalContext } from "../../../../context/overview-engine-internal-context.js";

const WrappedTextLineStateless = BufferedInput(HTMLInputAdapter(TextField));

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface NumberFilterEditorProps {
	readonly state: NumberFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const NumberFilterEditor: FC<NumberFilterEditorProps> = memo(function NumberFilterEditor({ state }) {
	const range = state.options.selectedRange;
	const onValueChange = useDispatchFilterOptions<NumberFilterState>(state.model.id);
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const { localizer } = useContext(LocalizerContext);
	const { singleInputLabel } = useLocalizedLabels();
	const { empty } = state.options;

	const parseInput = useCallback(
		(input: string): NumberFilterState.InputState => {
			if (!input) {
				return NumberFilterState.DefaultInputState;
			}

			const parsedValue = converter.parseValue(
				ModelPath.fromString(state.fieldPath ?? ""),
				input,
				undefined,
				state.model.options.subModel
			);

			if (parsedValue.error) {
				return { input, value: null, error: localizer(...parsedValue.error) ?? null };
			}

			const numericValue = Number(String(parsedValue.value));
			const formattedInput = converter.formatValue(
				ModelPath.fromString(state.fieldPath ?? ""),
				numericValue,
				undefined,
				state.model.options.subModel
			);

			return { input: formattedInput, value: numericValue, error: null };
		},
		[converter, localizer, state.fieldPath, state.model.options.subModel]
	);

	const filterStateSelectors = useFilterSelectors();
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const generalError = useMemo(() => filterStateSelectors.toGeneralError(state), [filterStateSelectors, state]);
	const errorMessage = useMemo(
		() => (generalError ? localizedResource(generalError.key, generalError.args) : undefined),
		[generalError, localizedResource]
	);

	const formatPresetValue = useCallback(
		(inputState: NumberFilterState.InputState): string => {
			if (inputState.input !== "") {
				return inputState.input;
			}

			if (inputState.value === null) {
				return "";
			}

			return converter.formatValue(
				ModelPath.fromString(state.fieldPath ?? ""),
				inputState.value,
				undefined,
				state.model.options.subModel
			);
		},
		[converter, state.fieldPath, state.model.options.subModel]
	);

	const renderInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<"default", { default: NumberFilterState.InputState }, "default">(
				"default",
				range,
				segment
			);
			const inputState = lens.get(state.options.criteria);

			if (!inputState) {
				return null;
			}

			return (
				<WrappedTextLineStateless
					errorMessage={inputState.error}
					error={!!inputState.error}
					placeholder={singleInputLabel}
					onValueSubmit={(input) =>
						onValueChange({
							criteria: lens.set(parseInput(input ?? ""))(state.options.criteria)
						})
					}
					value={formatPresetValue(inputState)}
				/>
			);
		},
		[onValueChange, parseInput, formatPresetValue, range, singleInputLabel, state.options.criteria]
	);

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	return <RangeFilterEditorTemplate overallErrorMessage={errorMessage} renderInput={renderInput} range={range} />;
});
