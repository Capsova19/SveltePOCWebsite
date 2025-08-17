<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { toast } from "svelte-sonner";

</script>
<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<Button onclick={() => toast.success("Hello world")}>Show toast</Button>