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

import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import * as KernelUtils from "@com.mgmtp.a12.kernel/kernel-md-facade/a12internal";

import { DocumentModelUtils } from "../models/internal/shared.js";

import { getDateTimeFormat } from "./converter/index.js";

/** Abstraction for formatting dates using DocumentModel timezone. */
interface DocumentModelFormatter {
	formatDate(value: Date | undefined | null, format?: string): string | undefined;
}

/**
 * Factory for date formatters that respect the DocumentModel's timezone annotation.
 *
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export function createDateFormatter(documentModel: DocumentModel, fieldPath: string): DocumentModelFormatter {
	const timeZone = documentModel.content.modelConfig.timeZone;

	return {
		formatDate(value, format) {
			if (value === undefined || value === null) {
				return undefined;
			}

			return KernelUtils.formatDate(value, format ?? getFormatString(fieldPath, documentModel), timeZone);
		}
	};
}

/**
 * Resolve the date format string for a field from the DocumentModel.
 * @internal
 * */
export function getFormatString(fieldPath: string, documentModel: DocumentModel) {
	const field = DocumentModelUtils.findElementByPath(documentModel, fieldPath);

	if (field.type !== "Field") {
		throw new Error(`Cannot get formatString, element ${fieldPath} is not a field.`);
	}

	return getDateTimeFormat(field.fieldType);
}

/** @experimental until 40.0.0 - API may change without semver guarantees. */
export function formatRange(start?: string | null, end?: string | null) {
	const definedStart = start !== null && start !== undefined;
	const definedEnd = end !== null && end !== undefined;

	if (definedStart && !definedEnd) {
		return `≥ ${start}`;
	}

	if (!definedStart && definedEnd) {
		return `≤ ${end}`;
	}

	if (definedStart && definedEnd) {
		if (start === end) {
			return start;
		}

		return `${start} - ${end}`;
	}

	return null;
}

/**
 * Type guard that narrows null | undefined to a defined value.
 *
 * @experimental until 40.0.0 - API may change without semver guarantees.
 */
export function isDefined<T>(x: T | null | undefined): x is T {
	return x !== undefined && x !== null;
}
