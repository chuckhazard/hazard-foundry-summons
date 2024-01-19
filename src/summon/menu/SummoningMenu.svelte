<svelte:options accessors={true} />

<script>
	import * as columnDefs from './columns/index.js';
	import FilterGroup from './FilterGroup.svelte';
	import Filters from './Filters.svelte';
	import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
	import { writable } from 'svelte/store';
	import loadPacks from './loadPacks.js';
	import { debug, localize, moduleID, deduplicate } from '../../utils.js';
	import defaultFilters from './defaultFilters.js';
	import { getContext } from 'svelte';
	import { DocWrapper } from '../packs.js';
	const { application } = getContext('#external');

	export let elementRoot;
	export let ogData;

	let data = foundry.utils.mergeObject(
		{
			sourceTokens: canvas.tokens.ownedTokens,
			creatures: null,
			location: null,
			amount: { value: 1, locked: false },
			filters: [],
			updates: undefined,
			flags: undefined,
			options: {
				defaultFilters: true,
				noAnimation: false,
			},
		},
		ogData
	);

	// Apply default column defs or flag that custom template is in use.
	if (!data.columns) data.columns = columnDefs[game.system.id] || columnDefs.none;

	if (!data.creatures) {
		data.creatures = loadPacks();
	} else if (data.creatures instanceof CompendiumCollection) {
		data.creatures = loadPacks(false, false, [data.creatures.metadata]);
	} else if (Array.isArray(data.creatures) && data.creatures.some((pack) => pack instanceof CompendiumCollection)) {
		data.creatures = new Promise((resolveOuter) => {
			data.creatures = data.creatures.map(async (pack) => {
				if (pack instanceof CompendiumCollection) {
					return await loadPacks(false, false, [pack.metadata]);
				} else {
					return pack;
				}
			});
			Promise.all(data.creatures).then((creatures) => {
				resolveOuter(creatures.flat());
			});
		});
	} else {
		// We want to support the following options:
		// - "Actor Name" (must be imported)
		// - "Actor ID" (must be imported)
		// - Array of above
		// - "Folder Name"
		// Compendium Class

		let creatures = [];

		if (game.actors.folders.getName(data.creatures)) {
			data.creatures = game.actors.folders.getName(data.creatures).contents;
		}

		if (Array.isArray(data.creatures)) {
			creatures.push(...data.creatures);
		} else {
			creatures.push(data.creatures);
		}

		creatures = creatures.flatMap((el) => {
			if (el instanceof DocWrapper) return el;
			if (el instanceof CONFIG.Actor.documentClass) return new DocWrapper(el);

			const actor = game.actors.get(el) || game.actors.getName(el);
			if (!actor) throw Error('Hazard Foundry Summons | No actor found in provided arguments!');

			return new DocWrapper(actor);
		});

		data.creatures = creatures;
	}

	if (data.options.defaultFilters) {
		data.filters.push(...defaultFilters());
		data.filters = deduplicate(data.filters, (filter) => filter.name);
	}

	const token = writable(canvas.tokens.controlled[0] ?? data?.sourceTokens?.[0]);
	const creature = writable();
	const currentFilters = writable(data.filters ?? []);
	const filterGroups = writable(data.filterGroups ?? []);
	const sort = writable({ column: data.columns[0], reverse: false });
	const search = writable('');
	const amount = writable(data.amount.value);

	async function send() {
		let location = data.location;

		if (!location) {
			const importedToken = (await $creature.loadDocument()).prototypeToken;

			const crosshairConfig = {
				label: importedToken.name,
				interval: importedToken.height < 1 ? 4 : importedToken.height % 2 === 0 ? 1 : -1,
				lockSize: true,
				radius: importedToken.width,
				drawOutline: debug() || !game.modules.get('sequencer')?.active,
				drawIcon: debug() || !game.modules.get('sequencer')?.active,
				icon: importedToken.texture.src,
			};

			let crosshairShow;

			if (game.modules.get('sequencer')?.active)
				crosshairShow = {
					show: async (crosshair) => {
						new Sequence('Hazard Foundry Summons')
							.effect()
							.file(importedToken?.texture?.src ?? $creature.img)
							.attachTo(crosshair)
							.persist()
							.scaleToObject(importedToken.height * importedToken.texture.scaleX)
							.opacity(0.5)
							.play();
					},
				};

			application.minimize();
			const crosshairs = await warpgate.crosshairs.show(crosshairConfig, crosshairShow);
			if (crosshairs.cancelled) {
				application.maximize();
				return;
			}

			const template = (
				await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [
					{
						...crosshairs,
						distance: (importedToken.height / 2) * canvas.scene.grid.distance,
					},
				])
			)[0];

			location = { ...template.toObject(), docName: 'MeasuredTemplate', uuid: template.uuid };
		}

		const options = {
			player: game.user.id,
			summonerTokenDocument: $token?.document,
			creatureActor: $creature.serialize(),
			amount: $amount,
			location,
			updates: data.updates ?? {},
			flags: data.flags ?? {},
			noAnimation: data.options.noAnimation,
		};
		debug('Sending', options);
		warpgate.event.notify('fs-summon', options);
	}

	if (data.options.autoPick && data.creatures.length === 1) {
		creature.set(data.creatures[0]);
		send();
	}

	function openImage(actor) {
		new ImagePopout(actor.img, { title: actor.name, uuid: actor.uuid }).render(true);
	}

	/**
	 * Filter the creature list. If any of the group filters are true the creature is included.
	 * If all filters are disabled, don't filter, unless flag specified.
	 *
	 * @param {Array} creatures List of creatures
	 * @param {Object} group Object
	 * @param {Array} group.filters	List of filter objects
	 * @param {boolean} group.filterWhenDisabled If no filters are enabled, return an empty list.
	 * @param {boolean} group.filters[].disabled Disabled filters are ignored.
	 * @param {function} group.filters[].function Function should return true if creature should
	 * 										      be included in results.
	 */
	function groupFilter(creatures, group) {
		let filters = group.filters.filter((i) => !i.disabled);
		if (filters.length) {
			return creatures.filter((creature) => {
				for (const filter of filters) {
					if (!filter.disabled && filter.function(creature)) return true;
				}
			});
		}
		return group.filterWhenDisabled ? [] : creatures;
	}

	function filterCreatures(creatures, filters, filterGroups, search) {
		let filtered = creatures.filter((x) => x.name.toLowerCase().includes(search.toLowerCase()));

		for (const group of filterGroups) {
			filtered = groupFilter(filtered, group);
		}

		filters
			.filter((x) => !x.disabled || x.locked)
			.forEach((filter) => {
				filtered = filter.function(filtered);
			});

		if ($sort.reverse) return filtered.sort($sort.column.compareFn).reverse();
		else return filtered.sort($sort.column.compareFn);
	}
</script>

<ApplicationShell bind:elementRoot>
	<main>
		<div>
			{#if $filterGroups.length}
				<div class="filter-wrapper">
					<p>{localize('fs.menu.filterGroups')}</p>
					{#each $filterGroups as group, i}
						<span class="row">
							<FilterGroup {filterGroups} {i} {currentFilters} />
						</span>
					{/each}
				</div>
			{/if}

			{#if $currentFilters.length}
				<div class="filter-wrapper">
					<p>{localize('fs.menu.currentFilters')}</p>
					<Filters {currentFilters} />
				</div>
			{/if}

			<div>
				<label for="token">{localize('fs.menu.summonToken')}</label>
				<select id="token" name="token" type="dropdown" placeholder="Select a Token" bind:value={$token}>
					{#each data.sourceTokens as token}
						<option value={token}>{token.name}</option>
					{/each}
				</select>
			</div>
			<div>
				{#if data.amount.locked}
					<span class="fas fa-lock disabled" />
				{/if}
				<label for="number" class:disabled={data.amount.locked}>{localize('fs.menu.howMany')}</label>
				<input type="number" id="number" min="1" bind:value={$amount} disabled={data.amount.locked} />
			</div>
		</div>
		<div class="search-options-box">
			<div class="search">
				<input type="text" bind:value={$search} />
			</div>

			<!-- <div class="creatures-wrapper" style="grid-template-columns: repeat({data.columns.length + 1}, 1fr);"> -->
			<div
				class="creatures"
				style="grid-template-columns: repeat({data.columns.length}, minmax(0, max-content)) auto;"
			>
				<span class="header image">
					{localize('fs.menu.headers.image')}
				</span>
				{#each data.columns as column, i}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<span
						class="header"
						on:click={() => {
							if (!column.compareFn) return;
							if ($sort.column == column) $sort.reverse = !$sort.reverse;
							else $sort.reverse = false;
							$sort.column = column;
						}}
					>
						{@html column.name}
						<span class="sort-arrow" class:invisible={$sort.column != column}>
							{#if $sort.reverse}
								<i class="down arrow" />
							{:else}
								<i class="up arrow" />
							{/if}
						</span>
					</span>
				{/each}
				<div class="scroll">
					<!-- <Header columns={data.columns} {sort} {localize} /> -->
					{#await data.creatures}
						<span class="row">
							<span class="cell"><p>{localize('fs.menu.loading')}</p></span>
						</span>
					{:then creatures}
						{@const filteredCreatures = filterCreatures(
							creatures,
							$currentFilters,
							$filterGroups,
							$search,
							$sort
						)}
						{#if filteredCreatures.length === 0}
							<span class="row">
								<span class="cell"><p>{localize('fs.menu.nothing')}</p></span>
							</span>
						{:else}
							{#each filteredCreatures as opt}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<span
									class="row"
									class:selected={$creature?.id === opt.id}
									on:click={() => ($creature = opt)}
									on:dblclick={() => send() && application.close()}
								>
									<span class="cell">
										<img
											src={opt.img}
											alt={opt.name}
											loading="lazy"
											on:keypress={openImage(opt)}
											on:click={openImage(opt)}
										/>
									</span>
									{#each data.columns as column, i}
										<span class="cell">
											{@html column.value(opt)}
										</span>
									{/each}
								</span>
							{/each}
						{/if}
					{:catch error}
						<p>{localize('fs.menu.error', { error: error.message })}</p>
					{/await}
				</div>
			</div>
		</div>
	</main>
	<div class="split">
		<button on:click={send} class:disabled={!$creature} disabled={!$creature}>
			{localize(
				'fs.menu.summon',
				$creature ? { number: $amount, creature: $creature?.name } : { number: '', creature: '' }
			)}
		</button>
		<button on:click={() => send() && application.close()} class:disabled={!$creature} disabled={!$creature}>
			{localize(
				'fs.menu.summonAndClose',
				$creature ? { number: $amount, creature: $creature?.name } : { number: '', creature: '' }
			)}
		</button>
	</div>
</ApplicationShell>

<style lang="scss">
	.filter-wrapper {
		display: grid;
		grid-template-columns: max-content 1fr;
		row-gap: 2px;
		border: none;
		padding: 0 5px 10px 5px;
	}

	.filter-wrapper p {
		grid-column: span 2;
	}

	.filter-wrapper .row {
		display: grid;
		row-gap: 5px;
		column-gap: 5px;
		background-color: rgb(0, 0, 0, 0.1);
		margin: 2px 0;
		padding: 5px;
		border-radius: 0.25rem;
		grid-template-columns: subgrid;
		grid-column: span 2;
	}

	input,
	select {
		margin: 0.25rem;
		margin-left: 0.5rem;
		min-width: 40%;
		max-width: 40%;
	}

	.disabled {
		opacity: 0.6;
		filter: grayscale(100%);
	}

	.search-options-box {
		display: flex;
		flex-direction: column;
	}

	.search {
		min-height: 2.25rem;
		height: 2.25rem;
		max-height: 2.25rem;

		input {
			height: 1.75rem;
			padding: 0.25rem;
		}
	}

	.creatures {
		overflow-x: hidden;
		display: grid;
		row-gap: 5px;
		column-gap: 5px;
		background-color: rgb(0, 0, 0, 0.1);
		padding: 5px;
		border-radius: 0.25rem;
	}

	.creatures .header {
		align-items: center;
		justify-content: center;
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		list-style-type: none;
		padding-left: 5px;
	}

	.creatures .scroll {
		padding: 0;
		margin: 0;
		display: grid;
		padding-right: 10px;
		border-radius: 0;
		grid-template-columns: subgrid;
		grid-column: 1/-1;
	}

	.creatures .scroll .row {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: 1/-1;

		&:hover {
			box-shadow: inset 0 0 0 200px #006cc41c;
		}
	}

	.creatures .scroll .row .cell {
		align-items: center;
		justify-content: center;
		display: flex;
		flex-wrap: wrap;
		list-style-type: none;
	}

	.selected {
		background-color: #416482;
		color: #fff;
		box-shadow: inset 0 0 0 200px #006bc44d;
	}

	button {
		margin-top: 0.125rem;
	}

	main {
		text-align: center;
		display: flex;
		flex-direction: row;
		columns: 2;
		min-height: calc(600px - 5rem - 2px);

		& > div {
			width: 50%;
		}
	}

	div {
		overflow-y: auto;
		box-shadow: 0 0 0.25rem 0.25rem rgba(0, 0, 0, 0.25);
		margin: 0.25rem;
		border-radius: 0.25rem;

		& > div {
			box-shadow: 0 0 0.125rem 0.125rem rgba(0, 0, 0, 0.25);
			margin: 0.25rem;
		}

		&.split {
			all: unset;

			display: flex;
			flex-direction: row;
			justify-content: space-evenly;
			align-items: center;
			padding-top: 0;
			border-radius: 0.25rem;
			button {
				width: 100%;
			}
		}
	}

	.cell {
	}

	img {
		clear: left;
		float: left;
		height: 100%;
		width: 50px;
		object-fit: cover;
		object-position: top;

		box-sizing: border-box;
		border: 1px solid var(--color-border-dark);
		border-radius: 2px;

		&:hover {
			box-shadow: inset 0 0 0 200px #0300c42c;
		}
	}

	.invisible {
		opacity: 0%;
	}
	.sort-arrow {
		width: 5px;
		padding: 5px;
	}
	.arrow {
		border: solid black;
		border-width: 0 3px 3px 0;
		display: inline-block;
		padding: 3px;
	}

	.up {
		transform: rotate(-135deg);
		-webkit-transform: rotate(-135deg);
	}

	.down {
		transform: rotate(45deg);
		-webkit-transform: rotate(45deg);
	}

	@import 'style/styles.css';
</style>
