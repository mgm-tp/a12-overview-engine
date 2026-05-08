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

// These imports must stay at the top because they define globals
import "./config/wdyr.js";
import "./config/reselect.js";
import "./config/logging.js";
import "./config/server-connector.js";

import * as React from "react";
import type { Store } from "redux";
import { Provider } from "react-redux";
import ReactDOM from "react-dom/client";

import "@com.mgmtp.a12.widgets/widgets-core/lib/theme/basic.css";
import { withDirtyHandling } from "@com.mgmtp.a12.client/client-core/dirtyHandling";
import { addDeepLinkingSagas } from "@com.mgmtp.a12.client/client-core/deepLinking";
import { withOverviewEngine } from "@com.mgmtp.a12.overviewengine/overviewengine-core";
import { withPlatformModelLoader } from "@com.mgmtp.a12.client/client-core/modelLoader";
import { withDataServicesConfiguration } from "@com.mgmtp.a12.client/client-core/dataServicesAdapter";
import {
	withModel,
	ModelActions,
	addCustomSagas,
	addDataHandlers,
	combineFeatures,
	ModuleRegistryProvider,
	type A12ApplicationConfig,
	createA12ApplicationSetup
} from "@com.mgmtp.a12.client/client-core";

import model from "../resources/models/showcaseAM.json" with { type: "json" };

import { Modules } from "./modules/index.js";
import { withTheme } from "./config/themes.js";
import { handleErrorSaga } from "./modules/common/saga.js";
import { withNotification } from "./config/notification.js";
import { withSizeDetector } from "./config/size-detector.js";
import { SimpleFormFactories } from "./modules/simple-form/index.js";
import { fetchModelGraph, withReduxDevtool } from "./config/redux.js";
import { LOCALES, withLocalizationProvider } from "./config/localization.js";
import { withApplicationFrameLayout } from "./config/application-frame-layout.js";

Modules.forEach((module) => ModuleRegistryProvider.getInstance().addModule(module));

const initialConfig: A12ApplicationConfig = {
	config: {},
	localization: { supportedLocales: LOCALES },
	initialActions: ({ dispatch }: Store) => fetchModelGraph(dispatch),
	deepLinking: { config: { applyTriggers: [ModelActions.setModelGraph] } }
};

const { store, initialActions, Component } = createA12ApplicationSetup(
	combineFeatures(
		withModel(model),
		withDataServicesConfiguration,
		withOverviewEngine,

		withPlatformModelLoader,
		combineFeatures(
			addCustomSagas(handleErrorSaga),
			addDataHandlers(SimpleFormFactories.createDataLoader()),
			withTheme,
			withSizeDetector,
			withLocalizationProvider,
			withNotification
		),
		combineFeatures(
			/* Nice to have extensions */
			withDirtyHandling,
			addDeepLinkingSagas,
			withReduxDevtool,
			withApplicationFrameLayout
		)
	)(initialConfig)
);

initialActions().then(() => {
	const root = document.getElementById("root");

	if (root) {
		ReactDOM.createRoot(root).render(
			<React.StrictMode>
				<Provider store={store}>{Component}</Provider>
			</React.StrictMode>
		);
	}
});
