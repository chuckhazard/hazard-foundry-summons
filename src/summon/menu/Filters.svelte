<script>
	export let currentFilters;
</script>

<div class="tags">
	{#each $currentFilters as filter, i}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span
			class="tag"
			class:locked={$currentFilters[i].locked}
			class:disabled={$currentFilters[i].disabled}
			on:click={() => {
				!$currentFilters[i].locked
					? ($currentFilters[i].disabled = !$currentFilters[i].disabled)
					: $currentFilters[i];
			}}
		>
			{#if $currentFilters[i].locked}
				<i style="margin-right:5px" class="fa-solid fa-lock" />
			{/if}
			{$currentFilters[i].name}
		</span>
	{/each}
</div>

<style>
	.tags {
		grid-column: 2/2;
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		list-style-type: none;
		padding-left: 5px;
	}

	div.tags span.tag {
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

	.disabled {
		opacity: 0.6;
		filter: grayscale(100%);
	}

	.tag.locked {
		opacity: 75%;
		/* Diagonal line through div*/
		/* background: linear-gradient(
			to top left,
			rgba(255, 255, 255, 0) 46%,
			rgba(0, 0, 0, 1) 50%,
			rgba(255, 255, 255, 0) 46%
		); */
	}
</style>
