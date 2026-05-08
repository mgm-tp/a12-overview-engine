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

import { LayoutGrid } from "@com.mgmtp.a12.widgets/widgets-core";

import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { RESOURCE_KEYS, LocalizerHooks } from "../../../../services/localization/index.js";

const { Grid, Row, Column } = LayoutGrid;

export enum SectionType {
	START = "start",
	END = "end"
}

/** @internal */
export namespace SectionTemplate {
	export interface Props {
		readonly errorMessage: string | undefined;
		readonly sectionRenderer: (sectionType: SectionType) => React.ReactNode;
	}
}

/** @internal */
export const SectionTemplate: React.FC<SectionTemplate.Props> = React.memo(function SectionTemplate({
	sectionRenderer,
	errorMessage
}) {
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const ErrorMessageBox = useOverviewEngineContext((context) => context.componentMap.ErrorMessageBox);
	const FilterSelectorTemplateSection = useOverviewEngineContext(
		(context) => context.widgetMap.FilterSelectorTemplateSection
	);

	return (
		<>
			{errorMessage && <ErrorMessageBox message={errorMessage} />}
			<Grid>
				{[SectionType.START, SectionType.END].map((sectionType) => (
					<React.Fragment key={sectionType}>
						<FilterSelectorTemplateSection useDivTag>
							{localizedResource(RESOURCE_KEYS.overviewEngine.filterOptionView.sectionHeader[sectionType])}
						</FilterSelectorTemplateSection>
						<Row>
							<Column size={{ sm: 12, md: 12, lg: 12 }}>{sectionRenderer(sectionType)}</Column>
						</Row>
					</React.Fragment>
				))}
			</Grid>
		</>
	);
});
