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

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { type View } from "@com.mgmtp.a12.client/client-core";
import {
	type ComponentMap,
	DefaultComponentMap,
	useOverviewEngineContext
} from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { ShowcaseOverview } from "../showcase-overview/showcase-overview.js";

export const MobileSupportCardView = (props: View) => <MobileSupportExpression {...props} cardView />;

export const MobileSupportExpression = (props: View & { cardView?: boolean }) => (
	<ShowcaseOverview {...props} componentMap={createMobileComponentMap()} />
);

MobileSupportExpression.handleProgressIndicator = ShowcaseOverview.handleProgressIndicator;

function createMobileComponentMap(): ComponentMap {
	return {
		...DefaultComponentMap,
		Heading: (props) => {
			const smallView = useOverviewEngineContext((context) => context.smallView);

			const additionalPrefixes = smallView ? (
				<DefaultComponentMap.MultiSelectionPanel key="multiSelectionPanel" />
			) : null;

			return <DefaultComponentMap.Heading {...props} additionalPrefixes={additionalPrefixes} />;
		},
		ReferenceCell: (props) => {
			const { columnModel, row } = props;

			if (columnModel.id === "column-6aac6" && "product" in row) {
				const product = row.product as object;

				if (product && "targetGroup" in product && product.targetGroup === "women") {
					return <Icon>attach_file</Icon>;
				}

				return null;
			}

			return <DefaultComponentMap.ReferenceCell {...props} />;
		}
	};
}
