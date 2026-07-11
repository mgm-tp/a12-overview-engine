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
import { useSelector } from "react-redux";

import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import { DataServicesSelectors } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { RESOURCE_KEYS } from "../../services/localization/index.js";
import { useOverviewEngineInternalContext } from "../context/overview-engine-internal-context.js";
import { OverviewEngineInternalConstants, ENABLE_APPROXIMATE_MATCH_SEARCH_ANNOTATION } from "../../shared/constants.js";

/**
 * Whether the field uses Data Services simple search (`enable_approximate_match_search`).
 *
 * @internal
 */
export function useSubstringSearchField(path: ModelPath, modelId?: string): boolean {
	const documentModelService = useOverviewEngineInternalContext((context) => context.documentModelService);

	return React.useMemo(() => {
		try {
			const element = documentModelService.getByPath(path, modelId);

			return (
				element.annotations?.find(({ name }) => name === ENABLE_APPROXIMATE_MATCH_SEARCH_ANNOTATION)?.value === "true"
			);
		} catch {
			return false;
		}
	}, [documentModelService, modelId, path]);
}

/**
 * Reads the Data Services minimum searchable token size as a positive number, or `undefined`
 * when it is unset or not a positive number. Shared by all string search inputs.
 *
 * @internal
 */
export function useMinSearchTokenSize(): number | undefined {
	const minSearchableTokenSize = useSelector(
		DataServicesSelectors.configurationByKey(OverviewEngineInternalConstants.MIN_SEARCH_TOKEN_SIZE_KEY)
	);

	return React.useMemo(() => {
		if (minSearchableTokenSize === undefined) {
			return undefined;
		}

		const minTokenSize = Number(minSearchableTokenSize);

		return Number.isFinite(minTokenSize) && minTokenSize > 0 ? minTokenSize : undefined;
	}, [minSearchableTokenSize]);
}

/**
 * Builds the localizable "enter at least N characters" hint for the given minimum token size.
 *
 * @internal
 */
export function minSearchTokenSizeHint(minTokenSize: number): Localizable {
	return {
		key: RESOURCE_KEYS.overviewEngine.searchBar.searchButtonMinLengthTitle,
		args: { count: { type: "plain", value: String(minTokenSize) } }
	};
}

/**
 * Validator yielding a hint when a whitespace-separated token is below the minimum searchable
 * token size. Pass `enabled: false` to disable (non-search filters); it then always returns
 * `undefined`. Used by the text-field string filter, whose multi-word input is tokenized into
 * a conjunction of Data Services simple searches.
 *
 * @internal
 */
export function useMinSearchTokenSizeValidator(enabled: boolean): (value?: string) => Localizable | undefined {
	const minTokenSize = useMinSearchTokenSize();

	return React.useCallback(
		(value?: string) => {
			if (!enabled || !value || minTokenSize === undefined) {
				return undefined;
			}

			const tokens = value.split(/\s+/).filter((token) => token.length > 0);

			if (tokens.length === 0 || tokens.every((token) => token.length >= minTokenSize)) {
				return undefined;
			}

			return minSearchTokenSizeHint(minTokenSize);
		},
		[enabled, minTokenSize]
	);
}
