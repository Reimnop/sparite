<script lang="ts">
	import { Alignment } from "$lib/Alignment";
	import { FormName } from "$lib/FormName";
	import { PrefabType } from "$lib/PrefabType";

  interface Props {
    onSubmit: (formData: FormData) => void;
  }

  let {
    onSubmit = () => {}
  }: Props = $props();

	function handleSubmit(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement; }) {
		event.preventDefault();
		onSubmit(new FormData(event.currentTarget));
	}
</script>

<form class="w-fit" onsubmit={handleSubmit}>
  <label>
    Prefab name
    <input type="text" name={FormName.PrefabName}>
  </label>
  
  <label>
    Prefab type
    <select name={FormName.PrefabType}>
      <option value={PrefabType.Character}>Character</option>
      <option value={PrefabType.CharacterParts}>Character Parts</option>
      <option value={PrefabType.Props}>Props</option>
      <option value={PrefabType.Bullets}>Bullets</option>
      <option value={PrefabType.Pulses}>Pulses</option>
      <option value={PrefabType.Bombs}>Bombs</option>
      <option value={PrefabType.Spinners}>Spinners</option>
      <option value={PrefabType.Beams}>Beams</option>
      <option value={PrefabType.Static}>Static</option>
      <option value={PrefabType.Misc1}>Misc 1</option>
      <option value={PrefabType.Misc2}>Misc 2</option>
      <option value={PrefabType.Misc3}>Misc 3</option>
    </select>
  </label>

  <label>
    Prefab description
    <textarea name={FormName.PrefabDescription}></textarea>
  </label>

  <label>
    Size
    <input type="number" name={FormName.Size} min="0" value="10">
  </label>

  <label>
    Lifetime
    <input type="number" name={FormName.Lifetime} min="0" value="10">
  </label>

  <label>
    Depth
    <input type="number" name={FormName.Depth} min="0" value="20">
  </label>

  <label>
    Horizontal alignment
    <input type="radio" name={FormName.HorizontalAlignment} value={Alignment.Left}>
    <input type="radio" name={FormName.HorizontalAlignment} value={Alignment.Center} checked>
    <input type="radio" name={FormName.HorizontalAlignment} value={Alignment.Right}>
  </label>

  <label>
    Vertical alignment
    <input type="radio" name={FormName.VerticalAlignment} value={Alignment.Top}>
    <input type="radio" name={FormName.VerticalAlignment} value={Alignment.Middle} checked>
    <input type="radio" name={FormName.VerticalAlignment} value={Alignment.Bottom}>
  </label>

  <label>
    Use hit objects
    <input type="checkbox" name={FormName.UseHitObjects}>
  </label>

  <label>
    Image file
    <input type="file" name={FormName.ImageFile} accept="image/*">
  </label>

  <button type="submit">Generate</button>
</form>