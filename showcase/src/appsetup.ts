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

import { DeepLinkingFactories } from "@com.mgmtp.a12.client/client-core/deepLinking";
import { DirtyHandlingFactories } from "@com.mgmtp.a12.client/client-core/dirtyHandling";
import { DataServicesReducerMap } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { OverviewEngineFactories } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import { createPlatformServerModelLoader } from "@com.mgmtp.a12.client/client-core/modelLoader";
import {
	ModelActions,
	ApplicationFactories,
	type ApplicationSetup,
	ModuleRegistryProvider,
	APPLICATION_MODEL_PLACEHOLDER
} from "@com.mgmtp.a12.client/client-core";

import { Modules } from "./modules/index.js";
import { createComposeEnhancer } from "./config/redux.js";
import { handleErrorSaga } from "./modules/common/saga.js";
import { initializationMiddleware } from "./config/init.js";
import { SimpleFormFactories } from "./modules/simple-form/index.js";
import { customRequestSelectorMap } from "./config/request-selector-map.js";

export function setup(): ApplicationSetup {
	ModuleRegistryProvider.getInstance().addModule(
		OverviewEngineFactories.createModule({
			requestSelectorMap: customRequestSelectorMap,
			infiniteScroll: { pageSize: 20 }
		})
	);
	Modules.forEach((module) => ModuleRegistryProvider.getInstance().addModule(module));

	return ApplicationFactories.createApplicationSetup({
		model: APPLICATION_MODEL_PLACEHOLDER, // not used, DynamicConfiguration provides the model
		dataHandlers: [SimpleFormFactories.createDataLoader()],
		modelLoader: createPlatformServerModelLoader(),
		additionalMiddlewares: [initializationMiddleware],
		overridePlatformSagas: [
			...OverviewEngineFactories.createApplicationSagas(),
			...DirtyHandlingFactories.createSagas()
		],
		customSagas: [
			...DeepLinkingFactories.createSagas({ applyTriggers: [ModelActions.setModelGraph] }),
			handleErrorSaga
		],
		reducerMap: { ...DataServicesReducerMap },
		composeEnhancer: createComposeEnhancer()
	});
}
