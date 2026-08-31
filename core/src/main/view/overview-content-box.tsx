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

import { addPrefix, type Container } from "@com.mgmtp.a12.widgets/widgets-core";

import type { OverviewEngineApi } from "./api.js";
import type { Filter } from "./components/filters/filter-options-view.js";
import { useSectionData, useFlattenedFilters } from "./components/filters/utils.js";
import { OverviewContentBoxContext } from "./context/overview-content-box-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "./context/overview-engine-context.js";
import { useFooterBoxButtons } from "./hooks/index.js";
import { isPageable, usePagination } from "./utils.js";

export namespace OverviewContentBox {
	export interface Props extends Container {
		/**
		 * To specify aria-level for content box
		 */
		readonly ariaLevel?: number;
	}
}

export const OverviewContentBox: React.ComponentType<OverviewContentBox.Props> = React.memo(
	function OverviewContentBox(props) {
		const contentRef = React.useRef<HTMLElement | null>(null);
		const triggerElement = React.useRef<HTMLElement | null>(null);
		const [showFilterSelector, setShowFilterSelector] = React.useState<boolean>(false);
		const [showMobileFilterBar, setShowMobileFilterBar] = React.useState<boolean>(false);
		const showMobileSearchBar = useOverviewEngineState((state) => state.showMobileSearchBar ?? false);
		const onMobileSearchBarToggle = useOverviewEngineContext(
			(context) => context.eventHandlers.onMobileSearchBarToggle
		);
		const setShowMobileSearchBar = React.useCallback(
			(visible: boolean) => onMobileSearchBarToggle?.({ visible }),
			[onMobileSearchBarToggle]
		);
		const [currentFilter, setCurrentFilter] = React.useState<Filter.FilterData | undefined>(undefined);

		const ContentBox = useOverviewEngineContext((context) => context.widgetMap.ContentBox);
		const Pagination = useOverviewEngineContext((context) => context.componentMap.Pagination);
		const Footer = useOverviewEngineContext((context) => context.componentMap.Footer);
		const FilterSelector = useOverviewEngineContext((context) => context.componentMap.FilterSelector);
		const ButtonPanelComponent = useOverviewEngineContext((context) => context.componentMap.ButtonPanel);
		const OverviewSubheaderBox = useOverviewEngineContext((context) => context.componentMap.OverviewSubheaderBox);
		const OverviewHeading = useOverviewEngineContext((context) => context.componentMap.OverviewHeading);
		const embedded = useOverviewEngineContext((context) => context.embedded);
		const onFilterChange = useOverviewEngineContext((context) => context.eventHandlers.onFilterChange);
		const onPageChange = useOverviewEngineContext((context) => context.eventHandlers.onPageChange);

		const headingAriaLevel = React.useMemo<number>(() => props.ariaLevel ?? 1, [props.ariaLevel]);
		const pagination = usePagination();
		const toggleMobileFilterBar = React.useCallback(
			(isVisible?: boolean) => {
				setShowMobileFilterBar(isVisible ?? !showMobileFilterBar);
			},
			[showMobileFilterBar]
		);
		const getTriggerElementRef = React.useCallback(
			(ref: HTMLButtonElement | null) => {
				triggerElement.current = ref;
			},
			[triggerElement]
		);
		const onFilterSelectorVisibilityChange = React.useCallback((isVisible: boolean) => {
			setShowFilterSelector(isVisible);

			if (!isVisible && triggerElement.current) {
				triggerElement.current.focus();
			}
		}, []);

		const handleFilterChange = React.useCallback(
			(filters: OverviewEngineApi.FilterMap) => {
				setCurrentFilter(undefined);
				onFilterChange?.(filters);
			},
			[onFilterChange]
		);

		const onCurrentFilterChange = React.useCallback((currentFilter: Filter.FilterData) => {
			setCurrentFilter(currentFilter);
			setShowFilterSelector(true);
		}, []);

		const handlePageChange = React.useCallback(
			(page: number) => {
				if (contentRef.current) {
					const overviewTableElement = contentRef.current.lastElementChild;

					if (overviewTableElement instanceof HTMLElement) {
						overviewTableElement.focus();
					}
				}

				onPageChange?.(page);
			},
			[onPageChange]
		);

		const filters = useFlattenedFilters();
		const sectionData = useSectionData();
		const footerButtons = useFooterBoxButtons();

		return (
			<OverviewContentBoxContext.Provider
				value={{
					showFilterSelector,
					showMobileFilterBar,
					setShowMobileSearchBar,
					toggleMobileFilterBar,
					onFilterSelectorVisibilityChange,
					getTriggerElementRef,
					showMobileSearchBar
				}}>
				<ContentBox
					heading={<OverviewHeading headingAriaLevel={headingAriaLevel} />}
					subHeading={
						<OverviewSubheaderBox
							handleFilterChange={handleFilterChange}
							onCurrentFilterChange={onCurrentFilterChange}
						/>
					}
					footer={
						<Footer
							ariaLevel={headingAriaLevel + 1}
							pagination={
								pagination && isPageable(pagination) ? <Pagination {...pagination} onChange={handlePageChange} /> : null
							}
							buttonPanel={
								footerButtons.length > 0 ? <ButtonPanelComponent responsive buttons={footerButtons} /> : null
							}
						/>
					}
					padding={false}
					embedded={embedded}
					contentRef={(ref) => {
						contentRef.current = ref;
					}}
					className={addPrefix("overview-engine")}>
					{props.children}
				</ContentBox>
				{showFilterSelector && triggerElement.current && (
					<FilterSelector
						filters={filters}
						sectionData={sectionData}
						onFilterChange={handleFilterChange}
						onVisibilityChange={onFilterSelectorVisibilityChange}
						toggleFilterBar={toggleMobileFilterBar}
						currentFilterId={currentFilter?.id}
						referenceElement={triggerElement.current}
						open={showFilterSelector}
					/>
				)}
			</OverviewContentBoxContext.Provider>
		);
	}
);
