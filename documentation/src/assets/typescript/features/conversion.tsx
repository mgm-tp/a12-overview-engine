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

// tag::main[]
import * as React from "react";

import { format } from "date-fns/format";

import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import {
	defaultDataFormats,
	type ValueConversion,
	defaultValueConversion,
	defaultLocalizerFactory
} from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext, type LocalizerContextProps } from "@com.mgmtp.a12.utils/utils-localization-react";
import { convertMomentToDateFnsFormat } from "@com.mgmtp.a12.widgets/widgets-core";

export const LocalizationProvider: React.FC = () => {
	const locale = useProjectLocale();

	const localizerContextValue: LocalizerContextProps = React.useMemo(() => {
		const dataFormats = defaultDataFormats(locale);
		const defaultConversion = defaultValueConversion(dataFormats);

		const conversion: ValueConversion = {
			...defaultConversion,
			formatValue(value, outputFormat) {
				if (
					value instanceof Date &&
					outputFormat.modelId === "PersonDM" &&
					outputFormat.modelPath &&
					ModelPath.equal(outputFormat.modelPath, targetFieldPath)
				) {
					// below is a date format using moment's format, to use with date-fns we can use the widgets utility
					return format(value, convertMomentToDateFnsFormat("dd MMM YYYY"));
				}

				return defaultConversion.formatValue(value, outputFormat);
			}
		};

		const localizer = defaultLocalizerFactory({ locale, conversion, dataFormats });

		return { locale, dataFormats, conversion, localizer };
	}, [locale]);

	return <LocalizerContext.Provider value={localizerContextValue} />;
};

// end::main[]

function useProjectLocale() {
	return { language: "en", country: "US" };
}

const targetFieldPath = [{ elementName: "PersonDetails" }, { elementName: "DateOfBirth" }];
