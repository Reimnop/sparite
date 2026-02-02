<script lang="ts">
  import { Alignment, FormName, PrefabType } from "$lib/types";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Field from "$lib/components/ui/field";
  import { Input } from "$lib/components/ui/input";
  import * as RadioGroup from "$lib/components/ui/radio-group";
  import * as Select from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import IconRadioGroupItem from "./IconRadioGroupItem.svelte";

  import BottomChecked from "$lib/icons/alignment/bottom-checked.svg";
  import BottomUnchecked from "$lib/icons/alignment/bottom-unchecked.svg";
  import CenterChecked from "$lib/icons/alignment/center-checked.svg";
  import CenterUnchecked from "$lib/icons/alignment/center-unchecked.svg";
  import LeftChecked from "$lib/icons/alignment/left-checked.svg";
  import LeftUnchecked from "$lib/icons/alignment/left-unchecked.svg";
  import MiddleChecked from "$lib/icons/alignment/middle-checked.svg";
  import MiddleUnchecked from "$lib/icons/alignment/middle-unchecked.svg";
  import RightChecked from "$lib/icons/alignment/right-checked.svg";
  import RightUnchecked from "$lib/icons/alignment/right-unchecked.svg";
  import TopChecked from "$lib/icons/alignment/top-checked.svg";
  import TopUnchecked from "$lib/icons/alignment/top-unchecked.svg";
  import CircleQuestionMark from "@lucide/svelte/icons/circle-question-mark";

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

  let {
    prefabName = $bindable(),
    prefabType = $bindable(),
    prefabDescription = $bindable(),
    pixelsPerUnit = $bindable(),
    lifetime = $bindable(),
    depth = $bindable(),
    horizontalAlignment = $bindable(),
    verticalAlignment = $bindable(),
    useHitObjects = $bindable()
  }: {
    prefabName: string;
    prefabType: PrefabType;
    prefabDescription: string;
    pixelsPerUnit: number;
    lifetime: number;
    depth: number;
    horizontalAlignment: Alignment;
    verticalAlignment: Alignment;
    useHitObjects: boolean;
  } = $props();

  let currentPrefabTypeStr = $state(prefabType.toString());

  $effect(() => {
    prefabType = parseInt(currentPrefabTypeStr, 10);
  });
</script>

<Field.Group class="grid gap-2 sm:grid-cols-2">
  <Field.Field class="w-full">
    <Field.Label>Prefab Name</Field.Label>
    <Input type="text" name={FormName.PrefabName} bind:value={prefabName} />
  </Field.Field>
  <Field.Field>
    <Field.Label>Prefab Type</Field.Label>
    <Select.Root type="single" name={FormName.PrefabType} bind:value={currentPrefabTypeStr}>
      <Select.Trigger>
        {prefabTypeNames[parseInt(currentPrefabTypeStr, 10) as PrefabType]}
      </Select.Trigger>
      <Select.Content>
        {#each Object.entries(prefabTypeNames) as [key, value] (key)}
          <Select.Item value={key.toString()}>{value}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </Field.Field>
</Field.Group>

<Field.Field>
  <Field.Label>Prefab Description</Field.Label>
  <Textarea name={FormName.PrefabDescription} bind:value={prefabDescription} />
</Field.Field>

<Field.Group class="grid gap-2 sm:grid-cols-3">
  <Tooltip.Root>
    <Tooltip.Trigger>
      <Field.Field>
        <div class="flex items-center">
          <Field.Label>Pixels Per Unit</Field.Label>
          <CircleQuestionMark class="ml-auto size-4 text-muted-foreground" />
        </div>
        <Input type="number" step="0.01" name={FormName.PixelsPerUnit} bind:value={pixelsPerUnit} />
      </Field.Field>
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p class="text-center">
        Amount of pixels to fit in one in-game unit.
        <br />
        Higher values result in smaller objects.
      </p>
    </Tooltip.Content>
  </Tooltip.Root>

  <Field.Field>
    <Field.Label>Lifetime</Field.Label>
    <Input type="number" step="0.01" name={FormName.Lifetime} bind:value={lifetime} />
  </Field.Field>

  <Field.Field>
    <Field.Label>Depth</Field.Label>
    <Input type="number" step="0.01" name={FormName.Depth} bind:value={depth} />
  </Field.Field>
</Field.Group>

<Field.Group class="grid gap-2 sm:grid-cols-2">
  <Field.Set>
    <Field.Label>Horizontal Alignment</Field.Label>
    <RadioGroup.Root
      class="grid w-fit grid-cols-3 gap-2"
      name={FormName.HorizontalAlignment}
      bind:value={horizontalAlignment}
    >
      <IconRadioGroupItem
        class="h-6 w-6 cursor-pointer"
        checkedIcon={LeftChecked}
        uncheckedIcon={LeftUnchecked}
        value={Alignment.Left}
      />
      <IconRadioGroupItem
        class="h-6 w-6 cursor-pointer"
        checkedIcon={CenterChecked}
        uncheckedIcon={CenterUnchecked}
        value={Alignment.Center}
      />
      <IconRadioGroupItem
        class="h-6 w-6 cursor-pointer"
        checkedIcon={RightChecked}
        uncheckedIcon={RightUnchecked}
        value={Alignment.Right}
      />
    </RadioGroup.Root>
  </Field.Set>
  <Field.Set>
    <Field.Label>Vertical Alignment</Field.Label>
    <RadioGroup.Root
      class="grid w-fit grid-cols-3 gap-2"
      name={FormName.VerticalAlignment}
      bind:value={verticalAlignment}
    >
      <IconRadioGroupItem
        class="h-6 w-6 cursor-pointer"
        checkedIcon={TopChecked}
        uncheckedIcon={TopUnchecked}
        value={Alignment.Top}
      />
      <IconRadioGroupItem
        class="h-6 w-6 cursor-pointer"
        checkedIcon={MiddleChecked}
        uncheckedIcon={MiddleUnchecked}
        value={Alignment.Middle}
      />
      <IconRadioGroupItem
        class="h-6 w-6 cursor-pointer"
        checkedIcon={BottomChecked}
        uncheckedIcon={BottomUnchecked}
        value={Alignment.Bottom}
      />
    </RadioGroup.Root>
  </Field.Set>
</Field.Group>

<Field.Field orientation="horizontal">
  <Checkbox
    class="cursor-pointer"
    id="use-hit-objects"
    name={FormName.UseHitObjects}
    bind:checked={useHitObjects}
  />
  <Field.Label class="cursor-pointer" for="use-hit-objects">Use Hit Objects</Field.Label>
</Field.Field>
