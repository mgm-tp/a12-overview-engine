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

export function generateEmployee(chance: Chance.Chance) {
	const DateField = (chance.date({ min: new Date("01-01-1960"), max: new Date("01-01-2000") }) as Date)
		.toISOString()
		.substring(0, 10);

	return {
		Group: {
			StringField: `${chance.first()} ${chance.last()}`,
			NumberField: chance.integer({ min: 10000, max: 100000 }),
			ActualSalary: chance.integer({ min: 10000, max: 100000 }),
			ActualSalaryUnit: chance.pickone(["VND", "EUR", "USD"]),
			DateField: DateField
		}
	};
}

export function generateDepartment(chance: Chance.Chance) {
	const DateField = (chance.date({ min: new Date("01-01-1960"), max: new Date("01-01-2000") }) as Date).toISOString();

	return {
		...generateEmployee(chance),
		Department: {
			Code: chance.pickone(["A12OE", "A12TE", "A12RE", "A12CE", "A12FE"]),
			AllDataTypes: {
				number: chance.integer({ min: 10000, max: 100000 }),
				dateField: DateField.substring(0, 10),
				dateTimeField: DateField.substring(0, 19),
				timeField: DateField.substring(11, 19),
				name: chance.name()
			}
		}
	};
}
