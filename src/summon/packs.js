export class DocWrapper {
	constructor(indexItem) {
		if (typeof indexItem === 'string') indexItem = JSON.parse(indexItem);
		if (indexItem instanceof DocWrapper) return indexItem;

		this.docType = this.constructor.name;
		Object.assign(this, indexItem);
		this.uuid = indexItem.uuid;
		this.name = indexItem.name;

		this.id ??= this.uuid;

		// #region Validation
		this.valid = true;
		if (!this.name) {
			this.valid = false;
			ui.notifications.error('Hazard Foundry Summons | Error loading pack index. An entry is missing a name!');
		}
		if (!this.uuid) {
			this.valid = false;
			ui.notifications.error('Hazard Foundry Summons | Error loading pack index. An entry is missing a uuid!');
		}
		if (!this.valid) {
			return console.log(this);
		}
		// #endregion Validation
	}

	serialize() {
		return { docType: this.docType, document: JSON.stringify(this) };
	}

	static deserialize(data) {
		return new this(data.document);
	}

	async loadDocument() {
		return await fromUuid(this.uuid);
	}
}

CONFIG.HazardFoundrySummons = {
	docWrapperClasses: {
		DocWrapper,
	},
	customPacks: [],
};

Hooks.once('ready', () => {
	Hooks.callAll('fs-addWrapperClasses', CONFIG.HazardFoundrySummons.docWrapperClasses);
	Hooks.callAll('fs-addCustomPacks', CONFIG.HazardFoundrySummons.customPacks);
});
