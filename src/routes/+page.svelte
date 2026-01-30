<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Alignment } from "$lib/Alignment";
  import type { ColorRgb } from "$lib/algo/Color";
  import { createIndexedImage, type RawImage } from "$lib/algo/IndexedImage";
  import { convertIndexedImageToColoredRects } from "$lib/algo/Processor";
  import type { GenerationFormData } from "./GenerationFormData";
  import GenerationForm from "./GenerationForm.svelte";
  import type { GenerationResult } from "./GenerationResult";
  import type { ColoredRect } from "$lib/algo/Rect";
  import GenerationResultView from "./GenerationResultView.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";

  interface RectImage {
    rects: ColoredRect[];
    palette: ColorRgb[];
    width: number;
    height: number;
  }

  let generationResult: GenerationResult | null = $state(null);

  async function onFormSubmitted(formData: GenerationFormData) {
    const rectImage = await generateRectImage(formData.imageFile);

    transformRectImage(
      rectImage,
      formData.pixelsPerUnit,
      formData.horizontalAlignment,
      formData.verticalAlignment
    );

    generationResult = {
      prefabName: formData.prefabName,
      prefabDescription: formData.prefabDescription,
      prefabType: formData.prefabType,
      pixelsPerUnit: formData.pixelsPerUnit,
      lifetime: formData.lifetime,
      depth: formData.depth,
      useHitObjects: formData.useHitObjects,
      rects: rectImage.rects,
      palette: rectImage.palette,
      width: rectImage.width,
      height: rectImage.height
    };
  }

  async function generateRectImage(imageFile: File): Promise<RectImage> {
    const rawImage = await loadImage(imageFile);

    // create indexed image
    const indexedImage = createIndexedImage(rawImage);

    // create colored rects
    const coloredRects = convertIndexedImageToColoredRects(indexedImage);

    return {
      rects: coloredRects,
      palette: indexedImage.palette,
      width: indexedImage.width,
      height: indexedImage.height
    };
  }

  async function loadImage(imageFile: File): Promise<RawImage> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = URL.createObjectURL(imageFile);
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve({
          width: image.width,
          height: image.height,
          data: imageData.data
        });
      };
      image.onerror = (err) => {
        reject(err);
      };
    });
  }

  function transformRectImage(
    rectImage: RectImage,
    pixelsPerUnit: number,
    horizontalAlignment: Alignment,
    verticalAlignment: Alignment
  ) {
    const scaleFactor = 1 / pixelsPerUnit; // the generator assumes 1 ppu, so scale accordingly
    const offsetX = computeXOffset(rectImage.width * scaleFactor, horizontalAlignment);
    const offsetY = computeYOffset(rectImage.height * scaleFactor, verticalAlignment);
    for (const rect of rectImage.rects) {
      rect.x = rect.x * scaleFactor + offsetX;
      rect.y = rect.y * scaleFactor + offsetY;
      rect.width *= scaleFactor;
      rect.height *= scaleFactor;
    }
  }

  function computeXOffset(width: number, horizontalAlignment: Alignment) {
    if (horizontalAlignment == Alignment.Left) {
      return 0;
    }
    if (horizontalAlignment == Alignment.Center) {
      return -width / 2;
    }
    return -width;
  }

  function computeYOffset(height: number, verticalAlignment: Alignment) {
    if (verticalAlignment == Alignment.Top) {
      return 0;
    }
    if (verticalAlignment == Alignment.Middle) {
      return -height / 2;
    }
    return -height;
  }
</script>

<div class="flex flex-col md:flex-row md:justify-center md:items-start min-h-screen w-full p-8 gap-8">
  <Card.Root class="w-full md:max-w-md">
    <Card.Header>
      <Card.Title>Generation Info</Card.Title>
      <Card.Description>Enter the details, upload your sprite and click Generate!</Card.Description>
    </Card.Header>
    <Card.Content>
      <GenerationForm onSubmit={onFormSubmitted} />
    </Card.Content>
  </Card.Root>
  <Card.Root class="w-full md:max-w-lg">
    <Card.Header>
      <Card.Title>Generated Prefab</Card.Title>
      <Card.Description>Here is the prefab generated from your input.</Card.Description>
      <Separator class="mt-4" />
    </Card.Header>
    <Card.Content>
      {#key generationResult}
        {#if generationResult}
          <GenerationResultView result={generationResult} />
        {:else}
          <p class="text-center text-sm text-muted-foreground">Nothing here yet.</p>
        {/if}
      {/key}
    </Card.Content>
  </Card.Root>
</div>
