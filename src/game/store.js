// Shared state + tiny pub/sub. The engine mutates it, the UI reads it.
import { START_STAFF } from '../data/story.js';
import { DRUGS } from '../data/medical.js';
const KEY = 'htvite3';
const def = () => ({
  name: 'Aarav', items: [], inv: {}, uid: 0, profile: { title: 'Dr.', name: 'Aarav', spec: 'General Physician', reg: 'MCI-' + (10000 + Math.random() * 89999 | 0), clinic: 'City Clinic', quals: ['MBBS'], bio: '', look: { skin: 0xf1c9a5, hair: 0x17120e, style: 'short', coat: 0xffffff } }, money: 250000, rep: 50, lvl: 1, day: 1, pat: 0, owned: 0, floors: 1, lift: 0, equip: {}, slots: {}, pid: 0, cases: 0, rated: 0, scoreSum: 0, charity: 0, opsDone: 0,
  staff: START_STAFF.map((s) => ({ ...s, sk: { ...s.sk } })), cands: [], rounds: {}, flags: {}, story: { intro: 0, done: [], pending: [] },
  stock: Object.fromEntries(Object.keys(DRUGS).map((k) => [k, 60])), tier: 0, field: null, course: null, bills: [],
  paint: { wall: 0xe9eef2, floor: 0xdfe6ea, ext: 0xe9eef2 },
});
export const store = {
  S: null, PR: null, ui: null, doc: null, duty: null, prompt: '', msg: '', fl: 0, started: false, v: 0, L: new Set(),
  subscribe: (f) => { store.L.add(f); return () => store.L.delete(f); },
  emit() { this.v++; this.L.forEach((f) => f()); },
  load() { let s = null; try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} this.S = { ...def(), ...s }; },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.S)); } catch (e) {} },
  toast(m) { this.msg = m; this.emit(); clearTimeout(this.h); this.h = setTimeout(() => { this.msg = ''; this.emit(); }, 3500); },
  rooms(id) { return Object.entries(this.S.slots).filter((e) => e[1] == id).map((e) => e[0]); },
  has(id) { return this.rooms(id).length > 0; },
  hasItem(id) { return this.S.items.some((i) => i.id == id); },
  reset() { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
};
