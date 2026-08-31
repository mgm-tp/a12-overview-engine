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

// tag::customLocalization[]
import * as React from "react";

import { OverviewEngine } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import {
	type Locale,
	defaultDataFormats,
	defaultValueConversion,
	defaultLocalizerFactory
} from "@com.mgmtp.a12.utils/utils-localization";
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";

export const Application: React.ComponentType<{ engineProps: OverviewEngine.Props }> = ({ engineProps }) => {
	const localizerContextValue = React.useMemo(() => {
		const customResourceKeys = { overviewEngine: { rowAction: { confirmation: { ok: "Confirm" } } } };

		const locale: Locale = { language: "en", country: "US" };
		const dataFormats = defaultDataFormats(locale);
		const conversion = defaultValueConversion(dataFormats);
		const localizer = defaultLocalizerFactory({
			locale,
			dataFormats,
			conversion,
			translationSource: { en_US: customResourceKeys }
		});

		return { locale, dataFormats, localizer, conversion };
	}, []);

	return (
		<LocalizerContext.Provider value={localizerContextValue}>
			<OverviewEngine {...engineProps} />
		</LocalizerContext.Provider>
	);
};

// end::customLocalization[]
