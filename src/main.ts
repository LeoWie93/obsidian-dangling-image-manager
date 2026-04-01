import { App, Modal, Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, ImageManagerSettings, ImageManagerSettingTab } from "./settings";
import { supportedImageExtensions, getLinkedImages, supportedTextfileExtensions } from 'lib/FileParser';
import { isDocument, isImage } from 'lib/Helpers';
import { VaultState } from 'lib/VaultState';
import { SyncTaskQueue } from 'lib/Queue/SyncTaskQueue';
import { AddImage, RemoveDocument, RemoveImage, RenameImage, UpdateImageRelations } from 'lib/Queue/Tasks';
import * as logger from 'lib/Logger';


//Obsidian does not make this field public on its own.
declare module "obsidian" {
	interface TFile {
		deleted: boolean;
	}
}

export default class ImageManager extends Plugin {
	syncQueue: SyncTaskQueue = new SyncTaskQueue();
	settings: ImageManagerSettings;
	vaultState: VaultState;

	async onload() {
		await this.loadSettings();
		logger.setLoglevel(this.settings.logLevel);

		this.app.workspace.onLayoutReady(async () => {
			//PERFORMANCE logging
			let startTime: number | null = null;
			if (this.settings.performanceTrackingEnabled) {
				startTime = performance.now();
			}

			const files: TFile[] = this.app.vault.getFiles();

			const physicalImages: Map<string, TFile> = new Map<string, TFile>;
			files.forEach((file: TFile) => {
				if (supportedImageExtensions.includes(file.extension)) {
					physicalImages.set(file.name, file);
				}
			});
			this.vaultState = new VaultState(physicalImages);


			const documentFiles: TFile[] = files.filter((file: TFile) => {
				return (supportedTextfileExtensions.includes(file.extension) && !file.deleted);
			});

			for (const file of documentFiles) {
				const linkedImages: string[] = await getLinkedImages(file, this.app);
				linkedImages.forEach((imageName) => {
					this.syncQueue.enqueue(
						new UpdateImageRelations(imageName, file, this.vaultState)
					);
				});
			}

			if (this.settings.performanceTrackingEnabled && startTime) {
				performance.measure("Parsing complete", {
					start: startTime,
					end: performance.now(),
					detail: {
						devtools: {
							dataType: "track-entry",
							track: "File Parsing",
							trackGroup: "Image Manager",
							color: "tertiary-dark",
							properties: [
								["Filter Type", "Gaussian Blur"],
							],
							tooltipText: "Files parsed succesfully",
						}
					}
				});
			}

			logger.debug("Image Relations", this.vaultState.imageRelations);
			logger.debug("Physical Images", this.vaultState.physicalImages);
			logger.debug("Dangling Images", this.vaultState.getDanglingImages());

			this.app.vault.on('create', async (file: TAbstractFile) => {
				logger.debug("Create handler", { message: "entered" });
				logger.debug("Created file", file);

				if (file instanceof TFile) {
					if (isDocument(file)) {
						const linkedImages: string[] = await getLinkedImages(file, this.app);
						linkedImages.forEach((imageName) => {
							this.syncQueue.enqueue(
								new UpdateImageRelations(imageName, file, this.vaultState)
							);
						});
					} else if (isImage(file)) {
						this.syncQueue.enqueue(new AddImage(file, this.vaultState));
					}
				}
			});

			this.app.vault.on('modify', async (file: TAbstractFile) => {
				logger.debug("Modify handler", { message: "entered" });
				logger.debug("Modified file", file);

				if (file instanceof TFile && isDocument(file)) {
					const linkedImages: string[] = await getLinkedImages(file, this.app);
					linkedImages.forEach((imageName) => {
						this.syncQueue.enqueue(
							new UpdateImageRelations(imageName, file, this.vaultState)
						);
					});
				}
			});

			this.app.vault.on('rename', (newFile: TAbstractFile, oldPath: string) => {
				logger.debug("Rename handler", { message: "entered" });
				logger.debug("New file", newFile);
				logger.debug("Oldpath", { message: oldPath });

				if (newFile instanceof TFile) {
					if (isImage(newFile)) {
						this.syncQueue.enqueue(new RenameImage(oldPath, newFile, this.vaultState));
					}
					//Files do not need to be handled. We have the TFile reference directly in our map, which is updated by obsidian
				}
			});

			this.app.vault.on('delete', (file: TAbstractFile) => {
				logger.debug("Delete handler", { message: "entered" });
				logger.debug("Deleted file", file);

				if (file instanceof TFile) {
					if (isDocument(file)) {
						this.syncQueue.enqueue(new RemoveDocument(file, this.vaultState));
					} else if (isImage(file)) {
						this.syncQueue.enqueue(new RemoveImage(file, this.vaultState));
					}
				}
			});
		});

		this.addCommand({
			id: 'image-cleanup',
			name: 'open ui',
			callback: () => {
				new ManageModal(this.app, this.vaultState).open();
			}
		});

		this.addSettingTab(new ImageManagerSettingTab(this.app, this));
	}

	onunload() {
		//we have nothing to cleanup on disk etc.
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ImageManagerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ManageModal extends Modal {
	vaultState: VaultState;

	constructor(app: App, vaultState: VaultState) {
		super(app);
		this.vaultState = vaultState;
	}

	onOpen() {
		let { contentEl } = this;

		const modal: Element | null = this.containerEl.querySelector("div.modal");
		if (modal instanceof HTMLElement) {
			modal.classList.add("width_100");
		}

		const modalTitle: HTMLHeadingElement = document.createElement("h1");
		modalTitle.setText("Image manager");
		contentEl.appendChild(modalTitle);

		const entryGridContainer = document.createElement("div");
		entryGridContainer.classList.add("entry-grid-container");

		const danglingImages = this.vaultState.getDanglingImages();
		danglingImages.forEach((file: TFile) => {
			const entryCard = document.createElement("div");
			entryCard.classList.add("entry-card");
			entryCard.dataset.filePath = file.path;

			const name = document.createElement("h3");
			name.setText(file.basename);

			const filePath = document.createElement("p");
			filePath.setText(file.path);

			const openButton = document.createElement("button");
			openButton.type = "button";
			openButton.classList.add("open-image-button");
			openButton.setText("Open image");
			openButton.onClickEvent(async () => {
				await this.app.workspace.getLeaf().openFile(file);
				this.close();
			});

			const deleteButton = document.createElement("button");
			deleteButton.type = "button";
			deleteButton.classList.add("delete-image-button");
			deleteButton.setText("Delete image");
			deleteButton.onClickEvent(() => {
				void this.app.fileManager.promptForDeletion(file).then(() => {
					if (file.deleted) {
						logger.debug("delete-button", { message: "User approved removal." });

						const deleteEntryCard = entryGridContainer.querySelector("div[data-file-path='" + file.path + "']");
						if (deleteEntryCard !== null) {
							entryGridContainer.removeChild(deleteEntryCard);
						} else {
							logger.error("delete-button", { message: "Removed file {" + file.name + "} but did not find entryCard to remove from list" });
							new Notice("File with name {" + file.name + "} was deleted but we could not update the list. Closing modal.");
							this.close();
						}
					} else {
						logger.debug("delete-button", { message: "User denied removal." });
					}
				});
			});

			const buttonGroup = document.createElement("div");
			buttonGroup.classList.add("button-group");
			buttonGroup.appendChild(openButton);
			buttonGroup.appendChild(deleteButton);

			// Preview Image
			const resourcePath = this.app.vault.getResourcePath(file);
			const previewImage = document.createElement("img");
			previewImage.src = resourcePath;

			entryCard.appendChild(name);
			entryCard.appendChild(filePath);
			entryCard.appendChild(previewImage);
			entryCard.appendChild(buttonGroup);
			entryGridContainer.appendChild(entryCard);
		});

		contentEl.appendChild(entryGridContainer);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
