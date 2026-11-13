// REPLACE PLACEHOLDERS WITH REAL 3D MODELS (.glb): put files in /public/models, then e.g. doc: '/models/doctor.glb'
// People: face +Z, feet at y=0. Optional animation clips named Idle / Walk / Work (partial, any case).
// Equipment: any item id from src/data/catalog.js (e.g. xray, ct, mri, bed, ecg, analyzer ...). Models are scaled to the item footprint; the first clip loops.
const ids = ['chair', 'sofa', 'stool', 'officechair', 'wheelchair', 'desk', 'recdesk', 'counter', 'cabinet', 'shelf', 'medshelf', 'table', 'trolley', 'bench', 'exambed', 'bed', 'icubed', 'ottable', 'stretcher', 'recliner', 'ecg', 'analyzer', 'centrifuge', 'microscope', 'xray', 'usg', 'ct', 'mri', 'monitor', 'ventilator', 'defib', 'autoclave', 'ivstand', 'fridge', 'oxygen', 'basin', 'plant', 'tv', 'totem', 'poster', 'vending', 'cooler', 'rug', 'lamp', 'screen', 'bin'];
export const MODELS = {
  people: { player: null, doc: null, nurse: null, tech: null, recep: null, hk: null, pharm: null, patient: null },
  equipment: Object.fromEntries(ids.map((k) => [k, null])),
};
