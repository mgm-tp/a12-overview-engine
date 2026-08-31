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

import { noop } from "@com.mgmtp.a12.widgets/widgets-core";

import type { JSONDocument } from "../../../../models/index.js";
import { RESOURCE_KEYS } from "../../../../services/localization/index.js";
import { UiStateSelector } from "../../../../store/index.js";
import { useOverviewEngineState, useOverviewEngineContext } from "../../../context/overview-engine-context.js";
import { LocalizerHooks } from "../../../hooks/localizer-hooks.js";
import { pickRowState } from "../../../utils.js";

import hooks from "./hooks.js";

export namespace RowCheckbox {
	export interface Props {
		readonly row: JSONDocument;
	}
}

/** @internal */
export const RowCheckbox: React.ComponentType<RowCheckbox.Props> = React.memo(function RowCheckbox(props) {
	const rowState = useOverviewEngineState(UiStateSelector.rowState());
	const Checkbox = useOverviewEngineContext((context) => context.widgetMap.Checkbox);
	const rowDisabledGetter = hooks.useRowDisabilityGetter();
	const disabled = rowDisabledGetter(props.row);

	const selected = React.useMemo(() => !!pickRowState(rowState, props.row)?.selected, [props.row, rowState]);
	const localizedResource = LocalizerHooks.useLocalizedResource();
	const title = React.useMemo(
		() => localizedResource(RESOURCE_KEYS.overviewEngine.multiSelection.rowCheckboxTitle),
		[localizedResource]
	);

	const screenReaderCellIdGetter = hooks.useScreenReaderCellId();
	const screenReaderCellId = React.useMemo(
		() => screenReaderCellIdGetter(props.row),
		[screenReaderCellIdGetter, props.row]
	);

	const checkboxId = React.useId();
	const ariaLabelledBy = React.useMemo(
		() => (screenReaderCellId ? `${checkboxId} ${screenReaderCellId}` : undefined),
		[checkboxId, screenReaderCellId]
	);

	const selectRows = hooks.useRowsSelect();

	const inputProps = React.useMemo(() => {
		return {
			onClick: (event: React.MouseEvent<HTMLElement>) => selectRows(event, props.row.id, props.row.linkId),
			...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})
		};
	}, [ariaLabelledBy, selectRows, props.row.id, props.row.linkId]);

	return (
		<Checkbox
			id={checkboxId}
			title={title}
			label={title}
			disabled={disabled}
			fitToParent={false}
			hideLabel
			checked={selected}
			onChange={noop}
			inputProps={inputProps}
		/>
	);
});
