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

import {
	Header as DateTimePickerHeader,
	type HeaderProps as DateTimePickerHeaderProps
} from "@com.mgmtp.a12.widgets/widgets-core/lib/date-time-picker/main/date-time-picker.internal.js";
import {
	Icon,
	List,
	Table,
	Badge,
	Radio,
	Button,
	Select,
	Filter,
	Message,
	Counter,
	Checkbox,
	PopUpMenu,
	DateInput,
	FilterBar,
	HiddenText,
	Pagination,
	TextOutput,
	BulletList,
	MessageBox,
	TimePicker,
	ContentBox,
	ButtonGroup,
	CssEllipsis,
	ModalOverlay,
	YearSelector,
	MonthSelector,
	type IconProps,
	type ListProps,
	AttachedPortal,
	DateTimePicker,
	FilterSelector,
	type BadgeProps,
	type TableProps,
	type RadioProps,
	SubActionBarTpl,
	FilterBarMobile,
	type ButtonProps,
	type SelectProps,
	type FilterProps,
	type MessageProps,
	type CounterProps,
	ModalNotification,
	YearMonthSelector,
	type ListItemProps,
	type CheckboxProps,
	ContentBoxElements,
	type PopUpMenuProps,
	type RadioItemProps,
	type DateInputProps,
	type FilterBarProps,
	DateTimePickerInput,
	type HiddenTextProps,
	type PaginationProps,
	type TextOutputProps,
	type BulletListProps,
	type MessageBoxProps,
	type TimePickerProps,
	type ContentBoxProps,
	ButtonGroupContainer,
	FilterSelectorMobile,
	type ButtonGroupProps,
	type CssEllipsisProps,
	type ModalOverlayProps,
	FilterSelectorTemplate,
	type ListSubHeaderProps,
	PickerHeaderCloseButton,
	type AttachedPortalProps,
	type DateTimePickerProps,
	type FilterSelectorProps,
	ResponsiveImageContainer,
	type SubActionBarTplProps,
	type FilterBarMobileProps,
	type ModalNotificationProps,
	type YearMonthSelectorProps,
	type DateTimePickerInputProps,
	type ButtonGroupContainerProps,
	type FilterSelectorMobileProps,
	type IndeterminateCheckboxProps,
	type FilterSelectorTemplateProps,
	type ResponsiveImageContainerProps
} from "@com.mgmtp.a12.widgets/widgets-core";

import { type JSONDocument } from "../../models/index.js";

export interface WidgetMap {
	readonly Pagination: React.ComponentType<PaginationProps>;
	readonly Badge: React.ComponentType<BadgeProps>;
	readonly PopUpMenu: React.ComponentType<PopUpMenuProps>;
	readonly Icon: React.ComponentType<IconProps>;
	readonly SubActionBarTpl: React.ComponentType<SubActionBarTplProps>;
	readonly ContentBox: React.ComponentType<ContentBoxProps>;
	readonly Message: React.ComponentType<MessageProps>;
	readonly MessageBox: React.ComponentType<MessageBoxProps>;
	readonly TextOutput: React.ComponentType<TextOutputProps>;
	readonly CssEllipsis: React.ComponentType<CssEllipsisProps>;
	readonly ModalNotification: React.ComponentType<ModalNotificationProps>;
	readonly Table: React.ComponentType<TableProps<JSONDocument>>;
	readonly Select: React.ComponentType<SelectProps>;
	readonly ModalOverlay: React.ComponentType<ModalOverlayProps>;
	readonly AttachedPortal: React.ComponentType<AttachedPortalProps>;
	readonly Counter: React.ComponentType<CounterProps>;
	readonly ResponsiveImageContainer: React.ComponentType<ResponsiveImageContainerProps>;

	readonly Button: React.ComponentType<ButtonProps>;
	readonly ButtonGroup: React.ComponentType<ButtonGroupProps>;
	readonly ButtonGroupContainer: React.ComponentType<ButtonGroupContainerProps>;

	readonly BackButton: React.ComponentType<ContentBoxProps.BackButtonProps>;
	readonly ActionButton: React.ComponentType<ButtonProps>;
	readonly Heading: React.ComponentType<ContentBoxProps.HeadingProps>;
	readonly HeadingAddon: React.ComponentType<ContentBoxProps.BaseProps>;
	readonly Title: React.ComponentType<ContentBoxProps.TitleProps>;
	readonly Subtitle: React.ComponentType<ContentBoxProps.TitleProps>;
	readonly ActionBarGroup: React.ComponentType<ContentBoxProps.ActionBarGroupProps>;
	readonly SubHeading: React.ComponentType<ContentBoxProps.BaseProps>;
	readonly ActionBarGroupArea: React.ComponentType<ContentBoxProps.ActionBarGroupAreaTplProps>;
	readonly ActionBarGroupDivider: React.ComponentType<ContentBoxProps.BaseProps>;
	readonly SubActionBar: React.ComponentType<ContentBoxProps.BaseProps>;
	readonly Footer: React.ComponentType<ContentBoxProps.FooterProps>;
	readonly HiddenText: React.ComponentType<HiddenTextProps>;

	readonly BulletListUnordered: React.ComponentType<BulletListProps.UnorderedProps>;
	readonly BulletListItem: React.ComponentType<BulletListProps.ItemProps>;

	readonly List: React.ComponentType<ListProps>;
	readonly ListItem: React.ComponentType<ListItemProps>;
	readonly ListSubHeader: React.ComponentType<ListSubHeaderProps>;

	readonly Checkbox: React.ComponentType<CheckboxProps>;
	readonly CheckboxIndeterminate: React.ComponentType<IndeterminateCheckboxProps>;

	readonly Radio: React.ComponentType<RadioProps>;
	readonly RadioItem: React.ComponentType<RadioItemProps>;

	readonly Filter: React.ComponentType<FilterProps>;
	readonly FilterBar: React.ComponentType<FilterBarProps>;
	readonly FilterBarMobile: React.ComponentType<FilterBarMobileProps>;
	readonly FilterSelector: React.ComponentType<FilterSelectorProps>;
	readonly FilterSelectorMobile: React.ComponentType<FilterSelectorMobileProps>;
	readonly FilterSelectorTemplate: React.ComponentType<FilterSelectorTemplateProps>;
	readonly FilterSelectorTemplateContent: React.ComponentType<FilterSelectorTemplateProps.ContentProps>;
	readonly FilterSelectorTemplateSection: React.ComponentType<FilterSelectorTemplateProps.SectionProps>;
	readonly FilterSelectorTemplateActionElement: React.ComponentType<FilterSelectorTemplateProps.ActionElementProps>;
	readonly FilterSelectorTemplateActionBar: React.ComponentType<FilterSelectorTemplateProps.ActionBarProps>;
	readonly FilterSelectorTemplateSearchInput: React.ComponentType<FilterSelectorTemplateProps.SearchInputProps>;
	readonly FilterSelectorTemplateList: React.ComponentType<FilterSelectorTemplateProps.ListProps>;
	readonly FilterSelectorTemplateItem: React.ComponentType<FilterSelectorTemplateProps.ItemProps>;

	readonly YearMonthSelector: React.ComponentType<YearMonthSelectorProps>;
	readonly YearSelector: typeof YearSelector;
	readonly MonthSelector: typeof MonthSelector;
	readonly DateTimePickerHeader: React.ComponentType<DateTimePickerHeaderProps>;
	readonly DateTimePickerInput: React.ComponentType<DateTimePickerInputProps<DateTimePickerProps>>;
	readonly TimePicker: React.ComponentType<TimePickerProps>;
	readonly DateInput: React.ComponentType<DateInputProps>;
	readonly PickerHeaderCloseButton: React.ComponentType<ButtonProps>;
}

export const DefaultWidgetMap: WidgetMap = {
	Pagination: React.memo(Pagination),
	Badge: React.memo(Badge),
	Icon: React.memo(Icon),
	SubActionBarTpl: React.memo(SubActionBarTpl),
	ContentBox: React.memo(ContentBox),
	Message: React.memo(Message),
	MessageBox: React.memo(MessageBox),
	TextOutput: React.memo(TextOutput),
	CssEllipsis: React.memo(CssEllipsis),
	ModalNotification: React.memo(ModalNotification),
	Select: React.memo(Select),
	Counter: React.memo(Counter),
	ResponsiveImageContainer: React.memo(ResponsiveImageContainer),
	PopUpMenu, // React.memo do not merge the defaultProps
	Table,
	ModalOverlay,
	AttachedPortal,

	Button: React.memo(Button),
	ButtonGroup: React.memo(ButtonGroup),
	ButtonGroupContainer: React.memo(ButtonGroupContainer),

	BackButton: React.memo(ContentBoxElements.BackButton),
	ActionButton: React.memo(ContentBoxElements.ActionButton),
	Heading: React.memo(ContentBoxElements.Heading),
	HeadingAddon: React.memo(ContentBoxElements.HeadingAddon),
	SubHeading: React.memo(ContentBoxElements.SubHeading),
	Title: React.memo(ContentBoxElements.Title),
	Subtitle: React.memo(ContentBoxElements.Subtitle),
	ActionBarGroup: React.memo(ContentBoxElements.ActionBarGroup),
	ActionBarGroupArea: React.memo(ContentBoxElements.ActionBarGroupArea),
	ActionBarGroupDivider: React.memo(ContentBoxElements.ActionBarGroupDivider),
	SubActionBar: React.memo(ContentBoxElements.SubActionBar),
	Footer: React.memo(ContentBoxElements.Footer),
	HiddenText: React.memo(HiddenText),

	BulletListUnordered: React.memo(BulletList.Unordered),
	BulletListItem: React.memo(BulletList.Item),

	List, // Do not use memo here since PopupMenu component is checking whether its children is a pure List component
	ListItem: React.memo(List.Item),
	ListSubHeader: React.memo(List.SubHeader),

	Checkbox: React.memo(Checkbox),
	CheckboxIndeterminate: React.memo(Checkbox.Indeterminate),

	Radio: React.memo(Radio),
	RadioItem: React.memo(Radio.Item),

	Filter: React.memo(Filter),
	FilterBar: React.memo(FilterBar),
	FilterBarMobile: React.memo(FilterBarMobile),
	FilterSelector,
	FilterSelectorMobile: React.memo(FilterSelectorMobile),
	FilterSelectorTemplate: React.memo(FilterSelectorTemplate),
	FilterSelectorTemplateContent: React.memo(FilterSelectorTemplate.Content),
	FilterSelectorTemplateSection: React.memo(FilterSelectorTemplate.Section),
	FilterSelectorTemplateActionElement: React.memo(FilterSelectorTemplate.ActionElement),
	FilterSelectorTemplateActionBar: React.memo(FilterSelectorTemplate.ActionBar),
	FilterSelectorTemplateSearchInput: React.memo(FilterSelectorTemplate.SearchInput),
	FilterSelectorTemplateList: React.memo(FilterSelectorTemplate.List),
	FilterSelectorTemplateItem: React.memo(FilterSelectorTemplate.Item),

	YearMonthSelector: React.memo(YearMonthSelector),
	YearSelector,
	MonthSelector,
	DateTimePickerHeader: React.memo(DateTimePickerHeader),
	DateTimePickerInput: React.memo(DateTimePickerInput(DateTimePicker)),
	DateInput: React.memo(DateInput),
	TimePicker: React.memo(TimePicker),
	PickerHeaderCloseButton: React.memo(PickerHeaderCloseButton)
};
