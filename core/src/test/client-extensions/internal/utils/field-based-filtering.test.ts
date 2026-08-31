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

import { it, expect, describe } from "vitest";

import { Query } from "@com.mgmtp.a12.dataservices/dataservices-access";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { FieldBasedFiltering } from "../../../../main/client-extensions/internal/utils/field-based-filtering.js";
import type { OverviewModel } from "../../../../main/overview-model.js";
import type { ModelsState } from "../../../../main/store/index.js";
import type { OverviewEngineApi } from "../../../../main/view/api.js";
import { createGroup, createModelsState, createDocumentModel, createEnumerationField } from "../../../utils.js";

function createModelsStateWithElements(documentElements: DocumentModel.Element[]): ModelsState {
	const documentModel = createDocumentModel(documentElements);

	return createModelsState({
		overviewModel: {
			header: { id: "TestOM", modelType: "overview" } as unknown as OverviewModel["header"],
			content: { configuration: { enableFilter: true }, columns: [], rowActionGroup: {} }
		},
		documentModel,
		modelGraph: {
			documentModels: [{ relations: null, subTypes: null, modelId: documentModel.header.id }],
			composeDocumentModels: [],
			genericModels: [],
			relationshipModels: []
		}
	} as Partial<ModelsState>);
}

describe("com.mgmtp.a12.overview-engine.client-extensions.utils.field-based-filtering", () => {
	describe("Enumeration filter uses raw enum values", () => {
		// createEnumerationField() creates field with values: "1" (label "One"), "2" (label "Two"), "3" (label "Three")
		const modelsState = createModelsStateWithElements([createEnumerationField()]);
		const fieldKey = "/root/value";

		it("should use raw enum value instead of localized label", () => {
			const filters: OverviewEngineApi.FilterMap = {
				[fieldKey]: { filterType: "Enumeration", criteria: { selectedValues: ["1"] } }
			};

			const [result] = FieldBasedFiltering.toOperators(filters, modelsState);

			// Value should be "1" (raw), not "One" (localized label)
			expect(result).toEqual({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: fieldKey,
				value: "1",
				caseSensitive: true
			});
		});

		it("should use raw enum values for multiple selections", () => {
			const filters: OverviewEngineApi.FilterMap = {
				[fieldKey]: { filterType: "Enumeration", criteria: { selectedValues: ["1", "2"] } }
			};

			const [result] = FieldBasedFiltering.toOperators(filters, modelsState);

			expect(result).toEqual({
				operator: Query.OPERATORS.OR_OPERATOR,
				operands: [
					{ operator: Query.OPERATORS.EXACT_MATCH_OPERATOR, field: fieldKey, value: "1", caseSensitive: true },
					{ operator: Query.OPERATORS.EXACT_MATCH_OPERATOR, field: fieldKey, value: "2", caseSensitive: true }
				]
			});
		});
	});

	describe("MultiSelect filter uses raw enum values", () => {
		const multiSelectGroup = createGroup({
			id: "tags",
			repeatability: 999999,
			usageType: "multi-select",
			elements: [createEnumerationField()]
		});
		const modelsState = createModelsStateWithElements([multiSelectGroup]);
		const fieldKey = "/root/tags";

		it("should use raw enum value instead of localized label", () => {
			const filters: OverviewEngineApi.FilterMap = {
				[fieldKey]: {
					filterType: "MultiSelect",
					criteria: { selectedValues: ["1"], operation: Query.OPERATORS.OR_OPERATOR }
				}
			};

			const [result] = FieldBasedFiltering.toOperators(filters, modelsState);

			// Value should be "1" (raw), not "One" (localized label)
			expect(result).toEqual({
				operator: Query.OPERATORS.EXACT_MATCH_OPERATOR,
				field: `${fieldKey}/value`,
				value: "1",
				caseSensitive: true
			});
		});
	});
});
