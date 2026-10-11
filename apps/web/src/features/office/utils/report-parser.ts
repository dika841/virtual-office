import type { Editor } from "@tiptap/react";

export type TExtractedReport = {
	points: string[];
	taskLinks: string[];
};

const URL_REGEX = /https?:\/\/[^\s)]+/g;
const MAX_POINT_LENGTH = 280;
const MAX_POINTS = 10;
const MAX_LINKS = 10;

/**
 * Extracts daily report points and references from a Tiptap editor instance.
 * Parses bullet lists, numbered lists, paragraphs, and detected links.
 */
export function parseReportFromEditor(editor: Editor): TExtractedReport {
	const doc = editor.state.doc;
	const points: string[] = [];
	const linksSet = new Set<string>();

	// 1. Extract link marks from editor AST nodes
	doc.descendants((node) => {
		for (const mark of node.marks) {
			if (mark.type.name === "link" && mark.attrs.href) {
				try {
					const u = new URL(mark.attrs.href);
					linksSet.add(u.href);
				} catch {
					// Ignore invalid URL
				}
			}
		}
	});

	// 2. Extract bullet points, ordered list items, or paragraphs
	doc.forEach((node) => {
		if (node.type.name === "bulletList" || node.type.name === "orderedList") {
			node.forEach((itemNode) => {
				const text = itemNode.textContent.trim();
				if (text) points.push(text);
			});
		} else if (node.type.name === "paragraph" || node.type.name === "heading") {
			const text = node.textContent.trim();
			if (text) points.push(text);
		}
	});

	// Fallback to line splitting if document has unnested raw text
	if (points.length === 0) {
		const text = editor.getText();
		const lines = text
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean);
		points.push(...lines);
	}

	// 3. Extract any raw URLs found in plain text content
	const fullText = editor.getText();
	const rawUrlMatches = fullText.match(URL_REGEX) || [];
	for (const raw of rawUrlMatches) {
		try {
			const clean = raw.replace(/[,.;]+$/, "");
			const u = new URL(clean);
			linksSet.add(u.href);
		} catch {
			// Ignore invalid URL
		}
	}

	return {
		points: points
			.map((p) =>
				p.length > MAX_POINT_LENGTH ? p.slice(0, MAX_POINT_LENGTH) : p,
			)
			.slice(0, MAX_POINTS),
		taskLinks: Array.from(linksSet).slice(0, MAX_LINKS),
	};
}
