<script lang="ts">
  import type { RawImage, RawImageFrame } from "$lib/algo/RawImage";
  import { Alignment, FormName, PrefabType } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Field from "$lib/components/ui/field";
  import { Input } from "$lib/components/ui/input";
  import type { AnimatedGenerationFormData } from "$lib/types/GenerationFormData";
  import CommonFormFields from "./CommonFormFields.svelte";

  let currentPrefabName: string = $state("Untitled Prefab");
  let currentPrefabType: PrefabType = $state(PrefabType.Character);
  let currentPrefabDescription: string = $state("My new Sparite prefab!");
  let currentPixelsPerUnit: number = $state(8);
  let currentLifetime: number = $state(10);
  let currentDepth: number = $state(20);
  let currentHorizontalAlignment: Alignment = $state(Alignment.Center);
  let currentVerticalAlignment: Alignment = $state(Alignment.Middle);
  let useHitObjects: boolean = $state(false);

  let currentSpeed: number = $state(1);
  let currentLooped: boolean = $state(true);

  interface Props {
    onSubmit: (formData: AnimatedGenerationFormData) => void;
  }

  let { onSubmit }: Props = $props();

  async function onFormSubmitted(
    event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get(FormName.ImageFile) as File | null;

    if (!imageFile) {
      return;
    }

    const image = await loadAnimatedImage(imageFile);

    onSubmit({
      type: "animated",
      prefabName: currentPrefabName,
      prefabDescription: currentPrefabDescription,
      prefabType: currentPrefabType,
      pixelsPerUnit: currentPixelsPerUnit,
      lifetime: currentLifetime,
      depth: currentDepth,
      horizontalAlignment: currentHorizontalAlignment,
      verticalAlignment: currentVerticalAlignment,
      useHitObjects: useHitObjects,
      speed: currentSpeed,
      looped: currentLooped,
      image
    });
  }

  async function loadAnimatedImage(imageFile: File): Promise<RawImage> {
    const decoder = new ImageDecoder({
      data: await imageFile.arrayBuffer(),
      type: "image/gif"
    });

    await decoder.tracks.ready;

    const track = decoder.tracks.selectedTrack;
    if (!track) {
      throw new Error("No image track found in the provided file.");
    }

    const frameCount = track.frameCount;

    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    const frames: RawImageFrame[] = [];
    for (let i = 0; i < frameCount; i++) {
      const { image } = await decoder.decode({ frameIndex: i });

      canvas.width = image.displayWidth;
      canvas.height = image.displayHeight;
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      frames.push({
        data: imageData.data,
        delay: image.duration === null ? 100 : image.duration / 1000
      });
    }

    return {
      width: canvas.width,
      height: canvas.height,
      frames
    };
  }
</script>

<form onsubmit={onFormSubmitted}>
  <Field.Set>
    <!-- Common Fields -->
    <CommonFormFields
      bind:prefabName={currentPrefabName}
      bind:prefabType={currentPrefabType}
      bind:prefabDescription={currentPrefabDescription}
      bind:pixelsPerUnit={currentPixelsPerUnit}
      bind:lifetime={currentLifetime}
      bind:depth={currentDepth}
      bind:horizontalAlignment={currentHorizontalAlignment}
      bind:verticalAlignment={currentVerticalAlignment}
      bind:useHitObjects
    />

    <!-- Animated Specific Fields -->
    <Field.Field>
      <Field.Label>Speed</Field.Label>
      <Input type="number" step="0.01" name={FormName.Speed} bind:value={currentSpeed} />
    </Field.Field>

    <Field.Field orientation="horizontal">
      <Checkbox
        class="cursor-pointer"
        id="looped"
        name={FormName.Looped}
        bind:checked={currentLooped}
      />
      <Field.Label class="cursor-pointer" for="looped">Looped</Field.Label>
    </Field.Field>

    <Field.Field>
      <Field.Label>Image File</Field.Label>
      <Input class="cursor-pointer" type="file" accept="image/gif" name={FormName.ImageFile} />
    </Field.Field>

    <Field.Field>
      <Button class="cursor-pointer" type="submit">Generate</Button>
    </Field.Field>
  </Field.Set>
</form>
