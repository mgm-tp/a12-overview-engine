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

import React from "react";
import { ThemeProvider, StyleSheetManager } from "styled-components";

import { addWrapper, type A12ApplicationConfig } from "@com.mgmtp.a12.client/client-core";
import {
	noop,
	flatTheme,
	GlobalStyles,
	defaultTheme,
	compactTheme,
	createContext,
	type Container,
	flatCompactTheme,
	shouldForwardProp,
	useContextSelector,
	type DefaultThemeType
} from "@com.mgmtp.a12.widgets/widgets-core";

export const THEMES: Record<string, DefaultThemeType> = {
	Default: defaultTheme,
	Compact: compactTheme,
	Flat: flatTheme,
	"Flat Compact": flatCompactTheme
} as const;

const THEME_KEY = "theme";

export function useTheme() {
	const [theme, setTheme] = React.useState<keyof typeof THEMES>(() => localStorage.getItem(THEME_KEY) ?? "Flat");

	const onChangeTheme = React.useCallback((theme: keyof typeof THEMES) => {
		setTheme(theme);
		localStorage.setItem(THEME_KEY, theme);
	}, []);

	return [theme, onChangeTheme] as const;
}

export interface ThemeContextType {
	theme: string;
	setTheme(theme: string): void;
}

const ThemeContext = createContext<ThemeContextType>({
	theme: "Flat Compact",
	setTheme: noop
});
ThemeContext.displayName = "ThemeContext";

export function useThemeContext<T>(selector: (value: ThemeContextType) => T): T {
	return useContextSelector(ThemeContext, selector);
}

export const ThemeContextProvider: React.FC<Container> = ({ children }) => {
	const [theme, setTheme] = useTheme();

	const showcaseContextValue: ThemeContextType = React.useMemo(() => {
		return { theme, setTheme };
	}, [setTheme, theme]);

	return (
		<ThemeContext.Provider value={showcaseContextValue}>
			<StyleSheetManager shouldForwardProp={shouldForwardProp}>
				<ThemeProvider theme={THEMES[theme]}>
					<GlobalStyles />
					{children}
				</ThemeProvider>
			</StyleSheetManager>
		</ThemeContext.Provider>
	);
};

export const withTheme = <T extends A12ApplicationConfig>(cfg: T) => addWrapper<T>(ThemeContextProvider, "outer")(cfg);
