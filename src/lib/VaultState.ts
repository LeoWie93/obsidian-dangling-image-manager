import { TFile } from "obsidian";
import * as logger from "./Logger";

export class VaultState {
	imageRelations: Map<string, Set<TFile>> = new Map<string, Set<TFile>>
	physicalImages: Map<string, TFile> = new Map<string, TFile>
	locked: boolean = false;

	constructor(physicalImages: Map<string, TFile>) {
		this.physicalImages = physicalImages;
	}

	isLocked(): boolean {
		return this.locked;
	}

	getLock(): boolean {
		const now: number = Date.now();
		while (this.locked) {
			if (Date.now() - now > 2000) {
				return false;
			}
		}

		this.locked = true;
		return true;
	}

	releaseLock(): void {
		this.locked = false;
	}

	addImageRelations(imageName: string, document: TFile): void {
		const documents: Set<TFile> | undefined = this.imageRelations.get(imageName);
		if (documents === undefined) {
			this.imageRelations.set(imageName, new Set<TFile>().add(document));
		} else {
			documents.add(document);
		}
	}

	addImage(image: TFile): void {
		if (!this.physicalImages.has(image.name)) {
			this.physicalImages.set(image.name, image);
		}
	}

	removeImageByName(imageName: string): void {
		if (this.physicalImages.has(imageName)) {
			this.physicalImages.delete(imageName);
			logger.debug("Removed image from physicalImages", { value: imageName });
		} else {
			logger.warn("Image was never tracked in physicalImages", { value: imageName });
		}
	}

	removeImageByFile(image: TFile): void {
		this.removeImageByName(image.name);
	}

	removeDocument(document: TFile): void {
		let entries: [string, Set<TFile>][] = Array.from(this.imageRelations.entries());
		entries = entries.filter((entry) => {
			return entry[1].has(document);
		});

		entries.forEach((entry) => {
			const imageName: string = entry[0];

			const relations: Set<TFile> | undefined = this.imageRelations.get(imageName);
			if (relations) {
				relations.delete(document);
				logger.debug("Removed relation of " + document.name + " from image " + imageName, relations);
				if (relations.size === 0) {
					this.imageRelations.delete(imageName);
					logger.debug("No relations left. Removing entry for image", { value: imageName });
				}
			}
		});
	}

	getDanglingImages(): TFile[] {
		const danglingImages: TFile[] = [];
		this.physicalImages.forEach((value, key) => {
			if (!this.imageRelations.has(key)) {
				danglingImages.push(value);
			}
		});

		return danglingImages;
	}

	getDanglingImageRelations(): [string, Set<TFile>][] {
		const danglingImageRelations: [string, Set<TFile>][] = []
		this.imageRelations.forEach((value, key) => {
			if (!this.physicalImages.has(key)) {
				danglingImageRelations.push([key, value]);
			}
		});
		return danglingImageRelations;
	}
}

