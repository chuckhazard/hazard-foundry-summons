import { localize, columnDefinition } from '../../../utils.js';
export const none = [];

Hooks.on('ready', () => {
	none[0] = columnDefinition(localize('fs.menu.headers.name'), (item) => item.name);
});
