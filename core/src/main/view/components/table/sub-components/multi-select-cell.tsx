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

import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { Column } from "@com.mgmtp.a12.widgets/widgets-core";

import type { MultiSelect } from "../../../../models/index.js";
import { MultiSelectUtils, DocumentModelUtils, MultiSelectModelUtils } from "../../../../models/internal/shared.js";
import { OverviewModel } from "../../../../overview-model.js";
import { useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { useOverviewEngineInternalContext } from "../../../context/overview-engine-internal-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";

export namespace MultiSelectCell {
	export interface Props {
		readonly elementPath: ModelPath;
		readonly data: MultiSelect;
		readonly alignment?: Column.HorizontalAlignment;
		readonly displayMode?: OverviewModel.MultiSelectDisplayMode;
	}
}

const COMMA_WITH_SPACE = ", ";

export const MultiSelectCell: React.FC<MultiSelectCell.Props> = React.memo(function MultiSelectCell(props) {
	const { data, alignment, elementPath, displayMode } = props;

	const documentModel = useOverviewEngineContext((context) => context.documentModel);
	const overviewModel = useOverviewEngineContext((context) => context.overviewModel);
	const CssEllipsis = useOverviewEngineContext((context) => context.widgetMap.CssEllipsis);
	const BulletListUnordered = useOverviewEngineContext((context) => context.widgetMap.BulletListUnordered);
	const BulletListItem = useOverviewEngineContext((context) => context.widgetMap.BulletListItem);
	const TextOutput = useOverviewEngineContext((context) => context.widgetMap.TextOutput);

	const localizedFieldValue = LocalizerHooks.useLocalizedFieldValue();
	const sortByLocale = LocalizerHooks.useLocaleSorter();
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

	const labels = React.useMemo<string[]>(() => {
		const group = documentModelService.getByPath(elementPath);

		if (!MultiSelectModelUtils.isInstance(group)) {
			throw new Error(`Invalid MultiSelect group ${JSON.stringify(group)}`);
		}

		const field = MultiSelectModelUtils.getField(group);
		const enumFieldPath: ModelPath = [...elementPath, { elementName: field.name }];
		const formattedLabels = MultiSelectUtils.flatten(data, group).map((value) => {
			return localizedFieldValue(enumFieldPath, value);
		});

		if (!DocumentModelUtils.isAlphabeticalSortedField(documentModel, enumFieldPath)) {
			return formattedLabels;
		}

		return sortByLocale(formattedLabels, (label) => label);
	}, [documentModelService, elementPath, data, documentModel, sortByLocale, localizedFieldValue]);

	const content = React.useMemo(() => {
		const joinedTextLabelsByComma = labels.join(COMMA_WITH_SPACE).trimEnd();

		if (overviewModel.content.configuration.rowHeight) {
			return <CssEllipsis useTooltip>{joinedTextLabelsByComma}</CssEllipsis>;
		}

		if (displayMode === OverviewModel.MultiSelectDisplayMode.COMMA_SEPARATED || labels.length === 1) {
			return joinedTextLabelsByComma;
		}

		return (
			<BulletListUnordered indent={false}>
				{labels.map((label, index) => (
					<BulletListItem key={index}>{label}</BulletListItem>
				))}
			</BulletListUnordered>
		);
	}, [
		BulletListItem,
		BulletListUnordered,
		CssEllipsis,
		labels,
		overviewModel.content.configuration.rowHeight,
		displayMode
	]);

	if (labels.length === 0) {
		return null;
	}

	return (
		<TextOutput disableParagraphWrapping alignment={alignment}>
			{content}
		</TextOutput>
	);
});
