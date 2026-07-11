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

/**
 * Clones effective filter options into a fresh, alias-free tree before the
 * snapshot hash so equal values always hash equally. `object-hash` serializes a
 * repeated object reference as a back-reference, so a default that aliases one
 * shared input-state across slots hashes differently once an edit replaces one
 * slot — wrongly leaving "Apply All" enabled. Removing the aliasing fixes that.
 */
export function normalizeFilterOptions(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(normalizeFilterOptions);
	}

	if (value !== null && typeof value === "object") {
		const result: Record<string, unknown> = {};

		for (const [key, entry] of Object.entries(value)) {
			result[key] = normalizeFilterOptions(entry);
		}

		return result;
	}

	return value;
}
