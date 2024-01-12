import { localize, columnDefinition } from '../../../utils.js';
export const dnd5e = [];

Hooks.on('ready', () => {
	dnd5e[0] = columnDefinition(localize('fs.menu.headers.name'), (item) => item.name);
	dnd5e[1] = columnDefinition(localize('fs.menu.headers.cr'), (item) => item.system?.details?.cr);
});
