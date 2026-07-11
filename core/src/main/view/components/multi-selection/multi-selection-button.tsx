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

import { UiStateSelector } from "../../../store/index.js";
import { OverviewModel } from "../../../overview-model.js";
import { LocalizerHooks } from "../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";

import { useClearMultiSelectionDialogVisible } from "./clear-multi-selection-dialog.js";

/** @internal */
export const MultiSelectionButton = React.memo(function MultiSelectionButton() {
	const expandedMultiSelection = useOverviewEngineState(UiStateSelector.expandedMultiSelection());
	const onMultiSelectionButtonClick = useOverviewEngineContext(
		(context) => context.eventHandlers.onMultiSelectionButtonClick
	);

	const overviewModel = useOverviewEngineContext((context) => context.overviewModel);
	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const onMultiSelectionClear = useOverviewEngineContext((context) => context.eventHandlers.onMultiSelectionClear);
	const ClearMultiSelectionDialog = useOverviewEngineContext(
		(context) => context.componentMap.ClearMultiSelectionDialog
	);
	const Button = useOverviewEngineContext((context) => context.widgetMap.Button);
	const Icon = useOverviewEngineContext((context) => context.widgetMap.Icon);
	const onLatestSelectedDocumentIdChange = useOverviewEngineContext(
		(context) => context.eventHandlers.onLatestSelectedDocumentIdChange
	);
	const onLatestSelectedDocumentIdsChange = useOverviewEngineContext(
		(context) => context.eventHandlers.onLatestSelectedDocumentIdsChange
	);

	const [showDialog, setShowDialog] = React.useState(false);
	const isHidden = React.useMemo(
		() =>
			overviewModel.content.configuration.multiSelection?.collapseOption ===
			OverviewModel.MultiSelection.CollapseOption.NON_COLLAPSIBLE,
		[overviewModel.content.configuration.multiSelection?.collapseOption]
	);

	const localizedResource = LocalizerHooks.useLocalizedResource();
	const title = React.useMemo(() => {
		const key = expandedMultiSelection ? "collapseTitle" : "expandTitle";

		return localizedResource(RESOURCE_KEYS.overviewEngine.multiSelection.multiSelectionButton[key]);
	}, [expandedMultiSelection, localizedResource]);

	const onConfirmDialog = React.useCallback(() => {
		onMultiSelectionClear?.();
		setShowDialog(false);
		onMultiSelectionButtonClick?.();
	}, [onMultiSelectionButtonClick, onMultiSelectionClear]);

	const onCancelDialog = React.useCallback(() => setShowDialog(false), []);

	const shouldShowClearMultiSelectionDialog = useClearMultiSelectionDialogVisible();

	const onClick = React.useCallback(() => {
		if (!expandedMultiSelection) {
			return onMultiSelectionButtonClick?.();
		}

		if (!showDialog && shouldShowClearMultiSelectionDialog) {
			return setShowDialog(true);
		}

		onMultiSelectionClear?.();
		onLatestSelectedDocumentIdChange?.({ latestSelectedDocumentId: null });
		onLatestSelectedDocumentIdsChange?.({ latestSelectedDocumentIds: null });
		onMultiSelectionButtonClick?.();
	}, [
		expandedMultiSelection,
		showDialog,
		shouldShowClearMultiSelectionDialog,
		onMultiSelectionClear,
		onLatestSelectedDocumentIdChange,
		onLatestSelectedDocumentIdsChange,
		onMultiSelectionButtonClick
	]);

	if (isHidden) {
		return null;
	}

	return (
		<>
			<Button
				key="multiSelectionButton"
				secondary
				icon={<Icon>library_add</Icon>}
				title={title}
				disabled={disabled}
				onClick={onClick}
			/>
			{showDialog && <ClearMultiSelectionDialog onConfirm={onConfirmDialog} onCancel={onCancelDialog} />}
		</>
	);
});
