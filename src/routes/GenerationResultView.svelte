<script lang="ts">
  import { getColorHex, type ColorRgb } from "$lib/algo/Color";
  import Button from "$lib/components/ui/button/button.svelte";
    import { onMount } from "svelte";
  import type { GenerationResult } from "./GenerationResult";

  type ThemeColor = ColorRgb | null;

  interface Props {
    result: GenerationResult;
  }

  let { 
    result 
  } : Props = $props();

  let colors: ThemeColor[] = $state([]);

  onMount(() => {
    let i = 0;
    for (; i < result.palette.length; i++) {
      colors.push(result.palette[i]);
    }
    for (; i < 9; i++) {
      colors.push(null);
    }
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<div class="mb-2">
  <div class="font-semibold">{result.prefabName}</div>
  <p class="text-sm text-muted-foreground">{result.prefabDescription}</p>
</div>

<div class="flex flex-col">
  {#each colors as color}
    <div class="h-12 flex flex-col justify-center">
      {#if color}
        <Button variant="outline" class="justify-start" onclick={() => copyToClipboard(getColorHex(color))}>
          <div class="flex -ml-2 gap-2">
            <div class="w-5 h-5 rounded-sm" style="background-color: {getColorHex(color)};"></div>
            <span>{getColorHex(color)}</span>
          </div>
      </Button>
      {:else}
        <div class="flex items-center gap-2 text-muted-foreground">
          <div class="w-5 h-5 rounded-sm border border-muted-foreground/50 bg-transparent"></div>
          <span>--</span>
        </div>
      {/if}
    </div>
  {/each}
</div>

{#if colors.length > 9}
  <div class="mt-4 text-sm text-muted-foreground">
    There are more than 9 colors in the theme. Your sprite might not be compatible with PA!
  </div>
{/if}
