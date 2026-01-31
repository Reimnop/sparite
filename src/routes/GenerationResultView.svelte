<script lang="ts">
  import { getColorHex, type ColorRgb } from "$lib/algo/Color";
  import Button from "$lib/components/ui/button/button.svelte";
  import { onMount } from "svelte";
  import type { GenerationResult } from "./GenerationResult";

  import NoColor from "$lib/icons/no-color.svg";
  import { createPrefab } from "$lib/algo/VgpExport";
  import Separator from "$lib/components/ui/separator/separator.svelte";

  interface ThemeColor {
    index: number;
    color: ColorRgb;
  }

  interface Props {
    result: GenerationResult;
  }

  let { result }: Props = $props();

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

  function onDownloadButtonClicked() {
    const filename = `${normalizeFileName(result.prefabName)}.vgp`;
    const colorIndexMap = getColorIndexMap();
    const prefab = createPrefab(
      result.prefabName,
      result.prefabDescription,
      result.prefabType,
      result.lifetime,
      result.depth,
      result.useHitObjects,
      result.rects,
      colorIndexMap,
      Date.now()
    );
    const prefabJson = JSON.stringify(prefab);
    const textEncoder = new TextEncoder();
    const prefabData = textEncoder.encode(prefabJson);
    downloadData([prefabData], filename, "application/octet-stream");
  }

  function getColorIndexMap(): Map<number, number> {
    const colorIndexMap: Map<number, number> = new Map();
    for (let i = 0; i < colors.length; i++) {
      const currentThemeColor = colors[i];
      if (currentThemeColor) {
        colorIndexMap.set(currentThemeColor.index, i);
      }
    }
    return colorIndexMap;
  }

  function normalizeFileName(name: string): string {
    // convert all non-alphanumeric characters to underscores
    return name.replace(/[^a-zA-Z0-9]/gi, "_").toLowerCase();
  }

  function downloadData(data: BlobPart[], filename: string, mimeType: string) {
    const blob = new Blob(data, { type: mimeType });
    const url = URL.createObjectURL(blob);

    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<div class="font-semibold">{result.prefabName}</div>
<p class="text-sm text-muted-foreground">{result.prefabDescription}</p>

<Separator class="my-4" />

<div class="font-semibold">Prefab Info</div>
<table class="text-sm text-muted-foreground">
  <tbody>
    <tr>
      <td class="pr-4">Lifetime</td>
      <td class="font-semibold">{result.lifetime}</td>
    </tr>
    <tr>
      <td class="pr-4">Depth</td>
      <td class="font-semibold">{result.depth}</td>
    </tr>
    <tr>
      <td class="pr-4">Use Hit Objects</td>
      <td class="font-semibold">{result.useHitObjects ? "Yes" : "No"}</td>
    </tr>
    <tr>
      <td class="pr-4">Size</td>
      <td class="font-semibold">{result.width} x {result.height} px</td>
    </tr>
    <tr>
      <td class="pr-4">Color Count</td>
      <td class="font-semibold">
        {#if result.palette.length > 9}
          ⚠️
        {/if}
        {result.palette.length}
      </td>
    </tr>
    <tr>
      <td class="pr-4">Object Count</td>
      <td class="font-semibold">{result.rects.length}</td>
    </tr>
  </tbody>
</table>

<Separator class="my-4" />

<div class="font-semibold">Theme</div>
<p class="text-sm text-muted-foreground">Click to copy to clipboard. Drag to reorder.</p>

<div>
  {#each colors as color}
    <div class="relative h-12">
      {#if color}
        <Button
          variant="outline"
          class="absolute top-1/2 w-full -translate-y-1/2 cursor-pointer justify-start"
          onclick={() => copyToClipboard(getColorHex(color.color))}
        >
          <div
            class="-ml-2 h-6 w-6 rounded-sm border border-muted-foreground/50"
            style="background-color: {getColorHex(color.color)};"
          ></div>
          <span>{getColorHex(color.color)}</span>
        </Button>
      {:else}
        <img
          class="absolute top-1/2 left-2 h-6 w-6 -translate-y-1/2 rounded-sm border border-muted-foreground/50 bg-transparent"
          src={NoColor}
          alt="No color"
        />
      {/if}
    </div>
  {/each}
</div>

<Separator class="my-4" />

<Button class="w-full cursor-pointer" onclick={onDownloadButtonClicked}>Download Prefab</Button>
