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

import Chance from "chance";

import { addRequest, linkEntities } from "../request.js";

function generateEmployee(chance: Chance.Chance) {
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

function generateDepartment(chance: Chance.Chance) {
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

function generateProject(chance: Chance.Chance) {
	const deadline = (chance.date({ min: new Date("2025-01-01"), max: new Date("2028-12-31") }) as Date)
		.toISOString()
		.substring(0, 10);

	return {
		Project: {
			ProjectName: `${chance.pickone(["Alpha", "Beta", "Gamma", "Delta", "Omega", "Nova", "Phoenix", "Atlas", "Titan", "Apex"])} ${chance.word({ capitalize: true })}`,
			Status: chance.pickone(["active", "completed", "planned"]),
			Budget: chance.floating({ min: 10000, max: 500000, fixed: 2 }),
			Deadline: deadline
		}
	};
}

const NUMBER_OF_EMPLOYEES = 12;
const NUMBER_OF_PROJECTS = 50;
const NUMBER_OF_PROJECTS_PER_EMPLOYEE = 45;

export function createEmployeesWithLinks() {
	const projectRequests = Array.from({ length: NUMBER_OF_PROJECTS }, (_, index) =>
		addRequest("ProjectDM", generateProject(new Chance(index + 200)), index)
	);

	const departmentRequests = Array.from({ length: 5 }, (_, index) =>
		addRequest("DepartmentDM", generateDepartment(new Chance(index + 100)), index)
	);

	const employeeRequests = Array.from({ length: NUMBER_OF_EMPLOYEES }, (_, index) => {
		const chance = new Chance(index);
		const employeeRequest = addRequest("EmployeeDM", generateEmployee(chance), index);

		const employeeProjectLinks = Array.from({ length: NUMBER_OF_PROJECTS_PER_EMPLOYEE }, (_, offset) =>
			linkEntities(`${index}-proj${offset}`, "EmployeeProjectRM", [
				{ role: "employee", docRef: `#{#${employeeRequest.id}.metadata.docRef}` },
				{
					role: "project",
					docRef: `#{#AddProjectDM${(index + offset) % NUMBER_OF_PROJECTS}.metadata.docRef}`
				}
			])
		);

		return [employeeRequest, ...employeeProjectLinks];
	}).flat();

	return [...projectRequests, ...departmentRequests, ...employeeRequests];
}
