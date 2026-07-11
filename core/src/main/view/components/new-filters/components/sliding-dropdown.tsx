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

import { css, styled } from "styled-components";
import { memo, type FC, type ReactNode } from "react";

import {
	DataRoles,
	FilterSelectorTemplate,
	StyledFilterSelectorBody,
	StyledFilterSelectorContent
} from "@com.mgmtp.a12.widgets/widgets-core";

import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";

import { SlidingPanel, SlidingLayout, useSlidingLayout } from "./utilities/sliding-layout.js";

export interface SlidingDropdownPanel {
	readonly label: string;
	readonly content: ReactNode;
}

export interface SlidingDropdownProps {
	readonly primaryPanel: SlidingDropdownPanel;
	readonly secondaryPanel?: SlidingDropdownPanel;
	readonly footerContent?: ReactNode;
}

export const SlidingDropdown: FC<SlidingDropdownProps> = memo(function SlidingDropdown({
	primaryPanel,
	secondaryPanel,
	footerContent
}) {
	const Icon = useOverviewEngineContext((c) => c.widgetMap.Icon);
	const Button = useOverviewEngineContext((c) => c.widgetMap.Button);
	const Typography = useOverviewEngineContext((c) => c.widgetMap.Typography);

	const { activeIndex, showPanel } = useSlidingLayout();
	const hasSecondary = secondaryPanel !== undefined;
	const isSecondaryView = activeIndex === 1;

	const navigateButton = hasSecondary ? (
		<Button
			icon={<Icon>build</Icon>}
			title={secondaryPanel.label}
			onClick={(e) => {
				e.stopPropagation();
				showPanel(1);
			}}
		/>
	) : undefined;

	const mainPanel = (
		<StyledSection>
			<Typography.Headline level={2} compact headerActions={navigateButton}>
				{primaryPanel.label}
			</Typography.Headline>
			<StyledBody>{primaryPanel.content}</StyledBody>
		</StyledSection>
	);

	const secondarySlide = isSecondaryView && secondaryPanel && (
		<SlidingPanel>
			<StyledSecondaryHeader>
				<Button icon={<Icon>chevron_left</Icon>} onClick={() => showPanel(0)} />
				<Typography.Headline level={2} compact>
					{secondaryPanel.label}
				</Typography.Headline>
			</StyledSecondaryHeader>
			{secondaryPanel.content}
		</SlidingPanel>
	);

	return (
		<StyledTemplate
			primaryContent={
				hasSecondary ? (
					<SlidingLayout activeIndex={activeIndex}>
						<SlidingPanel>{mainPanel}</SlidingPanel>
						{secondarySlide}
					</SlidingLayout>
				) : (
					mainPanel
				)
			}
			footerContent={footerContent}
		/>
	);
});

const StyledTemplate = styled(FilterSelectorTemplate)(({ theme }) => {
	const { spacingSm, spacingXs } = theme.spacing.spacing;
	const { menu } = theme.components.popupMenu;

	return css`
		background: ${menu.background};
		border-radius: ${spacingXs}px;
		overflow: hidden;

		[data-role="${DataRoles.Typography.Headline}"] {
			margin: 0;
			padding: 0;
		}

		${StyledFilterSelectorBody} {
			min-height: 0;
			padding: ${spacingSm}px;
		}

		${StyledFilterSelectorContent} {
			max-height: unset;
			overflow-y: auto;
		}
	`;
});

const StyledSection = styled.div`
	[data-role="${DataRoles.Typography.Headline}"] {
		margin: 0;
		padding: 0;
	}
`;

const StyledSecondaryHeader = styled.div(({ theme }) => {
	const { spacingSm } = theme.spacing.spacing;

	return css`
		display: flex;
		align-items: center;
		gap: ${spacingSm}px;
	`;
});

const StyledBody = styled.div(({ theme }) => {
	const { spacingXs } = theme.spacing.spacing;

	return css`
		padding: ${spacingXs}px;
	`;
});
