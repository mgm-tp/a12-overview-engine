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

import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";

import { FilterFocusProvider } from "../../context/filter-focus-context.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../context/overview-engine-context.js";
import { useFooterBoxButtons } from "../../hooks/index.js";
import type { OverviewContentBox as OldOverviewContentBox } from "../../overview-content-box.js";
import { isPageable, usePagination } from "../../utils.js";

import { FilterSelectorModal, useShouldShowFilterSelectorModal } from "./components/filter-selector-modal.js";

export const OverviewContentBox: React.ComponentType<OldOverviewContentBox.Props> = React.memo(
	function OverviewContentBox(props) {
		const contentRef = React.useRef<HTMLElement | null>(null);
		const selectorTriggerRef = React.useRef<HTMLElement | null>(null);

		const ContentBox = useOverviewEngineContext((c) => c.widgetMap.ContentBox);
		const Pagination = useOverviewEngineContext((c) => c.componentMap.Pagination);
		const OverviewSubheaderBox = useOverviewEngineContext((c) => c.componentMap.newFilter.OverviewSubheaderBox);
		const Footer = useOverviewEngineContext((c) => c.componentMap.Footer);
		const ButtonPanelComponent = useOverviewEngineContext((c) => c.componentMap.ButtonPanel);
		const OverviewHeading = useOverviewEngineContext((c) => c.componentMap.newFilter.OverviewHeading);
		const FilterSelector = useOverviewEngineContext((c) => c.componentMap.newFilter.FilterSelector);
		const embedded = useOverviewEngineContext((c) => c.embedded);
		const onPageChange = useOverviewEngineContext((c) => c.eventHandlers.onPageChange);

		const headingAriaLevel = props.ariaLevel ?? 1;
		const pagination = usePagination();

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

		const footerButtons = useFooterBoxButtons();

		const mode = useOverviewEngineState((s) => s.newFilter?.filterSelectorOptions.viewMode ?? "docked");
		const onNewFilterSelectorVisibilityChange = useOverviewEngineContext(
			(c) => c.eventHandlers.newFilter?.onFilterSelectorVisibilityChanged
		);
		const onFilterSelectorClose = React.useCallback(() => {
			onNewFilterSelectorVisibilityChange?.({ visible: false });
		}, [onNewFilterSelectorVisibilityChange]);
		const selectorOpen = useOverviewEngineState((state) => state.newFilter?.filterSelectorOptions.open ?? false);
		const shouldShowFilterSelectorModal = useShouldShowFilterSelectorModal();

		return (
			<FilterFocusProvider selectorTriggerRef={selectorTriggerRef}>
				<ContentBox
					heading={<OverviewHeading headingAriaLevel={headingAriaLevel} />}
					subHeading={<OverviewSubheaderBox />}
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
					className={addPrefix("overview-engine")}
					sidePanels={
						mode === "modal"
							? undefined
							: {
									right: {
										mode: mode,
										hide: !selectorOpen,
										content: <FilterSelector />,
										onClose: onFilterSelectorClose,
										triggerReference: selectorTriggerRef
									}
								}
					}>
					{props.children}
				</ContentBox>
				{mode === "modal" && shouldShowFilterSelectorModal && <FilterSelectorModal />}
			</FilterFocusProvider>
		);
	}
);
