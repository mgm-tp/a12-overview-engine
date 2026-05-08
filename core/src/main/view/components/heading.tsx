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

import { NavigationContentboxContext } from "@com.mgmtp.a12.widgets/widgets-core";

import { UiStateSelector } from "../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../context/overview-engine-context.js";

/** @internal */
export const Heading: React.ComponentType<Heading.PropsType> = React.memo(function Heading(props) {
	const {
		title,
		subtitle,
		hiddenText,
		labelHidden,
		buttons,
		ariaLevel,
		additionalPrefixes,
		additionalControls,
		searchButton,
		filterSelector
	} = props;

	const disabled = useOverviewEngineState(UiStateSelector.disabled());
	const embedded = useOverviewEngineContext((context) => context.embedded);
	const BackButton = useOverviewEngineContext((context) => context.widgetMap.BackButton);
	const Title = useOverviewEngineContext((context) => context.widgetMap.Title);
	const Subtitle = useOverviewEngineContext((context) => context.widgetMap.Subtitle);
	const Heading = useOverviewEngineContext((context) => context.widgetMap.Heading);
	const HiddenText = useOverviewEngineContext((context) => context.widgetMap.HiddenText);
	const MobileActionBar = useOverviewEngineContext((context) => context.componentMap.MobileActionBar);

	const { onBackButtonClicked } = React.useContext(NavigationContentboxContext);
	const backButton = React.useMemo(
		() => (onBackButtonClicked && !embedded ? <BackButton onBackButtonClicked={onBackButtonClicked} /> : undefined),
		[BackButton, embedded, onBackButtonClicked]
	);

	const childrenOnly = React.useMemo<boolean>(() => {
		return !!(
			labelHidden &&
			!backButton &&
			!additionalPrefixes &&
			!additionalControls &&
			!searchButton &&
			!filterSelector &&
			!buttons
		);
	}, [additionalControls, additionalPrefixes, backButton, buttons, filterSelector, labelHidden, searchButton]);

	return (
		<Heading
			prefixes={
				<>
					{backButton}
					{additionalPrefixes}
				</>
			}
			suffixes={
				<>
					{additionalControls}
					{searchButton}
					{filterSelector}
					<MobileActionBar buttons={buttons} disabled={disabled} />
				</>
			}
			childrenOnly={childrenOnly}>
			{labelHidden ? (
				<HiddenText role={"heading"} ariaLevel={ariaLevel}>
					{hiddenText}
				</HiddenText>
			) : (
				<>
					<Title ariaLevel={ariaLevel} text={title} />
					<Subtitle text={subtitle} />
				</>
			)}
		</Heading>
	);
});

export namespace Heading {
	export interface PropsType {
		readonly title: string;
		readonly hiddenText?: string;
		readonly subtitle?: string;
		readonly ariaLevel?: number;
		readonly buttons: React.ReactNode;
		readonly additionalControls?: React.ReactNode;
		readonly additionalPrefixes?: React.ReactNode;
		readonly filterSelector?: React.ReactNode;
		readonly searchButton?: React.ReactNode;
		readonly labelHidden?: true;
	}
}
