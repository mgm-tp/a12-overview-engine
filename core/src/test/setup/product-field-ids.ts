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

export const ProductFieldIds = {
	releaseMonthYear: { id: "field_d4c4b", path: "/product/releaseMonthYear" },
	releaseYear: { id: "field_d4c4c", path: "/product/releaseYear" },
	releaseMonth: { id: "field_d4c4d", path: "/product/releaseMonth" },
	releaseMonthDay: { id: "field_d4c4e", path: "/product/releaseMonthDay" },
	saleYearRange: { id: "F100", path: "/product/saleYearRange" },
	saleMonthRange: { id: "F101", path: "/product/saleMonthRange" },
	saleYearMonthRange: { id: "F102", path: "/product/saleYearMonthRange" },
	saleDateRange: { id: "F103", path: "/product/saleDateRange" },
	saleMonthDayRange: { id: "F104", path: "/product/saleMonthDayRange" },
	number: { id: "F3", path: "/product/number" },
	externalNumberSystem: { id: "F5", path: "/product/externalNumber/system" },
	externalNumberNumber: { id: "F6", path: "/product/externalNumber/number" },
	dateField: { id: "F50", path: "/product/dateField" },
	dateTimeField: { id: "F51", path: "/product/dateTimeField" },
	timeField: { id: "F52", path: "/product/timeField" },
	name: { id: "F7", path: "/product/name" },
	description: { id: "F8", path: "/product/description" },
	meta: { id: "F9", path: "/product/meta" },
	metaItem: { id: "field_f866d", path: "/product/meta/item" },
	searchKeyword: { id: "F11", path: "/product/searchKeywords/searchKeyword" },
	mediaFileType: { id: "F19", path: "/product/mediaFiles/mediaFile/type" },
	mediaFileMimeType: { id: "F21", path: "/product/mediaFiles/mediaFile/mimeType" },
	mediaFileUrl: { id: "F22", path: "/product/mediaFiles/mediaFile/url" },
	weightValue: { id: "F15", path: "/product/logistics/weight/weightValue" },
	weightUnit: { id: "F16", path: "/product/logistics/weight/weightUnit" },
	packagingMultiplicator: { id: "F24", path: "/product/packaging/packagingMultiplicator" },
	packagingAmount: { id: "F25", path: "/product/packaging/packagingAmount" },
	packagingUnit: { id: "F26", path: "/product/packaging/packagingUnit" },
	targetGroup: { id: "F54", path: "/product/targetGroup" },
	inStock: { id: "F53", path: "/product/inStock" },
	limitedOffer: { id: "F66", path: "/product/limitedOffer" },
	sellerEmail: { id: "F67", path: "/product/sellerEmail" }
} as const;
