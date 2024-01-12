import { localize, columnDefinition } from '../../../utils.js';
export const pf2e = [];

export const traits = (creature) => {
	let out = '';
	for (const trait of creature?.system?.traits.value ?? []) {
		out += `<span class="tag">${trait}</span>`;
	}
	return out;
};

export const nameWithTraits = (creature) => {
	let out = `<div>${creature.name}</div>`;
	out += `<div class="justify-center tags">${traits(creature)}</div>`;
	return out;
};

Hooks.on('ready', () => {
	pf2e[0] = columnDefinition(localize('fs.menu.headers.name'), nameWithTraits);
	pf2e[1] = columnDefinition(localize('fs.menu.headers.level'), (creature) => creature?.system?.details.level.value);
});
