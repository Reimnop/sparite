<script lang="ts">
  import type { RawImage } from "$lib/algo/RawImage";
  import { Alignment, FormName, PrefabType } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import * as Field from "$lib/components/ui/field";
  import { Input } from "$lib/components/ui/input";
  import type { StaticGenerationFormData } from "$lib/types/GenerationFormData";
  import CommonFormFields from "./CommonFormFields.svelte";

  let currentPrefabName: string = $state("Untitled Prefab");
  let currentPrefabType: PrefabType = $state(PrefabType.Character); // Changed to PrefabType directly
  let currentPrefabDescription: string = $state("My new Sparite prefab!");
  let currentPixelsPerUnit: number = $state(8);
  let currentLifetime: number = $state(10);
  let currentDepth: number = $state(20);
  let currentHorizontalAlignment: Alignment = $state(Alignment.Center);
  let currentVerticalAlignment: Alignment = $state(Alignment.Middle);
  let useHitObjects: boolean = $state(false); // Added state for this

  interface Props {
    onSubmit: (formData: StaticGenerationFormData) => void;
  }

  let { onSubmit }: Props = $props();

  async function onFormSubmitted(
    event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    // Values are now bound to state, so we can use them directly or from formData.
    // Using formData ensures we get what the form sees, but binding is also fine.
    // However, the original code used formData.get(). The CommonFormFields inputs have name attributes, so formData should still work.
    // BUT, the bound variables currentPrefabTypeStr etc in original were used to drive UI.
    // In CommonFormFields, I am binding the values.

    // Let's use the state values directly since they are bound, it's cleaner than parsing formData again,
    // EXCEPT for the file input which is not bound (file inputs can't be bound easily).

    // Actually, let's keep consistency with original if possible, but state is handier.
    // The original code used formData for everything.

    const imageFile = formData.get(FormName.ImageFile) as File | null;

    if (!imageFile) {
      return;
    }

    const image = await loadImage(imageFile);

    onSubmit({
      type: "static",
      prefabName: currentPrefabName,
      prefabDescription: currentPrefabDescription,
      prefabType: currentPrefabType,
      pixelsPerUnit: currentPixelsPerUnit,
      lifetime: currentLifetime,
      depth: currentDepth,
      horizontalAlignment: currentHorizontalAlignment,
      verticalAlignment: currentVerticalAlignment,
      useHitObjects: useHitObjects,
      image
    });
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
          frames: [{ data: imageData.data, delay: 0 }]
        });
      };

      image.onerror = (err) => {
        URL.revokeObjectURL(url); // free memory

        reject(err);
      };
    });
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

    <!-- Static Specific Fields (Image) -->
    <Field.Field>
      <Field.Label>Image File</Field.Label>
      <Input class="cursor-pointer" type="file" accept="image/*" name={FormName.ImageFile} />
    </Field.Field>

    <Field.Field>
      <Button class="cursor-pointer" type="submit">Generate</Button>
    </Field.Field>
  </Field.Set>
</form>
