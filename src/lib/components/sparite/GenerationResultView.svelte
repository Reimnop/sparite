<script lang="ts">
  import { getColorHex, type ColorRgb } from "$lib/algo/Color";
  import type { ColoredRect } from "$lib/algo/Rect";
  import type { RectImage, RectImageFrame } from "$lib/algo/RectImage";
  import { createPrefab, type PrefabRect } from "$lib/algo/VgpExport";
  import { Alignment } from "$lib/types";
  import Button from "$lib/components/ui/button/button.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { SortableList, sortItems } from "@rodrigodagostino/svelte-sortable-list";
  import { onMount } from "svelte";
  import type { GenerationResult } from "$lib/types/GenerationResult";
  import { toast } from "svelte-sonner";

  import NoColor from "$lib/icons/no-color.svg";
  import Copy from "@lucide/svelte/icons/copy";
  import { SvelteMap } from "svelte/reactivity";

  interface ThemeColor {
    index: number;
    color: ColorRgb | null;
  }

  interface Props {
    result: GenerationResult;
  }

  let { result }: Props = $props();
  let rectImage = $derived(result.rectImage);
  let objectCount = $derived(determineObjectCount(rectImage.frames));

  let colors: ThemeColor[] = $state([]);

  onMount(() => {
    let i = 0;
    for (; i < rectImage.palette.length; i++) {
      colors.push({ index: i, color: rectImage.palette[i] });
    }
    for (; i < 9; i++) {
      colors.push({ index: i, color: null });
    }
  });

  function drawGenerationOnCanvas(
    canvas: HTMLCanvasElement,
    { rectImage, frameIndex }: { rectImage: RectImage; frameIndex: number }
  ) {
    const scaleFactor = 4; // scale up for better visibility

    canvas.width = rectImage.width * scaleFactor;
    canvas.height = rectImage.height * scaleFactor;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // disable image smoothing
    ctx.imageSmoothingEnabled = false;

    const frame = rectImage.frames[frameIndex];

    // draw each rect
    for (const rect of frame.rects) {
      const color = rectImage.palette[rect.color.index];
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${rect.color.opacity})`;
      ctx.fillRect(
        rect.x * scaleFactor,
        rect.y * scaleFactor,
        rect.width * scaleFactor,
        rect.height * scaleFactor
      );
    }
  }

  function onDownloadButtonClicked() {
    const colorIndexMap = getColorIndexMap();

    // allocate prefab rects
    const prefabRects: PrefabRect[] = [];
    for (let i = 0; i < objectCount; i++) {
      prefabRects.push({
        positions: [],
        sizes: [],
        colors: []
      });
    }

    // loop through every frame
    let time = 0,
      currentFrameIndex = 0;
    while (time < result.lifetime) {
      const coloredRects = postProcessRectImageFrame(
        rectImage,
        currentFrameIndex,
        result.pixelsPerUnit,
        result.horizontalAlignment,
        result.verticalAlignment,
        colorIndexMap
      );

      // push keyframes to prefab rects
      let j = 0;
      for (; j < coloredRects.length; j++) {
        const rect = coloredRects[j];
        prefabRects[j].positions.push({ time, value: [rect.x, rect.y] });
        prefabRects[j].sizes.push({ time, value: [rect.width, rect.height] });
        prefabRects[j].colors.push({ time, value: rect.color });
      }

      // hide remaining objects
      for (; j < prefabRects.length; j++) {
        prefabRects[j].positions.push({ time, value: [0, 0] });
        prefabRects[j].sizes.push({ time, value: [0, 0] });
        prefabRects[j].colors.push({ time, value: { index: 0, opacity: 0 } });
      }

      time += rectImage.frames[currentFrameIndex].delay / 1000;

      // advance frame index
      currentFrameIndex++;
      if (currentFrameIndex >= rectImage.frames.length) {
        if (!result.looped) {
          break;
        }
        currentFrameIndex = 0;
      }
    }

    const filename = `${normalizeFileName(result.prefabName)}.vgp`;
    const prefab = createPrefab(
      result.prefabName,
      result.prefabDescription,
      result.prefabType,
      result.lifetime,
      result.depth,
      result.useHitObjects,
      prefabRects,
      Date.now()
    );
    const prefabJson = JSON.stringify(prefab, (key, value) => {
      if (typeof value === "number") {
        return Math.round(value * 10000) / 10000; // round to 4 decimal places
      }
      return value;
    });
    const textEncoder = new TextEncoder();
    const prefabData = textEncoder.encode(prefabJson);
    downloadData([prefabData], filename, "application/octet-stream");
  }

  function postProcessRectImageFrame(
    rectImage: RectImage,
    frameIndex: number,
    pixelsPerUnit: number,
    horizontalAlignment: Alignment,
    verticalAlignment: Alignment,
    colorMap: Map<number, number>
  ): ColoredRect[] {
    const scaleFactor = 1 / pixelsPerUnit; // the generator assumes 1 ppu, so scale accordingly
    const offsetX = computeXOffset(rectImage.width * scaleFactor, horizontalAlignment);
    const offsetY = computeYOffset(rectImage.height * scaleFactor, verticalAlignment);

    const frame = rectImage.frames[frameIndex];

    const result = frame.rects.map((rect) => {
      let mappedIndex = colorMap.get(rect.color.index);
      if (mappedIndex === undefined) {
        mappedIndex = rect.color.index;
      }
      return {
        x: rect.x * scaleFactor + offsetX,
        y: rect.y * scaleFactor + offsetY,
        width: rect.width * scaleFactor,
        height: rect.height * scaleFactor,
        color: {
          index: mappedIndex,
          opacity: rect.color.opacity
        }
      };
    });

    return result;
  }

  function computeXOffset(width: number, horizontalAlignment: Alignment) {
    if (horizontalAlignment === Alignment.Left) {
      return 0;
    }
    if (horizontalAlignment === Alignment.Center) {
      return -width / 2;
    }
    return -width;
  }

  function computeYOffset(height: number, verticalAlignment: Alignment) {
    if (verticalAlignment === Alignment.Top) {
      return 0;
    }
    if (verticalAlignment === Alignment.Middle) {
      return -height / 2;
    }
    return -height;
  }

  function getColorIndexMap(): Map<number, number> {
    const colorIndexMap: Map<number, number> = new SvelteMap();
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
    toast(`Copied ${text} to clipboard!`);
  }

  function handleDragEnd(e: SortableList.RootEvents["ondragend"]) {
    const { draggedItemIndex, targetItemIndex, isCanceled } = e;
    if (
      !isCanceled &&
      typeof targetItemIndex === "number" &&
      draggedItemIndex !== targetItemIndex
    ) {
      colors = sortItems(colors, draggedItemIndex, targetItemIndex);
    }
  }

  function determineObjectCount(frames: RectImageFrame[]): number {
    return Math.max(...frames.map((frame) => frame.rects.length));
  }
</script>

<div class="font-semibold">{result.prefabName}</div>
<p class="text-sm text-muted-foreground">{result.prefabDescription}</p>

<Separator class="my-4" />

<div class="font-semibold">Prefab Info</div>
<div class="flex flex-wrap items-center gap-2">
  <canvas
    class="h-full max-h-32 max-w-48 bg-transparent"
    use:drawGenerationOnCanvas={{ rectImage, frameIndex: 0 }}
  ></canvas>

  <table class="text-sm text-muted-foreground">
    <tbody>
      <tr>
        <td class="pr-4">Lifetime</td>
        <td class="font-semibold">{result.lifetime} seconds</td>
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
        <td class="font-semibold">{rectImage.width}&times;{rectImage.height} px</td>
      </tr>
      <tr>
        <td class="pr-4">Color Count</td>
        <td class="font-semibold">
          {#if rectImage.palette.length > 9}
            ⚠️
          {/if}
          {rectImage.palette.length}
        </td>
      </tr>
      <tr>
        <td class="pr-4">Object Count</td>
        <td class="font-semibold">{objectCount}</td>
      </tr>
      {#if rectImage.frames.length > 1}
        <tr>
          <td class="pr-4">Frame Count</td>
          <td class="font-semibold">{rectImage.frames.length}</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<Separator class="my-4" />

<div class="font-semibold">Theme</div>
<p class="pb-4 text-sm text-muted-foreground">Click to copy to clipboard. Reorder if necessary.</p>

<div class="grid grid-cols-[min-content_minmax(0,1fr)] gap-3.5">
  <div class="grid gap-3">
    {#each colors as color, i (color.index)}
      <div class="flex h-12 items-center justify-center font-mono">{i + 1}</div>
    {/each}
  </div>
  <SortableList.Root ondragend={handleDragEnd}>
    {#each colors as color, i (String(color.index))}
      <SortableList.Item
        class="flex h-12 items-center justify-between rounded-md border border-border bg-muted data-[is-ghost=false]:data-[drag-state*='ptr']:opacity-0"
        id={String(color.index)}
        index={i}
      >
        <div class="flex items-center gap-2.5 pl-3">
          {#if color.color}
            <div
              class="size-6 rounded-sm"
              style="background-color: {getColorHex(color.color)};"
            ></div>
            <span class="font-mono">{getColorHex(color.color)}</span>
          {:else}
            <img class="size-6 rounded-sm" src={NoColor} alt="No color" />
            <span>No color</span>
          {/if}
        </div>
        <div class="flex items-center">
          {#if color.color}
            <button
              class="cursor-pointer rounded-sm border border-border bg-card p-2 transition-colors hover:bg-card/50"
              onclick={() => copyToClipboard(getColorHex(color.color!))}
            >
              <Copy class="size-4" />
            </button>
          {/if}
          <SortableList.ItemHandle class="p-4!" />
        </div>
      </SortableList.Item>
    {/each}
  </SortableList.Root>
</div>

<Separator class="my-4" />

<Button class="w-full cursor-pointer" onclick={onDownloadButtonClicked}>
  Export &amp; Download Prefab
</Button>
