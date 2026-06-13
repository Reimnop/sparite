<script lang="ts">
  import type { ExportResult } from "$lib/types/ExportResult";
  import Button from "$lib/components/ui/button/button.svelte";

  interface Props {
    result: ExportResult;
  };

  let { result }: Props = $props();

  let canvas: HTMLCanvasElement;

  $effect(() => {
    canvas.width = result.prefabCardWidth;
    canvas.height = result.prefabCardHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx)
      return;
    
    const imageData = new ImageData(result.prefabCardImage as ImageDataArray, result.prefabCardWidth, result.prefabCardHeight);
    ctx.putImageData(imageData, 0, 0);
  });

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

  function downloadImage() {
    canvas.toBlob(blob => {
      if (blob)
        downloadData([blob], `${result.fileNameWithoutExtension}.png`, "image/png");
    });
  }

  function downloadVgp() {
    const vgpData = new Blob([result.prefabString], { type: "text/plain" });
    downloadData([vgpData], `${result.fileNameWithoutExtension}.vgp`, "text/plain");
  }
</script>

<div class="grid place-items-center w-full">
  <canvas bind:this={canvas} class="w-[256px] sm:w-lg aspect-square" style="image-rendering: crisp-edges;"></canvas>
</div>

<div class="grid grid-cols-2 gap-4">
  <Button class="cursor-pointer" onclick={downloadImage}>Download image</Button>
  <Button class="cursor-pointer" onclick={downloadVgp}>Download VGP</Button>
</div>
