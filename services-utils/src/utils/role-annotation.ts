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

import type { Model } from "@com.mgmtp.a12.base/base-model-api";

/**
 * Mirrors the build-time WCF converter chain (see showcase-models-converters) so
 * that runtime uploads (e2e overrides, ad-hoc seed) match what `:server:convertModels`
 * would emit. Currently only injects the `roles: anonymous` annotation required by
 * the showcase's anonymous auth setup. Extend here when new WCF converters are added.
 */
export function applyRoleAnnotation(model: Model): Model {
	const header = model?.header;

	const annotations = header.annotations ?? [];

	if (annotations.some((a) => a?.name === "roles")) {
		return model;
	}

	return { ...model, header: { ...header, annotations: [...annotations, { name: "roles", value: "anonymous" }] } };
}
