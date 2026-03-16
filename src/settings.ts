import { App, PluginSettingTab, Setting } from "obsidian";
import ImageManager from "./main";

export interface ImageManagerSettings {
	performanceTrackingEnabled: boolean;
	logLevel: number;
}

export const DEFAULT_SETTINGS: ImageManagerSettings = {
	performanceTrackingEnabled: false,
	logLevel: 5,
}

export class ImageManagerSettingTab extends PluginSettingTab {
	plugin: ImageManager;

	constructor(app: App, plugin: ImageManager) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Logging level")
			.addDropdown(dropDown => dropDown
				.addOptions({ "5": "Errors", "4": "Warnings", "3": "Debugging", "2": "Tracing" })
				.setValue(String(this.plugin.settings.logLevel))
				.onChange(async (value) => {
					const newValue: number = Number(value);
					try {
						if (newValue >= 0 && newValue <= 5) {
							this.plugin.settings.logLevel = newValue;
							await this.plugin.saveSettings();
						}
					} catch (e) {
						console.error("Settings", String(newValue) + " is not a valid loglevel");
					}
				}));

		new Setting(containerEl)
			.setName("Performance tracking")
			.setDesc("Enable Browser `Performance` measuring in the Developer Console for the plugins startup.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.performanceTrackingEnabled)
				.onChange(async (value) => {
					this.plugin.settings.performanceTrackingEnabled = value;
					await this.plugin.saveSettings();
				})
			);
	}
}

