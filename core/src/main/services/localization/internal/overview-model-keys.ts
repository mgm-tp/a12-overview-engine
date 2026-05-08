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

export namespace OverviewModelKeys {
	export const HEADER = "header";
	export const COLUMNS = "columns";
	export const ROWS = "rows";
	export const FOOTER_BOX = "footerBox";
	export const CONTEXT_MENU = "contextMenu";
	export const SUB_HEADER_BOX = "subHeaderBox";
	export const MULTI_SELECTION = "multiSelection";
	export const ROW_ACTION_GROUP = "rowActionGroup";
	export const FILTER_SELECTOR = "filterSelector";

	export const ACTION_GROUPS = "groups";
	export const ACTIONS = "actions";

	export const CONFIRMATION = "confirmation";
	export const CLEAR_CONFIRMATION = "clearConfirmation";
	export const SECTION_DATA = "sectionData";

	export const LABEL = "label";
	export const TITLE = "title";
	export const SUBTITLE = "subtitle";
	export const MESSAGE = "message";
	export const SUFFIX = "suffix";

	export function getActionKeys(componentKey: string, event: string): string[] {
		return [componentKey, ACTIONS, event];
	}

	export function getPrefixes(overviewModelId: string): string[] {
		return ["uiModel", overviewModelId];
	}
}
