<script>
	export let localize;
	export let columns;
	export let sort;
</script>

<thead>
	<tr>
		<th class="image">
			{localize('fs.menu.headers.image')}
		</th>
		{#each columns as column, i}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<th
				on:click={() => {
					if (!column.compareFn) return;
					if ($sort.column == column) $sort.reverse = !$sort.reverse;
					else $sort.reverse = false;
					$sort.column = column;
				}}
			>
				{@html column.name}
				<span class:invisible={$sort.column != column}>
					{#if $sort.reverse}
						<i class="down arrow" />
					{:else}
						<i class="up arrow" />
					{/if}
				</span>
			</th>
		{/each}
	</tr>
</thead>

<style>
	thead th {
		white-space: nowrap;
		position: sticky;
		top: 0px;
	}
	th span {
		padding-right: 10px;
		padding-left: 10px;
	}

	th.image {
		width: 50px;
	}

	tr th:first-child {
		border-top-left-radius: 0.25rem;
	}
	tr th:last-child {
		border-top-right-radius: 0.25rem;
	}
	thead {
		border: none;
	}
	th {
		background-color: rgba(180, 180, 164, 1);
		background: rgba(180, 180, 164, 1);
		z-index: 15;
		position: sticky;
		top: 0;
	}
	.invisible {
		opacity: 0%;
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

	span {
		display: inline-block;
	}
</style>
