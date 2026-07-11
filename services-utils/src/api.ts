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

import { handleSeed } from "./commands/seed.js";
import { handleClean } from "./commands/clean.js";
import { handleWaitOn } from "./commands/wait-on.js";
import { handleUpdateModel } from "./commands/update-model.js";
import { handleUploadModels } from "./commands/upload-models.js";

/**
 * Base options required for all commands that interact with the server
 */
export interface BaseOptions {
	/**
	 * The base URL of the server
	 * @default "http://localhost:8080"
	 */
	baseUrl?: string;
}

/**
 * Options for preset-based commands (seed, clean)
 */
export interface PresetOptions {
	/**
	 * List of presets to process. If not provided, defaults to 'all'.
	 * Available presets: 'all', 'product', 'person', 'bundle', 'employee', 'cdm'
	 */
	presets?: string | string[];
}

/**
 * Options for the seed command
 */
export interface SeedOptions extends BaseOptions, PresetOptions {
	/**
	 * Wait until the server is initialized before seeding
	 * @default false
	 */
	waitOn?: boolean;

	/**
	 * Only run the script when the target directory doesn't exist
	 */
	whenDirNotFound?: string;
}

/**
 * Options for the clean command
 */
export interface CleanOptions extends BaseOptions, PresetOptions {}

/**
 * Options for the wait-on command
 */
export interface WaitOnOptions extends BaseOptions {
	/**
	 * Timeout in milliseconds
	 */
	timeout?: number;
}

/**
 * Options for the upload-models command
 */
export interface UploadModelsOptions extends BaseOptions {
	/**
	 * Path to the models directory (relative path)
	 * @default "resources/models"
	 */
	path?: string;
}

/**
 * Options for the update-model command
 */
export interface UpdateModelOptions extends BaseOptions {
	/**
	 * The model to upload to the server
	 */
	model: Model;
}

/**
 * Seed data to the server for all or specific preset(s)
 *
 * @param options - Seeding options
 * @returns Promise that resolves when seeding is complete
 *
 * @example
 * ```typescript
 * // Seed all presets
 * await seed({ baseUrl: 'http://localhost:8080' });
 *
 * // Seed specific presets
 * await seed({
 *   baseUrl: 'http://localhost:8080',
 *   presets: ['product', 'person']
 * });
 *
 * // Wait for server initialization before seeding
 * await seed({
 *   baseUrl: 'http://localhost:8080',
 *   waitOn: true
 * });
 * ```
 */
export async function seed(options: SeedOptions = {}): Promise<void> {
	const opts = {
		baseUrl: "http://localhost:8080",
		presets: "all" as string | string[],
		waitOn: false,
		...options
	};

	return handleSeed(opts);
}

/**
 * Clean documents from the server for all or specific preset(s)
 *
 * @param options - Cleaning options
 * @returns Promise that resolves when cleaning is complete
 *
 * @example
 * ```typescript
 * // Clean all presets
 * await clean({ baseUrl: 'http://localhost:8080' });
 *
 * // Clean specific presets
 * await clean({
 *   baseUrl: 'http://localhost:8080',
 *   presets: ['product', 'person']
 * });
 * ```
 */
export async function clean(options: CleanOptions = {}): Promise<void> {
	const opts = {
		baseUrl: "http://localhost:8080",
		presets: "all" as string | string[],
		...options
	};

	return handleClean(opts);
}

/**
 * Wait until the server starts and is ready
 *
 * @param options - Wait-on options
 * @returns Promise that resolves when server is ready
 *
 * @example
 * ```typescript
 * // Wait for server with default timeout
 * await waitOn({ baseUrl: 'http://localhost:8080' });
 *
 * // Wait with custom timeout
 * await waitOn({
 *   baseUrl: 'http://localhost:8080',
 *   timeout: 60000
 * });
 * ```
 */
export async function waitOn(options: WaitOnOptions = {}): Promise<void> {
	const opts = {
		baseUrl: "http://localhost:8080",
		...options
	};

	return handleWaitOn(opts);
}

/**
 * Upload all models from the specified directory to the server
 *
 * @param options - Upload options
 * @returns Promise that resolves when upload is complete
 *
 * @example
 * ```typescript
 * // Upload models from default path
 * await uploadModels({ baseUrl: 'http://localhost:8080' });
 *
 * // Upload models from custom path
 * await uploadModels({
 *   baseUrl: 'http://localhost:8080',
 *   path: 'custom/models/path'
 * });
 * ```
 */
export async function uploadModels(options: UploadModelsOptions = {}): Promise<void> {
	const opts = {
		baseUrl: "http://localhost:8080",
		path: "resources/models",
		...options
	};

	return handleUploadModels(opts);
}

/**
 * Upload a single model configuration to the server
 *
 * @param options - Update model options
 * @returns Promise that resolves when the model is updated
 *
 * @example
 * ```typescript
 * // Update a specific model configuration
 * await updateModel({
 *   baseUrl: 'http://localhost:8080',
 *   model: myModelConfiguration
 * });
 * ```
 */
export async function updateModel(options: UpdateModelOptions): Promise<void> {
	const opts = {
		baseUrl: "http://localhost:8080",
		...options
	};

	return handleUpdateModel(opts);
}

/**
 * Complete workflow: wait for server, clean data, and seed new data
 *
 * @param options - Seed options (waitOn will be set to true automatically)
 * @returns Promise that resolves when the entire workflow is complete
 *
 * @example
 * ```typescript
 * // Run complete workflow
 * await resetAndSeed({
 *   baseUrl: 'http://localhost:8080',
 *   presets: ['product', 'person']
 * });
 * ```
 */
export async function resetAndSeed(options: SeedOptions = {}): Promise<void> {
	return seed({ ...options, waitOn: true });
}
