import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import BottleModel from './BottleModel';

// Dynamic Camera Controller interpolating position and lookAt based on scroll & mouse
function CameraRig({ scrollProgress = 0, mousePosition = { x: 0, y: 0 } }) {
  useFrame(({ camera }, delta) => {
    // Stage 1 (0 to 0.25): Hero center
    // Stage 2 (0.25 to 0.55): Exploded view zoom out to fit all parts
    // Stage 3 (0.55 to 0.75): Configurator showcase
    // Stage 4 (0.75 to 1.0): Shift left to make room for Buy Box on the right

    let targetX = 0;
    let targetY = 0.4;
    let targetZ = 5.2;

    if (scrollProgress < 0.25) {
      // Hero
      targetX = mousePosition.x * 0.4;
      targetY = 0.3 - mousePosition.y * 0.3;
      targetZ = 5.0;
    } else if (scrollProgress >= 0.25 && scrollProgress < 0.55) {
      // Exploded Anatomy: Pulled back, slightly elevated
      const p = (scrollProgress - 0.25) / 0.3;
      targetX = mousePosition.x * 0.5;
      targetY = 0.8 + p * 0.3;
      targetZ = 6.4;
    } else if (scrollProgress >= 0.55 && scrollProgress < 0.8) {
      // Studio Configurator
      targetX = mousePosition.x * 0.3;
      targetY = 0.2;
      targetZ = 4.8;
    } else {
      // Buy Box / Checkout: Shift bottle to the left side of the screen
      targetX = -1.2 + mousePosition.x * 0.2;
      targetY = 0.2;
      targetZ = 4.6;
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 3);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 3);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 3);

    const lookTarget = new THREE.Vector3(
      scrollProgress > 0.8 ? -0.7 : 0,
      scrollProgress >= 0.25 && scrollProgress < 0.55 ? 0.6 : 0,
      0
    );
    camera.lookAt(lookTarget);
  });

  return null;
}

// Atmospheric 3D Floating Dust & Hydration Particles
function FloatingParticles({ count = 120 }) {
  const meshRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const noise = (seed) => (Math.sin(seed * 127.1) * 43758.5453) % 1;
      pos[i * 3] = noise(i + 1) * 7;
      pos[i * 3 + 1] = noise(i + 83) * 7;
      pos[i * 3 + 2] = noise(i + 173) * 5 - 2;
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04;
      meshRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#00f0ff"
        transparent={true}
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Dynamic Mouse Follower Point Light in 3D Space
function MouseLight({ mousePosition }) {
  const lightRef = useRef();

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.x = mousePosition.x * 4;
      lightRef.current.position.y = -mousePosition.y * 3 + 1;
      lightRef.current.position.z = 3.5;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={1.2}
      distance={8}
      color="#00f0ff"
      decay={2}
    />
  );
}

export default function Scene3D({
  activeColor = 'camo',
  explodedProgress = 0,
  scrollProgress = 0,
  mousePosition = { x: 0, y: 0 },
  activeHotspot = null,
  onHotspotClick = () => {},
  manualRotation = 0,
}) {
  return (
    <div className="webgl-canvas-container">
      <Canvas
        camera={{ position: [0, 0.4, 5.2], fov: 42 }}
        dpr={[1, 2]} // Performance clamp
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        shadows
      >
        {/* Lights Setup */}
        <ambientLight intensity={0.4} color="#b0c4de" />
        <directionalLight
          position={[5, 8, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-6, -2, -4]}
          intensity={1.2}
          color="#ff7b00"
        />
        <pointLight position={[0, 4, -4]} intensity={2.2} color="#ffffff" />
        <MouseLight mousePosition={mousePosition} />

        {/* Camera Rig & Kinetic Controller */}
        <CameraRig
          scrollProgress={scrollProgress}
          mousePosition={mousePosition}
        />

        {/* Floating Ambient WebGL Particles */}
        <FloatingParticles count={140} />

        {/* The 3D Jimkeg Bottle */}
        <BottleModel
          activeColor={activeColor}
          explodedProgress={explodedProgress}
          mousePosition={mousePosition}
          activeHotspot={activeHotspot}
          onHotspotClick={onHotspotClick}
          manualRotation={manualRotation}
        />
      </Canvas>
    </div>
  );
}
