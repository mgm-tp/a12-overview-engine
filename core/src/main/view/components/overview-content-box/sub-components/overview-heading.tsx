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

import { UiStateSelector } from "../../../../store/index.js";
import { OverviewModel } from "../../../../overview-model.js";
import { useRowCount, useShouldAllowSearch } from "../../../utils.js";
import { LocalizerHooks, OverviewModelKeys } from "../../../../services/localization/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";

export interface OverviewHeadingProps {
	readonly headingAriaLevel: number;
}

/** @internal */
export const OverviewHeading: React.FC<OverviewHeadingProps> = React.memo(function OverviewHeading(props) {
	const activeFilters = useOverviewEngineState(UiStateSelector.activeFilters());
	const enumeratedStringFilterMap = useOverviewEngineState(UiStateSelector.enumeratedStringFilterMap());
	const modelLabels = useOverviewEngineContext((context) => context.overviewModel.header.labels);
	const modelSubtitle = useOverviewEngineContext((context) => context.overviewModel.content.configuration.subtitle);
	const subHeaderBox = useOverviewEngineContext((context) => context.overviewModel.content.subHeaderBox);
	const Heading = useOverviewEngineContext((context) => context.componentMap.Heading);
	const OverviewButton = useOverviewEngineContext((context) => context.componentMap.OverviewButton);
	const OverviewSearchButton = useOverviewEngineContext((context) => context.componentMap.OverviewSearchButton);
	const OverviewFilterButton = useOverviewEngineContext((context) => context.componentMap.OverviewFilterButton);
	const showRowCount = useOverviewEngineContext((context) => context.overviewModel.content.configuration.showRowCount);
	const labelHidden = useOverviewEngineContext((context) => context.overviewModel.content.configuration.labelHidden);
	const enableFilter = useOverviewEngineContext((context) => context.overviewModel.content.configuration.enableFilter);
	const shouldAllowSearch = useShouldAllowSearch();
	const shouldDisplayInSmallView = useOverviewEngineContext((context) => !!context.smallView);

	const rowCount = useRowCount();

	const extractedButtons: OverviewModel.ButtonElement[] = React.useMemo(
		() =>
			[...(subHeaderBox?.minorElements || []), ...(subHeaderBox?.majorElements || [])].filter(
				OverviewModel.ButtonElement.isAssignableFrom
			),
		[subHeaderBox?.majorElements, subHeaderBox?.minorElements]
	);

	const buttons = React.useMemo(
		() =>
			shouldDisplayInSmallView &&
			extractedButtons.length > 0 &&
			extractedButtons.map((buttonModel) => (
				<OverviewButton
					componentKey={OverviewModelKeys.HEADER}
					key={buttonModel.event}
					buttonModel={{ ...buttonModel, labelHidden: undefined }} // to show button label in pop up menu in small view only
				/>
			)),
		[OverviewButton, extractedButtons, shouldDisplayInSmallView]
	);

	const localizedOverviewElement = LocalizerHooks.useLocalizedOverviewElement();
	const title = React.useMemo<string>(() => {
		if (labelHidden) {
			return "";
		}

		const localizedTitle = localizedOverviewElement([OverviewModelKeys.HEADER, OverviewModelKeys.LABEL], modelLabels);

		if (!showRowCount || rowCount === undefined) {
			return localizedTitle;
		}

		return !localizedTitle ? "" : `${localizedTitle} (${rowCount})`;
	}, [labelHidden, localizedOverviewElement, modelLabels, showRowCount, rowCount]);

	const hiddenText = React.useMemo<string>(() => {
		if (!labelHidden) {
			return "";
		}

		return localizedOverviewElement([OverviewModelKeys.HEADER, OverviewModelKeys.LABEL], modelLabels);
	}, [labelHidden, localizedOverviewElement, modelLabels]);

	const subtitle = React.useMemo<string>(() => {
		if (!title) {
			return "";
		}

		return localizedOverviewElement([OverviewModelKeys.HEADER, OverviewModelKeys.SUBTITLE], modelSubtitle);
	}, [localizedOverviewElement, modelSubtitle, title]);

	return (
		<Heading
			title={title}
			hiddenText={hiddenText}
			subtitle={subtitle}
			ariaLevel={props.headingAriaLevel}
			buttons={buttons}
			filterSelector={
				enableFilter &&
				(activeFilters || enumeratedStringFilterMap) &&
				shouldDisplayInSmallView && <OverviewFilterButton key="HeadingFilterButton" />
			}
			searchButton={shouldAllowSearch && shouldDisplayInSmallView && <OverviewSearchButton />}
			labelHidden={labelHidden}
		/>
	);
});
