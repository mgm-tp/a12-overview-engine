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

import { TimeFilterState } from "../../../../../store/index.js";
import type { SegmentOption } from "../../../../../store/index.js";
import { PeriodCriteria } from "../../../../../store/internal/filter-controllers/criteria.js";
import { useOverviewEngineInternalContext } from "../../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../../hooks/localizer-hooks.js";
import { DateTimeUtils } from "../../../filters/options-views/date-time-utils.js";
import { useDispatchFilterOptions } from "../../hooks/use-filter-callbacks.js";
import { useFilterSelectors } from "../../hooks/use-filter-selectors.js";
import { TimePickerAdapter } from "../adapters/time-picker-adapter.js";
import { useTargetModelId } from "../filter-label-resolvers.js";
import { EmptyFilter } from "../utilities/empty-filter.js";
import { RangeFilterEditorTemplate } from "../utilities/range-filter-editor-template.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface TimeFilterEditorProps {
	readonly state: TimeFilterState;
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const TimeFilterEditor: FC<TimeFilterEditorProps> = memo(function TimeFilterEditor({ state }) {
	const onFilterOptionsChange = useDispatchFilterOptions<TimeFilterState>(state.model.id);
	const converter = useOverviewEngineInternalContext((context) => context.converter);
	const modelId = useTargetModelId(state);
	const { localizer } = useContext(LocalizerContext);

	const { empty, criteria, selectedRange } = state.options;
	const range = selectedRange;
	const { resetCounter } = state;

	const path = useMemo(() => ModelPath.fromString(state.fieldPath ?? ""), [state.fieldPath]);

	const parseInput = useCallback(
		(input: string): TimeFilterState.InputState => {
			if (!input) {
				return TimeFilterState.DefaultInputState;
			}

			const parsedValue = converter.parseValue(path, input, undefined, modelId);

			if (parsedValue.error) {
				return { input, value: null, error: localizer(...parsedValue.error) ?? null };
			}

			if (!(parsedValue.value instanceof Date)) {
				throw new Error("Parsed value is not a Date instance");
			}

			const formattedInput = converter.formatValue(path, parsedValue.value, undefined, modelId);

			return { input: formattedInput, value: parsedValue.value, error: null };
		},
		[converter, localizer, path, modelId]
	);

	const filterStateSelectors = useFilterSelectors();
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const generalError = useMemo(() => filterStateSelectors.toGeneralError(state), [filterStateSelectors, state]);
	const errorMessage = useMemo(
		() => (generalError ? localizedResource(generalError.key, generalError.args) : undefined),
		[generalError, localizedResource]
	);
	const localizedFieldFormat = LocalizerHooks.useLocalizedDateFieldFormat();

	const renderInput = useCallback(
		(segment: SegmentOption) => {
			const lens = PeriodCriteria.slotLens<"default", { default: TimeFilterState.InputState }, "default">(
				"default",
				range,
				segment
			);
			const inputState = lens.get(criteria);

			const onStateChange = (newState: TimeFilterState.InputState) =>
				onFilterOptionsChange({ criteria: lens.set(newState)(criteria) });
			const timeFormatter = (time: Date | undefined) => DateTimeUtils.format(converter, path, time, modelId);

			if (!inputState) {
				return null;
			}

			return (
				<TimePickerAdapter
					key={resetCounter}
					value={inputState.value ?? undefined}
					errorMessage={inputState.error ?? undefined}
					onDateChange={(time) =>
						onStateChange(
							time === null
								? TimeFilterState.DefaultInputState
								: { value: time, input: timeFormatter(time), error: null }
						)
					}
					onValidate={(newInput) => onStateChange(parseInput(newInput))}
					timeFormatter={timeFormatter}
					timeConverter={(text) => parseInput(text).value ?? undefined}
					fieldFormatString={localizedFieldFormat(path, modelId)}
				/>
			);
		},
		[range, criteria, resetCounter, localizedFieldFormat, path, modelId, onFilterOptionsChange, converter, parseInput]
	);

	if (empty.enabled && empty.value) {
		return <EmptyFilter />;
	}

	return <RangeFilterEditorTemplate overallErrorMessage={errorMessage} renderInput={renderInput} range={range} />;
});
