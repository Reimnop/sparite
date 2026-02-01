<script lang="ts">
  import { getColorHex, type ColorRgb } from "$lib/algo/Color";
  import Button from "$lib/components/ui/button/button.svelte";
  import { onMount } from "svelte";
  import type { GenerationResult } from "./GenerationResult";
  import { createPrefab, type PrefabRect } from "$lib/algo/VgpExport";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import type { RectImage, RectImageFrame } from "$lib/algo/RectImage";
  import { Alignment } from "$lib/Alignment";
  import type { ColoredRect } from "$lib/algo/Rect";

  import NoColor from "$lib/icons/no-color.svg";
  import ArrowUp from "$lib/icons/arrow-up.svg";
  import ArrowDown from "$lib/icons/arrow-down.svg";

  interface ThemeColor {
    index: number;
    color: ColorRgb;
  }

  interface Props {
    result: GenerationResult;
  }

  let { result }: Props = $props();
  let rectImage = $derived(result.rectImage);
  let objectCount = $derived(determineObjectCount(rectImage.frames));

  let colors: (ThemeColor | null)[] = $state([]);

  onMount(() => {
    let i = 0;
    for (; i < rectImage.palette.length; i++) {
      colors.push({ index: i, color: rectImage.palette[i] });
    }
    for (; i < 9; i++) {
      colors.push(null);
    }
  });

  function drawGenerationOnCanvas(canvas: HTMLCanvasElement, { rectImage, frameIndex }: { rectImage: RectImage, frameIndex: number }) {
    const scaleFactor = 4; // scale up for better visibility

    canvas.width = rectImage.width * scaleFactor;
    canvas.height = rectImage.height * scaleFactor;

    const ctx = canvas.getContext("2d");
    if (!ctx) 
      return;

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // disable image smoothing
    ctx.imageSmoothingEnabled = false;

    const frame = rectImage.frames[frameIndex];

    // draw each rect
    for (const rect of frame.rects) {
      const color = rectImage.palette[rect.color.index];
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${rect.color.opacity})`;
      ctx.fillRect(rect.x * scaleFactor, rect.y * scaleFactor, rect.width * scaleFactor, rect.height * scaleFactor);
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
    let time = 0, currentFrameIndex = 0;
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
    const prefabJson = JSON.stringify(prefab);
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

  function moveColorUp(index: number) {
    if (index <= 0) return;

    const temp = colors[index - 1];
    colors[index - 1] = colors[index];
    colors[index] = temp;
  }

  function moveColorDown(index: number) {
    if (index >= colors.length - 1) return;

    const temp = colors[index + 1];
    colors[index + 1] = colors[index];
    colors[index] = temp;
  }

  function determineObjectCount(frames: RectImageFrame[]): number {
    return Math.max(...frames.map(frame => frame.rects.length));
  }
</script>

<div class="font-semibold">{result.prefabName}</div>
<p class="text-sm text-muted-foreground">{result.prefabDescription}</p>

<Separator class="my-4" />

<div class="font-semibold">Prefab Info</div>
<div class="flex gap-2 items-center flex-wrap">
  <canvas
    class="bg-transparent max-h-32 max-w-48 h-full"
    use:drawGenerationOnCanvas={{ rectImage, frameIndex: 0 }}></canvas>

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
<p class="text-sm text-muted-foreground">Click to copy to clipboard. Reorder if necessary.</p>

<div>
  {#each colors as color, i}
    <div class="h-12 py-1.5 w-full flex items-center gap-2">
      <div class="h-full grid grid-rows-2 place-items-center">
        <button class="h-2 w-4 cursor-pointer" onclick={() => moveColorUp(i)}>
          <img src={ArrowUp} alt="Move up" />
        </button>
        <button class="h-2 w-4 cursor-pointer" onclick={() => moveColorDown(i)}>
          <img src={ArrowDown} alt="Move down" />
        </button>
      </div>
      {#if color}
        <div class="w-full">
          <Button
            variant="outline"
            class="w-full cursor-pointer justify-start"
            onclick={() => copyToClipboard(getColorHex(color.color))}
          >
            <div
              class="-ml-2 h-6 w-6 rounded-sm border border-muted-foreground/50"
              style="background-color: {getColorHex(color.color)};"
            ></div>
            <span class="font-mono">{getColorHex(color.color)}</span>
          </Button>
        </div>
      {:else}
        <img
          class="ml-2 h-6 w-6 rounded-sm border border-muted-foreground/50 bg-transparent"
          src={NoColor}
          alt="No color"
        />
      {/if}
    </div>
  {/each}
</div>

<Separator class="my-4" />

<Button class="w-full cursor-pointer" onclick={onDownloadButtonClicked}>Export &amp; Download Prefab</Button>
