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

import { useRowCount } from "../utils.js";
import { OverviewModel } from "../../overview-model.js";
import { OverviewModelKeys } from "../../services/localization/index.js";
import { useOverviewEngineContext } from "../context/overview-engine-context.js";

import { LocalizerHooks } from "./localizer-hooks.js";

/** @internal */
export function useHeadingMetadata(): {
	readonly title: string;
	readonly hiddenText: string;
	readonly subtitle: string;
	readonly buttons: React.ReactNode;
	readonly labelHidden: true | undefined;
} {
	const modelLabels = useOverviewEngineContext((c) => c.overviewModel.header.labels);
	const modelSubtitle = useOverviewEngineContext((c) => c.overviewModel.content.configuration.subtitle);
	const subHeaderBox = useOverviewEngineContext((c) => c.overviewModel.content.subHeaderBox);
	const OverviewButton = useOverviewEngineContext((c) => c.componentMap.OverviewButton);
	const showRowCount = useOverviewEngineContext((c) => c.overviewModel.content.configuration.showRowCount);
	const labelHidden = useOverviewEngineContext((c) => c.overviewModel.content.configuration.labelHidden);
	const shouldDisplayInSmallView = useOverviewEngineContext((c) => !!c.smallView);
	const rowCount = useRowCount();

	const extractedButtons: OverviewModel.ButtonElement[] = React.useMemo(
		() =>
			[...(subHeaderBox?.leftSlot || []), ...(subHeaderBox?.rightSlot || [])].filter(
				OverviewModel.ButtonElement.isAssignableFrom
			),
		[subHeaderBox?.leftSlot, subHeaderBox?.rightSlot]
	);

	const buttons = React.useMemo(
		() =>
			shouldDisplayInSmallView &&
			extractedButtons.length > 0 &&
			extractedButtons.map((buttonModel) => (
				<OverviewButton
					componentKey={OverviewModelKeys.HEADER}
					key={buttonModel.event}
					buttonModel={{ ...buttonModel, labelHidden: undefined }}
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

	return { title, hiddenText, subtitle, buttons, labelHidden };
}
