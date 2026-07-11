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

import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";

import { createContext, type Container, useContextSelector } from "@com.mgmtp.a12.widgets/widgets-core";

import type { UiState } from "../../store/index.js";

import { useOverviewEngineState } from "./overview-engine-context.js";

export namespace FilterFocusContext {
	export type Target = "selectorTrigger" | "selectorWrapper";

	export interface Type {
		readonly registerRef: (target: Target, element: HTMLElement | null) => void;
		readonly onFocusedFilterChange: (filterId: string | null) => void;
	}
}

const DEFAULT_ERROR_MESSAGE = "FilterFocusContext is not initiated.";
const defaultValue: FilterFocusContext.Type = {
	registerRef: () => {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	},
	onFocusedFilterChange: () => {
		throw new Error(DEFAULT_ERROR_MESSAGE);
	}
};

export const FilterFocusContext = createContext<FilterFocusContext.Type>(defaultValue);
FilterFocusContext.displayName = "FilterFocusContext";

export function useFilterFocusContext<T>(selector: (value: FilterFocusContext.Type) => T): T {
	return useContextSelector(FilterFocusContext, selector);
}

export interface FilterFocusProviderProps extends Container {
	readonly selectorTriggerRef: React.RefObject<HTMLElement | null>;
}

export const FilterFocusProvider: React.FC<FilterFocusProviderProps> = React.memo(function FilterFocusProvider({
	selectorTriggerRef,
	children
}) {
	const [focusedFilterId, setFocusedFilterId] = useState<string | null>(null);

	const refs = useRef<Record<string, HTMLElement | null>>({});

	const registerRef = useCallback(
		(target: FilterFocusContext.Target, element: HTMLElement | null) => {
			refs.current[target] = element;

			if (target === "selectorTrigger") {
				selectorTriggerRef.current = element;
			}
		},
		[selectorTriggerRef]
	);

	const selectorOpen = useOverviewEngineState((state) => state.newFilter?.filterSelectorOptions.open ?? false);
	const hiddenFilterBarItemIdsKeySelector = useCallback((state: UiState) => {
		return Object.values(state.newFilter?.filters ?? {})
			.filter((f) => f.model.preferFilterBar === true && f.area === "filterSelector")
			.map((f) => f.model.id)
			.join(",");
	}, []);
	const hiddenFilterBarItemIdsKey = useOverviewEngineState(hiddenFilterBarItemIdsKeySelector);
	const hiddenFilterBarItemIds = useMemo<readonly string[]>(
		() => (hiddenFilterBarItemIdsKey === "" ? [] : hiddenFilterBarItemIdsKey.split(",")),
		[hiddenFilterBarItemIdsKey]
	);

	const { isFallbackFocus } = useFilterFocusManagement({ focusedFilterId, hiddenFilterBarItemIds });

	useEffect(() => {
		if (!isFallbackFocus) {
			return;
		}

		refs.current[selectorOpen ? "selectorWrapper" : "selectorTrigger"]?.focus();
	}, [isFallbackFocus, selectorOpen]);

	const contextValue = useMemo<FilterFocusContext.Type>(
		() => ({ registerRef, onFocusedFilterChange: setFocusedFilterId }),
		[registerRef]
	);

	return <FilterFocusContext.Provider value={contextValue}>{children}</FilterFocusContext.Provider>;
});

function useFilterFocusManagement({
	focusedFilterId,
	hiddenFilterBarItemIds
}: {
	readonly focusedFilterId: string | null;
	readonly hiddenFilterBarItemIds: readonly string[];
}): { readonly isFallbackFocus: boolean } {
	const prevHiddenIdsRef = useRef<readonly string[]>([]);
	const [isFallbackFocus, setIsFallbackFocus] = useState(false);

	useEffect(() => {
		if (!focusedFilterId) {
			prevHiddenIdsRef.current = hiddenFilterBarItemIds;
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setIsFallbackFocus(false);

			return;
		}

		const wasHidden = prevHiddenIdsRef.current.includes(focusedFilterId);
		const isNowHidden = hiddenFilterBarItemIds.includes(focusedFilterId);

		setIsFallbackFocus(wasHidden !== isNowHidden);
		prevHiddenIdsRef.current = hiddenFilterBarItemIds;
	}, [focusedFilterId, hiddenFilterBarItemIds]);

	return { isFallbackFocus };
}
