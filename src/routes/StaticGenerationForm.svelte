<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import { Button } from "$lib/components/ui/button";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import * as Field from "$lib/components/ui/field";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import { PrefabType } from "$lib/PrefabType";
  import { FormName } from "$lib/FormName";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Alignment } from "$lib/Alignment";
  import type { StaticGenerationFormData } from "./GenerationFormData";
  import IconRadioGroupItem from "./IconRadioGroupItem.svelte";
  import type { RawImage } from "$lib/algo/RawImage";

  import LeftUnchecked from "$lib/icons/alignment/left-unchecked.svg";
  import LeftChecked from "$lib/icons/alignment/left-checked.svg";
  import CenterUnchecked from "$lib/icons/alignment/center-unchecked.svg";
  import CenterChecked from "$lib/icons/alignment/center-checked.svg";
  import RightUnchecked from "$lib/icons/alignment/right-unchecked.svg";
  import RightChecked from "$lib/icons/alignment/right-checked.svg";
  import TopUnchecked from "$lib/icons/alignment/top-unchecked.svg";
  import TopChecked from "$lib/icons/alignment/top-checked.svg";
  import MiddleUnchecked from "$lib/icons/alignment/middle-unchecked.svg";
  import MiddleChecked from "$lib/icons/alignment/middle-checked.svg";
  import BottomUnchecked from "$lib/icons/alignment/bottom-unchecked.svg";
  import BottomChecked from "$lib/icons/alignment/bottom-checked.svg";

  const prefabTypeNames: Record<PrefabType, string> = {
    [PrefabType.Character]: "Character",
    [PrefabType.CharacterParts]: "Character Parts",
    [PrefabType.Props]: "Props",
    [PrefabType.Bullets]: "Bullets",
    [PrefabType.Pulses]: "Pulses",
    [PrefabType.Bombs]: "Bombs",
    [PrefabType.Spinners]: "Spinners",
    [PrefabType.Beams]: "Beams",
    [PrefabType.Static]: "Static",
    [PrefabType.Misc1]: "Misc 1",
    [PrefabType.Misc2]: "Misc 2",
    [PrefabType.Misc3]: "Misc 3"
  };

  let currentPrefabName: string = $state("Untitled Prefab");
  let currentPrefabTypeStr: string = $state(PrefabType.Character.toString());

  let currentPrefabDescription: string = $state("My new Sparite prefab!");

  let currentPixelsPerUnit: number = $state(8);
  let currentLifetime: number = $state(10);
  let currentDepth: number = $state(20);

  let currentHorizontalAlignment: Alignment = $state(Alignment.Center);
  let currentVerticalAlignment: Alignment = $state(Alignment.Middle);

  interface Props {
    onSubmit: (formData: StaticGenerationFormData) => void;
  }

  let { 
    onSubmit 
  } : Props = $props();

  async function onFormSubmitted(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const prefabName = formData.get(FormName.PrefabName) as string;
    const prefabDescription = formData.get(FormName.PrefabDescription) as string;
    const prefabType = parseInt(formData.get(FormName.PrefabType) as string, 10) as PrefabType;
    const pixelsPerUnit = parseInt(formData.get(FormName.PixelsPerUnit) as string, 10);
    const lifetime = parseFloat(formData.get(FormName.Lifetime) as string);
    const depth = parseFloat(formData.get(FormName.Depth) as string);
    const horizontalAlignment = formData.get(FormName.HorizontalAlignment) as Alignment;
    const verticalAlignment = formData.get(FormName.VerticalAlignment) as Alignment;
    const useHitObjects = formData.get(FormName.UseHitObjects) === "on";
    const imageFile = formData.get(FormName.ImageFile) as File | null;

    if (!imageFile) {
      return;
    }

    const image = await loadImage(imageFile);

    onSubmit({
      type: "static",
      prefabName,
      prefabDescription,
      prefabType,
      pixelsPerUnit,
      lifetime,
      depth,
      horizontalAlignment,
      verticalAlignment,
      useHitObjects,
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
    <Field.Group>
      <Field.Group class="grid gap-2 sm:grid-cols-2">
        <Field.Field class="w-full">
          <Field.Label>Prefab Name</Field.Label>
          <Input type="text" name={FormName.PrefabName} bind:value={currentPrefabName} />
        </Field.Field>
        <Field.Field>
          <Field.Label>Prefab Type</Field.Label>
          <Select.Root type="single" name={FormName.PrefabType} bind:value={currentPrefabTypeStr}>
            <Select.Trigger>{prefabTypeNames[parseInt(currentPrefabTypeStr, 10) as PrefabType]}</Select.Trigger>
            <Select.Content>
              {#each Object.entries(prefabTypeNames) as [key, value]}
                <Select.Item value={key.toString()}>{value}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>
      </Field.Group>

      <Field.Field>
        <Field.Label>Prefab Description</Field.Label>
        <Textarea name={FormName.PrefabDescription} bind:value={currentPrefabDescription} />
      </Field.Field>

      <Field.Group class="grid gap-2 sm:grid-cols-3">
        <Tooltip.Root>
          <Tooltip.Trigger>
            <Field.Field>
              <Field.Label>Pixels Per Unit</Field.Label>
              <Input type="number" step="0.01" name={FormName.PixelsPerUnit} bind:value={currentPixelsPerUnit} />
            </Field.Field>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p class="text-center">Amount of pixels to fit in one in-game unit.<br>Higher values result in smaller objects.</p>
          </Tooltip.Content>
        </Tooltip.Root>

        <Field.Field>
          <Field.Label>Lifetime</Field.Label>
          <Input type="number" step="0.01" name={FormName.Lifetime} bind:value={currentLifetime} />
        </Field.Field>

        <Field.Field>
          <Field.Label>Depth</Field.Label>
          <Input type="number" step="0.01" name={FormName.Depth} bind:value={currentDepth} />
        </Field.Field>
      </Field.Group>

      <Field.Group class="grid gap-2 sm:grid-cols-2">
        <Field.Set>
          <Field.Label>Horizontal Alignment</Field.Label>
          <RadioGroup.Root class="grid grid-cols-3 gap-2 w-fit" name={FormName.HorizontalAlignment} bind:value={currentHorizontalAlignment}>
            <IconRadioGroupItem class="cursor-pointer w-6 h-6" checkedIcon={LeftChecked} uncheckedIcon={LeftUnchecked} value={Alignment.Left} />
            <IconRadioGroupItem class="cursor-pointer w-6 h-6" checkedIcon={CenterChecked} uncheckedIcon={CenterUnchecked} value={Alignment.Center} />
            <IconRadioGroupItem class="cursor-pointer w-6 h-6" checkedIcon={RightChecked} uncheckedIcon={RightUnchecked} value={Alignment.Right} />
          </RadioGroup.Root>
        </Field.Set>
        <Field.Set>
          <Field.Label>Vertical Alignment</Field.Label>
          <RadioGroup.Root class="grid grid-cols-3 gap-2 w-fit" name={FormName.VerticalAlignment} bind:value={currentVerticalAlignment}>
            <IconRadioGroupItem class="cursor-pointer w-6 h-6" checkedIcon={TopChecked} uncheckedIcon={TopUnchecked} value={Alignment.Top} />
            <IconRadioGroupItem class="cursor-pointer w-6 h-6" checkedIcon={MiddleChecked} uncheckedIcon={MiddleUnchecked} value={Alignment.Middle} />
            <IconRadioGroupItem class="cursor-pointer w-6 h-6" checkedIcon={BottomChecked} uncheckedIcon={BottomUnchecked} value={Alignment.Bottom} />
          </RadioGroup.Root>
        </Field.Set>
      </Field.Group>

      <Field.Field orientation="horizontal">
        <Checkbox class="cursor-pointer" id="use-hit-objects" name={FormName.UseHitObjects} />
        <Field.Label class="cursor-pointer" for="use-hit-objects">Use Hit Objects</Field.Label>
      </Field.Field>

      <Field.Field>
        <Field.Label>Image File</Field.Label>
        <Input class="cursor-pointer" type="file" accept="image/*" name={FormName.ImageFile} />
      </Field.Field>

      <Field.Field>
        <Button class="cursor-pointer" type="submit">Generate</Button>
      </Field.Field>
    </Field.Group>
  </Field.Set>
</form>
