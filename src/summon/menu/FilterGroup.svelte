<script>
	export let filterGroups;
	export let i;
	const filterStatus = (filters) => {
		let enabled = filters.filter((i) => !i.disabled).length;
		if (enabled == 0) return 'disabled';
		if (enabled == filters.length) return 'enabled';
		return 'partial';
	};
</script>

<div class="control">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<span
		class="name"
		class:disabled={filterStatus($filterGroups[i].filters) == 'disabled'}
		on:click={() => {
			let disabled = true;
			if ('disabled' == filterStatus($filterGroups[i].filters)) disabled = false;
			let filters = $filterGroups[i].filters;
			filters.forEach((i) => (i.disabled = disabled));
			$filterGroups[i].filters = filters;
		}}
	>
		{$filterGroups[i].category}
	</span>
</div>
<div class="filters">
	{#each $filterGroups[i].filters as filter}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span
			class="filter"
			class:disabled={filter.disabled}
			on:click={() => {
				filter.disabled = !filter.disabled;
			}}
			>{@html filter.name}
		</span>
	{/each}
</div>

<style>
	div.control {
		grid-column: 1/2;
	}
	.filters {
		grid-column: 2/2;
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		list-style-type: none;
		padding-left: 5px;
	}

	div.filters span.filter,
	.control .name {
		/* color: var(--color-text-light-highlight); */
		/* font-family: var(--sans-serif);
		font-size: var(--font-size-10);
		/* text-transform: uppercase; */
		letter-spacing: 0.05em;
		text-rendering: optimizeLegibility;
		align-items: center;
		background-color: var(--color-bg-btn-minor-active);
		border-radius: 2px;
		border-color: var(--color-border-light-highlight);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.7);
		display: inline-flex;
		font-weight: 500;
		padding: 0.3em;
	}

	.control .name {
		width: 100%;

		/* text-transform: capitalize; */
		align-items: top;
	}

	/* diagonal half colored bg */
	/* .control .name.partial {
		background: linear-gradient(to top left, var(--color-bg-btn-minor-active) 50%, rgba(0, 0, 0, 0) 50%);
	} */

	.control .name.disabled,
	.filter.disabled {
		opacity: 50%;
	}
</style>
