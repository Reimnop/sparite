<script lang="ts">
  import { getColorHex, type ColorRgb } from "$lib/algo/Color";
  import type { ColoredRect } from "$lib/algo/Rect";
  import { determineObjectCount } from "$lib/algo/RectImage";
  import Button from "$lib/components/ui/button/button.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { SortableList, sortItems } from "@rodrigodagostino/svelte-sortable-list";
  import { onMount } from "svelte";
  import type { GenerationResult } from "$lib/types/GenerationResult";
  import { toast } from "svelte-sonner";
  import { Input } from "$lib/components/ui/input";
  import type { ExportResult } from "$lib/types/ExportResult";
  import ExportResultView from "./ExportResultView.svelte";
  import { SvelteMap } from "svelte/reactivity";
  import ExporterWorker from "$lib/exporter-worker.ts?worker";

  import NoColor from "$lib/icons/no-color.svg";
  import Copy from "@lucide/svelte/icons/copy";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";  

  interface Props {
    result: GenerationResult;
  }

  let { result }: Props = $props();

  let currentFramePreviewStr = $state("0");

  let rectImage = $derived(result.rectImage);
  let objectCount = $derived(determineObjectCount(rectImage.frames));

  let colors: [(ColorRgb | null), number][] = $state([]);

  let previewWidth = $derived(rectImage.width);
  let previewHeight = $derived(rectImage.height);
  
  let currentFramePreviewIndex = $state(0);
  let currentFramePreviewRects = $derived(rectImage.frames[currentFramePreviewIndex].rects);

  let exportResult: ExportResult | null = $state(null);
  let resultDialogOpen: boolean = $state(false);
  let isExporting: boolean = $state(false);

  $effect(() => {
    const parsed = parseInt(currentFramePreviewStr, 10);
    if (!isNaN(parsed)) {
      currentFramePreviewIndex = Math.min(Math.max(parsed, 0), rectImage.frames.length - 1);
    }
  });

  onMount(() => {
    let i = 0;
    for (; i < rectImage.palette.length; i++) {
      colors.push([rectImage.palette[i], i]);
    }
    for (; i < 9; i++) {
      colors.push([null, i]);
    }
  });

  function onExportButtonClicked() {
    const colorIndexMap = getColorIndexMap();
    const worker = new ExporterWorker();
    worker.onmessage = (event: MessageEvent) => {
      exportResult = event.data as ExportResult;
      resultDialogOpen = true;
      isExporting = false;
    };
    const resultSnapshot = $state.snapshot(result);
    worker.postMessage({ result: resultSnapshot, colorIndexMap });
    isExporting = true;
  }

  function drawGenerationOnCanvas(
    canvas: HTMLCanvasElement,
    rects: ColoredRect[],
    scaleFactor: number = 4
  ) {
    canvas.width = previewWidth * scaleFactor;
    canvas.height = previewHeight * scaleFactor;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // disable image smoothing
    ctx.imageSmoothingEnabled = false;

    // draw each rect
    for (const rect of rects) {
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

  function getColorIndexMap(): Map<number, number> {
    const colorIndexMap = new SvelteMap<number, number>();
    for (let i = 0; i < colors.length; i++) {
      const [color, index] = colors[i];
      if (color) {
        colorIndexMap.set(index, i);
      }
    }
    return colorIndexMap;
  }

  function advanceFrameIndex(offset: number) {
    let newIndex = currentFramePreviewIndex + offset;
    newIndex = Math.min(Math.max(newIndex, 0), rectImage.frames.length - 1);
    currentFramePreviewIndex = newIndex;
    currentFramePreviewStr = newIndex.toString();
  }
</script>

<div class="font-semibold">{result.prefabName}</div>
<p class="text-sm text-muted-foreground">{result.prefabDescription}</p>

<Separator class="my-4" />

<div class="font-semibold">Prefab Info</div>
<div class="flex flex-wrap items-start gap-2">
  <div class="h-full flex flex-col items-center gap-2">
    {#key currentFramePreviewRects}
      <canvas
        class="h-full max-h-32 max-w-48 bg-transparent"
        use:drawGenerationOnCanvas={currentFramePreviewRects}
      ></canvas>
    {/key}
    {#if rectImage.frames.length > 1}
      <div class="flex gap-1">
        <Button 
          variant="outline"
          size="icon"
          class="h-8 w-8 cursor-pointer"
          disabled={currentFramePreviewIndex <= 0}
          onclick={() => advanceFrameIndex(-1)}
        >
          <ChevronLeft />
        </Button>
        <Input bind:value={currentFramePreviewStr} class="text-sm w-12 h-8 px-2 text-center" inputmode="numeric" min="0" max={rectImage.frames.length - 1} />
        <Button 
          variant="outline"
          size="icon" 
          class="h-8 w-8 cursor-pointer"
          disabled={currentFramePreviewIndex >= rectImage.frames.length - 1}
          onclick={() => advanceFrameIndex(1)}
        >
          <ChevronRight />
        </Button>
      </div>
    {/if}
  </div>

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
    {#each colors as [color, i], li (color ? getColorHex(color) : `null-${i}`)}
      <div class="flex h-12 items-center justify-center font-mono">{li + 1}</div>
    {/each}
  </div>
  <SortableList.Root ondragend={handleDragEnd}>
    {#each colors as [color, i], li (color ? getColorHex(color) : `null-${i}`)}
      <SortableList.Item
        class="flex h-12 items-center justify-between rounded-md border border-border bg-muted data-[is-ghost=false]:data-[drag-state*='ptr']:opacity-0"
        id={color ? getColorHex(color) : `null-${i}`}
        index={li}
      >
        <div class="flex items-center gap-2.5 pl-3">
          {#if color}
            <div
              class="size-6 rounded-sm"
              style="background-color: {getColorHex(color)};"
            ></div>
            <span class="font-mono">{getColorHex(color)}</span>
          {:else}
            <img class="size-6 rounded-sm" src={NoColor} alt="No color" />
            <span>No color</span>
          {/if}
        </div>
        <div class="flex items-center">
          {#if color}
            <button
              class="cursor-pointer rounded-sm border border-border bg-card p-2 transition-colors hover:bg-card/50"
              onclick={() => copyToClipboard(getColorHex(color))}
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

<Button class="w-full cursor-pointer" onclick={onExportButtonClicked} disabled={isExporting}>
  {#if isExporting}
    <div class="flex items-center gap-2">
      <Spinner class="mx-auto" />
      Exporting...
    </div>
  {:else}
    Export prefab
  {/if}
</Button>

<Dialog.Root bind:open={resultDialogOpen}>
  <Dialog.Content class="sm:max-w-xl">
    <Dialog.Header>
      <Dialog.Title>Your prefab is ready!</Dialog.Title>
    </Dialog.Header>

    {#if exportResult !== null}
      <ExportResultView result={exportResult} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
