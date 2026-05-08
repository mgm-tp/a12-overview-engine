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

/**
 * Extend global by properties that are normally available of browser window
 */
export namespace NodeJS {
	export interface Global extends Window {
		document: Document;
		window: Window & typeof globalThis;
		navigator: Navigator;
		requestAnimationFrame(callback: any): any;
		cancelAnimationFrame(callback: any): any;
	}
}

/**
 * Make extension accessible
 */
declare let global: NodeJS.Global;

global.requestAnimationFrame = function (callback) {
	return setTimeout(callback, 0);
};

window.requestAnimationFrame = function (callback) {
	return setTimeout(callback, 0);
};

global.cancelAnimationFrame = function (callback) {
	return setTimeout(callback, 0);
};

/**
 * Insert properties into global that would be accessible by window.
 * Due to fact that the interface has some properties that are read-only,
 * it is necessary to work on a variable of type any!
 */
Object.defineProperties(
	global,
	Object.getOwnPropertyNames(window)
		.filter((prop) => {
			const value = global[prop as keyof NodeJS.Global];

			return typeof value === "undefined";
		})
		.reduce((map, prop) => ({ ...map, [prop]: Object.getOwnPropertyDescriptor(window, prop) }), {})
);

/* eslint-disable @typescript-eslint/no-empty-function */
window.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
};
