export interface Prefab {
	n?: string;
	description?: string;
	type?: number;
	objs?: PrefabObject[];
}

export interface PrefabObject {
	id: string;
	p_id?: string;
	ak_t?: number;
	ak_o?: number;
	p_t?: string;
	ot?: number;
	d?: number;
	n?: string;
	ed?: PrefabObjectEditorSettings;
	o?: PrefabObjectOrigin;
	s?: number;
	so?: number;
	e?: PrefabObjectEvent[];
}

export interface PrefabObjectEditorSettings {
	b?: number;
}

export interface PrefabObjectOrigin {
	x: number;
	y: number;
}

export interface PrefabObjectEvent {
	k: PrefabObjectKeyframe[];
}

export interface PrefabObjectKeyframe {
	t: number;
	ev: number[];
}
