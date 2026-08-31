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

import type { RelationshipJsonRpc2request } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { addRequest, linkEntities } from "../request.js";

function generatePerson(chance: Chance.Chance) {
	return {
		Person: {
			PersonalData: {
				FirstName: chance.first(),
				LastName: chance.last(),
				PlaceOfBirth: chance.city(),
				Nationality: chance.pickone(["German", "English", "French", "Spanish"]),
				Salary: chance.integer({ min: 1000, max: 10000 })
			}
		}
	};
}

function generateContract(chance: Chance.Chance) {
	const DateField = (chance.date({ min: new Date("01-01-1960"), max: new Date("01-01-2000") }) as Date).toISOString();

	return {
		Contract: {
			Weekly_Work_Hours: chance.integer({ min: 20, max: 40 }),
			domainTest: {
				string: chance.string({ length: 10 }),
				integer: chance.integer({ min: 1, max: 1000 }),
				date: DateField.substring(0, 10),
				dateTime: DateField.substring(0, 19),
				time: DateField.substring(11, 19),
				confirm: chance.bool() ? true : undefined,
				boolean: chance.bool()
			}
		}
	};
}

function generateEquipment(chance: Chance.Chance) {
	const categories = ["Laptop", "Monitor", "Phone", "Printer", "Desk", "Headset"];
	const conditions = ["New", "Good", "Fair", "NeedsRepair"];

	const assignedDate = (chance.date({ min: new Date("2005-01-01"), max: new Date("2024-12-31") }) as Date)
		.toISOString()
		.substring(0, 10);

	return {
		Equipment: {
			EquipmentName: chance.company(),
			SerialNumber: chance.integer({ min: 1, max: 9999 }),
			IsActive: chance.bool({ likelihood: 80 }),
			Category: chance.pickone(categories),
			Condition: chance.pickone(conditions),
			EquipmentDetails: {
				Quantity: chance.integer({ min: 1, max: 50 }),
				PurchasePrice: chance.floating({ min: 50, max: 5000, fixed: 2 })
			},
			domainTest: {
				string: chance.sentence({ words: 3 }),
				date: assignedDate,
				enumeration: chance.pickone(["enum1", "enum2"]),
				boolean: chance.bool()
			}
		}
	};
}

function generatePersonEquipmentAdditionalFields(chance: Chance.Chance) {
	return {
		AdditionalLinkFields: {
			UsageRate: chance.integer({ min: 1, max: 100 }) // percentage
		}
	};
}

function generatePersonDepartmentAdditionalFields(chance: Chance.Chance) {
	const joinDate = (chance.date({ min: new Date("2015-01-01"), max: new Date("2025-12-31") }) as Date)
		.toISOString()
		.substring(0, 10);

	return {
		AdditionalLinkFields: {
			JoinDate: joinDate
		}
	};
}

const DEPARTMENTS = [
	{ name: "Engineering", code: "ENG", floor: 3 },
	{ name: "Sales", code: "SAL", floor: 1 },
	{ name: "Marketing", code: "MKT", floor: 2 },
	{ name: "HR", code: "HR", floor: 4 },
	{ name: "Finance", code: "FIN", floor: 5 },
	{ name: "Operations", code: "OPS", floor: 0 }
] as const;

function generateDepartment(dept: (typeof DEPARTMENTS)[number]) {
	return {
		Department: {
			Name: dept.name,
			Code: dept.code,
			Floor: dept.floor
		}
	};
}

export function createPeopleWithLinks() {
	const SIZE = 30;
	const NUMBER_OF_EQUIPMENT = 15;
	const NUMBER_OF_EQUIPMENT_PER_PERSON = 8;
	const NUMBER_OF_DUPLICATE_EQUIPMENT_PER_PERSON = 2;

	const equipmentRequests = Array.from({ length: NUMBER_OF_EQUIPMENT }, (_, index) => {
		const chance = new Chance(index);

		return addRequest("EquipmentDM", generateEquipment(chance), index);
	});

	const departmentRequests = DEPARTMENTS.map((dept, index) =>
		addRequest("PersonDepartmentDM", generateDepartment(dept), index)
	);

	const linkDeptWithOtherDeptRequests: RelationshipJsonRpc2request.AddLinkJsonRpc2request[] = Array.from(
		{ length: DEPARTMENTS.length - 1 },
		(_, i) =>
			linkEntities(`deptLink${i}`, "DepartmentDepartmentRM", [
				{ role: "parent", docRef: `#{#${departmentRequests[i].id}.metadata.docRef}` },
				{ role: "child", docRef: `#{#${departmentRequests[i + 1].id}.metadata.docRef}` }
			])
	);

	const personRequests = Array.from({ length: SIZE }, (_, index) => {
		const chance = new Chance(index);

		const person = generatePerson(chance);
		const contract = generateContract(chance);

		const personRequest = addRequest("PersonDM", person, index);
		const contractRequest = addRequest("ContractDM", contract, index);

		const personContractLink = linkEntities(`${index}`, "PersonContractRM", [
			{ role: "person", docRef: `#{#${personRequest.id}.metadata.docRef}` },
			{ role: "contract", docRef: `#{#${contractRequest.id}.metadata.docRef}` }
		]);

		const personDepartmentLink = linkEntities(
			`dept${index}`,
			"PersonDepartmentRM",
			[
				{ role: "person", docRef: `#{#${personRequest.id}.metadata.docRef}` },
				{ role: "department", docRef: `#{#${departmentRequests[index % DEPARTMENTS.length].id}.metadata.docRef}` }
			],
			generatePersonDepartmentAdditionalFields(new Chance(index + 100))
		);

		const personEquipmentLinks = Array.from({ length: NUMBER_OF_EQUIPMENT_PER_PERSON }, (_, offset) =>
			linkEntities(
				`${index}-equip${offset}`,
				"PersonEquipmentRM",
				[
					{ role: "person", docRef: `#{#${personRequest.id}.metadata.docRef}` },
					{
						role: "equipment",
						docRef: `#{#${equipmentRequests[(index + offset) % NUMBER_OF_EQUIPMENT].id}.metadata.docRef}`
					}
				],
				generatePersonEquipmentAdditionalFields(new Chance(index + offset))
			)
		);

		const duplicateEquipmentLinks = Array.from({ length: NUMBER_OF_DUPLICATE_EQUIPMENT_PER_PERSON }, (_, dupIdx) =>
			linkEntities(
				`${index}-equip${dupIdx}-dup`,
				"PersonEquipmentRM",
				[
					{ role: "person", docRef: `#{#${personRequest.id}.metadata.docRef}` },
					{
						role: "equipment",
						docRef: `#{#${equipmentRequests[dupIdx % NUMBER_OF_EQUIPMENT].id}.metadata.docRef}`
					}
				],
				generatePersonEquipmentAdditionalFields(new Chance(index * 100 + dupIdx))
			)
		);

		return [
			personRequest,
			contractRequest,
			personContractLink,
			personDepartmentLink,
			...personEquipmentLinks,
			...duplicateEquipmentLinks
		];
	}).flat();

	const departmentLeaderLinks = departmentRequests.map((deptReq, index) => {
		const leaderPersonId = `AddPersonDM${index}`;

		return linkEntities(`deptLeader${index}`, "DepartmentLeaderRM", [
			{ role: "department", docRef: `#{#${deptReq.id}.metadata.docRef}` },
			{ role: "leader", docRef: `#{#${leaderPersonId}.metadata.docRef}` }
		]);
	});

	return [
		...departmentRequests,
		...equipmentRequests,
		...linkDeptWithOtherDeptRequests,
		...personRequests,
		...departmentLeaderLinks
	];
}
