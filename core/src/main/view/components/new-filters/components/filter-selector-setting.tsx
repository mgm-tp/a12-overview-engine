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

import { memo, type FC } from "react";

import { useWindowSize } from "@com.mgmtp.a12.widgets/widgets-core";

import { useFilterState } from "../hooks/use-filter-state.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

const t = RESOURCE_KEYS.overviewEngine.newFilter.selectorOptions;

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export interface FilterSelectorSettingProps {}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export const FilterSelectorSetting: FC<FilterSelectorSettingProps> = memo(function FilterSelectorSetting() {
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const List = useOverviewEngineContext((c) => c.widgetMap.List);
	const ListItem = useOverviewEngineContext((c) => c.widgetMap.ListItem);
	const ListSubHeader = useOverviewEngineContext((c) => c.widgetMap.ListSubHeader);
	const Switch = useOverviewEngineContext((c) => c.widgetMap.Switch);
	const PopUpMenu = useOverviewEngineContext((c) => c.widgetMap.PopUpMenu);
	const onFilterSelectorOptionsChanged = useOverviewEngineContext(
		(c) => c.eventHandlers.newFilter?.onFilterSelectorOptionsChanged
	);
	const onFilterOptionsChanged = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterOptionsChanged);
	const onFilterCollapsedChanged = useOverviewEngineContext((c) => c.eventHandlers.newFilter?.onFilterCollapsedChanged);
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const searchBarOption = useFilterState((s) => s?.filterSelectorOptions.searchBar);
	const joinOperatorOption = useFilterState((s) => s?.queryOptions.joinOperator.current);
	const invertOption = useFilterState((s) => s?.queryOptions.invert.current);
	const showSetFiltersOnly = useFilterState((s) => s?.filterSelectorOptions.showSetFiltersOnly);
	const runtimeViewMode = useFilterState((s) => s?.filterSelectorOptions.viewMode);
	const configViewMode = useOverviewEngineContext(
		(c) => c.overviewModel.content.configuration.newFilterConfiguration?.filterSelector.viewMode
	);
	const { breakPoint } = useWindowSize();
	const isOverlayForced = breakPoint?.size !== "lg";
	const isPinUnpinAvailable = !isOverlayForced && configViewMode !== "modal";
	const isPinned = runtimeViewMode === "docked";

	return (
		<PopUpMenu icon={<Icon>more_vert</Icon>} orientation="bottom-end">
			<List>
				<ListSubHeader fill>{localizedResource(t.viewHeader)}</ListSubHeader>
				{searchBarOption?.enabled && (
					<ListItem
						graphic={<Icon iconTheme={"filled"}>search</Icon>}
						meta={
							<Switch
								labelGraphic={<Icon>info</Icon>}
								checked={searchBarOption.value}
								onChange={(value) =>
									onFilterSelectorOptionsChanged?.({ options: { searchBar: { ...searchBarOption, value } } })
								}
							/>
						}
						text={localizedResource(t.showSearch)}
						divider
					/>
				)}
				<ListItem
					graphic={<Icon>unfold_more</Icon>}
					text={localizedResource(t.expandAll)}
					onClick={() => onFilterCollapsedChanged?.({ filterId: null, collapsed: false })}
				/>
				<ListItem
					graphic={<Icon>unfold_less</Icon>}
					text={localizedResource(t.collapseAll)}
					divider
					onClick={() => onFilterCollapsedChanged?.({ filterId: null, collapsed: true })}
				/>
				{showSetFiltersOnly?.enabled && (
					<ListItem
						graphic={<Icon iconTheme={"filled"}>remove_red_eye</Icon>}
						meta={
							<Switch
								labelGraphic={<Icon>info</Icon>}
								checked={showSetFiltersOnly.value}
								onChange={(show) =>
									onFilterSelectorOptionsChanged?.({
										options: { showSetFiltersOnly: { ...showSetFiltersOnly, value: show } }
									})
								}
							/>
						}
						text={localizedResource(t.showSetFiltersOnly)}
						divider
					/>
				)}
				{isPinUnpinAvailable && (
					<ListItem
						graphic={<Icon>push_pin</Icon>}
						meta={
							<Switch
								checked={isPinned}
								onChange={(pinned) =>
									onFilterSelectorOptionsChanged?.({
										options: { viewMode: pinned ? "docked" : "overlay" }
									})
								}
							/>
						}
						text={localizedResource(t.pinFilterList)}
						divider
					/>
				)}
				{joinOperatorOption?.enabled && (
					<>
						<ListSubHeader fill>{localizedResource(t.matchHeader)}</ListSubHeader>
						<ListItem
							graphic={<Icon iconTheme="custom">or</Icon>}
							text={localizedResource(t.any)}
							onClick={() =>
								onFilterOptionsChanged?.({
									joinOperator: { ...joinOperatorOption, value: "or" }
								})
							}
							meta={joinOperatorOption.value === "or" ? <Icon>check</Icon> : undefined}
						/>
						<ListItem
							graphic={<Icon iconTheme="custom">and</Icon>}
							text={localizedResource(t.all)}
							onClick={() =>
								onFilterOptionsChanged?.({
									joinOperator: { ...joinOperatorOption, value: "and" }
								})
							}
							meta={joinOperatorOption.value === "and" ? <Icon>check</Icon> : undefined}
						/>
					</>
				)}

				{invertOption?.enabled && (
					<>
						<ListSubHeader fill>{localizedResource(t.resultHeader)}</ListSubHeader>
						<ListItem
							graphic={<Icon iconTheme="filled">invert_colors</Icon>}
							text={localizedResource(t.invert)}
							meta={invertOption.value ? <Icon>check</Icon> : undefined}
							onClick={() =>
								onFilterOptionsChanged?.({
									invert: { ...invertOption, value: !invertOption.value }
								})
							}
						/>
					</>
				)}
			</List>
		</PopUpMenu>
	);
});
