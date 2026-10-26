import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createCamoTexture,
  createBlackStealthTexture,
  createMeasurementTexture,
  createNeopreneBumpTexture,
} from '../../textures/proceduralTextures';

export default function BottleModel({
  activeColor = 'camo', // 'camo' | 'black'
  explodedProgress = 0, // 0 = normal, 1 = exploded view
  mousePosition = { x: 0, y: 0 },
  activeHotspot = null,
  onHotspotClick = () => {},
  manualRotation = 0,
}) {
  const groupRef = useRef();
  const capRef = useRef();
  const sealRef = useRef();
  const sleeveRef = useRef();
  const innerBottleRef = useRef();
  const liquidRef = useRef();

  // Create procedural textures once
  const { camoTex, blackTex, measureTex, bumpTex } = useMemo(() => {
    return {
      camoTex: createCamoTexture(),
      blackTex: createBlackStealthTexture(),
      measureTex: createMeasurementTexture(),
      bumpTex: createNeopreneBumpTexture(),
    };
  }, []);

  useEffect(() => () => {
    [camoTex, blackTex, measureTex, bumpTex].forEach((texture) => texture.dispose());
  }, [camoTex, blackTex, measureTex, bumpTex]);

  // Frame loop for interactive physics, inertia, liquid sloshing, and exploded offsets
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Natural idle floating + mouse inertia parallax
      const targetRotX = mousePosition.y * 0.35 + Math.sin(time * 0.8) * 0.04;
      const targetRotY =
        manualRotation +
        mousePosition.x * 0.6 +
        time * 0.15 * (1 - explodedProgress * 0.8);
      const targetPosY = Math.sin(time * 1.5) * 0.08 - explodedProgress * 0.2;

      // Smooth lerp damping
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotX,
        delta * 4
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        delta * 4
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetPosY,
        delta * 4
      );
    }

    // Exploded View kinematics
    if (capRef.current) {
      const targetCapY = 1.95 + explodedProgress * 1.8;
      capRef.current.position.y = THREE.MathUtils.lerp(
        capRef.current.position.y,
        targetCapY,
        delta * 6
      );
      capRef.current.rotation.z = THREE.MathUtils.lerp(
        capRef.current.rotation.z,
        explodedProgress * 0.35,
        delta * 5
      );
    }

    if (sealRef.current) {
      const targetSealY = 1.7 + explodedProgress * 0.9;
      sealRef.current.position.y = THREE.MathUtils.lerp(
        sealRef.current.position.y,
        targetSealY,
        delta * 6
      );
    }

    if (sleeveRef.current) {
      const targetSleeveY = -0.15 - explodedProgress * 1.6;
      sleeveRef.current.position.y = THREE.MathUtils.lerp(
        sleeveRef.current.position.y,
        targetSleeveY,
        delta * 5
      );
    }

    // Liquid surface dynamic wave
    if (liquidRef.current) {
      liquidRef.current.rotation.y = time * 0.3;
      liquidRef.current.scale.y = 1 + Math.sin(time * 2.5) * 0.015;
    }
  });

  const sleeveTexture = activeColor === 'camo' ? camoTex : blackTex;

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={[1.15, 1.15, 1.15]}>
      {/* ============================================================ */}
      {/* 1. INNER JUG (Tritan Polymer BPA-Free translucent bottle)    */}
      {/* ============================================================ */}
      <group ref={innerBottleRef}>
        {/* Main cylindrical lower body */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.2, 1.2, 2.9, 64]} />
          <meshPhysicalMaterial
            color="#081018"
            roughness={0.08}
            metalness={0.05}
            transmission={0.88}
            ior={1.48}
            thickness={1.5}
            transparent={true}
            opacity={0.92}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>

        {/* Tapered shoulder transition */}
        <mesh position={[0, 1.65, 0]} castShadow>
          <cylinderGeometry args={[0.55, 1.2, 0.6, 64]} />
          <meshPhysicalMaterial
            color="#081018"
            roughness={0.08}
            metalness={0.05}
            transmission={0.88}
            ior={1.48}
            thickness={1.5}
            transparent={true}
            opacity={0.92}
            clearcoat={1.0}
          />
        </mesh>

        {/* Threaded mouth neck */}
        <mesh position={[0, 2.05, 0]}>
          <cylinderGeometry args={[0.48, 0.52, 0.35, 64]} />
          <meshStandardMaterial
            color="#141820"
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>

        {/* Measurement Scale Decal Cylinder (inside bottle, revealed on exploded view) */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI * 0.75, 0]}>
          <cylinderGeometry args={[1.205, 1.205, 2.8, 48, 1, true]} />
          <meshBasicMaterial
            map={measureTex}
            transparent={true}
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Internal Liquid Volume (Hydration level) */}
        <mesh ref={liquidRef} position={[0, -0.3, 0]}>
          <cylinderGeometry args={[1.15, 1.15, 2.1, 48]} />
          <meshPhysicalMaterial
            color="#00d4ff"
            transmission={0.92}
            opacity={0.75}
            transparent={true}
            roughness={0.05}
            ior={1.33} // Water IOR
            attenuationColor="#0066aa"
            attenuationDistance={1.2}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 2. SILICONE SEAL GASKET (Floats in Exploded View)            */}
      {/* ============================================================ */}
      <mesh ref={sealRef} position={[0, 1.7, 0]}>
        <torusGeometry args={[0.52, 0.05, 16, 64]} />
        <meshStandardMaterial
          color="#ff7b00"
          roughness={0.2}
          metalness={0.1}
          emissive="#ff7b00"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* ============================================================ */}
      {/* 3. CAP & SPOUT ASSEMBLY                                      */}
      {/* ============================================================ */}
      <group ref={capRef} position={[0, 1.95, 0]}>
        {/* Screw collar lid with grip ridges */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.58, 0.32, 48]} />
          <meshStandardMaterial
            color="#181a1f"
            roughness={0.35}
            metalness={0.6}
          />
        </mesh>

        {/* Textured ribbed grip ring on cap */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.18, 32]} />
          <meshStandardMaterial
            color="#0e1014"
            roughness={0.7}
            metalness={0.2}
            wireframe={false}
          />
        </mesh>

        {/* Flip Cap Top Dome */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.52, 0.22, 32]} />
          <meshStandardMaterial
            color="#1c1f24"
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>

        {/* Flip Cap Latch (tactical release button) */}
        <mesh position={[0.46, 0.34, 0]}>
          <boxGeometry args={[0.12, 0.16, 0.2]} />
          <meshStandardMaterial
            color="#ff7b00"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Ergonomic Heavy-duty Carry Loop */}
        <mesh position={[0, 0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.08, 16, 48, Math.PI]} />
          <meshStandardMaterial
            color="#16181c"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Stainless Steel Carabiner Clip ring */}
        <mesh position={[-0.38, 0.58, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.16, 0.035, 16, 32]} />
          <meshStandardMaterial
            color="#d8e0e8"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 4. TACTICAL NEOPRENE SLEEVE (Slides down in Exploded View)  */}
      {/* ============================================================ */}
      <group ref={sleeveRef} position={[0, -0.15, 0]}>
        {/* Main Insulated Sleeve Body */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.27, 1.27, 2.55, 64]} />
          <meshStandardMaterial
            map={sleeveTexture}
            bumpMap={bumpTex}
            bumpScale={0.04}
            roughness={0.75}
            metalness={0.15}
          />
        </mesh>

        {/* Top Hem Stitched Rim */}
        <mesh position={[0, 1.28, 0]}>
          <torusGeometry args={[1.27, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#121316"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>

        {/* Bottom Hem Stitched Rim */}
        <mesh position={[0, -1.28, 0]}>
          <torusGeometry args={[1.27, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#121316"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>

        {/* Front Smartphone Tactical Pocket (Fitted for iPhone Pro Max) */}
        <group position={[0, -0.05, 1.27]}>
          {/* Pocket Backing/Sleeve expansion */}
          <mesh castShadow>
            <boxGeometry args={[1.15, 1.65, 0.12]} />
            <meshStandardMaterial
              map={sleeveTexture}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>

          {/* Stitched Elastic Pocket Rim */}
          <mesh position={[0, 0.83, 0.04]}>
            <boxGeometry args={[1.16, 0.06, 0.08]} />
            <meshStandardMaterial color="#20242b" roughness={0.6} />
          </mesh>

          {/* Simulated Smartphone Silhouette inside pocket */}
          <mesh position={[0, 0.35, 0.02]} rotation={[-0.05, 0, 0]}>
            <boxGeometry args={[0.9, 1.5, 0.05]} />
            <meshStandardMaterial
              color="#0f1013"
              roughness={0.15}
              metalness={0.9}
            />
          </mesh>
        </group>

        {/* Ergonomic Molded Side Handle */}
        <group position={[-1.38, 0.1, 0]}>
          <mesh rotation={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 1.9, 24]} />
            <meshStandardMaterial
              color="#101216"
              roughness={0.5}
              metalness={0.3}
            />
          </mesh>
          {/* Top handle mount */}
          <mesh position={[0.18, 0.9, 0]}>
            <boxGeometry args={[0.3, 0.12, 0.16]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.6} />
          </mesh>
          {/* Bottom handle mount */}
          <mesh position={[0.18, -0.9, 0]}>
            <boxGeometry args={[0.3, 0.12, 0.16]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.6} />
          </mesh>
        </group>

        {/* Tactical Shoulder Strap D-Rings (Steel) */}
        <mesh position={[1.32, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.14, 0.03, 16, 32]} />
          <meshStandardMaterial
            color="#c2c9d1"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
        <mesh position={[1.32, -0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.14, 0.03, 16, 32]} />
          <meshStandardMaterial
            color="#c2c9d1"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 5. INTERACTIVE 3D HOTSPOTS (Visible during Exploded View)    */}
      {/* ============================================================ */}
      {explodedProgress > 0.4 && (
        <group>
          {/* Hotspot 1: Tapa y Cierre Hermético */}
          <HotspotMarker
            position={[0.7, 3.4, 0.4]}
            title="Tapa Flip-Lock Antifugas"
            active={activeHotspot === 1}
            onClick={() => onHotspotClick(1)}
          />

          {/* Hotspot 2: Junta de Silicona */}
          <HotspotMarker
            position={[-0.8, 2.5, 0.4]}
            title="Junta Estanca Grado Alimentario"
            active={activeHotspot === 2}
            onClick={() => onHotspotClick(2)}
          />

          {/* Hotspot 3: Cuerpo Tritan 2.2L */}
          <HotspotMarker
            position={[1.35, 0.6, 0.6]}
            title="Tritán 2.2L Libre de BPA"
            active={activeHotspot === 3}
            onClick={() => onHotspotClick(3)}
          />

          {/* Hotspot 4: Funda Neopreno 5mm */}
          <HotspotMarker
            position={[-1.4, -1.8, 0.7]}
            title="Neopreno Aislante 5mm"
            active={activeHotspot === 4}
            onClick={() => onHotspotClick(4)}
          />

          {/* Hotspot 5: Bolsillo Smartphone */}
          <HotspotMarker
            position={[0.2, -1.5, 1.6]}
            title="Bolsillo Táctico Smartphone"
            active={activeHotspot === 5}
            onClick={() => onHotspotClick(5)}
          />
        </group>
      )}
    </group>
  );
}

// Interactive 3D Glowing Hotspot Component
function HotspotMarker({ position, active, onClick }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      {/* Outer pulsing beacon ring */}
      <mesh ref={meshRef} onClick={onClick}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial
          color={active ? '#00f0ff' : '#ff7b00'}
          transparent={true}
          opacity={0.9}
        />
      </mesh>

      <mesh onClick={onClick}>
        <ringGeometry args={[0.1, 0.14, 32]} />
        <meshBasicMaterial
          color={active ? '#00f0ff' : '#ff7b00'}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}
