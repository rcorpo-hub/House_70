import { Color3, PBRMaterial, PointLight, Vector3 } from '../scene/babylon.js';
import { Geo, Wall } from '../scene/geometry.js';
import { createApply, createMaterials, createTextures } from '../scene/interior/materials.js';
import { INTERIOR_CATEGORIES, resolveAll } from '../interiorCatalog.js';
import { createCampFitout } from './campHillFitout.js';
import { frontFacade, levels, mainRoof } from './campHillPlan.js';

// A-01-04 and A-01-05 show showers and WCs without a dedicated bath tub.
export const campExcludedInterior = ['b-bath'];

const point = (u, y, v) => [v - 4.4, y, u - 11.05];
const vec = (...args) => new Vector3(...point(...args));

export function campViews(views) {
  const focus = (u, y, v, radius, alpha = -2, beta = 1.23) =>
    ({ target: point(u, y, v), radius, alpha, beta });
  Object.assign(views, {
    home: focus(9, 1.65, 4.4, 35), front: focus(2.2, 2.55, 4.4, 18, -Math.PI / 2, 1.43),
    left: focus(11, 2.6, 4.4, 31, Math.PI), right: focus(11, 2.6, 4.4, 31, 0),
    aerial: focus(11, 1.5, 4.4, 39, -2, 0.66), back: focus(23, 1.45, 4.4, 33, 1.11),
    summaryRight: focus(10.8, 1.8, 4.4, 34, -1.02),
    summaryLeft: focus(10.8, 1.8, 4.4, 34, -2.14),
    hall: focus(8.1, 1.25, 4.78, 2.85, -1.55),
    wc: focus(10.95, 0.9, 3.45, 2.3, 0.5),
    dollhouse: focus(11, 1.8, 4.4, 34, -2, 0.55),
    living: focus(18, 1.2, 3, 4.4, 2.2), kitchen: focus(17, 1.25, 6.8, 4.4, 2.65),
    pantry: focus(13, 1.2, 7.1, 1.7, 2.65), master: focus(19.2, 4.32, 2.7, 4.4, 2.2),
    media: focus(2.7, 4.32, 3.5, 4.4, 2.2), alfresco: focus(23.5, 1.2, 4.4, 5, 1),
    bathroom: focus(11.7, 1.2, 2.4, 2.5, 0.5), vanity: focus(11.7, 1.2, 2.4, 2.5, 0.5),
    ensuite: focus(20.8, 4.25, 7.1, 2.6, 0.5), laundry: focus(11.2, 1.2, 7, 2.2, 0.5),
    roof: focus(10, 5.5, 4.4, 30, -2, 0.77), eaves: focus(1, 5.7, 3, 9),
    fascia: focus(1, 5.7, 3, 9), downpipe: focus(0, 1.6, 0.1, 8),
    cladding: focus(1, 4.3, 5.6, 10), flashing: focus(0, 6.1, 4, 10),
    entry: focus(3.45, 1.3, 7.3, 8), entrydoor: focus(3.45, 1.3, 7.3, 4),
    bricks: focus(2, 1.5, 0, 10, -2.7), trim: focus(0, 4.3, 3.5, 8),
    windows: focus(0, 4.3, 3.5, 7), garage: focus(0, 1.3, 3, 10),
    driveway: focus(-2.5, 0, 3, 14),
  });
}

export function buildCampHill({ scene, M, shadows }) {
  const IM = createMaterials(scene, M);
  const S = {};
  const { applyMaterials } = createApply({ scene, M, IM, S, ...createTextures(scene) });
  const floors = [[], []];
  const walls = [];
  const roofs = [];
  const extras = [];
  const doorOpenings = [];
  const windows = [];
  const fixedGlass = M.glass.clone('camp-fixed-glass');
  const fixedMetal = IM.appSS;
  const paving = IM.wetTile;
  const groundFinish = IM.kick;
  const canopy = IM.appBlack.clone('camp-canopy');
  canopy.albedoColor = Color3.FromHexString('#7b8084').toLinearSpace();
  canopy.roughness = 0.68;
  let infill;
  let inside = false;
  let floor = 1;

  function mesh(name, material, part, int, level, geo) {
    const m = geo.toMesh(name, scene, material);
    m.material = material;
    m.metadata = { part, int };
    m.receiveShadows = true;
    shadows.addShadowCaster(m);
    if (level != null) floors[level].push(m);
    return m;
  }

  function box(name, u0, u1, v0, v1, y0, y1, material, { part, int, level } = {}) {
    const g = new Geo();
    g.box(...point(u0, y0, v0), ...point(u1, y1, v1));
    return mesh(name, material, part, int, level, g);
  }

  function segment(spec, level, external) {
    const [name, u0, v0, u1, v1, part, openings = []] = spec;
    const { base, height } = levels[level];
    const length = Math.hypot(u1 - u0, v1 - v0);
    const du = (u1 - u0) / length;
    const dv = (v1 - v0) / length;
    const reverseNormal = ['garage-side', 'living-side', 'upper-long-side', 'deck-slider',
      'master-rear', 'court-front', 'garage-return'].includes(name);
    const outward = reverseNormal ? -1 : 1;
    const wall = new Wall({ origin: point(u0, base, v0), dir: [dv, 0, du], out: [du * outward, 0, -dv * outward] });
    const thickness = external ? 0.18 : 0.09;
    const g = new Geo();
    wall.solid(g, 0, length, external && name.startsWith('garage') ? -0.35 : 0, height, thickness,
      openings.map(([s0, s1, y0, y1]) => ({ s0, s1, y0, y1 })));
    walls.push(mesh(name, external ? M[part] : part === 'feature' ? IM.feature : IM.wall,
      external ? part : undefined, external ? undefined : part, level, g));
    const piece = (id, a, b, c, d, material, tag, depth = 0.075) => {
      const shape = new Geo();
      wall.box(shape, a, b, c, d, depth, depth - 0.045);
      return mesh(name + '-' + id, material, tag, undefined, level, shape);
    };
    for (const [i, [a, b, lo, hi, kind]] of openings.entries()) {
      if (kind === 'entry') {
        entryOpening = { wall, x0: a, x1: b, height: hi };
        continue;
      }
      if (kind === 'door') {
        doorOpenings.push({ name, wall, a, b, hi, level, external });
        piece('jamb-left', a - 0.035, a, lo, hi, IM.woodwork);
        piece('jamb-right', b, b + 0.035, lo, hi, IM.woodwork);
        piece('jamb-head', a, b, hi, hi + 0.035, IM.woodwork);
        continue;
      }
      if (kind === 'garage') {
        piece('leaf', a, b, lo, hi, M.garage, 'garage');
        for (const [id, start, end] of [['left', a - 0.10, a], ['right', b, b + 0.10]]) {
          piece('garage-surround-' + id, start, end, lo, hi + 0.10, IM.appBlack, undefined, 0.09);
        }
        piece('garage-surround-head', a, b, hi, hi + 0.10, IM.appBlack, undefined, 0.09);
        infill = piece('infill', a, b, hi, hi + 0.16, M.bricks, 'bricks', 0.012);
        continue;
      }
      piece(i + '-glass', a, b, lo, hi, M.glass, 'frame', 0.012);
      const panels = name === 'deck-slider' ? 6 : name === 'media-front' ? 4 : 2;
      for (let j = 0; j <= panels; j++) {
        const s = a + (b - a) * j / panels;
        piece(i + '-frame-' + j, s - 0.024, s + 0.024, lo, hi, M.frame, 'frame');
      }
      for (const [j, y] of [lo, hi].entries()) {
        if (name === 'media-front') {
          piece(i + '-frame-rail-' + j, a, b, y - 0.035, y + 0.035, M.frame, 'frame');
        }
        piece(i + '-trim-' + j, a - 0.05, b + 0.05, y - 0.045, y + 0.045, M.trim, 'trim');
      }
      const slider = name === 'deck-slider' || name === 'media-front';
      windows.push({ name: name + '-' + i, wall, a, b, lo, hi, level, slider });
      // The glazed openings are traced without a sash schedule. Preview mesh on
      // the operable half and retain the other half as unobstructed fixed glass.
      const screenStart = (a + b) / 2;
      extras.push({
        slider,
        flyscreen: piece(i + '-screen', screenStart, b, lo, hi, M.flyscreen, 'frame', 0.09),
        barrier: piece(i + '-barrier', screenStart, b, lo, hi, M.barrier, 'frame', 0.12),
        boutique: piece(i + '-boutique', a, b, (lo + hi) / 2 - 0.022, (lo + hi) / 2 + 0.022, M.frame, 'frame'),
      });
    }
  }

  let entryOpening;
  levels.forEach(({ slabs, exterior, partitions }, level) => {
    const { base } = levels[level];
    slabs.forEach(([u0, u1, v0, v1, y = base], i) =>
      box('level-' + level + '-slab-' + i, u0, u1, v0, v1, y - (level ? 0.38 : 0.16), y,
        y < 0 ? IM.wetTile : u0 >= 22.1 || u0 < 0 ? paving : IM.floorMain,
        { level, int: y >= 0 && u0 >= 0 && u0 < 22.1 ? 'flooring' : undefined }));
    exterior.forEach((s) => segment(s, level, true));
    partitions.forEach(([name, a, b, c, d, door]) =>
      segment([name, a, b, c, d, 'paint', door ? [[...door, 0, 2.12, 'door']] : []], level, false));
    if (level === 0) {
      box('guest-carpet', 6.9, 10, 1, 4.05, 0.002, 0.012, IM.carpet, { level, int: 'carpet' });
    } else {
      for (const [name, a, b, c, d] of [
        ['media', 0.12, 5.6, 1, 4.06], ['bed4', 5.75, 10, 1, 4.06],
        ['bed3', 3.5, 7.29, 5.56, 8.65], ['bed2', 10.41, 14.3, 5.56, 8.65],
        ['master', 17.14, 22, 1, 5.44],
      ]) box(name + '-carpet', a, b, c, d, base + 0.002, base + 0.012, IM.carpet, { level, int: 'carpet' });
    }
  });

  function roof(name, a, b, c, d, y, material, part, thickness = 0.12, slope = 0, fall = 0) {
    const g = new Geo();
    g.box(...point(a, y, c), ...point(b, y + thickness, d));
    for (let i = 0; i < g.p.length; i += 3) g.p[i + 1] += (g.p[i] + 4.4 - c) * slope + (g.p[i + 2] + 11.05 - a) * fall;
    roofs.push(mesh(name, material, part, undefined, undefined, g));
  }
  roof('main-roof-front', -0.2, 7.35, mainRoof.edge, 8.75, mainRoof.base, M.roof, 'roof', mainRoof.thickness, mainRoof.slope);
  roof('main-roof-court', 7.35, 10.35, mainRoof.edge, 5.48, mainRoof.base, M.roof, 'roof', mainRoof.thickness, mainRoof.slope);
  roof('main-roof-rear', 10.35, 22.08, mainRoof.edge, 8.75, mainRoof.base, M.roof, 'roof', mainRoof.thickness, mainRoof.slope);
  roof('front-parapet', -0.34, 0, 0.67, 8.95, 6.35, M.render, 'render', 0.45);
  roof('front-flashing', -0.36, 0.03, 0.65, 8.97, 6.8, M.flashing, 'flashing', 0.04);
  roof('side-fascia-front', -0.17, 7.35, 8.95, 9.01, 5.62, M.fascia, 'fascia', 0.2);
  roof('side-fascia-rear', 10.35, 22.27, 8.95, 9.01, 5.62, M.fascia, 'fascia', 0.2);
  roof('side-gutter', -0.17, 22.27, 0.53, 0.72, 5.61, M.gutter, 'gutter');
  roof('parapet-long-left', -0.33, 22.28, 0.67, 0.9, 5.71, M.cladding, 'cladding', 1.09);
  roof('parapet-rear', 22.08, 22.3, 0.67, 8.95, 5.71, M.cladding, 'cladding', 1.09);
  roof('parapet-long-front', -0.33, 7.35, 8.75, 8.95, 5.71, M.cladding, 'cladding', 1.09);
  roof('parapet-long-rear', 10.35, 22.28, 8.75, 8.95, 5.71, M.cladding, 'cladding', 1.09);
  walls.push(box('front-render-pier', -0.33, 0.02, 7.8, 8.95, -0.35, 6.8, M.render, { part: 'render' }));
  // The reference shows a lined recess, with the entry screen behind the balcony.
  const timber = IM.oakDark;
  const timberLining = new Geo();
  const { mediaRight } = frontFacade;
  // Follow the underside of the pitched roof with 15 mm clearance. The old
  // horizontal lining at 6.39 m broke through the roof near the media room.
  const liningTop = (v) => mainRoof.base + (v - mainRoof.edge) * mainRoof.slope - 0.015;
  function recessedTimber(u0, u1, v0, v1, y0, y1, ceiling = false) {
    const start = timberLining.p.length;
    timberLining.box(...point(u0, y0, v0), ...point(u1, y1, v1));
    for (let i = start; i < timberLining.p.length; i += 3) {
      const top = liningTop(timberLining.p[i] + 4.4);
      if (ceiling) timberLining.p[i + 1] += top - 6.39;
      else timberLining.p[i + 1] = Math.min(timberLining.p[i + 1], top - 0.1);
    }
  }
  for (const [v0, v1, y] of [[mediaRight, 6.56, 0], [6.56, 7.56, 2.35], [7.56, 8.72, 0]]) {
    recessedTimber(3.43, 3.45, v0, v1, y, 6.35);
  }
  timberLining.box(...point(-1.04, 6.35, 0.67), ...point(0, 6.39, 8.72));
  recessedTimber(0, 3.43, mediaRight, 8.72, 6.35, 6.39, true);
  for (let v = mediaRight; v < 8.72; v += 0.085) {
    const doorOpening = v + 0.072 > 6.56 && v < 7.56;
    recessedTimber(3.37, 3.43, v, Math.min(v + 0.072, 8.72), doorOpening ? 2.35 : 0, 6.35);
  }
  for (let u = -1.04; u < 0; u += 0.085) {
    timberLining.box(...point(u, 6.29, 0.67), ...point(Math.min(u + 0.072, 0), 6.35, 8.72));
  }
  for (let u = 0; u < 3.43; u += 0.085) {
    recessedTimber(u, Math.min(u + 0.072, 3.43), mediaRight, 8.72, 6.29, 6.35, true);
  }
  for (let u = -1.04; u < 0; u += 0.085) {
    timberLining.box(...point(u, 3.12, 0.67), ...point(u + 0.072, 6.35, 0.73));
  }
  roofs.push(mesh('front-recess-timber-soffit', timber, undefined, undefined, undefined, timberLining));
  roof('front-portal-header', -1.1, -0.33, 0.64, 8.95, 6.35, IM.appBlack, undefined, 0.45);
  walls.push(box('front-portal-left-return', -1.1, 0, 0.52, 0.67, 3.12, 6.35, IM.appBlack));
  const canopyStart = 22.08;
  const canopyHeight = 2.89;
  const canopyFall = -0.056;
  roof('deck-cover', canopyStart, 25.3, 0.85, 8.8, canopyHeight, canopy, undefined, 0.1, 0, canopyFall);
  for (const [side, v] of [['left', 1.02], ['right', 8.62]]) {
    box('deck-column-' + side, 25.08, 25.22, v - 0.07, v + 0.07, 0,
      canopyHeight + (25.22 - canopyStart) * canopyFall, fixedMetal);
  }
  box('downpipe-front', 0.1, 0.22, 0.59, 0.71, -0.35, 5.65, M.downpipe, { part: 'downpipe' });
  function gradedPad(name, u0, u1, v0, v1, low, high, material, part) {
    const g = new Geo();
    g.box(...point(u0, low - 0.1, v0), ...point(u1, low, v1));
    const slope = (high - low) / (u1 - u0);
    for (let i = 0; i < g.p.length; i += 3) g.p[i + 1] += (g.p[i + 2] + 11.05 - u0) * slope;
    mesh(name, material, part, undefined, undefined, g);
  }
  gradedPad('driveway', -5.25, 0, frontFacade.garageLeft + 0.25, 6.02, -0.48, -0.35, M.driveway, 'driveway');
  gradedPad('side-grade', -1.35, 25.3, 8.75, 9.87, -0.48, -0.055, groundFinish);
  gradedPad('portico-approach', -3.1, -0.95, 6.29, 8.75, -0.42, -0.16, paving);
  box('portico-paving', -0.95, 3.45, 6.29, 8.75, -0.16, 0, paving);
  box('dry-court-paving', 7.35, 13.2, 8.75, 9.82, -0.17, -0.04, paving);
  walls.push(box('garage-portal-head', -0.095, -0.015, frontFacade.garageDoorLeft - 0.12,
    frontFacade.garageDoorRight + 0.13, 2.23, 2.74, IM.appBlack));
  box('balcony-edge-trim', -1.09, -0.97, 0.68, 6.2, 2.76, 3.17, IM.appBlack, { level: 1 });
  const balconyFixings = new Geo();
  for (let panel = 0; panel < 5; panel++) {
    const v = 0.7 + panel * 1.1;
    box('balcony-glass-panel-' + panel, -1.065, -1.04, v, v + 1.083, 3.03, 4.17, fixedGlass, { level: 1 });
    for (const offset of [0.09, 0.55, 0.99]) {
      for (const y of [3.025, 3.14]) {
        balconyFixings.box(...point(-1.113, y, v + offset), ...point(-1.089, y + 0.033, v + offset + 0.033));
      }
    }
  }
  mesh('balcony-glass-fixings', fixedMetal, undefined, undefined, 1, balconyFixings);
  box('balcony-handrail', -1.095, -1.01, 0.68, 6.2, 4.15, 4.19, fixedMetal, { level: 1 });
  const water = new PBRMaterial('pool-water-preview', scene);
  water.albedoColor = Color3.FromHexString('#619eaf');
  water.roughness = 0.21;
  water.metallic = 0;
  box('rear-pool-water', 25.51, 30.2, 5.7, 8.68, -0.48, -0.15, water);
  for (const [name, a, b, c, d] of [
    ['near', 25.3, 25.51, 5.48, 8.9], ['far', 30.2, 30.42, 5.48, 8.9],
    ['left', 25.51, 30.2, 5.48, 5.7], ['right', 25.51, 30.2, 8.68, 8.9],
  ]) box('pool-coping-' + name, a, b, c, d, -0.28, 0, paving);
  for (const [name, a, b, c, d] of [
    ['outer-left', 25.3, 31.85, 0.9, 5.48], ['outer-right', 25.3, 31.85, 8.9, 9.82],
    ['outer-end', 30.42, 31.85, 5.48, 8.9],
  ]) box('pool-surround-' + name, a, b, c, d, -0.16, -0.025, paving);
  function guard(name, a, b, c, d, y, level, height = 1.08) {
    box(name + '-glass', a, b, c, d, y + 0.09, y + height, fixedGlass, { level });
    box(name + '-rail', a - 0.012, b + 0.012, c - 0.012, d + 0.012, y + height, y + height + 0.035, fixedMetal, { level });
    for (const [i, u, v] of [[0, a, c], [1, b, d]]) {
      box(name + '-post-' + i, u - 0.023, u + 0.023, v - 0.023, v + 0.023, y, y + height, fixedMetal, { level });
    }
  }
  guard('pool-deck-barrier', 25.28, 25.32, 6.21, 8.72, -0.025);
  guard('pool-deck-gate', 25.28, 25.32, 5.43, 6.19, -0.025);
  guard('pool-side-barrier', 25.3, 31.8, 5.39, 5.43, -0.025);
  guard('pool-boundary-return', 31.77, 31.81, 5.41, 9.77, -0.025);
  guard('upper-void-guard', 0.05, 3.44, mediaRight - 0.06, mediaRight - 0.02, 3.12, 1);
  guard('upper-stair-guard', 13.35, 16.42, 4.08, 4.12, 3.12, 1);

  for (let i = 0; i < 18; i++) {
    const u = 13.33 + (i < 9 ? i : 17 - i) * 0.25;
    const v = i < 9 ? 2.25 : 3.16;
    const y = (i + 1) * 3.12 / 18;
    box('stair-tread-' + (i + 1), u, u + 0.27, v, v + 0.89, y - 0.16, y, IM.oak, { level: 0 });
  }
  box('stair-landing', 15.58, 16.43, 2.25, 4.05, 1.43, 1.56, IM.oak, { level: 0 });
  for (const [i, u, y] of [[0, 13.36, 0.18], [1, 14.44, 0.92], [2, 15.55, 1.57]]) {
    box('stair-handrail-post-' + i, u - 0.022, u + 0.022, 2.24, 2.28, y, y + 0.89, fixedMetal, { level: 0 });
  }
  const stairRail = new Geo();
  stairRail.box(...point(13.33, 1.06, 2.226), ...point(15.59, 1.1, 2.294));
  for (let i = 0; i < stairRail.p.length; i += 3) stairRail.p[i + 1] += (stairRail.p[i + 2] - 2.28) * 0.63;
  mesh('stair-handrail', fixedMetal, undefined, undefined, 0, stairRail);

  const fit = (name, u, v, w, d, y, h, material, int, level = 0) =>
    box(name, u, u + w, v, v + d, y, y + h, material, { int, level });
  for (const [name, u, v, w, d, level] of [
    ['guest-bed', 7.25, 1.25, 2.05, 1.54, 0], ['bed2', 11.25, 6.34, 2.05, 1.55, 1],
    ['bed3', 4.05, 6.38, 2.05, 1.45, 1], ['bed4', 6.37, 1.19, 2.05, 1.55, 1],
    ['master-bed', 19.25, 1.18, 1.88, 2.08, 1], ['living-sofa', 18.35, 2.13, 2.85, 0.92, 0],
    ['media-sofa', 0.65, 4.7, 2.85, 0.9, 1], ['dining-table', 19.55, 6.1, 1.03, 1.98, 0],
  ]) {
    const y = levels[level].base;
    fit(name, u, v, w, d, y + 0.11, 0.36, IM.oak, undefined, level);
    fit(name + '-top', u + 0.03, v + 0.03, w - 0.06, d - 0.06, y + 0.47, 0.15, IM.fabricSofa, undefined, level);
  }
  const fitout = createCampFitout({ scene, shadows, IM, S, point, doors: doorOpenings, windows });
  const glow = box('entry-light-preview', 3.39, 3.44, 7.8, 7.96, 2.1, 2.23, M.glassFrosted);
  glow.setEnabled(false);
  const lights = [[18.5, 2.4, 4.5], [11, 2.4, 5], [19.7, 5.35, 3], [3.2, 5.35, 3.8]].map(
    (p, i) => {
      const l = new PointLight('camp-hill-room-light-' + i, vec(...p), scene);
      l.diffuse = new Color3(1, 0.87, 0.72);
      l.intensity = 0.42;
      l.range = 8;
      return l;
    });
  function refreshCutaway() {
    roofs.forEach((m) => { m.isVisible = !inside; });
    floors[1].forEach((m) => { m.isVisible = !inside || floor === 1; });
    walls.forEach((m) => { m.visibility = inside ? 0.32 : 1; });
    fitout.showUpper(!inside || floor === 1);
  }
  const house = {
    entryOpening, glow, lightSpots: [[2.9, 2.25, -7.68], [3.9, 2.23, 11]],
    anchors: {
      roof: vec(8, 6.34, 4.2), gutter: vec(2, 5.65, 0.55), fascia: vec(0.05, 5.68, 8.99),
      downpipe: vec(0, 1.6, 0.65), cladding: vec(0, 4.52, 5.93), flashing: vec(0, 6.85, 4.8),
      render: vec(3.42, 1.74, 8.4), bricks: vec(1.8, 1.3, 0), trim: vec(0, 5.36, 2.8),
      frame: vec(0, 4.6, 3.55), garage: vec(0, 1.02, 3), driveway: vec(-2.9, -0.34, 3),
      entry: vec(3.35, 1.45, 7.06),
    },
    setTransparent(on) { inside = on; refreshCutaway(); },
    showFloor(level) { floor = level; refreshCutaway(); },
    getFloor() { return floor; },
    setWindowExtras(options) {
      for (const { slider, flyscreen, barrier, boutique } of extras) {
        flyscreen.setEnabled(options.flyscreen);
        barrier.setEnabled(options.barrier);
        boutique.setEnabled(options.boutique === 'both' || options.boutique === (slider ? 'slider' : 'window'));
      }
    },
    setInfill(kind) { if (infill) infill.material = kind === 'brick' ? M.bricks : M.cladding; },
  };
  let pending = Promise.resolve();
  const interior = {
    async buildAll(state) {
      for (const { key } of INTERIOR_CATEGORIES) S[key] = resolveAll(key, state[key] || {});
      await applyMaterials();
      fitout.rebuild();
      refreshCutaway();
    },
    apply(key, selection) {
      pending = pending.catch(console.error).then(async () => {
        S[key] = resolveAll(key, selection);
        await applyMaterials();
        fitout.rebuild(key);
        refreshCutaway();
      });
      return pending;
    },
    setMood(dusk) { lights.forEach((light) => { light.intensity = dusk ? 1.6 : 0.42; }); },
    setTransparent() {},
  };
  return { house, interior };
}
