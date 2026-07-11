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

import Chance from "chance";
import { addDays, getDate, getMonth } from "date-fns";

import { addRequest, linkEntities } from "../index.js";

function generateBundle(chance: Chance.Chance) {
	const releaseDate = chance.date({ year: 2021 }) as Date;
	const onSaleStart = chance.date({ year: 2021, month: chance.integer({ min: 1, max: 10 }) }) as Date;
	const onSaleEnd = addDays(onSaleStart, chance.integer({ min: 1, max: 30 }));

	return {
		bundle: {
			name: chance.name(),
			price: chance.integer({ min: 100, max: 10000 }),
			bundleDescription: chance.sentence(),
			FeatureList: chance.pickset(
				Array.from({ length: 7 }, (_, index) => ({ value: "feature" + String(index + 1) })),
				chance.integer({ min: 0, max: 7 })
			),
			releaseDate: toDateFragment(releaseDate),
			onSaleInterval: `${toDateFragment(onSaleStart)}/${toDateFragment(onSaleEnd)}`
		}
	};
}

function generatePromotion(chance: Chance.Chance) {
	const startDate = chance.date({ year: 2024 }) as Date;
	const endDate = addDays(startDate, chance.integer({ min: 7, max: 90 }));

	return {
		promotion: {
			name: `${chance.word({ capitalize: true })} ${chance.pickone(["Sale", "Discount", "Offer", "Deal"])}`,
			start: startDate.toISOString().substring(0, 19),
			end: endDate.toISOString().substring(0, 19)
		}
	};
}

export function createBundlesWithLinks() {
	const SIZE = 100;
	const NUMBER_OF_PROMOTIONS = 10;

	const promotionRequests = Array.from({ length: NUMBER_OF_PROMOTIONS }, (_, index) => {
		const chance = new Chance(index);

		return addRequest("PromotionDM", generatePromotion(chance), index);
	});

	const bundleRequests = Array.from({ length: SIZE }, (_, index) => {
		const chance = new Chance(index);

		const bundle = generateBundle(chance);
		const bundleRequest = addRequest("BundleDM", bundle, index);

		const shouldLinkPromotion = chance.bool({ likelihood: 70 });

		if (shouldLinkPromotion) {
			const promotionIndex = index % NUMBER_OF_PROMOTIONS;
			const bundlePromotionLink = linkEntities(`bundle-promo-${index}`, "PromotionBundle", [
				{ role: "promotion", docRef: `#{#${promotionRequests[promotionIndex].id}.metadata.docRef}` },
				{ role: "bundle", docRef: `#{#${bundleRequest.id}.metadata.docRef}` }
			]);

			return [bundleRequest, bundlePromotionLink];
		}

		return [bundleRequest];
	}).flat();

	return [...promotionRequests, ...bundleRequests];
}

function toDateFragment(date: Date) {
	return `${padZero(getMonth(date) + 1)}-${padZero(getDate(date))}`;
}

function padZero(num: number) {
	return String(num).padStart(2, "0");
}
