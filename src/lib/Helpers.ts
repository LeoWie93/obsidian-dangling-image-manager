import { TFile } from "obsidian";
import { supportedImageExtensions, supportedTextfileExtensions } from "./FileParser";

export function isDocument(file: TFile): boolean {
	return supportedTextfileExtensions.includes(file.extension);
}

export function isImage(file: TFile): boolean {
	return supportedImageExtensions.includes(file.extension);
}

export function getFirstMatchInString(content: string, regex: RegExp): string | undefined {
	const matches: IterableIterator<RegExpMatchArray> = content.matchAll(regex);
	const firstMatch: RegExpMatchArray | undefined = matches.next().value as RegExpMatchArray | undefined;

	if (firstMatch === undefined) {
		return undefined;
	}

	return firstMatch[1];
}

