import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, ContactShadows, Html, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { priceFor, formatPrice } from '../../data/pricing';

const MODEL_URL = '/models/jimkeg_v3.glb?v=8';

const FINISHES = {
  black: { label: 'Negro Stealth', color: '#1a1c21', roughness: 0.92, keepMap: false },
  camo: { label: 'Camuflaje Urbano', color: '#ffffff', roughness: 0.88, keepMap: true },
};

// Ficha de cada pieza (datos alineados con AnatomySection)
const PARTS = {
  cap: { num: '01', title: 'Tapa táctica', tag: 'Flip-lock antifugas', text: 'Apertura rápida a una mano con bloqueo y boquilla protegida contra el polvo. Asa en D para colgarla o llevarla con un dedo.' },
  cord: { num: '02', title: 'Paracord', tag: 'Cordón trenzado', text: 'Asegura la tapa al cuello de la botella para que no se pierda y añade un punto de agarre extra.' },
  body: { num: '03', title: 'Cuerpo Tritán 2,2 L', tag: 'BPA & BPS free', text: 'Capacidad de 74 oz. No retiene sabores ni olores tras batidos o suplementos.' },
  sleeve: { num: '04', title: 'Funda neopreno 5 mm', tag: 'Aislante · MOLLE', text: 'Aislamiento térmico y anticondensación. Amortigua impactos y mantiene el agua fresca durante horas.' },
  phone: { num: '05', title: 'Bolsillo smartphone', tag: 'Hasta 6,7"', text: 'Bolsillo frontal para móviles de gran formato. Lleva móvil, llaves y pase del gimnasio sin mochila.' },
  strap: { num: '06', title: 'Correa de hombro', tag: 'Ajustable', text: 'Correa ajustable con almohadilla acolchada y mosquetones para engancharla a las anillas de la funda.' },
};

// Desarme escalonado: cada pieza se mueve en su ventana del progreso global [a, b]
const EXPLODE = {
  cap: { to: [0, 1.75, 0], win: [0, 0.5], spin: 0.6 },
  // Colgado del asa: sube y gira con la tapa, luego se suelta y queda de frente a la derecha
  cord: { win: [0.5, 0.85], to: [1.3, 1.85, 0.06], toEulerBlender: [THREE.MathUtils.degToRad(-95), 0, 0], toScale: 0.95 },
  body: { to: [0, 1.25, 0], win: [0.2, 0.7] },
  // Sube recto fuera del bolsillo y luego se aparta; empieza cuando el cuerpo ya libero el hombro
  phone: { to: [-1.05, 0.15, 0.35], via: [0, 1.0, 0.12], win: [0.35, 1] },
  // Enganchada a las anillas al armar. Al desarmar: se suelta (morph), avanza por el suelo,
  // se desliza a la derecha por delante de la funda y se levanta de frente
  strap: { win: [0.45, 1], fwd: [0, 0, 1.0], side: [1.2, 0, 0.92], up: [1.35, 1.185, -0.18], tilt: THREE.MathUtils.degToRad(78), shrink: 0.28 },
};
// glTF convierte Z-arriba (Blender) a Y-arriba: una rotacion de Blender R pasa a C·R·C^-1
const Y_UP = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const fromBlender = ([x, y, z]) => Y_UP.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z))).multiply(Y_UP.clone().invert());
const CORD_TO_QUAT = fromBlender(EXPLODE.cord.toEulerBlender);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

const SCALE_ASSEMBLED = 1.5;
const SCALE_EXPLODED = 1.0;
const FLOOR_Y = -1.4;
const MODEL_BOTTOM = -0.745;
// Angulo vertical fijo: el arrastre vertical queda libre para desarmar en tactil
const POLAR = Math.PI * 0.46;
const CAM_HOME = new THREE.Vector3().setFromSphericalCoords(7.2, POLAR, 0.083);
const TARGET_HOME = new THREE.Vector3(0, 0, 0);
const AMBER = new THREE.Color('#f59e0b');

const smooth = (x) => {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const windowed = (p, [a, b]) => smooth((p - a) / (b - a));

function classify(name) {
  const n = (name || '').toLowerCase();
  for (const k of ['phone', 'cord', 'cap', 'sleeve', 'strap', 'body']) if (n.includes(k)) return k;
  return null;
}

function BottleModel({ activeColor, progressRef, hovered, selected, onHover, onSelect, focusRef, onReady }) {
  const { scene } = useGLTF(MODEL_URL, true);
  const model = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef();
  const size = useThree((s) => s.size);

  // Solo lectura: StrictMode puede llamar esto dos veces
  const { parts, byKind } = useMemo(() => {
    const parts = [];
    const byKind = {};
    model.traverse((o) => {
      if (!o.isMesh) return;
      const kind = classify(o.name) || classify(o.parent?.name);
      if (!kind) return;
      o.userData.kind = kind;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const entry = {
        node: o, kind, base: o.position.clone(), rotX: o.rotation.x,
        baseQuat: o.quaternion.clone(), baseScale: o.scale.x, box: o.geometry.boundingBox.clone(),
      };
      parts.push(entry);
      // La correa trae dos mallas (cinta y mosquetones): se enfoca la primera, la cinta
      if (!byKind[kind]) byKind[kind] = entry;
    });
    return { parts, byKind };
  }, [model]);

  // Materiales: una sola vez por malla (marcada), aunque el efecto se repita
  useLayoutEffect(() => {
    for (const { node: o, kind } of parts) {
      if (o.userData.prepared) continue;
      o.userData.prepared = true;
      o.castShadow = true;
      o.receiveShadow = true;
      if (kind === 'body') {
        // Vidrio ahumado por opacidad: el fondo ambar es CSS y la transmision no lo ve
        o.material = new THREE.MeshPhysicalMaterial({
          color: '#3a4552', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.36,
          clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, depthWrite: false,
        });
        o.renderOrder = 2;
        continue;
      }
      // Material propio por pieza para poder resaltarla sin afectar a otras
      o.material = o.material.clone();
      if (kind === 'sleeve') {
        o.userData.camoMap = o.material.map;
        o.material.sheen = 0.4;
        o.material.sheenRoughness = 0.4;
        o.material.sheenColor = new THREE.Color('#9aa6b8');
      } else if (kind === 'phone') {
        o.material.color = new THREE.Color('#3a3d42');
        o.material.roughness = 0.45;
      } else if (kind === 'cap') {
        o.material.color = new THREE.Color('#aab2c0');
      }
    }
    onReady();
  }, [parts, onReady]);

  useLayoutEffect(() => {
    const node = byKind.sleeve?.node;
    if (!node) return;
    const m = node.material;
    const f = FINISHES[activeColor] || FINISHES.black;
    m.map = f.keepMap ? node.userData.camoMap : null;
    m.color = new THREE.Color(f.color);
    m.roughness = f.roughness;
    m.needsUpdate = true;
  }, [activeColor, byKind]);

  // Resalte ambar sutil de la pieza seleccionada o bajo el cursor
  useEffect(() => {
    for (const p of parts) {
      const m = p.node.material;
      m.emissive = AMBER;
      m.emissiveIntensity = p.kind === selected ? 0.07 : p.kind === hovered ? 0.035 : 0;
    }
  }, [parts, hovered, selected]);

  // Centro en mundo de una pieza, para el vuelo de camara y la etiqueta
  const tmpBox = useMemo(() => new THREE.Box3(), []);
  const centerOf = useCallback((kind, out) => {
    const p = byKind[kind];
    if (!p) return null;
    tmpBox.copy(p.box).applyMatrix4(p.node.matrixWorld);
    return tmpBox.getCenter(out);
  }, [byKind, tmpBox]);
  useEffect(() => { focusRef.current = centerOf; }, [centerOf, focusRef]);

  const labelRef = useRef();
  const tmpV = useMemo(() => new THREE.Vector3(), []);
  const tmpTo = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const smoothP = useRef(0);

  useFrame((_, delta) => {
    smoothP.current = THREE.MathUtils.damp(smoothP.current, progressRef.current, 7, delta);
    const p = smoothP.current;
    for (const part of parts) {
      const cfg = EXPLODE[part.kind];
      if (!cfg) continue;
      const k = windowed(p, cfg.win);

      if (part.kind === 'cap') part.node.rotation.y = cfg.spin * k;

      if (part.kind === 'cord') {
        // Tramo 1: atado a la tapa (misma subida y giro sobre el eje de la botella)
        const kc = windowed(p, EXPLODE.cap.win);
        const spin = EXPLODE.cap.spin * kc;
        tmpQ.setFromAxisAngle(AXIS_Y, spin);
        tmpV.copy(part.base).applyQuaternion(tmpQ);
        tmpV.y += EXPLODE.cap.to[1] * kc;
        part.node.quaternion.copy(tmpQ).multiply(part.baseQuat);
        // Tramo 2: se suelta hacia su sitio
        tmpV.lerp(tmpTo.fromArray(cfg.to), k);
        part.node.position.copy(tmpV);
        part.node.quaternion.slerp(CORD_TO_QUAT, k);
        part.node.scale.setScalar(THREE.MathUtils.lerp(part.baseScale, cfg.toScale, k));
        continue;
      }

      if (part.kind === 'strap') {
        const t = THREE.MathUtils.clamp((p - cfg.win[0]) / (cfg.win[1] - cfg.win[0]), 0, 1);
        const fall = smooth(t / 0.2);
        const f1 = smooth((t - 0.2) / 0.25);
        const f2 = smooth((t - 0.45) / 0.25);
        const f3 = smooth((t - 0.7) / 0.3);
        const { fwd, side, up } = cfg;
        part.node.position.set(
          part.base.x + fwd[0] * f1 + (side[0] - fwd[0]) * f2 + (up[0] - side[0]) * f3,
          part.base.y + fwd[1] * f1 + (side[1] - fwd[1]) * f2 + (up[1] - side[1]) * f3,
          part.base.z + fwd[2] * f1 + (side[2] - fwd[2]) * f2 + (up[2] - side[2]) * f3,
        );
        part.node.rotation.x = part.rotX + cfg.tilt * f3;
        part.node.scale.setScalar(1 - cfg.shrink * f3);
        if (part.node.morphTargetInfluences) part.node.morphTargetInfluences[0] = fall;
        continue;
      }

      const { to, via } = cfg;
      if (via) {
        const k1 = smooth(k / 0.5);
        const k2 = smooth((k - 0.5) / 0.5);
        part.node.position.set(
          part.base.x + via[0] * k1 + (to[0] - via[0]) * k2,
          part.base.y + via[1] * k1 + (to[1] - via[1]) * k2,
          part.base.z + via[2] * k1 + (to[2] - via[2]) * k2,
        );
      } else {
        part.node.position.set(part.base.x + to[0] * k, part.base.y + to[1] * k, part.base.z + to[2] * k);
      }
    }
    const g = groupRef.current;
    if (g) {
      // En pantallas angostas se achica para que quepa a lo ancho (armado y desarmado)
      const aspect = size.width / size.height;
      const assembled = Math.min(SCALE_ASSEMBLED, SCALE_ASSEMBLED * aspect / 0.62);
      const exploded = Math.min(SCALE_EXPLODED, SCALE_EXPLODED * aspect / 0.85);
      const s = THREE.MathUtils.lerp(assembled, exploded, smooth(p));
      g.scale.setScalar(s);
      g.position.y = FLOOR_Y - MODEL_BOTTOM * s;
    }
    if (labelRef.current && hovered && hovered !== selected && centerOf(hovered, tmpV)) {
      labelRef.current.position.copy(tmpV);
    }
  });

  const kindOf = (e) => e.object?.userData?.kind || null;
  const label = hovered && hovered !== selected ? PARTS[hovered] : null;

  return (
    <>
      <group ref={groupRef}>
        <primitive
          object={model}
          onPointerMove={(e) => {
            e.stopPropagation();
            const k = kindOf(e);
            if (k !== hovered) onHover(k);
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            const k = kindOf(e);
            if (k) onSelect(k);
          }}
        />
      </group>
      {/* Siempre montada: desmontar Html de drei en pleno render rompe React 19 */}
      <group ref={labelRef}>
        <Html center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div className="viewer-hover-label" style={{ visibility: label ? 'visible' : 'hidden' }}>
            <span>{label?.num}</span>
            {label?.title}
          </div>
        </Html>
      </group>
    </>
  );
}

// Vuelo de camara hacia la pieza enfocada; vuelve a casa al soltar
function CameraRig({ focusKind, focusRef, flyRef }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);
  const goalCam = useMemo(() => new THREE.Vector3(), []);
  const sph = useMemo(() => new THREE.Spherical(), []);

  useEffect(() => {
    if (!controls) return undefined;
    // Si el usuario arrastra, se cancela el vuelo
    const stop = () => { flyRef.current = false; };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls, flyRef]);

  // Cada cambio de pieza (o vuelta a casa) arranca el vuelo: evita la carrera con un cuadro
  // que aun ve la seleccion anterior y da el vuelo por terminado
  useEffect(() => { flyRef.current = true; }, [focusKind, flyRef]);

  useFrame((_, delta) => {
    if (!controls || !flyRef.current) return;
    if (focusKind && focusRef.current?.(focusKind, goalTarget)) {
      // Mantiene el azimut actual y el angulo fijo, a 3.4 de la pieza
      sph.setFromVector3(goalCam.copy(camera.position).sub(controls.target));
      goalCam.setFromSphericalCoords(3.4, POLAR, sph.theta).add(goalTarget);
    } else {
      goalTarget.copy(TARGET_HOME);
      goalCam.copy(CAM_HOME);
    }
    const a = 1 - Math.exp(-4 * delta);
    controls.target.lerp(goalTarget, a);
    camera.position.lerp(goalCam, a);
    controls.update();
    if (!focusKind && camera.position.distanceTo(goalCam) < 0.02) flyRef.current = false;
  });
  return null;
}

export default function JimkegViewer({ activeColor = 'black', onColorChange = () => {}, onClose = () => {}, onBuy = () => {}, initialPart = null }) {
  const progressRef = useRef(0);
  const focusRef = useRef(null);
  const flyRef = useRef(false);
  const controlsRef = useRef();
  const rootRef = useRef();
  const closeRef = useRef();
  const touchY = useRef(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  const setProgress = useCallback((v) => {
    progressRef.current = THREE.MathUtils.clamp(v, 0, 1);
  }, []);

  const select = useCallback((kind) => {
    setSelected(kind);
    setAutoRotate(false);
    flyRef.current = true;
    if (kind && kind !== 'sleeve') setProgress(1);
  }, [setProgress]);

  const closeCard = useCallback(() => {
    setSelected(null);
    flyRef.current = true;
  }, []);

  // Abre enfocado en una pieza si se pidio desde la seccion
  useEffect(() => {
    if (ready && initialPart && PARTS[initialPart]) select(initialPart);
  }, [ready, initialPart, select]);

  // Rueda: desarma/rearma. Ctrl+rueda (pellizco de trackpad) se deja para el zoom
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();
      setProgress(progressRef.current + e.deltaY * 0.0011);
    };
    el.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', onWheel, { capture: true });
  }, [setProgress]);

  // Teclado: Esc cierra, flechas desarman
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setProgress(progressRef.current + 0.1);
      if (e.key === 'ArrowUp') setProgress(progressRef.current - 0.1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [onClose, setProgress]);

  // Tactil: deslizar en vertical desarma (la orbita queda solo horizontal)
  const onPointerDown = (e) => {
    setAutoRotate(false);
    if (e.pointerType === 'touch') touchY.current = e.clientY;
  };
  const onPointerMove = (e) => {
    if (e.pointerType !== 'touch' || touchY.current === null) return;
    const dy = touchY.current - e.clientY;
    touchY.current = e.clientY;
    setProgress(progressRef.current + dy * 0.0035);
  };
  const onPointerUp = () => { touchY.current = null; };

  const zoom = (factor) => {
    const c = controlsRef.current;
    if (!c) return;
    flyRef.current = false;
    const cam = c.object;
    const offset = cam.position.clone().sub(c.target);
    const dist = THREE.MathUtils.clamp(offset.length() * factor, c.minDistance, c.maxDistance);
    cam.position.copy(c.target).add(offset.setLength(dist));
    c.update();
  };

  const card = selected ? PARTS[selected] : null;
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  return (
    <div className="viewer-modal" role="dialog" aria-modal="true" aria-label="Visor 3D JIMKEG" data-lenis-prevent>
      <div
        ref={rootRef}
        className="jimkeg-viewer is-amber"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: hovered ? 'pointer' : undefined }}
      >
        <Canvas
          shadows
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          camera={{ position: CAM_HOME.toArray(), fov: 38 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          onPointerMissed={() => { if (selected) closeCard(); }}
        >
          {/* Estudio ambar de marca */}
          <ambientLight intensity={0.3} color="#f3e4cf" />
          <hemisphereLight args={['#fff4e6', '#3a2410', 0.3]} />
          <directionalLight position={[4, 9, 6]} intensity={1.6} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0001} />
          {/* luz frontal: sin ella la cara visible queda en sombra */}
          <directionalLight position={[0.5, 2.5, 8]} intensity={1.1} color="#fff1dd" />
          <directionalLight position={[-6, 3, -4]} intensity={1.3} color="#ffb347" />
          <directionalLight position={[6, 3, -4]} intensity={0.9} color="#cfd8e8" />
          <directionalLight position={[-4, 1, 4]} intensity={0.5} color="#f59e0b" />
          <Environment resolution={256}>
            <Lightformer intensity={0.9} position={[0, 1.5, 6]} scale={[8, 5, 1]} color="#fff4e6" />
            <Lightformer intensity={1.0} position={[0, 5, 3]} scale={[7, 2, 1]} color="#fff4e6" />
            <Lightformer intensity={1.4} position={[-5, 2, -1]} rotation={[0, Math.PI / 3, 0]} scale={[2, 6, 1]} color="#ffb347" />
            <Lightformer intensity={1.1} position={[5, 2, 1]} rotation={[0, -Math.PI / 3, 0]} scale={[3, 6, 1]} color="#eef3fa" />
            <Lightformer intensity={0.35} position={[0, -4, 2]} scale={[7, 2, 1]} color="#7a4a12" />
          </Environment>

          <Suspense fallback={null}>
            <BottleModel
              onReady={markReady}
              activeColor={activeColor}
              progressRef={progressRef}
              hovered={hovered}
              selected={selected}
              onHover={setHovered}
              onSelect={select}
              focusRef={focusRef}
            />
            <ContactShadows position={[0, FLOOR_Y, 0]} opacity={0.55} scale={11} blur={2.8} far={4} resolution={1024} color="#000000" />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate && !selected}
            autoRotateSpeed={0.7}
            enablePan={false}
            enableZoom
            minDistance={3}
            maxDistance={11}
            minPolarAngle={POLAR}
            maxPolarAngle={POLAR}
            makeDefault
          />
          <CameraRig focusKind={selected} focusRef={focusRef} flyRef={flyRef} />
        </Canvas>

        {!ready && <div className="viewer-loading viewer-loading-center" role="status">Cargando modelo 3D…</div>}

        <div className="viewer-overlay">
          <div className="viewer-topbar">
            <div className="viewer-finishes">
              {Object.entries(FINISHES).map(([key, f]) => (
                <button
                  key={key}
                  type="button"
                  className={`viewer-finish-btn${activeColor === key ? ' is-active' : ''}`}
                  onClick={() => onColorChange(key)}
                >
                  <span className="viewer-finish-dot" style={{ background: key === 'camo' ? 'linear-gradient(135deg,#e8ecef,#6b7278)' : '#14161b' }} />
                  {f.label}
                </button>
              ))}
            </div>
            <div className="viewer-actions">
              <button ref={closeRef} type="button" className="viewer-action-btn viewer-close" aria-label="Cerrar visor" onClick={onClose}>✕</button>
            </div>
          </div>

          <div className="viewer-zoom">
            <button type="button" className="viewer-action-btn" aria-label="Acercar" onClick={() => zoom(0.85)}>+</button>
            <button type="button" className="viewer-action-btn" aria-label="Alejar" onClick={() => zoom(1.18)}>−</button>
            <button type="button" className="viewer-action-btn" aria-label="Volver a la vista inicial" onClick={() => { closeCard(); setProgress(0); setAutoRotate(true); }}>⟲</button>
          </div>

          {card && (
            <aside className="viewer-card" aria-live="polite">
              <span className="viewer-card-num">{card.num} · {card.tag}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <div className="viewer-card-actions">
                <button type="button" className="viewer-action-btn" onClick={closeCard}>Cerrar ficha</button>
              </div>
            </aside>
          )}

          <div className="viewer-bottombar">
            <span className="viewer-hint">
              {isMobile ? 'Desliza arriba para desarmar · gira con el dedo · toca una pieza' : 'Rueda para desarmar · arrastra para girar · clic en una pieza'}
            </span>
            <button type="button" className="viewer-buy-btn" onClick={onBuy}>
              <span>Comprar ahora</span>
              <small>{FINISHES[activeColor]?.label || FINISHES.black.label} · desde {formatPrice(priceFor(1))}</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
