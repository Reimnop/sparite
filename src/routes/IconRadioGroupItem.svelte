<script lang="ts">
  import { RadioGroup, type WithoutChildrenOrChild } from "bits-ui";

  let {
		ref = $bindable(null),
		class: className,
    checkedIcon,
    uncheckedIcon,
		...restProps
	}: WithoutChildrenOrChild<RadioGroup.ItemProps> & {
    checkedIcon: string;
    uncheckedIcon: string;
  } = $props();
</script>

<RadioGroup.Item
  bind:ref
  data-slot="radio-group-item"
  class={className}
  {...restProps}>
  {#snippet children({ checked })}
    <img src={checked ? checkedIcon : uncheckedIcon} alt={checked ? "Checked" : "Unchecked"} />
  {/snippet}
</RadioGroup.Item>