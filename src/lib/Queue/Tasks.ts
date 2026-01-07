import { getFirstMatchInString } from "lib/Helpers";
import { VaultState } from "lib/VaultState";
import { TFile } from "obsidian";
import * as logger from "../Logger";

export interface Task {
	retries: number;
	vaultState: VaultState;
	execute(): Promise<void>;
}

export class UpdateImageRelations implements Task {
	retries: number = 0;
	vaultState: VaultState;
	imageName: string;
	document: TFile;

	constructor(
		imageName: string,
		document: TFile,
		vaultState: VaultState
	) {
		this.imageName = imageName;
		this.document = document;
		this.vaultState = vaultState;
	}

	async execute(): Promise<void> {
		const gotLock: boolean = this.vaultState.getLock();

		if (!gotLock) {
			throw new Error("Could not get lock.");
		}

		this.vaultState.addImageRelations(this.imageName, this.document);

		this.vaultState.releaseLock();
	}
}

export class RemoveDocument implements Task {
	retries: number = 0;
	vaultState: VaultState;
	document: TFile;

	constructor(
		document: TFile,
		vaultState: VaultState
	) {
		this.document = document;
		this.vaultState = vaultState;
	}

	async execute(): Promise<void> {
		const gotLock: boolean = this.vaultState.getLock();

		if (!gotLock) {
			throw new Error("Could not get lock.");
		}

		this.vaultState.removeDocument(this.document);
		logger.trace("ImageRelations after removeDocument: ", this.vaultState.imageRelations);

		this.vaultState.releaseLock();
	}
}

export class RemoveImage implements Task {
	retries: number = 0;
	vaultState: VaultState;
	image: TFile;

	constructor(
		image: TFile,
		vaultState: VaultState
	) {
		this.image = image;
		this.vaultState = vaultState;
	}

	async execute(): Promise<void> {
		const gotLock: boolean = this.vaultState.getLock();

		if (!gotLock) {
			throw new Error("Could not get lock.");
		}

		this.vaultState.removeImageByFile(this.image);
		logger.debug("PhysicalImages after removeImage: ", this.vaultState.physicalImages);

		this.vaultState.releaseLock();
	}
}

export class AddImage implements Task {
	retries: number = 0;
	vaultState: VaultState;
	image: TFile;

	constructor(
		image: TFile,
		vaultState: VaultState
	) {
		this.image = image;
		this.vaultState = vaultState;
	}

	async execute(): Promise<void> {
		const gotLock: boolean = this.vaultState.getLock();

		if (!gotLock) {
			throw new Error("Could not get lock.");
		}

		this.vaultState.addImage(this.image);
		logger.debug("PhysicalImages after addImage: ", this.vaultState.physicalImages);

		this.vaultState.releaseLock();
	}
}

//Renaming of the linking documents does Obsidian on its own and will trigger "modify" on each
//of them which will be handled by our handlers
export class RenameImage implements Task {
	retries: number = 0;
	vaultState: VaultState;
	oldPath: string;
	newImage: TFile;

	constructor(
		oldPath: string,
		newImage: TFile,
		vaultState: VaultState
	) {
		this.oldPath = oldPath;
		this.newImage = newImage;
		this.vaultState = vaultState;
	}

	async execute(): Promise<void> {
		const gotLock: boolean = this.vaultState.getLock();

		if (!gotLock) {
			throw new Error("Could not get lock.");
		}

		try {
			const oldImageName = getFirstMatchInString(this.oldPath, /[\w\/ -:]+\/([\w_ -]+\.(?:png|jpg|jpeg))/g);
			if (!oldImageName) {
				throw new Error("Could not get name from old image path: " + this.oldPath);
			}

			this.vaultState.removeImageByName(oldImageName);
			this.vaultState.addImage(this.newImage);

			logger.debug("PhysicalImages after addImage: ", this.vaultState.physicalImages);
		} catch (e) {
			throw e;
		} finally {
			this.vaultState.releaseLock();
		}
	}
}

