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

import { OverviewEngine } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

// tag::row-action-state[]
export interface RowActionState {
	/**
	 * To specify row action state for all rows
	 */
	readonly rowActions?: {
		readonly [event: string]: RowActionState.IndividualRowActionState;
	};

	/**
	 * To specify row action state for each specific row
	 */
	readonly rows?: {
		readonly [id: string]: {
			[event: string]: RowActionState.IndividualRowActionState;
		};
	};
}
// end::row-action-state[]

// tag::individual-row-action-state[]
namespace RowActionState {
	export interface IndividualRowActionState {
		readonly hidden?: boolean;
		readonly disabled?: boolean;
	}
}

// end::individual-row-action-state[]

export const RowActionStateExample1: React.ComponentType<{ otherProps: OverviewEngine.Props }> = ({ otherProps }) => {
	return (
		// tag::row-action-state-example-1[]
		<OverviewEngine
			{...otherProps}
			rowActionState={{
				rowActions: {
					delete_event: {
						disabled: true
					}
				}
			}}
		/>
		// end::row-action-state-example-1[]
	);
};

export const RowActionStateExample2: React.ComponentType<{ otherProps: OverviewEngine.Props }> = ({ otherProps }) => {
	return (
		// tag::row-action-state-example-2[]
		<OverviewEngine
			{...otherProps}
			rowActionState={{
				rows: {
					0: {
						delete_event: { disabled: true }
					},
					2: {
						delete_event: { disabled: true },
						edit: { disabled: true }
					}
				}
			}}
		/>
		// end::row-action-state-example-2[]
	);
};
