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

import { memo, type FC, useState, useEffect, useCallback } from "react";

import { css, styled } from "styled-components";

import { DataRoles } from "@com.mgmtp.a12.widgets/widgets-core";

import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { UiStateSelector } from "../../../../store/index.js";
import { useFilterFocusContext } from "../../../context/filter-focus-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { useFilterGroups } from "../hooks/use-filter-groups.js";
import { useFilterItems } from "../hooks/use-filter-items.js";
import { useFilterSelectors } from "../hooks/use-filter-selectors.js";
import { useFilterState } from "../hooks/use-filter-state.js";

import { useFilterLabelResolver } from "./filter-label-resolvers.js";

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSelectorProps {}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSelector: FC<FilterSelectorProps> = memo(function FilterSelector() {
	const showSearchBar = useFilterState(
		(s) => !!s?.filterSelectorOptions.searchBar.enabled && s.filterSelectorOptions.searchBar.value
	);
	const [searchText, setSearchText] = useState("");
	const filterGroups = useOverviewEngineContext(
		(c) => c.overviewModel.content.configuration.newFilterConfiguration?.filterGroups ?? []
	);
	const showSetFiltersOnly = useFilterState(
		(s) => !!s?.filterSelectorOptions.showSetFiltersOnly.enabled && s.filterSelectorOptions.showSetFiltersOnly.value
	);

	const onFilterSelectorVisibilityChanged = useOverviewEngineContext(
		(c) => c.eventHandlers.newFilter?.onFilterSelectorVisibilityChanged
	);
	const onFilterCollapsedChanged = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterCollapsedChanged);
	const smallView = useOverviewEngineContext((c) => c.smallView);
	const filterStates = useOverviewEngineState((state) => state.newFilter?.filters);
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const filterTitle = localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.title);
	const closeButtonTitle = localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.selector.closeButtonTitle);
	const filterSubtitleText = useOverviewEngineContext(
		(c) => c.overviewModel.content.configuration.newFilterConfiguration?.filterSelector.headerSubtitle
	);
	const filterSubtitle = filterSubtitleText
		? localizedOverviewElement(["newFilterConfiguration", "headerSubtitle"], filterSubtitleText)
		: undefined;

	const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const Title = useOverviewEngineContext((c) => c.widgetMap.Title);
	const Subtitle = useOverviewEngineContext((c) => c.widgetMap.Subtitle);
	const Message = useOverviewEngineContext((c) => c.widgetMap.Message);
	const GlobalMessageBox = useOverviewEngineContext((c) => c.widgetMap.GlobalMessageBox);
	const FilterSelectorListMode = useOverviewEngineContext((c) => c.widgetMap.FilterSelectorListMode);
	const FilterSelectorFooter = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSelectorFooter);
	const FilterSelectorSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSelectorSetting);
	const FilterSelectorSearchBar = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSelectorSearchBar);
	const FilterSetting = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSetting);

	const editingFilterSettings = useOverviewEngineState(UiStateSelector.NewFilter.editingFilterSettings());
	const onFilterItemSettingsClosed = useOverviewEngineContext(
		(c) => c.eventHandlers.newFilter?.onFilterItemSettingsClosed
	);
	const resolveFilterLabel = useFilterLabelResolver();
	const settingsSubtitle = localizedResource(RESOURCE_KEYS.overviewEngine.newFilter.barItemDropdown.settingsTitle);

	const registerRef = useFilterFocusContext((c) => c.registerRef);
	const onFocusedFilterChange = useFilterFocusContext((c) => c.onFocusedFilterChange);
	const setWrapperRef = useCallback((ref: HTMLDivElement | null) => registerRef("selectorWrapper", ref), [registerRef]);

	const filterStateSelectors = useFilterSelectors();
	const hasErrors = useOverviewEngineState(UiStateSelector.NewFilter.hasFilterSelectorErrors(filterStateSelectors));
	const [bannerDismissed, setBannerDismissed] = useState(false);
	const [prevHasErrors, setPrevHasErrors] = useState(hasErrors);
	useEffect(() => {
		if (hasErrors !== prevHasErrors) {
			if (hasErrors && !prevHasErrors) {
				setBannerDismissed(false);
			}

			setPrevHasErrors(hasErrors);
		}
	}, [hasErrors, prevHasErrors]);
	const showErrorBanner = hasErrors && !bannerDismissed;

	const groups = useFilterGroups({
		filterStates,
		filterGroups,
		searchText,
		showSetFiltersOnly,
		smallView: !!smallView
	});

	const onCollapseChange = useCallback(
		(filterId: string, collapsed: boolean) => onFilterCollapsedChanged?.({ filterId, collapsed }),
		[onFilterCollapsedChanged]
	);

	const items = useFilterItems({ groups, onCollapseChange, onFocusedFilterChange });

	const actionBar = (
		<>
			{showErrorBanner && (
				<GlobalMessageBox
					variant="error"
					content={localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.errorBanner)}
					actions={<Button invert icon={<Icon>close</Icon>} onClick={() => setBannerDismissed(true)} />}
				/>
			)}
			{showSearchBar && <FilterSelectorSearchBar text={searchText} onTextChange={setSearchText} />}
		</>
	);

	const isSettingsView = !!editingFilterSettings;

	const headerContent = isSettingsView ? (
		<StyledFilterHeader $hasSubtitle>
			<HeaderLeading>
				<Button
					icon={<Icon>arrow_back</Icon>}
					title={localizedResource(RESOURCE_KEYS.overviewEngine.filterSelector.title)}
					onClick={() => onFilterItemSettingsClosed?.()}
				/>
				<HeaderTitleStack>
					<Subtitle text={settingsSubtitle} />
					<Title ariaLevel={2} text={resolveFilterLabel(editingFilterSettings.model)} />
				</HeaderTitleStack>
			</HeaderLeading>
			<HeaderActions>
				<Button
					icon={<Icon>close</Icon>}
					title={closeButtonTitle}
					onClick={() => onFilterSelectorVisibilityChanged?.({ visible: false })}
				/>
			</HeaderActions>
		</StyledFilterHeader>
	) : (
		<StyledFilterHeader $hasSubtitle={!!filterSubtitle}>
			<HeaderTitleStack>
				{filterSubtitle && <Subtitle text={filterTitle} />}
				<Title ariaLevel={2} text={filterSubtitle ?? filterTitle} />
			</HeaderTitleStack>
			<HeaderActions>
				<FilterSelectorSetting />
				<Button
					icon={<Icon>close</Icon>}
					title={closeButtonTitle}
					onClick={() => onFilterSelectorVisibilityChanged?.({ visible: false })}
				/>
			</HeaderActions>
		</StyledFilterHeader>
	);

	return (
		<FilterSelectorListMode
			listMode={{
				id: "filter-selector",
				wrapperRef: setWrapperRef,
				headerContent,
				footerContent: <FilterSelectorFooter />,
				actionBar: isSettingsView ? undefined : actionBar,
				items: isSettingsView ? [] : items,
				customFilterList:
					isSettingsView && editingFilterSettings ? <FilterSetting filterState={editingFilterSettings} /> : undefined
			}}>
			{!isSettingsView && items.length === 0 && (
				<Message>
					{localizedResource(
						searchText
							? RESOURCE_KEYS.overviewEngine.filterSelector.noSearchResults
							: showSetFiltersOnly
								? RESOURCE_KEYS.overviewEngine.filterSelector.noSetFilters
								: RESOURCE_KEYS.overviewEngine.filterSelector.noFilterFound
					)}
				</Message>
			)}
		</FilterSelectorListMode>
	);
});

const StyledFilterHeader = styled.div<{ $hasSubtitle: boolean }>(({ theme, $hasSubtitle }) => {
	const {
		spacing: { spacing },
		colors: { divider, text },
		components: { contentBox }
	} = theme;

	return css`
		background-color: ${contentBox.actionBar.background};
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: ${spacing.spacingSm}px;
		border-bottom: 1px solid ${divider.color};
		${$hasSubtitle &&
		css`
			/* The header swaps the configured subtitle into the Title slot and shows the static
			   "Filters" label as the Subtitle. Both default to the inverted (light) contentBox color,
			   which is invisible on the light header background. Restore legible text colors. */
			[data-role="${DataRoles.Contentbox.Title}"] {
				margin: 0;
				color: ${text.color};
			}
			[data-role="${DataRoles.Contentbox.Subtitle}"] {
				color: ${text.secondaryColorDark};
			}
		`}
	`;
});

const HeaderTitleStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const HeaderActions = styled.div(({ theme }) => {
	const {
		spacing: { spacing }
	} = theme;

	return css`
		display: flex;
		align-items: center;
		gap: ${spacing.spacingXs}px;
	`;
});

const HeaderLeading = styled.div(({ theme }) => {
	const {
		spacing: { spacing }
	} = theme;

	return css`
		display: flex;
		align-items: center;
		gap: ${spacing.spacingSm}px;
		min-width: 0;
	`;
});
