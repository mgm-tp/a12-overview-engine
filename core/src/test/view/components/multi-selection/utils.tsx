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

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { OverviewModel } from "../../../../main/overview-model.js";
import type { OverviewEngineApi } from "../../../../main/view/api.js";
import { OverviewEngine } from "../../../../main/view/overview-engine.js";

import { defaultEngineProps } from "../../../basic.spec.js";
import { render, type TestReduxState } from "../../../test-utils.js";
import { noop, type PartialOEInfiniteScrollProps } from "../../../utils.js";

interface MultiSelectionRendererOptions {
	reduxState?: Partial<TestReduxState>;
}

export function setupMultiSelection(
	multiSelection?: OverviewModel.MultiSelection,
	engineProps?: (Partial<OverviewEngine.PaginatedProps> | PartialOEInfiniteScrollProps) & { asBaseElement?: boolean },
	locale?: Locale,
	shortcut?: boolean,
	rendererOptions?: MultiSelectionRendererOptions
) {
	const rightSlotElements: OverviewModel.Element[] = multiSelection
		? [{ type: OverviewModel.ElementType.MULTI_SELECTION }]
		: [];
	const defaultOverviewModel = engineProps?.overviewModel ?? defaultEngineProps.overviewModel;
	const overviewModel: OverviewModel = {
		...defaultOverviewModel,
		content: {
			...defaultOverviewModel.content,
			subHeaderBox: {
				...defaultOverviewModel.content.subHeaderBox,
				rightSlot: [...(defaultOverviewModel.content.subHeaderBox?.rightSlot || []), ...rightSlotElements]
			},
			configuration: {
				...defaultOverviewModel.content.configuration,
				multiSelection
			}
		}
	};
	const eventHandlers = { ...multiSelectionCallbacks, ...engineProps?.eventHandlers };
	const { asBaseElement, ...componentEngineProps } = engineProps ?? {};

	const Component = shortcut ? RowStateWrapper : OverviewEngine;

	return render(
		<Component
			{...defaultEngineProps}
			{...componentEngineProps}
			uiState={{ expandedMultiSelection: true, ...engineProps?.uiState }}
			eventHandlers={eventHandlers}
			overviewModel={overviewModel}
		/>,
		{ asBaseElement, reduxState: rendererOptions?.reduxState },
		locale
	);
}

function RowStateWrapper(props: OverviewEngine.Props) {
	const [rowState, setRowState] = React.useState<OverviewEngineApi.RowState>({});

	const onRowsSelect = React.useCallback((params: { documentId: string; selected: boolean }[]) => {
		setRowState((oldRowState) =>
			params.reduce((newRowState, { documentId, selected }) => {
				return { ...newRowState, [documentId]: { ...newRowState[documentId], selected } };
			}, oldRowState)
		);
	}, []);

	const customEventHandlers = React.useMemo(() => {
		return { ...props.eventHandlers, onRowsSelect };
	}, [onRowsSelect, props.eventHandlers]);

	return <OverviewEngine {...props} uiState={{ ...props.uiState, rowState }} eventHandlers={customEventHandlers} />;
}

export const multiSelectionCallbacks = {
	onRowsSelect: noop,
	onMultiSelectionClear: noop,
	onOverallMultiSelectionButtonClick: noop
};

export const disabledMultiSelection = undefined;
export const noneClearConfirmationMultiSelection: OverviewModel.MultiSelection = {
	collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED,
	counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE
};
export const defaultClearConfirmationMultiSelection: OverviewModel.MultiSelection = {
	collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED,
	counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
	clearConfirmation: {
		enabled: true
	}
};
export const customClearConfirmationMultiSelection: OverviewModel.MultiSelection = {
	collapseOption: OverviewModel.MultiSelection.CollapseOption.COLLAPSIBLE_COLLAPSED,
	counterOption: OverviewModel.MultiSelection.CounterOption.SIMPLE,
	clearConfirmation: {
		enabled: true,
		confirmation: {
			title: [
				{
					locale: "en",
					text: "Delete Title"
				},
				{
					locale: "de",
					text: "Titel löschen"
				}
			],
			message: [
				{
					locale: "en",
					text: "Delete?"
				},
				{
					locale: "de",
					text: "Löschen?"
				}
			]
		}
	}
};

export function multiSelectionToString(multiSelection?: OverviewModel.MultiSelection): string {
	const description =
		multiSelection === undefined
			? "disabled"
			: multiSelection?.clearConfirmation?.confirmation
				? "custom confirmation"
				: multiSelection?.clearConfirmation?.enabled
					? "default confirmation"
					: "none confirmation";

	return description + " multi-selection";
}
