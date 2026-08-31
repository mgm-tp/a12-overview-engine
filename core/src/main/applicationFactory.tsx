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

// eslint-disable check-file/filename-naming-convention

import {
	addView,
	type View,
	modifyView,
	setConfigured,
	addDataHandlers,
	addDataReducers,
	combineFeatures,
	addPlatformSagas,
	type RequireFeatures,
	addAdditionalMiddlewares,
	type A12ApplicationConfig,
	type ApplicationWithConfiguredFeature
} from "@com.mgmtp.a12.client/client-core";
import { addSupportedModelVersion } from "@com.mgmtp.a12.client/client-core/modelLoader";

import { OverviewEngineFactories, type OverviewEngineDataLoader } from "./client-extensions/index.js";
import { SUPPORTED_MODEL_VERSIONS } from "./supported-model-version.js";

const MODEL_TYPE = "overview";

/**
 * We use module augmentation to extend the A12ApplicationConfig type with more options
 * for users, this is applied once they import anything from this file
 * we must use the "internal" path as TS does not support module augmentation for re-exported types
 * See https://github.com/microsoft/TypeScript/issues/12607
 */
declare module "@com.mgmtp.a12.client/client-core" {
	interface A12ApplicationConfig {
		/** Overview Engine configuration. Omit to skip Overview Engine integration entirely. */
		readonly overviewEngine?: {
			/** Engine-wide settings consumed by data providers and middleware (e.g. `filterStateSelectors`). */
			readonly moduleConfig?: OverviewEngineFactories.ModuleConfig;
			/** Default props applied to every `OverviewEngine` view rendered by the host app. */
			readonly viewConfig?: Partial<Omit<OverviewEngineFactories.ViewComponentProps, keyof View>>;
			/** Custom data loader. Falls back to the engine's default loader when omitted. */
			readonly dataLoader?: OverviewEngineDataLoader;
		};
	}
}

/**
 * This describes the overviewEngine must not but exist yet.
 * @experimental
 */
export type ApplicationWithOverviewEngineConfig = RequireFeatures<
	A12ApplicationConfig,
	{ overviewEngine?: never; modelLoader?: never; dataServicesConfig: true }
>;

/**
 * @experimental
 */
export const withOverviewEngineDataHandlers = <T extends ApplicationWithOverviewEngineConfig>(cfg: T) =>
	addDataHandlers<T>(
		...OverviewEngineFactories.createDataProviders(cfg.overviewEngine?.dataLoader, cfg.overviewEngine?.moduleConfig)
	)(cfg);

/**
 * @experimental
 */
export const withOverviewEngineDataReducers = <T extends ApplicationWithOverviewEngineConfig>(cfg: T) =>
	addDataReducers<T>(...OverviewEngineFactories.createDataReducers())(cfg);

/**
 * @experimental
 */
export const withOverviewEnginePlatformSagas = <T extends ApplicationWithOverviewEngineConfig>(cfg: T) =>
	addPlatformSagas<T>(...OverviewEngineFactories.createApplicationSagas())(cfg);

/**
 * @experimental
 */
export const withOverviewEngineMiddlewares = <T extends ApplicationWithOverviewEngineConfig>(cfg: T) =>
	addAdditionalMiddlewares<T>(...OverviewEngineFactories.createMiddlewares(cfg.overviewEngine?.moduleConfig))(cfg);

/**
 * @experimental
 */
export const withOverviewEngineView = <T extends ApplicationWithOverviewEngineConfig>(cfg: T) => {
	return addView<T>("OverviewEngine", OverviewEngineFactories.ViewComponent)(cfg);
};

/**
 * @experimental
 */
export const withConfiguredOverviewEngine = <T extends ApplicationWithOverviewEngineConfig>(cfg: T) => {
	if (!cfg.overviewEngine?.viewConfig) {
		return cfg;
	}

	return modifyView<T>("OverviewEngine", (Component) => {
		return (props) => <Component {...props} {...cfg.overviewEngine?.viewConfig} />;
	})(cfg);
};

/**
 * @experimental
 */
export const withOverviewModelSupport = <T extends ApplicationWithOverviewEngineConfig>(cfg: T) =>
	combineFeatures(addSupportedModelVersion(MODEL_TYPE, SUPPORTED_MODEL_VERSIONS))(cfg);

/**
 * @experimental
 */
export const withOverviewEngine = <T extends ApplicationWithOverviewEngineConfig>(
	cfg: T
): ApplicationWithConfiguredFeature<T, "overviewEngine"> =>
	setConfigured<T, "overviewEngine">("overviewEngine")(
		combineFeatures(
			withOverviewEngineDataHandlers,
			withOverviewEngineDataReducers,
			withOverviewEngineMiddlewares,
			withOverviewEnginePlatformSagas,
			withOverviewEngineView,
			withConfiguredOverviewEngine,
			withOverviewModelSupport
		)(cfg)
	);
