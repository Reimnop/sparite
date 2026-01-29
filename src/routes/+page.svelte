<script lang="ts">
	import * as Field from '$lib/components/ui/field';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { PrefabType } from '$lib/PrefabType';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Alignment } from '$lib/Alignment';
	import type { ColoredRect } from '$lib/algo/Rect';
	import { getColorHex, type ColorRgb } from '$lib/algo/Color';
	import { createPrefab } from '$lib/algo/VgpExport';
	import { createIndexedImage, type RawImage } from '$lib/algo/IndexedImage';
	import { convertIndexedImageToColoredRects } from '$lib/algo/Processor';

	interface Values {
		prefabName: string;
		prefabDescription: string;
		prefabType: PrefabType;
		pixelsPerUnit: number;
		lifetime: number;
		depth: number;
		horizontalAlignment: Alignment;
		verticalAlignment: Alignment;
		useHitObjects: boolean;
		imageFiles?: FileList;
	}

	interface GenerationResult {
		rects: ColoredRect[];
		palette: ColorRgb[];
		width: number;
		height: number;
	}

	let values = $state<Values>({
		prefabName: '',
		prefabDescription: '',
		prefabType: PrefabType.Character,
		pixelsPerUnit: 8,
		lifetime: 10,
		depth: 20,
		horizontalAlignment: Alignment.Center,
		verticalAlignment: Alignment.Middle,
		useHitObjects: false,
		imageFiles: undefined
	});

	const prefabTypes: Record<PrefabType, string> = {
		[PrefabType.Character]: 'Character',
		[PrefabType.CharacterParts]: 'Character Parts',
		[PrefabType.Props]: 'Props',
		[PrefabType.Bullets]: 'Bullets',
		[PrefabType.Pulses]: 'Pulses',
		[PrefabType.Bombs]: 'Bombs',
		[PrefabType.Spinners]: 'Spinners',
		[PrefabType.Beams]: 'Beams',
		[PrefabType.Static]: 'Static',
		[PrefabType.Misc1]: 'Misc 1',
		[PrefabType.Misc2]: 'Misc 2',
		[PrefabType.Misc3]: 'Misc 3'
	};

	const horizontalAlignments: Partial<Record<Alignment, string>> = {
		[Alignment.Left]: 'Left',
		[Alignment.Center]: 'Center',
		[Alignment.Right]: 'Right'
	};

	const verticalAlignments: Partial<Record<Alignment, string>> = {
		[Alignment.Top]: 'Top',
		[Alignment.Middle]: 'Middle',
		[Alignment.Bottom]: 'Bottom'
	};

	const prefabTypeLabel = $derived(prefabTypes[values.prefabType]);

	let prefabString = $state<string | undefined>();
	let pallete = $state<string[] | undefined>();

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const result = await generatePAImage(values.imageFiles[0]);
		transformGenerationResult(
			result,
			values.pixelsPerUnit,
			values.horizontalAlignment,
			values.verticalAlignment
		);

		const prefab = createPrefab(
			values.prefabName,
			values.prefabDescription,
			values.prefabType,
			values.lifetime,
			values.depth,
			values.useHitObjects,
			result.rects,
			Date.now()
		);

		prefabString = JSON.stringify(prefab);
		pallete = result.palette.map((color) => getColorHex(color));
	}

	async function generatePAImage(imageFile: File): Promise<GenerationResult> {
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
				const canvas = document.createElement('canvas');
				canvas.width = image.width;
				canvas.height = image.height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
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

	function transformGenerationResult(
		result: GenerationResult,
		pixelsPerUnit: number,
		horizontalAlignment: Alignment,
		verticalAlignment: Alignment
	) {
		const scaleFactor = 1 / pixelsPerUnit; // the generator assumes 1 ppu, so scale accordingly
		const offsetX = computeXOffset(result.width * scaleFactor, horizontalAlignment);
		const offsetY = computeYOffset(result.height * scaleFactor, verticalAlignment);
		for (const rect of result.rects) {
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

<div class="flex min-h-screen w-full flex-col items-center p-8">
	<Card.Root class="w-full max-w-md">
		<Card.Content>
			<form onsubmit={handleSubmit}>
				<Field.Set>
					<Field.Group>
						<Field.Field>
							<Field.Label>Prefab Name</Field.Label>
							<Input type="text" bind:value={values.prefabName} />
						</Field.Field>

						<Field.Field>
							<Field.Label>Prefab Type</Field.Label>
							<Select.Root
								type="single"
								bind:value={
									() => String(values.prefabType),
									(value) => (values.prefabType = Number(value) as PrefabType)
								}
							>
								<Select.Trigger class="w-45">{prefabTypeLabel}</Select.Trigger>
								<Select.Content>
									{#each Object.entries(prefabTypes) as [key, value]}
										<Select.Item value={key}>{value}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Field>

						<Field.Field>
							<Field.Label>Prefab Description</Field.Label>
							<Textarea bind:value={values.prefabDescription} />
						</Field.Field>

						<Field.Group class="grid gap-2 sm:grid-cols-3">
							<Field.Field>
								<Field.Label>Pixels Per Unit</Field.Label>
								<Input type="number" bind:value={values.pixelsPerUnit} />
							</Field.Field>

							<Field.Field>
								<Field.Label>Lifetime</Field.Label>
								<Input type="number" bind:value={values.lifetime} />
							</Field.Field>

							<Field.Field>
								<Field.Label>Depth</Field.Label>
								<Input type="number" bind:value={values.depth} />
							</Field.Field>
						</Field.Group>

						<Field.Group class="grid gap-2 sm:grid-cols-2">
							<Field.Set>
								<Field.Label>Horizontal Alignment</Field.Label>
								<RadioGroup.Root bind:value={values.horizontalAlignment}>
									{#each Object.entries(horizontalAlignments) as [key, value]}
										<Field.Field orientation="horizontal">
											<RadioGroup.Item id="alignment-{key}" value={key} />
											<Field.Label for="alignment-{key}">{value}</Field.Label>
										</Field.Field>
									{/each}
								</RadioGroup.Root>
							</Field.Set>
							<Field.Set>
								<Field.Label>Vertical Alignment</Field.Label>
								<RadioGroup.Root bind:value={values.verticalAlignment}>
									{#each Object.entries(verticalAlignments) as [key, value]}
										<Field.Field orientation="horizontal">
											<RadioGroup.Item id="alignment-{key}" value={key} />
											<Field.Label for="alignment-{key}">{value}</Field.Label>
										</Field.Field>
									{/each}
								</RadioGroup.Root>
							</Field.Set>
						</Field.Group>

						<Field.Field orientation="horizontal">
							<Checkbox id="use-hit-objects" bind:checked={values.useHitObjects} />
							<Field.Label for="use-hit-objects">Use Hit Objects</Field.Label>
						</Field.Field>

						<Field.Field>
							<Field.Label>Image File</Field.Label>
							<Input type="file" bind:files={values.imageFiles} />
						</Field.Field>

						<Field.Field>
							<Button type="submit">Generate</Button>
						</Field.Field>
					</Field.Group>
				</Field.Set>
			</form>
		</Card.Content>
	</Card.Root>
</div>

{#if prefabString}
	<h2 class="mt-8 text-lg font-bold">Generated Prefab JSON:</h2>
	<Textarea value={prefabString} readonly />
{/if}

{#if pallete}
	<h2 class="mt-8 text-lg font-bold">Palette:</h2>
	<div class="mt-2 flex space-x-2">
		{#each pallete as color}
			<div class="h-8 w-8 rounded" style="background-color: {color};" title={color}></div>
			<p>{color}</p>
		{/each}
	</div>
{/if}
