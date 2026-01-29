<script lang="ts">
	import { getColorHex, type ColorRgb } from "$lib/algo/Color";
	import { createIndexedImage, type RawImage } from "$lib/algo/IndexedImage";
	import { convertIndexedImageToColoredRects } from "$lib/algo/Processor";
	import type { ColoredRect } from "$lib/algo/Rect";
	import { createPrefab } from "$lib/algo/VgpExport";
	import { Alignment } from "$lib/Alignment";
	import { FormName } from "$lib/FormName";
	import type { PrefabType } from "$lib/PrefabType";
	import SpariteForm from "./SpariteForm.svelte";

	let prefabString = $state<string | undefined>();
	let pallete = $state<string[] | undefined>();

	interface GenerationResult {
		rects: ColoredRect[];
		palette: ColorRgb[];
		width: number;
		height: number;
	}

	async function handleSubmit(formData: FormData) {
		const prefabName = formData.get(FormName.PrefabName) as string;
		const prefabDescription = formData.get(FormName.PrefabDescription) as string;
		const prefabType = parseInt(formData.get(FormName.PrefabType) as string, 10) as PrefabType;
		const pixelsPerUnit = parseInt(formData.get(FormName.PixelsPerUnit) as string, 10);
		const lifetime = parseInt(formData.get(FormName.Lifetime) as string, 10);
		const depth = parseInt(formData.get(FormName.Depth) as string, 20);
		const horizontalAlignment = formData.get(FormName.HorizontalAlignment) as Alignment;
		const verticalAlignment = formData.get(FormName.VerticalAlignment) as Alignment;
		const useHitObjects = formData.get(FormName.UseHitObjects) === "on";
		const imageFile = formData.get(FormName.ImageFile) as File;

		const result = await generatePAImage(imageFile);
		transformGenerationResult(result, pixelsPerUnit, horizontalAlignment, verticalAlignment);

		const prefab = createPrefab(prefabName, prefabDescription, prefabType, lifetime, depth, useHitObjects, result.rects, Date.now());

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

	function transformGenerationResult(result: GenerationResult, pixelsPerUnit: number, horizontalAlignment: Alignment, verticalAlignment: Alignment) {
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

<SpariteForm onSubmit={handleSubmit} />

{#if prefabString}
	<h2 class="mt-8 text-lg font-bold">Generated Prefab JSON:</h2>
	<textarea class="w-full h-64 mt-2 p-2 border border-gray-300 rounded" readonly>{prefabString}</textarea>
{/if}

{#if pallete}
	<h2 class="mt-8 text-lg font-bold">Palette:</h2>
	<div class="flex space-x-2 mt-2">
		{#each pallete as color}
			<div class="w-8 h-8 rounded" style="background-color: {color};" title={color}></div>
			<p>{color}</p>
		{/each}
	</div>
{/if}

