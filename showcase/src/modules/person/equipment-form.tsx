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

import { LayoutGrid } from "@com.mgmtp.a12.widgets/widgets-core";

import { SimpleForm, NumberInput, StringInput, withSingleDocumentActivityContext } from "../simple-form/index.js";

const { Grid, Row, Column } = LayoutGrid;

export const EquipmentForm = withSingleDocumentActivityContext((props) => {
	return (
		<SimpleForm {...props} title="Equipment">
			<Grid>
				<Row>
					<Column size={{ sm: 12, md: 12, lg: 6 }}>
						<StringInput label="Equipment Name" path="Equipment.EquipmentName" />
					</Column>
					<Column size={{ sm: 12, md: 12, lg: 6 }}>
						<NumberInput label="Serial Number" path="Equipment.SerialNumber" />
					</Column>
					<Column size={{ sm: 12, md: 12, lg: 6 }}>
						<StringInput label="Category" path="Equipment.Category" />
					</Column>
					<Column size={{ sm: 12, md: 12, lg: 6 }}>
						<NumberInput label="Quantity" path="Equipment.EquipmentDetails.Quantity" />
					</Column>
					<Column size={{ sm: 12, md: 12, lg: 6 }}>
						<NumberInput label="Purchase Price" path="Equipment.EquipmentDetails.PurchasePrice" />
					</Column>
				</Row>
			</Grid>
		</SimpleForm>
	);
});
