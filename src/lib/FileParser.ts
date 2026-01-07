import { App, TFile } from "obsidian";
import * as logger from "./Logger";

const mdImageLinkRegex = /\[\[([^\|\]]+\.(?:avif|bmp|gif|jpg|jpeg|png|svg|webp))(?:[^\]]*)?\]\]/g;
const canvasImageLinkRegex = /"file":"(?:[^"/]*\/)*([\w -]+\.(?:avif|bmp|gif|jpg|jpeg|png|svg|webp))"/g;

export const supportedImageExtensions: string[] = ["avif", "bmp", "gif", "jpg", "jpeg", "png", "svg", "webp"];
export const supportedTextfileExtensions: string[] = ["md", "canvas"]; // excalidraw are just fancy .md files

const filetypeToRegexMap: Map<string, RegExp> = new Map<string, RegExp>([
	["md", mdImageLinkRegex],
	["canvas", canvasImageLinkRegex],
]);

export async function getLinkedImages(file: TFile, app: App): Promise<string[]> {
	const fileNames: string[] = [];
	const content: string = await app.vault.cachedRead(file);
	const regex: RegExp | undefined = filetypeToRegexMap.get(file.extension);

	if (regex === undefined) {
		logger.warn("Parser for fileextension not found", file.extension);
		return [];
	}

	const matches = content.matchAll(regex);
	for (const match of matches) {
		if (match[1]) {
			fileNames.push(match[1]);
		}
	}

	return fileNames;
}

