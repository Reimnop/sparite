import type { Prefab, PrefabObject, PrefabObjectEvent, PrefabObjectOrigin } from '$lib/data/Vgp';
import type { IndexedColor } from './Color';
import type { ColoredRect } from './Rect';

enum ObjectType {
	Hit = 4,
	NoHit = 5,
	Empty = 6
}

type Vec2 = [number, number];

export function createPrefab(
	name: string,
	description: string,
	type: number,
	lifetime: number,
	depth: number,
	hit: boolean,
	coloredRects: ColoredRect[],
	seed: number
): Prefab {
	return {
		n: name,
		description,
		type,
		objs: createPrefabObjects(lifetime, depth, hit, coloredRects, seed)
	};
}

function createPrefabObjects(
	lifetime: number,
	depth: number,
	hit: boolean,
	coloredRects: ColoredRect[],
	seed: number
): PrefabObject[] {
	const parentObject: PrefabObject = createPrefabObject(
		generateId(0, seed),
		null,
		'root',
		0,
		{ x: 0, y: 0 },
		ObjectType.Empty,
		lifetime,
		depth,
		[0, 0],
		[1, 1],
		{ index: 0, opacity: 0 }
	);

	const rectObjects = coloredRects.map((rect, i) => {
		const id = generateId(i + 1, seed);
		const position: Vec2 = [rect.x, -rect.y];
		const scale: Vec2 = [rect.width, rect.height];
		const origin: PrefabObjectOrigin = { x: 0.5, y: -0.5 };
		return createPrefabObject(
			id,
			parentObject.id,
			`rect_${i}`,
			1,
			origin,
			hit ? ObjectType.Hit : ObjectType.NoHit,
			lifetime,
			depth,
			position,
			scale,
			rect.color
		);
	});

	return [parentObject, ...rectObjects];
}

function createPrefabObject(
	id: string,
	parentId: string | null,
	name: string,
	bin: number,
	origin: PrefabObjectOrigin,
	type: ObjectType,
	lifetime: number,
	depth: number,
	position: Vec2,
	scale: Vec2,
	color: IndexedColor
): PrefabObject {
	const posEvent: PrefabObjectEvent = {
		k: [
			{
				t: 0,
				ev: position
			}
		]
	};

	const scaEvent: PrefabObjectEvent = {
		k: [
			{
				t: 0,
				ev: scale
			}
		]
	};

	const rotEvent: PrefabObjectEvent = {
		k: [
			{
				t: 0,
				ev: [0]
			}
		]
	};

	const colEvent: PrefabObjectEvent = {
		k: [
			{
				t: 0,
				ev: [color.index, color.opacity * 100]
			}
		]
	};

	const obj: PrefabObject = {
		id,
		n: name,
		ed: {
			b: bin
		},
		o: origin,
		ak_t: 3, // auto kill type fixed time
		ak_o: lifetime,
		ot: type,
		d: depth,
		e: [posEvent, scaEvent, rotEvent, colEvent]
	};

	if (parentId) {
		obj.p_id = parentId;
	}

	return obj;
}

function generateId(i: number, seed: number): string {
	return `${seed}_${i}`;
}
