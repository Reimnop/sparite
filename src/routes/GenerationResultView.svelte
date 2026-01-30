<script lang="ts">
  import { getColorHex, type ColorRgb } from "$lib/algo/Color";
  import Button from "$lib/components/ui/button/button.svelte";
  import { onMount } from "svelte";
  import type { GenerationResult } from "./GenerationResult";

  import NoColor from "$lib/icons/no-color.svg"

  interface ThemeColor {
    index: number;
    color: ColorRgb;
  }

  interface Props {
    result: GenerationResult;
  }

  let { 
    result 
  } : Props = $props();

  let colors: (ThemeColor | null)[] = $state([]);

  onMount(() => {
    let i = 0;
    for (; i < result.palette.length; i++) {
      colors.push({ index: i, color: result.palette[i] });
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

<div>
  {#each colors as color}
    <div class="h-12 relative">
      {#if color}
        <Button variant="outline" class="justify-start w-full cursor-pointer absolute top-1/2 -translate-y-1/2" onclick={() => copyToClipboard(getColorHex(color.color))}>
          <div class="flex -ml-2 gap-2">
            <div class="w-6 h-6 border border-muted-foreground/50 rounded-sm" style="background-color: {getColorHex(color.color)};"></div>
            <span>{getColorHex(color.color)}</span>
          </div>
        </Button>
      {:else}
        <img class="left-2 absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-sm border border-muted-foreground/50 bg-transparent" src={NoColor} alt="No color" />
      {/if}
    </div>
  {/each}
</div>

{#if colors.length > 9}
  <div class="mt-4 text-sm text-muted-foreground">
    There are more than 9 colors in the theme. Your sprite might not be compatible with PA!
  </div>
{/if}
