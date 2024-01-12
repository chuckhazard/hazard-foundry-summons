export const moduleID = 'hazard-foundry-summons';
const isNumericRegex = new RegExp(/[-+](\d*?\.?\d+|\d+\.?\d*)/);

/**
 * Returns the localized string for the given key.
 *
 * @param {string} key - The localization
 *
 * @param {object} format - Formatting to add to the localized string
 *
 * @returns {string} The localized string
 */
export function localize(key, format) {
	if (key.startsWith('fs')) {
		key = key.replace('fs.', 'hazard-foundry-summons.');
	}
	if (format) {
		return game.i18n.format(key, format);
	} else {
		return game.i18n.localize(key);
	}
}

/**
 * Sends out a console log if debug mode is enabled.
 *
 * @returns {void}
 */
export function debug() {
	if (game.settings.get(moduleID, 'debug')) {
		if (arguments.length > 0) {
			console.log('Hazard Foundry Summons |', ...arguments);
		}
		return true;
	}
}

/**
 * Removes duplicates from an array of objects based on a key.
 *
 * @example deduplicate(items, (item) => item.id));
 *
 * @param {Array} array - The array to deduplicate
 *
 * @param {Function} getKey - The function to get the key from the object
 *
 * @returns {Array} The deduplicated array
 */
export function deduplicate(array, getKey) {
	const seenItems = {};
	return array.filter((item) => {
		const key = getKey(item);
		if (seenItems[key]) {
			return false;
		}
		seenItems[key] = true;
		return true;
	});
}

/**
 * Stolen from the PF2e system.
 *
 * Quick and dirty API around the Loading bar.
 * Does not handle conflicts; multiple instances of this class will fight for the same loading bar, but once all but
 * once are completed, the bar should return to normal
 *
 */
export class Progress {
	constructor({ steps = 1 } = {}) {
		this.steps = steps;
		this.counter = -1;
	}

	advance(label) {
		this.counter += 1;
		const pct = Math.floor((100 * this.counter) / this.steps);
		SceneNavigation.displayProgressBar({ label, pct });
	}

	close(label) {
		SceneNavigation.displayProgressBar({ label, pct: 100 });
	}
}

/**
 * @param {*} x Input
 *
 * @returns {number} true if the input is a number
 */
const isNumber = (x) => !isNaN(x);

/**
 * @param {*} x Input
 *
 * @returns {number} true if the input is a string (has a match function)
 */
const isString = (x) => x.match;

/**
 * @param {*} x Input
 *
 * @returns {number} true if the input is a string and fully numeric
 */
const isNumeric = (x) => isString(x) && x.match(isNumericRegex);

/**
 * Ambiguous (or ambitious) sort function for potentially disparate data types.
 * Null/Undefined are sorted first, numbers and numeric strings are compared naturally,
 * as are non-numeric strings. If types don't match, strings sort before numbers.
 *
 * @param {*} lhs left hand side value
 *
 * @param {*} rhs right hand side value
 *
 * @param {*} invert invert comparison
 *
 * @returns {number} 0 for equivalent items, <0 if lhs sorts first, >0 if rhs sorts first.
 */
const ambiSort = (lhs, rhs, invert) => {
	if (invert) return ambiSort(lhs, rhs) * -1;
	try {
		if (lhs === rhs) return 0;
		if (lhs === null || lhs === undefined) return 1;
		if (rhs === null || rhs === undefined) return -1;
		if (isNumber(lhs) && isNumber(rhs)) return lhs - rhs;
		if (isNumeric(lhs) && isNumeric(rhs)) return parseFloat(lhs) - parseFloat(rhs);
		if (isNumber(lhs)) return 1;
		if (isNumber(rhs)) return -1;
		return lhs.localeCompare(rhs);
	} catch (ex) {
		// console.log(ex);
	}
	return 0;
};

/**
 * Convenience function to create a column definition, which is used to build
 * the creature list header and rows.
 *
 * @param {*} name	Column header name
 *
 * @param {*} width	Pixel width for column
 *
 * @param {*} valueFn Function to get the column value from a creature object.
 *
 * @param {*} compareFn Function to compare two rows for sorting, defaults to
 * 						ambisort, first extracting the field value with valueFn
 *
 * @returns {object} Object containing necessary column data
 */
export const columnDefinition = (name, valueFn, compareFn) => {
	if (!compareFn && valueFn) {
		// eslint-disable-next-line id-length
		compareFn = (a, b) => {
			const lhs = valueFn(a);
			const rhs = valueFn(b);
			return ambiSort(lhs, rhs);
		};
	}

	return {
		name,
		compareFn,
		value: valueFn,
	};
};
