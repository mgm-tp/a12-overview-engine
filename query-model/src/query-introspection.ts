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

import type { ModelReference } from "@com.mgmtp.a12.base/base-model-api";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { Query, type RelationshipModel } from "@com.mgmtp.a12.dataservices/dataservices-access";

import type { QueryModel } from "./query-model.js";

/** Utilities for inspecting and transforming {@link QueryModel} instances. */
export namespace QueryIntrospection {
	/** Returns the name of the target document model referenced by the query model. */
	export function getTargetDocumentModelName(queryModel: QueryModel): string {
		return queryModel.content.targetDocumentModel;
	}

	/** Returns the paging configuration defined in the query model. */
	export function getPaging(queryModel: QueryModel): Query.Paging {
		return queryModel.content.paging;
	}

	/**
	 * Returns the sorting configuration defined in the query model.
	 * Returns an empty array when no sorting is defined.
	 */
	export function getSorting(queryModel: QueryModel): ReadonlyArray<Query.Order> {
		return queryModel.content.sort ?? [];
	}

	/**
	 * Collects all {@link ModelReference}s from the query model, including the target
	 * document model and all relationship models referenced through links.
	 */
	export function collectModelReferences(queryModel: QueryModel): ModelReference[] {
		return [
			createModelReference("document", "DM", getTargetDocumentModelName(queryModel)),
			...collectLinkReferences(queryModel.content.links ?? [])
		];
	}

	function collectLinkReferences(links: Query.QueryLink[]): ModelReference[] {
		return links.flatMap((link) => [
			createModelReference("relationship", "RM", link.relationshipModel),
			...collectLinkReferences(link.links ?? [])
		]);
	}

	function createModelReference(modelType: string, alias: string, reference: string): ModelReference {
		return { modelType, alias, purpose: `${modelType}-model-for-query`, reference };
	}

	/**
	 * Returns the document model field paths that survive the query's field projection.
	 * Returns an empty set when the query excludes all fields.
	 */
	export function collectProjectedFieldPaths(
		queryModel: QueryModel,
		documentModel: DocumentModel
	): ReadonlySet<string> {
		const { fields, exclude } = queryModel.content;

		if ((Array.isArray(fields) && fields.length === 0) || exclude === true) {
			return new Set();
		}

		return projectFieldPaths(fields, documentModel);
	}

	/**
	 * A traversal path entry that identifies a query link by relationship model and target role.
	 * Structurally compatible with `OverviewModel.LinkReference` so callers can pass it directly.
	 */
	export interface LinkPathEntry {
		readonly relationship: string;
		readonly targetRole: string;
	}

	/**
	 * Collection of models needed to resolve document model references from a query's link tree.
	 * `targetDocumentModelName` is the root document model name from the query model content.
	 */
	export interface ModelGraph {
		readonly targetDocumentModelName: string;
		readonly documentModels: DocumentModel[];
		readonly relationshipModels: RelationshipModel[];
	}

	/** Result of inspecting a {@link Query.QueryLink} reached via a {@link LinkPathEntry} path. */
	export interface LinkProjection extends Omit<Query.QueryLink, "fields" | "linkDocumentFields"> {
		readonly projectedFieldPaths: ReadonlySet<string>;
		readonly projectedLinkDocumentFieldPaths: ReadonlySet<string>;
	}

	/**
	 * Resolves a linear link path through the query model's link tree and returns projection and
	 * constraint information for the matched leaf {@link Query.QueryLink}.
	 *
	 * Document models for projection are resolved through the relationship models in `graph`:
	 * `entityCharacteristics[role].documentModel` for the target DM and
	 * `linkDocumentModel` for the link DM. Returns empty projection sets when a model cannot
	 * be resolved from the graph.
	 *
	 * Each entry in `linkPath` identifies one traversal hop by `relationship` + `targetRole`.
	 * Returns `undefined` when the path does not match any nested link.
	 */
	export function collectLinkProjection(
		queryModel: QueryModel,
		linkPath: ReadonlyArray<LinkPathEntry>,
		graph: ModelGraph
	): LinkProjection | undefined {
		if (linkPath.length === 0) {
			return undefined;
		}

		const link = findQueryLink(queryModel.content.links ?? [], linkPath);

		if (!link) {
			return undefined;
		}

		const rm = graph.relationshipModels.find((r) => r.header.id === link.relationshipModel);
		const targetDmId = rm?.content.entityCharacteristics.find((c) => c.role === link.targetRole)?.documentModel;
		const linkDmId = rm?.content.linkDocumentModel ?? undefined;

		const targetDm = targetDmId ? graph.documentModels.find((dm) => dm.header.id === targetDmId) : undefined;
		const linkDm = linkDmId ? graph.documentModels.find((dm) => dm.header.id === linkDmId) : undefined;

		return {
			relationshipModel: link.relationshipModel,
			targetRole: link.targetRole,
			...(link.maxDepth !== undefined && { maxDepth: link.maxDepth }),
			projectedFieldPaths: targetDm ? projectFieldPaths(link.fields, targetDm) : new Set(),
			projectedLinkDocumentFieldPaths: linkDm ? projectFieldPaths(link.linkDocumentFields, linkDm) : new Set(),
			...(link.constraint && { constraint: link.constraint }),
			...(link.linkDocumentConstraint && { linkDocumentConstraint: link.linkDocumentConstraint })
		};
	}

	function findQueryLink(links: Query.QueryLink[], path: ReadonlyArray<LinkPathEntry>): Query.QueryLink | undefined {
		const [head, ...tail] = path;
		const match = links.find((l) => l.relationshipModel === head.relationship && l.targetRole === head.targetRole);

		if (!match) {
			return undefined;
		}

		if (tail.length === 0) {
			return match;
		}

		return findQueryLink(match.links ?? [], tail);
	}

	function projectFieldPaths(fields: string[] | undefined, documentModel: DocumentModel): ReadonlySet<string> {
		if (Array.isArray(fields) && fields.length === 0) {
			return new Set();
		}

		const modelFieldPaths = collectFieldPaths(documentModel.content.modelRoot, "");

		if (!fields) {
			return modelFieldPaths;
		}

		return modelFieldPaths.intersection(new Set(fields));
	}

	function collectFieldPaths(group: DocumentModel.Group, parentPath: string): Set<string> {
		const paths = new Set<string>();

		for (const element of group.elements) {
			const path = `${parentPath}/${element.name}`;

			if (element.type === "Field") {
				paths.add(path);
			} else if (element.type === "Group") {
				for (const nested of collectFieldPaths(element, path)) {
					paths.add(nested);
				}
			}
		}

		return paths;
	}

	const VARIABLE_PATTERN = /^\$\{(?<documentModelName>[^,]+?)\s*,\s*\[(?<path>[^\]]+)\]\}$/;

	/**
	 * Returns a new {@link Query.QueryRoot} tree with all `${DocumentModelName, [path]}`
	 * placeholders replaced by corresponding values from the provided map.
	 *
	 * The `variables` parameter is a map where:
	 * - key: `${DocumentModelName}${path}` (e.g., "Person_DM/FirstName")
	 * - value: string | number
	 *
	 * Unmatched placeholders are left unchanged. The original query is not mutated.
	 */
	export function replaceVariables(
		query: Query.QueryRoot,
		variables: Record<string, string | number>
	): Query.QueryRoot {
		const replacedConstraint = query.constraint ? replaceVariablesInConstraint(query.constraint, variables) : undefined;
		const replacedLinks = query.links?.map((link) => replaceVariablesInLink(link, variables));

		return { ...query, constraint: replacedConstraint, links: replacedLinks };
	}

	function replaceVariablesInLink(link: Query.QueryLink, variables: Record<string, string | number>): Query.QueryLink {
		const replacedConstraint = link.constraint ? replaceVariablesInConstraint(link.constraint, variables) : undefined;
		const replacedLinkDMConstraint = link.linkDocumentConstraint
			? replaceVariablesInConstraint(link.linkDocumentConstraint, variables)
			: undefined;

		const replacedNestedLinks = link.links?.map((nestedLink) => replaceVariablesInLink(nestedLink, variables));

		return {
			...link,
			...{
				constraint: replacedConstraint,
				linkDocumentConstraint: replacedLinkDMConstraint,
				links: replacedNestedLinks
			}
		};
	}

	function replaceVariablesInConstraint(
		operator: Query.Operator,
		variables: Record<string, string | number>
	): Query.Operator {
		if (operator.operator === Query.OPERATORS.AND_OPERATOR || operator.operator === Query.OPERATORS.OR_OPERATOR) {
			return { ...operator, operands: operator.operands.map((o) => replaceVariablesInConstraint(o, variables)) };
		}

		if (operator.operator === Query.OPERATORS.NOT_OPERATOR) {
			return { ...operator, operand: replaceVariablesInConstraint(operator.operand, variables) };
		}

		if (operator.operator === Query.OPERATORS.HAS_OPERATOR) {
			return {
				...operator,
				...(operator.constraint && { constraint: replaceVariablesInConstraint(operator.constraint, variables) }),
				...(operator.linkDocumentConstraint && {
					linkDocumentConstraint: replaceVariablesInConstraint(operator.linkDocumentConstraint, variables)
				})
			};
		}

		if (operator.operator === Query.OPERATORS.EXACT_MATCH_OPERATOR) {
			return replaceExactMatchVariable(operator, variables);
		}

		if (operator.operator === Query.OPERATORS.DOUBLE_RANGE_OPERATOR) {
			return replaceDoubleRangeVariables(operator, variables);
		}

		if (
			operator.operator === Query.OPERATORS.DATE_RANGE_OPERATOR ||
			operator.operator === Query.OPERATORS.DATE_FRAGMENT_RANGE_OPERATOR
		) {
			return replaceDateRangeVariables(operator, variables);
		}

		return operator;
	}

	function resolveVariable(
		value: string | number | undefined,
		variables: Record<string, string | number | undefined>
	):
		| { status: "literal"; value: string | number | undefined }
		| { status: "resolved"; value: string | number }
		| { status: "unresolved" } {
		if (typeof value !== "string") {
			return { status: "literal", value };
		}

		const match = VARIABLE_PATTERN.exec(value);

		if (!match || !match.groups?.documentModelName || !match.groups?.path) {
			return { status: "literal", value };
		}

		const { documentModelName, path } = match.groups;
		const resolvedValue = variables[`${documentModelName}${path}`];

		if (resolvedValue === undefined) {
			return { status: "unresolved" };
		}

		return { status: "resolved", value: resolvedValue };
	}

	function replaceExactMatchVariable(
		operator: Query.ExactMatchOperator,
		variables: Record<string, string | number | undefined>
	): Query.Operator {
		const resolved = resolveVariable(operator.value, variables);

		return resolved.status === "resolved" ? { ...operator, value: resolved.value } : operator;
	}

	function replaceDoubleRangeVariables(
		operator: Query.DoubleRangeOperator,
		variables: Record<string, string | number>
	): Query.Operator {
		const from = resolveVariable(operator.from, variables);
		const to = resolveVariable(operator.to, variables);

		if (from.status === "literal" && to.status === "literal") {
			return operator;
		}

		const toNumber = (v: string | number): number => (typeof v === "string" ? Number(v) : v);

		return {
			...operator,
			from:
				from.status === "resolved" ? toNumber(from.value) : from.status === "unresolved" ? undefined : operator.from,
			to: to.status === "resolved" ? toNumber(to.value) : to.status === "unresolved" ? undefined : operator.to
		};
	}

	function replaceDateRangeVariables(
		operator: Query.DateRangeOperator | Query.DateFragmentRangeOperator,
		variables: Record<string, string | number>
	): Query.Operator {
		const from = resolveVariable(operator.from, variables);
		const to = resolveVariable(operator.to, variables);

		if (from.status === "literal" && to.status === "literal") {
			return operator;
		}

		return {
			...operator,
			from: from.status === "resolved" ? String(from.value) : operator.from,
			to: to.status === "resolved" ? String(to.value) : operator.to
		};
	}
}
