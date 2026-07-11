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

import * as React from "react";
import { de, enUS } from "date-fns/locale";

import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import type { LocalizedLocale } from "@com.mgmtp.a12.client/client-core/localization";
import { addWrapper, type A12ApplicationConfig } from "@com.mgmtp.a12.client/client-core";
import {
	Locale,
	defaultDataFormats,
	type PartialLocale,
	defaultValueConversion,
	defaultLocalizerFactory
} from "@com.mgmtp.a12.utils/utils-localization";
import {
	noop,
	createContext,
	type Container,
	DateTimeContext,
	getA11yResource,
	useContextSelector,
	type A11yDefinition,
	A11YLanguageContext,
	type TimePickerProps
} from "@com.mgmtp.a12.widgets/widgets-core";

import { SHOWCASE_RESOURCES } from "./resources.js";

export const LOCALES: LocalizedLocale[] = [
	{ language: "en", country: "US" },
	{ language: "en", country: "GB" },
	{ language: "de", country: "DE" },
	{ language: "fr", country: "FR" }
];

const LOCALE_KEY = "locale";
const TIME_MODE_KEY = "timeMode";

export type TimeMode = TimePickerProps.ClockMode;

export const TIME_MODES: readonly TimeMode[] = ["12h", "24h"] as const;

function useLocale() {
	const [locale, setLocale] = React.useState<Locale>(
		() => Locale.fromString(localStorage.getItem(LOCALE_KEY) ?? "en_US") as Locale
	);

	const onChangeLocale = React.useCallback((locale: Locale) => {
		setLocale(locale);
		localStorage.setItem(LOCALE_KEY, Locale.toString(locale));
	}, []);

	return [locale, onChangeLocale] as const;
}

function useTimeMode() {
	const [timeMode, setTimeMode] = React.useState<TimeMode>(() => {
		const stored = localStorage.getItem(TIME_MODE_KEY);

		return stored === "12h" || stored === "24h" ? stored : "12h";
	});

	const onChangeTimeMode = React.useCallback((next: TimeMode) => {
		setTimeMode(next);
		localStorage.setItem(TIME_MODE_KEY, next);
	}, []);

	return [timeMode, onChangeTimeMode] as const;
}

interface LocalizationContextType {
	timeMode: TimeMode;
	setLocale(locale: Locale): void;
	setTimeMode(timeMode: TimeMode): void;
}

const LocalizationContext = createContext<LocalizationContextType>({
	timeMode: "12h",
	setLocale: noop,
	setTimeMode: noop
});
LocalizationContext.displayName = "LocalizationContext";

export function useLocalizationContext<T>(selector: (value: LocalizationContextType) => T): T {
	return useContextSelector(LocalizationContext, selector);
}

export const LocalizationContextProvider: React.FC<Container> = ({ children }) => {
	const [locale, setLocale] = useLocale();
	const [timeMode, setTimeMode] = useTimeMode();

	const localizerContextValue = React.useMemo(() => {
		const dataFormats = defaultDataFormats(locale);

		return {
			locale,
			dataFormats,
			conversion: defaultValueConversion(dataFormats),
			localizer: defaultLocalizerFactory({
				locale,
				translationSource: SHOWCASE_RESOURCES,
				fallbackLocales: createFallbackLocales(locale)
			})
		};
	}, [locale]);

	const localizationContextValue: LocalizationContextType = React.useMemo(
		() => ({ timeMode, setLocale, setTimeMode }),
		[timeMode, setLocale, setTimeMode]
	);

	const a11yLanguageContextValue = React.useMemo<A11yDefinition>(() => {
		return getA11yResource(["en", "de"].includes(locale.language) ? locale.language : "en");
	}, [locale.language]);

	const dateTimeContextValue = React.useMemo(
		() => ({ locale: locale.language === "en" ? enUS : de, timeMode }),
		[locale.language, timeMode]
	);

	return (
		<LocalizationContext.Provider value={localizationContextValue}>
			<LocalizerContext.Provider value={localizerContextValue}>
				<A11YLanguageContext.Provider value={a11yLanguageContextValue}>
					<DateTimeContext.Provider value={dateTimeContextValue}>{children}</DateTimeContext.Provider>
				</A11YLanguageContext.Provider>
			</LocalizerContext.Provider>
		</LocalizationContext.Provider>
	);
};

export const withLocalizationProvider = <T extends A12ApplicationConfig>(cfg: T) =>
	addWrapper<T>(LocalizationContextProvider, "outer")(cfg);

function createFallbackLocales(locale: PartialLocale): PartialLocale[] {
	if (Locale.isLocale(locale)) {
		if (locale.language === "en") {
			return [{ language: "en" }];
		} else {
			return [{ language: locale.language }, { language: "en" }];
		}
	}

	if (locale.language !== "en") {
		return [{ language: "en" }];
	}

	return [];
}
