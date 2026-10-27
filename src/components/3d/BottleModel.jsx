import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createBlackStealthTexture } from '../../textures/proceduralTextures';

const MODEL_URL = '/models/jimkeg_interactive.glb?v=hero1';
const TARGET_HEIGHT = 3.2; // alto normalizado del ensamble en unidades de escena

// Clasifica cada parte del GLB por su nombre de nodo
function classify(name) {
  const n = name.toLowerCase();
  if (n.includes('cap') || n.includes('lid')) return 'cap';
  if (n.includes('paracord') || n.includes('neck')) return 'paracord';
  if (n.includes('tritan') || n.includes('body')) return 'body';
  if (n.includes('sleeve') || n.includes('neoprene')) return 'sleeve';
  if (n.includes('phone') || n.includes('smartphone')) return 'phone';
  if (n.includes('strap')) return 'strap';
  return null;
}

// Desplazamiento vertical (fraccion del alto del modelo) al explotar cada pieza
const EXPLODE_Y = {
  cap: 0.6,
  paracord: 0.32,
  body: 0.05,
  sleeve: -0.3,
  phone: -0.15,
  strap: -0.6,
};
// Empuje lateral extra para separar el movil del cuerpo al explotar
const EXPLODE_Z = { phone: 0.28 };

export default function BottleModel({
  activeColor = 'camo', // 'camo' | 'black'
  explodedProgress = 0, // 0 = armada, 1 = explosionada
  mousePosition = { x: 0, y: 0 },
  activeHotspot = null,
  onHotspotClick = () => {},
  manualRotation = 0,
}) {
  const groupRef = useRef();
  const fitRef = useRef();

  const { scene } = useGLTF(MODEL_URL, true); // true = usa DRACOLoader

  // Clon aislado para no mutar la cache compartida de useGLTF
  const model = useMemo(() => scene.clone(true), [scene]);

  // Textura negra procedural para la variante stealth
  const blackTex = useMemo(() => createBlackStealthTexture(), []);
  useLayoutEffect(() => () => blackTex.dispose(), [blackTex]);

  // Mapa de piezas: ref de nodo, posicion original y offset de explosion
  const parts = useMemo(() => {
    const map = {};
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const kind = classify(o.name) || classify(o.parent?.name || '');
      if (kind && !map[kind]) {
        map[kind] = {
          node: o,
          basePos: o.position.clone(),
          dy: EXPLODE_Y[kind] ?? 0,
          dz: EXPLODE_Z[kind] ?? 0,
        };
      }
    });
    return map;
  }, [model]);

  // Guarda material camo original de la funda y prepara clon para swap
  const sleeveMat = useMemo(() => {
    const s = parts.sleeve?.node;
    if (!s) return null;
    const mat = Array.isArray(s.material) ? s.material[0] : s.material;
    const camoMap = mat.map || null;
    s.material = mat.clone();
    s.material.map = camoMap;
    return { mesh: s, camoMap };
  }, [parts]);

  // Normaliza escala y centra el ensamble una sola vez
  useLayoutEffect(() => {
    if (!fitRef.current) return;
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const h = Math.max(size.y, 1e-4);
    const s = TARGET_HEIGHT / h;
    fitRef.current.scale.setScalar(s);
    // recentrar al origen
    model.position.sub(center);
  }, [model]);

  // Swap de material segun color activo
  useLayoutEffect(() => {
    if (!sleeveMat) return;
    const { mesh, camoMap } = sleeveMat;
    mesh.material.map = activeColor === 'black' ? blackTex : camoMap;
    mesh.material.color.set(activeColor === 'black' ? '#1a1d22' : '#ffffff');
    mesh.material.needsUpdate = true;
  }, [activeColor, sleeveMat, blackTex]);

  // Guardar alto nativo del modelo para escalar los offsets de explosion
  const modelHeight = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    return Math.max(box.getSize(new THREE.Vector3()).y, 1e-4);
  }, [model]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const k = Math.min(delta * 4, 1);

    if (groupRef.current) {
      const targetRotX = mousePosition.y * 0.35 + Math.sin(time * 0.8) * 0.04;
      const targetRotY =
        manualRotation +
        mousePosition.x * 0.6 +
        time * 0.15 * (1 - explodedProgress * 0.8);
      const targetPosY = Math.sin(time * 1.5) * 0.08 - explodedProgress * 0.2;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, k);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, k);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPosY, k);
    }

    // Cinematica de explosion por pieza (en unidades locales del modelo)
    const ek = Math.min(delta * 6, 1);
    for (const key in parts) {
      const p = parts[key];
      const ty = p.basePos.y + p.dy * modelHeight * explodedProgress;
      const tz = p.basePos.z + p.dz * modelHeight * explodedProgress;
      p.node.position.y = THREE.MathUtils.lerp(p.node.position.y, ty, ek);
      p.node.position.z = THREE.MathUtils.lerp(p.node.position.z, tz, ek);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      <group ref={fitRef}>
        <primitive object={model} />
      </group>

      {/* Hotspots interactivos (visibles en vista explosionada) */}
      {explodedProgress > 0.4 && (
        <group>
          <HotspotMarker position={[0.7, 1.9, 0.4]} active={activeHotspot === 1} onClick={() => onHotspotClick(1)} />
          <HotspotMarker position={[-0.8, 1.2, 0.4]} active={activeHotspot === 2} onClick={() => onHotspotClick(2)} />
          <HotspotMarker position={[1.0, 0.2, 0.6]} active={activeHotspot === 3} onClick={() => onHotspotClick(3)} />
          <HotspotMarker position={[-1.1, -1.0, 0.7]} active={activeHotspot === 4} onClick={() => onHotspotClick(4)} />
          <HotspotMarker position={[0.2, -0.9, 1.1]} active={activeHotspot === 5} onClick={() => onHotspotClick(5)} />
        </group>
      )}
    </group>
  );
}

// Baliza 3D pulsante
function HotspotMarker({ position, active, onClick }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
      meshRef.current.scale.set(s, s, s);
    }
  });
  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onClick}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={active ? '#00f0ff' : '#ff7b00'} transparent opacity={0.9} />
      </mesh>
      <mesh onClick={onClick}>
        <ringGeometry args={[0.1, 0.14, 32]} />
        <meshBasicMaterial color={active ? '#00f0ff' : '#ff7b00'} side={THREE.DoubleSide} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
