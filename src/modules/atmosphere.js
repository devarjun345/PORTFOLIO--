import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { prefersReducedMotion } from '../lib/motion.js';

/* ---------------------------------------------------------------------------
   Backdrop: a tokamak fusion reactor. Thousands of plasma particles spiral
   along helical magnetic field lines inside a ring of coils. Scrolling ignites
   the plasma (it tightens and burns brighter), and the energy escapes the core
   as a glowing cloud network of nodes, links and data packets. Below it, a
   datacenter grid recedes to the horizon. Post: bloom, anamorphic streak,
   chromatic aberration, vignette and film grain.
--------------------------------------------------------------------------- */

const NOISE = /* glsl */ `
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.,0.)), c = hash(i + vec2(0.,1.)), d = hash(i + vec2(1.,1.));
    vec2 u = f * f * (3. - 2. * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1. - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.02; a *= .5; } return v; }
`;


// A five-colour palette shared by plasma, nodes, packets and dust: cyan, violet, pink, orange, green.
const PALETTE = /* glsl */ `
  vec3 pal(float t){
    t = fract(t) * 5.;
    vec3 c0 = vec3(.13, .89, 1.), c1 = vec3(.55, .48, 1.), c2 = vec3(1., .31, .64), c3 = vec3(1., .54, .24), c4 = vec3(.21, .9, .63);
    if (t < 1.) return mix(c0, c1, t);
    if (t < 2.) return mix(c1, c2, t - 1.);
    if (t < 3.) return mix(c2, c3, t - 2.);
    if (t < 4.) return mix(c3, c4, t - 3.);
    return mix(c4, c0, t - 4.);
  }
`;

// Where a core particle sits at a given release amount. Shared by nodes, links and packets.
const DISP = /* glsl */ `
  vec3 disp(vec3 base, vec3 dir, float s, float split, float t){
    vec3 p = base + dir * split * (0.9 + 3.6 * s);
    p += 0.05 * vec3(sin(t * 1.7 + s * 40.), cos(t * 1.3 + s * 31.), sin(t * 1.1 + s * 17.)) * (1. + split * 2.);
    return p;
  }
`;

const BACKDROP_FRAG = /* glsl */ `
  ${PALETTE}
  uniform float uTime, uAspect, uPulse, uIgnite;
  uniform vec2 uMouse;
  uniform vec3 uTint;
  varying vec2 vUv;
  ${NOISE}
  void main(){
    vec2 p = vUv * 2. - 1.;
    p.x *= uAspect;

    // plasma haze around the reactor
    vec2 c = vec2(uAspect * .55 + uMouse.x * .1, .05);
    float n = fbm(p * 1.1 + vec2(uTime * .02, -uTime * .015));
    float d = length((p - c) * vec2(1., 1.35));
    vec3 haze = mix(mix(vec3(.12, .09, .42), vec3(.04, .32, .5), n), uTint * .6, .3) * exp(-d * 1.15) * n * 1.6;
    vec3 haze2 = pal(.3 + uTime * .012) * exp(-length((p - vec2(-uAspect * .55, -.15)) * vec2(1., 1.3)) * 1.25) * fbm(p * 1.3 + 7. + uTime * .02) * .6;
    vec3 haze3 = pal(.75 + uTime * .01) * exp(-length((p - vec2(uAspect * .05, .75)) * vec2(.9, 1.5)) * 1.4) * fbm(p * 1.5 + 3. - uTime * .015) * .45;
    haze += haze2 + haze3;
    haze *= .55 + uIgnite * .35 + uPulse * .6;

    // datacenter floor: a perspective grid that recedes to the horizon
    float horizon = .4;
    float fy = horizon - vUv.y;
    vec3 col = haze;
    if (fy > 0.) {
      float z = .16 / max(fy, .002);
      vec2 gp = vec2((vUv.x - .5) * uAspect * z * 1.1 + .5, z - uTime * .7);
      vec2 f = abs(fract(gp) - .5);
      float line = smoothstep(.488, .5, max(f.x, f.y));
      float fade = smoothstep(.03, .24, fy) * (1. - smoothstep(.16, .4, fy) * .75);
      col += mix(vec3(.1, .55, .75), uTint, .65) * line * fade * .55;
      col += uTint * fade * .04;
    }
    col += mix(vec3(.25, .45, 1.), uTint, .7) * exp(-abs(fy) * 45.) * .22 * (.7 + uIgnite * .3);
    gl_FragColor = vec4(col, 1.);
  }
`;

const GLOW_FRAG = /* glsl */ `
  varying vec3 vCol;
  varying float vA;
  void main(){
    float d = length(gl_PointCoord - .5);
    float a = smoothstep(.5, 0., d);
    a *= a;
    gl_FragColor = vec4(vCol * a * vA, a * vA);
  }
`;

// plasma: helical field-line particles inside the torus
const PLASMA_VERT = /* glsl */ `
  ${PALETTE}
  attribute vec4 aP;
  uniform float uTime, uIgnite, uSize, uPulse, uFade;
  varying vec3 vCol;
  varying float vA;
  void main(){
    float speed = (.22 + aP.w * .5) * (1. + uIgnite * 1.6);
    float th = aP.x + uTime * speed;
    float heat = 1. - aP.z;
    float rr = .52 * (.12 + .88 * aP.z) * mix(1., .6, uIgnite);
    float ph = aP.y + th * 3. + uTime * .5;
    vec3 p = vec3((1.6 + rr * cos(ph)) * cos(th), rr * sin(ph), (1.6 + rr * cos(ph)) * sin(th));
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (.4 + heat * 1.0) / -mv.z * (1. + uIgnite * .2 + uPulse * .3);
    vec3 outer = pal(aP.x / 6.28318 + uTime * .02);
    vec3 inner = mix(pal(aP.x / 6.28318 + .5 + uTime * .02), vec3(.8, .97, 1.), .3);
    vCol = mix(outer, inner, heat);
    vCol = mix(vCol, vec3(.85, 1., 1.), heat * heat * uIgnite * .45);
    vA = (.22 + .6 * heat) * (.6 + .4 * uIgnite) * uFade;
  }
`;

const NODE_VERT = /* glsl */ `
  ${PALETTE}
  attribute vec3 aDir;
  attribute float aSeed;
  uniform float uTime, uSplit, uSize, uPulse;
  varying vec3 vCol;
  varying float vA;
  ${DISP}
  void main(){
    vec3 p = disp(position, aDir, aSeed, uSplit, uTime);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    float pulse = .85 + .15 * sin(uTime * 2. + aSeed * 20.);
    gl_PointSize = uSize * (.7 + aSeed * .8) * pulse / -mv.z * (1. + uPulse * .6);
    vCol = pal(fract(aSeed * 7.31));
    vA = 1.;
  }
`;

const LINK_VERT = /* glsl */ `
  attribute vec3 aDir;
  attribute float aSeed;
  uniform float uTime, uSplit;
  varying float vA;
  ${DISP}
  void main(){
    vec3 p = disp(position, aDir, aSeed, uSplit, uTime);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
    vA = uSplit * uSplit * .7;
  }
`;
const LINK_FRAG = /* glsl */ `uniform vec3 uTint; varying float vA; void main(){ vec3 c = mix(vec3(.4, .85, 1.), uTint, .7); gl_FragColor = vec4(c * vA, vA); }`;

const PACKET_VERT = /* glsl */ `
  ${PALETTE}
  attribute vec3 aBaseA; attribute vec3 aDirA; attribute vec3 aBaseB; attribute vec3 aDirB;
  attribute vec2 aSeed; attribute vec2 aMove;
  uniform float uTime, uSplit, uSize;
  varying vec3 vCol;
  varying float vA;
  ${DISP}
  void main(){
    vec3 pa = disp(aBaseA, aDirA, aSeed.x, uSplit, uTime);
    vec3 pb = disp(aBaseB, aDirB, aSeed.y, uSplit, uTime);
    float f = fract(uTime * aMove.x + aMove.y);
    vec3 p = mix(pa, pb, f);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * .8 / -mv.z;
    vCol = mix(pal(aMove.y + uTime * .05), vec3(1.), .35);
    vA = uSplit * uSplit * sin(f * 3.14159);
  }
`;

const DUST_VERT = /* glsl */ `
  ${PALETTE}
  attribute float aSeed;
  attribute vec3 aRand;
  uniform float uTime, uSize, uPulse;
  varying vec3 vCol;
  varying float vA;
  void main(){
    float y = fract(aSeed + uTime * (.02 + aRand.x * .04));
    vec3 pos = position;
    pos.y = mix(-5., 5., y);
    pos.x += sin(uTime * aRand.y * .7 + aSeed * 30.) * .5 * (.3 + y);
    pos.z += cos(uTime * aRand.z * .5 + aSeed * 20.) * .8;
    vec4 mv = modelViewMatrix * vec4(pos, 1.);
    gl_Position = projectionMatrix * mv;
    float flick = .6 + .4 * sin(uTime * (2. + aRand.x * 6.) + aSeed * 50.);
    vA = (1. - y) * smoothstep(0., .08, y) * flick * (.55 + uPulse);
    vCol = mix(pal(aRand.y * 1.7), vec3(1.), .25);
    gl_PointSize = uSize * (.3 + aRand.z) / -mv.z * (1. + uPulse * .8);
  }
`;

const GRADE = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uPulse: { value: 0 }, uDim: { value: 1 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uPulse, uDim;
    varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - .5;
      float d = dot(c, c);
      vec2 off = c * d * (.012 + uPulse * .03);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      // anamorphic streak: horizontal smear of the brightest highlights
      vec3 streak = vec3(0.);
      for (int i = -6; i <= 6; i++) {
        vec3 s = texture2D(tDiffuse, vUv + vec2(float(i) * .012, 0.)).rgb;
        float l = max(max(s.r, s.g), s.b);
        streak += max(vec3(l - .86), 0.) * (1. - abs(float(i)) / 7.);
      }
      col += streak * vec3(.3, .6, 1.) * .28;
      col *= uDim;
      float vig = smoothstep(.95, .18, length(c) * 1.2);
      col *= mix(.45, 1., vig);
      col += (rand(vUv * vec2(1920., 1080.) + fract(uTime) * 100.) - .5) * .05;
      gl_FragColor = vec4(col, 1.);
    }
  `,
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function initAtmosphere() {
  const canvas = document.getElementById('atmosphere');
  if (!canvas) return;

  const lite = window.innerWidth < 768 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x05070d, 1);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.6);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.set(0, 0, 6);

  const U = {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uPulse: { value: 0.55 },    // a flash of plasma ignition when the page opens
    uSplit: { value: 0 },
    uIgnite: { value: 0 },
    uFade: { value: 1 },
    uMouse: { value: new THREE.Vector2() },
    uTint: { value: new THREE.Vector3(0.13, 0.89, 1) },
  };

  // horizon grid and plasma haze (full-screen quad)
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: BACKDROP_FRAG,
      depthTest: false,
      depthWrite: false,
    }),
  );
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  scene.add(backdrop);

  const reactor = new THREE.Group();
  scene.add(reactor);

  // ----- plasma: particles spiralling along magnetic field lines -----
  const PN = lite ? 3500 : 9000;
  const pA = new Float32Array(PN * 4);
  for (let i = 0; i < PN; i++) {
    pA[i * 4] = Math.random() * Math.PI * 2;          // position around the ring
    pA[i * 4 + 1] = Math.random() * Math.PI * 2;      // phase around the field line
    pA[i * 4 + 2] = Math.pow(Math.random(), 0.7);     // distance from the plasma axis (0 = hot core)
    pA[i * 4 + 3] = Math.random();                    // speed variation
  }
  const plasmaGeo = new THREE.BufferGeometry();
  plasmaGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PN * 3), 3));
  plasmaGeo.setAttribute('aP', new THREE.BufferAttribute(pA, 4));
  const plasma = new THREE.Points(plasmaGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uIgnite: U.uIgnite, uPulse: U.uPulse, uFade: U.uFade, uSize: { value: 55 * pixelRatio } },
    vertexShader: PLASMA_VERT, fragmentShader: GLOW_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  plasma.frustumCulled = false;
  reactor.add(plasma);

  // ----- magnetic coils around the vessel -----
  const coilMat = new THREE.LineBasicMaterial({ color: 0x5f78d8, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
  const COILS = 20;
  for (let k = 0; k < COILS; k++) {
    const th = (k / COILS) * Math.PI * 2;
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r = 1.6 + Math.cos(a) * 0.9;
      pts.push(Math.cos(th) * r, Math.sin(a) * 0.9, Math.sin(th) * r);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    reactor.add(new THREE.Line(g, coilMat));
  }

  // ----- fusion core and the cloud it feeds: nodes, links and packets -----
  const N = lite ? 34 : 56;
  const base = new Float32Array(N * 3);
  const dirs = new Float32Array(N * 3);
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection();
    const r = 0.06 + Math.random() * 0.22;
    base.set([v.x * r, v.y * r, v.z * r], i * 3);
    const d = new THREE.Vector3().randomDirection();
    dirs.set([d.x, d.y, d.z], i * 3);
    seeds[i] = Math.random();
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(base, 3));
  nodeGeo.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3));
  nodeGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const nodes = new THREE.Points(nodeGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSplit: U.uSplit, uPulse: U.uPulse, uSize: { value: 170 * pixelRatio } },
    vertexShader: NODE_VERT, fragmentShader: GLOW_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  nodes.frustumCulled = false;
  reactor.add(nodes);

  // link each node to its two nearest neighbours once the core has released its energy
  const splitPos = (i) => {
    const k = 0.9 + 3.6 * seeds[i];
    return new THREE.Vector3(base[i * 3] + dirs[i * 3] * k, base[i * 3 + 1] + dirs[i * 3 + 1] * k, base[i * 3 + 2] + dirs[i * 3 + 2] * k);
  };
  const pts = Array.from({ length: N }, (_, i) => splitPos(i));
  const pairs = new Set();
  const links = [];
  for (let i = 0; i < N; i++) {
    pts.map((p, j) => [j, p.distanceTo(pts[i])]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2).forEach(([j]) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!pairs.has(key)) { pairs.add(key); links.push([i, j]); }
    });
  }
  const lp = new Float32Array(links.length * 6);
  const ld = new Float32Array(links.length * 6);
  const ls = new Float32Array(links.length * 2);
  links.forEach(([a, b], k) => {
    lp.set(base.slice(a * 3, a * 3 + 3), k * 6);
    lp.set(base.slice(b * 3, b * 3 + 3), k * 6 + 3);
    ld.set(dirs.slice(a * 3, a * 3 + 3), k * 6);
    ld.set(dirs.slice(b * 3, b * 3 + 3), k * 6 + 3);
    ls[k * 2] = seeds[a];
    ls[k * 2 + 1] = seeds[b];
  });
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  linkGeo.setAttribute('aDir', new THREE.BufferAttribute(ld, 3));
  linkGeo.setAttribute('aSeed', new THREE.BufferAttribute(ls, 1));
  const linkMesh = new THREE.LineSegments(linkGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSplit: U.uSplit, uTint: U.uTint },
    vertexShader: LINK_VERT, fragmentShader: LINK_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  linkMesh.frustumCulled = false;
  reactor.add(linkMesh);

  // data packets travelling along the links
  const P = links.length * 2;
  const pk = { pos: new Float32Array(P * 3), bA: new Float32Array(P * 3), dA: new Float32Array(P * 3), bB: new Float32Array(P * 3), dB: new Float32Array(P * 3), s: new Float32Array(P * 2), m: new Float32Array(P * 2) };
  for (let k = 0; k < P; k++) {
    const [a, b] = links[k % links.length];
    pk.bA.set(base.slice(a * 3, a * 3 + 3), k * 3);
    pk.dA.set(dirs.slice(a * 3, a * 3 + 3), k * 3);
    pk.bB.set(base.slice(b * 3, b * 3 + 3), k * 3);
    pk.dB.set(dirs.slice(b * 3, b * 3 + 3), k * 3);
    pk.s.set([seeds[a], seeds[b]], k * 2);
    pk.m.set([0.18 + Math.random() * 0.25, Math.random()], k * 2);
  }
  const packetGeo = new THREE.BufferGeometry();
  packetGeo.setAttribute('position', new THREE.BufferAttribute(pk.pos, 3));
  packetGeo.setAttribute('aBaseA', new THREE.BufferAttribute(pk.bA, 3));
  packetGeo.setAttribute('aDirA', new THREE.BufferAttribute(pk.dA, 3));
  packetGeo.setAttribute('aBaseB', new THREE.BufferAttribute(pk.bB, 3));
  packetGeo.setAttribute('aDirB', new THREE.BufferAttribute(pk.dB, 3));
  packetGeo.setAttribute('aSeed', new THREE.BufferAttribute(pk.s, 2));
  packetGeo.setAttribute('aMove', new THREE.BufferAttribute(pk.m, 2));
  const packets = new THREE.Points(packetGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSplit: U.uSplit, uSize: { value: 90 * pixelRatio } },
    vertexShader: PACKET_VERT, fragmentShader: GLOW_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  packets.frustumCulled = false;
  reactor.add(packets);

  // drifting plasma dust
  const count = lite ? 260 : 600;
  const dGeo = new THREE.BufferGeometry();
  const dpos = new Float32Array(count * 3);
  const dseed = new Float32Array(count);
  const drand = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    dpos[i * 3] = (Math.random() - 0.5) * 12;
    dpos[i * 3 + 2] = Math.random() * 6 - 4;
    dseed[i] = Math.random();
    drand.set([Math.random(), Math.random(), Math.random()], i * 3);
  }
  dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  dGeo.setAttribute('aSeed', new THREE.BufferAttribute(dseed, 1));
  dGeo.setAttribute('aRand', new THREE.BufferAttribute(drand, 3));
  const dust = new THREE.Points(dGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPulse: U.uPulse, uSize: { value: 50 * pixelRatio } },
    vertexShader: DUST_VERT, fragmentShader: GLOW_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  dust.frustumCulled = false;
  scene.add(dust);

  // post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.7, 0.1);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GRADE);
  composer.addPass(grade);

  // the page may already have picked an accent before this lazy module loaded
  const tintTarget = new THREE.Vector3(0.13, 0.89, 1);
  const initial = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').split(',').map((n) => Number(n) / 255);
  if (initial.length === 3 && initial.every((n) => Number.isFinite(n))) { tintTarget.set(...initial); U.uTint.value.copy(tintTarget); }
  window.addEventListener('section:tint', (e) => tintTarget.set(...e.detail.rgb));
  const mouse = new THREE.Vector2();
  const mouseTarget = new THREE.Vector2();
  let split = 0;
  let ignite = 0;
  let prevT = 0;

  // Phone browsers resize the viewport whenever the address bar slides away mid-scroll. Rebuilding every render
  // target of the bloom chain on each of those hitches the scroll, so small height-only changes are ignored there.
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let sizeW = 0;
  let sizeH = 0;

  function resize(force = false) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!force && coarse && w === sizeW && Math.abs(h - sizeH) < 160) return;
    sizeW = w;
    sizeH = h;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    U.uAspect.value = w / h;
  }

  function frame(time) {
    const t = time * 0.001;
    const dt = Math.min(0.1, Math.max(0, t - prevT));
    prevT = t;
    U.uTime.value = t;
    grade.uniforms.uTime.value = t;

    mouse.lerp(mouseTarget, 0.04);
    U.uMouse.value.copy(mouse);
    U.uTint.value.lerp(tintTarget, 1 - Math.exp(-dt * 2.5));
    camera.position.x = mouse.x * 0.3;
    camera.position.y = mouse.y * 0.18;
    camera.lookAt(0, 0, 0);

    const vh = window.innerHeight;
    const sy = window.scrollY / vh;
    // ignition arrives first; the cloud network follows
    ignite += (smooth(0.02, 0.8, sy) - ignite) * (1 - Math.exp(-dt * 3));
    split += (smooth(0.35, 1.7, sy) - split) * (1 - Math.exp(-dt * 3));
    const breathing = ignite > 0.8 ? 0.94 + 0.06 * Math.sin(t * 3) : 1;
    U.uIgnite.value = ignite * breathing;
    U.uSplit.value = split;
    U.uFade.value = 1 - 0.55 * smooth(0.9, 1.9, sy);

    const wide = camera.aspect > 1.25;
    const homeX = wide ? 2.2 : 0;
    const homeY = wide ? 0.05 : 1.15;
    reactor.position.x += (homeX * (1 - split * 0.7) - reactor.position.x) * (1 - Math.exp(-dt * 3));
    reactor.position.y += (homeY * (1 - split) - reactor.position.y) * (1 - Math.exp(-dt * 3));
    reactor.position.z = -1.6 - split * 0.6;
    reactor.scale.setScalar((wide ? 1.0 : 0.62) + split * 0.15);
    reactor.rotation.x = 1.05 + mouse.y * 0.12 + sy * 0.15;
    reactor.rotation.z = 0.18;
    reactor.rotation.y = t * 0.08 + window.scrollY * 0.0004;
    coilMat.opacity = 0.28 + ignite * 0.3;

    const pulse = U.uPulse.value * Math.exp(-dt * 2.6);
    U.uPulse.value = pulse < 0.003 ? 0 : pulse;
    grade.uniforms.uPulse.value = U.uPulse.value + ignite * 0.05;
    grade.uniforms.uDim.value = 1 - 0.5 * smooth(0.25, 1.2, sy);
    bloom.strength = 0.7 + U.uPulse.value * 1.2 + ignite * 0.12;

    composer.render();
  }

  // adaptive quality: if the first frames are slow, drop bloom, resolution and particle counts
  let sampled = 0;
  let sampleSum = 0;
  let lastTime = 0;
  let degraded = false;
  function watchPerformance(time) {
    if (degraded || sampled > 90) return;
    if (lastTime) { sampleSum += time - lastTime; sampled++; }
    lastTime = time;
    if (sampled === 90 && sampleSum / sampled > 34) {
      degraded = true;
      bloom.enabled = false;
      renderer.setPixelRatio(1);
      composer.setPixelRatio(1);
      composer.setSize(window.innerWidth, window.innerHeight);
      plasmaGeo.setDrawRange(0, Math.floor(PN * 0.4));
      dGeo.setDrawRange(0, Math.floor(count * 0.4));
    }
  }

  let rafId = 0;
  const loop = (time) => {
    watchPerformance(time);
    frame(time);
    rafId = requestAnimationFrame(loop);
  };

  resize(true);
  window.addEventListener('resize', () => {
    resize();
    if (prefersReducedMotion) frame(2000);
  });
  window.addEventListener('pointermove', (e) => {
    mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  }, { passive: true });

  document.documentElement.classList.add('has-webgl');

  if (prefersReducedMotion) {
    U.uPulse.value = 0;
    frame(2000);
    let queued = false;
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; frame(2000); });
    }, { passive: true });
  } else {
    // a click on empty space pulses the reactor, like the spark burst at the cursor
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea, summary, label, dialog')) return;
      U.uPulse.value = Math.min(1, U.uPulse.value + 0.35);
    }, { passive: true });
    rafId = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(rafId);
      else rafId = requestAnimationFrame(loop);
    });
  }
}
