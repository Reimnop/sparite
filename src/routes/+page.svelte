<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { createIndexedImage, type RawImage } from "$lib/algo/IndexedImage";
  import { convertIndexedImageToColoredRects } from "$lib/algo/Processor";
  import type { GenerationFormData } from "./GenerationFormData";
  import GenerationForm from "./GenerationForm.svelte";
  import type { GenerationResult } from "./GenerationResult";
  import GenerationResultView from "./GenerationResultView.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import type { RectImage } from "$lib/data/RectImage";

  let generationResult: GenerationResult | null = $state(null);

  async function onFormSubmitted(formData: GenerationFormData) {
    const rectImage = await generateRectImage(formData.imageFile);

    generationResult = {
      prefabName: formData.prefabName,
      prefabDescription: formData.prefabDescription,
      prefabType: formData.prefabType,
      pixelsPerUnit: formData.pixelsPerUnit,
      lifetime: formData.lifetime,
      depth: formData.depth,
      horizontalAlignment: formData.horizontalAlignment,
      verticalAlignment: formData.verticalAlignment,
      useHitObjects: formData.useHitObjects,
      rectImage: rectImage
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
      const url = URL.createObjectURL(imageFile);

      const image = new Image();
      image.src = url;
      image.onload = () => {
        URL.revokeObjectURL(url); // free memory

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
        URL.revokeObjectURL(url); // free memory

        reject(err);
      };
    });
  }
</script>

<div class="min-h-screen w-full flex flex-col">
  <div class="flex flex-col md:flex-row md:justify-center md:items-start gap-8 p-8">
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

  <div class="mt-auto">
    <Separator />
    <p class="text-center text-sm text-muted-foreground py-4">
      Sparite. Made by Reimnop and enchart.<br>
      <a class="underline" href="https://github.com/Reimnop/sparite">Source code</a>
    </p>
  </div>
</div>
