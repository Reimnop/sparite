import type { Prefab, PrefabObject, PrefabObjectEvent, PrefabObjectOrigin } from "$lib/data/Vgp";
import type { IndexedColor } from "./Color";

enum ObjectType {
  Hit = 4,
  NoHit = 5,
  Empty = 6
}

type Vec2 = [number, number];

export interface PrefabRect {
	positions: Keyframe<Vec2>[];
	sizes: Keyframe<Vec2>[];
	colors: Keyframe<IndexedColor>[];
}

export interface Keyframe<T> {
	time: number;
	value: T;
}

export function createPrefab(
  name: string,
  description: string,
  type: number,
  lifetime: number,
  depth: number,
  hit: boolean,
  prefabRects: PrefabRect[],
  seed: number
): Prefab {
  return {
    n: name,
    description,
    type,
    objs: createPrefabObjects(lifetime, depth, hit, prefabRects, seed)
  };
}

function createPrefabObjects(
  lifetime: number,
  depth: number,
  hit: boolean,
  prefabRects: PrefabRect[],
  seed: number
): PrefabObject[] {
  const parentObject: PrefabObject = createPrefabObject(
    generateId(0, seed),
    null,
    "root",
    0,
    { x: 0, y: 0 },
    ObjectType.Empty,
    lifetime,
    depth,
    [{ time: 0, value: [0, 0] }],
    [{ time: 0, value: [1, 1] }],
    [{ time: 0, value: { index: 0, opacity: 100 } }]
  );

  const rectObjects = prefabRects.map((rect, i) => {
    const id = generateId(i + 1, seed);
    const positions: Keyframe<Vec2>[] = rect.positions.map(pos => ({
			time: pos.time,
			value: [pos.value[0], -pos.value[1]]
		}));
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
      positions,
      rect.sizes,
      rect.colors
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
  positions: Keyframe<Vec2>[],
  scales: Keyframe<Vec2>[],
  colors: Keyframe<IndexedColor>[]
): PrefabObject {
  const posEvent: PrefabObjectEvent = {
    k: [
      ...positions.map(pos => ({
				t: pos.time,
				ev: [pos.value[0], pos.value[1]],
				ct: "Instant"
			}))
    ]
  };

  const scaEvent: PrefabObjectEvent = {
    k: [
      ...scales.map(sca => ({
				t: sca.time,
				ev: [sca.value[0], sca.value[1]],
				ct: "Instant"
			}))
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
      ...colors.map(col => ({
				t: col.time,
				ev: [col.value.index, col.value.opacity * 100],
				ct: "Instant"
			}))
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
    p_t: "111",
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
