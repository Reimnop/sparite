<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as Card from "$lib/components/ui/card";
  import { createIndexedImage } from "$lib/algo/IndexedImage";
  import type { GenerationFormData } from "$lib/types/GenerationFormData";
  import StaticGenerationForm from "$lib/components/sparite/StaticGenerationForm.svelte";
  import type { GenerationResult } from "$lib/types/GenerationResult";
  import GenerationResultView from "$lib/components/sparite/GenerationResultView.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import type { RectImage } from "$lib/algo/RectImage";
  import { convertIndexedImageToRectImage } from "$lib/algo/Processor";
  import type { RawImage } from "$lib/algo/RawImage";
  import AnimatedGenerationForm from "$lib/components/sparite/AnimatedGenerationForm.svelte";

  let generationResult: GenerationResult | null = $state(null);

  function onFormSubmitted(formData: GenerationFormData) {
    const rectImage = generateRectImage(formData.image);

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
      speed: formData.type === "animated" ? formData.speed : 1,
      looped: formData.type === "animated" ? formData.looped : false,
      rectImage
    };
  }

  function generateRectImage(image: RawImage): RectImage {
    // create indexed image
    const indexedImage = createIndexedImage(image);

    // create rect image
    const rectImage = convertIndexedImageToRectImage(indexedImage);

    return rectImage;
  }
</script>

<div class="flex min-h-screen w-full flex-col">
  <header class="m-4">
    <h1 class="text-center text-4xl font-bold">Sparite</h1>
    <p class="mt-2 text-center text-muted-foreground">
      Turn your pixel art into Project Arrhythmia prefabs!
    </p>
  </header>

  <div class="flex flex-col gap-8 p-8 md:flex-row md:items-start md:justify-center">
    <Tabs.Root value="static" class="w-full md:max-w-md">
      <Tabs.List>
        <Tabs.Trigger class="cursor-pointer" value="static">Static</Tabs.Trigger>
        <Tabs.Trigger class="cursor-pointer" value="animated">Animated</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="static">
        <Card.Root>
          <Card.Header>
            <Card.Title>Static Prefab Generation</Card.Title>
            <Card.Description>Generate static prefabs from your pixel art!</Card.Description>
          </Card.Header>
          <Card.Content>
            <StaticGenerationForm onSubmit={onFormSubmitted} />
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
      <Tabs.Content value="animated">
        <Card.Root>
          <Card.Header>
            <Card.Title>Animated Prefab Generation</Card.Title>
            <Card.Description>
              Generate animated prefabs from your animated pixel art!
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <AnimatedGenerationForm onSubmit={onFormSubmitted} />
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>

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

  <footer class="mt-auto">
    <Separator />
    <p class="py-4 text-center text-sm text-muted-foreground">
      Made by Reimnop and enchart.
      <br />
      <a class="underline" href="https://github.com/Reimnop/sparite">Source code</a>
    </p>
  </footer>
</div>
