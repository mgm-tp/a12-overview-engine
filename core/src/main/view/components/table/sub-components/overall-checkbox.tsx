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

import * as React from "react";

import { pickRowState } from "../../../utils.js";
import { UiStateSelector } from "../../../../store/index.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

export namespace OverallCheckbox {
	export interface Props {}
}

/** @internal */
export const OverallCheckbox = React.memo(function OverallCheckbox() {
	const data = useOverviewEngineContext((context) => context.data);
	const rowState = useOverviewEngineState(UiStateSelector.rowState());
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const onOverallMultiSelectionButtonClick = useOverviewEngineContext(
		(context) => context.eventHandlers.onOverallMultiSelectionButtonClick
	);
	const onLatestSelectedDocumentIdChange = useOverviewEngineContext(
		(context) => context.eventHandlers.onLatestSelectedDocumentIdChange
	);
	const onLatestSelectedDocumentIdsChange = useOverviewEngineContext(
		(context) => context.eventHandlers.onLatestSelectedDocumentIdsChange
	);
	const CheckboxIndeterminate = useOverviewEngineContext((context) => context.widgetMap.CheckboxIndeterminate);

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const title = React.useMemo(
		() => localizedResource(RESOURCE_KEYS.overviewEngine.multiSelection.overallCheckboxTitle),
		[localizedResource]
	);

	const selected: boolean | "mixed" = React.useMemo(() => {
		const currentSelectedRows = data.filter((row) => row && pickRowState(rowState, row)?.selected).length;

		if (currentSelectedRows === 0) {
			return false;
		}

		if (currentSelectedRows === data.length) {
			return true;
		}

		return "mixed";
	}, [data, rowState]);

	const documentsSelection = React.useMemo(() => {
		const nextSelected = selected !== true;

		return data.flatMap((row) => (row?.id ? [{ documentId: row.id, linkId: row.linkId, selected: nextSelected }] : []));
	}, [data, selected]);

	const onChange = React.useCallback(() => {
		onOverallMultiSelectionButtonClick?.(documentsSelection);
		onLatestSelectedDocumentIdChange?.({ latestSelectedDocumentId: null });
		onLatestSelectedDocumentIdsChange?.({ latestSelectedDocumentIds: null });
	}, [
		documentsSelection,
		onOverallMultiSelectionButtonClick,
		onLatestSelectedDocumentIdChange,
		onLatestSelectedDocumentIdsChange
	]);

	return (
		<CheckboxIndeterminate
			title={title}
			label={title}
			disabled={disabled}
			hideLabel
			checked={selected}
			onChange={onChange}
		/>
	);
});
