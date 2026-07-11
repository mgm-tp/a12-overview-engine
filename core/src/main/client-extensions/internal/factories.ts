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

import type React from "react";
import type { Middleware } from "redux";

import type { View, Module, DataProvider, ApplicationSaga, ActivityReducers } from "@com.mgmtp.a12.client/client-core";

import type { MiddlewareOptions } from "../../store/index.js";

import { OverviewEngineContainer } from "./view/container.js";
import { defaultDataLoader } from "./data-loader/default-data-loader.js";
import { createOverviewEngineDataReducers } from "./data-reducers/index.js";
import type { OverviewEngineDataLoader } from "./data-loader/data-loader.js";
import { createApplicationSagas as createApplicationSagasInternal } from "./sagas.js";
import { OverviewEngineDataProvider } from "./providers/overview-engine-data-provider.js";
import { EnumeratedStringDataProvider } from "./providers/enumerated-string-data-provider.js";
import type { DataProvidersConfig as InternalDataProvidersConfig } from "./providers/types.js";
import {
	createOverviewEngineAdapterMiddleware,
	createOverviewEngineDataServicesMonitoredPropertiesMiddleware
} from "./middlewares.js";

export namespace OverviewEngineFactories {
	export type ModuleConfig = InternalDataProvidersConfig;
	/** @deprecated use {@link OverviewEngineFactories.ModuleConfig} */
	export type DataProvidersConfig = InternalDataProvidersConfig;

	/**
	 * This function is used to create a module for the Overview Engine client extension.
	 *
	 * @param config - An object containing the parameters for creating the module.
	 *
	 * @returns - An object representing the Overview Engine module.
	 */
	export function createModule(config?: ModuleConfig): Module {
		return {
			id: "OverviewEngineClientModule",
			dataProviders: () => createDataProviders(undefined, config),
			dataReducers: createDataReducers,
			middlewares: () => createMiddlewares(config),
			views: () => viewComponentProvider
		};
	}

	export const createMiddlewares: (options?: MiddlewareOptions) => Middleware[] = (options) => [
		createOverviewEngineAdapterMiddleware(options),
		createOverviewEngineDataServicesMonitoredPropertiesMiddleware()
	];

	/**
	 * This function is used to create the initial set of data providers for the Overview Engine module.
	 */
	export const createDataProviders: (
		dataLoader?: OverviewEngineDataLoader,
		config?: InternalDataProvidersConfig
	) => DataProvider[] = (dataLoader = defaultDataLoader, config) => [
		new EnumeratedStringDataProvider(dataLoader, config),
		new OverviewEngineDataProvider(dataLoader, config)
	];

	export const dataLoader: OverviewEngineDataLoader = defaultDataLoader;

	export const createDataReducers: () => ActivityReducers.DataReducer[] = createOverviewEngineDataReducers;

	export const createApplicationSagas: () => ApplicationSaga.Descriptor[] = createApplicationSagasInternal;

	export type ViewComponentProps = OverviewEngineContainer.Props;
	export const ViewComponent: React.ComponentType<ViewComponentProps> & { handleProgressIndicator?: boolean } =
		OverviewEngineContainer;

	ViewComponent.handleProgressIndicator = true;

	export const viewComponentProvider = (componentName: string): React.ComponentType<View> | undefined => {
		if (componentName === "OverviewEngine") {
			return OverviewEngineContainer;
		}

		return undefined;
	};
}
