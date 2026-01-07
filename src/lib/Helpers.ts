import { TFile } from "obsidian";
import { supportedImageExtensions, supportedTextfileExtensions } from "./FileParser";

export function isDocument(file: TFile): boolean {
	return supportedTextfileExtensions.includes(file.extension);
}

export function isImage(file: TFile): boolean {
	return supportedImageExtensions.includes(file.extension);
}

export function getFirstMatchInString(content: string, regex: RegExp): string | undefined {
	const firstMatch: RegExpExecArray | undefined = content.matchAll(regex).next().value;
	return firstMatch?.[1];
}

