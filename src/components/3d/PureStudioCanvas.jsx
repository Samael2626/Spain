import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  createCamoTexture,
  createBlackStealthTexture,
  createMeasurementTexture,
  createNeopreneBumpTexture,
} from '../../textures/proceduralTextures';
import { sound } from '../../audio/soundFx';

export default function PureStudioCanvas({
  activeAct = 'giro', // 'giro' | 'partes' | 'color'
  activeColor = 'camo', // 'camo' | 'black'
  onActChange = () => {},
  onColorChange = () => {},
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef({
    activeAct: 'giro',
    activeColor: 'camo',
    isDragging: false,
    prevMouseX: 0,
    rotY: 0,
    targetRotY: 0,
    rotX: 0,
    targetRotX: 0,
    explodedVal: 0,
    targetExploded: 0,
  });

  const [hotspotCoords, setHotspotCoords] = useState({
    cap: { x: 0, y: 0, visible: false },
    seal: { x: 0, y: 0, visible: false },
    body: { x: 0, y: 0, visible: false },
    sleeve: { x: 0, y: 0, visible: false },
    pocket: { x: 0, y: 0, visible: false },
  });

  // Keep stateRef synced with props
  useEffect(() => {
    stateRef.current.activeAct = activeAct;
    stateRef.current.activeColor = activeColor;
    stateRef.current.targetExploded = activeAct === 'partes' ? 1 : 0;
  }, [activeAct, activeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Scene Setup with Explicit Dark Obsidian Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10); // Guaranteed dark studio background

    // Atmospheric Studio Radial Gradient Floor Plane
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x08090c,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.8;
    floor.receiveShadow = true;
    scene.add(floor);

    // 3. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.5, 6.2);

    // 4. Studio Lighting Rig
    const ambLight = new THREE.AmbientLight(0xdde5f0, 0.85);
    scene.add(ambLight);

    // Main Studio Soft Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Warm Rim / Tactical Orange Accent Light
    const rimLight = new THREE.DirectionalLight(0xff7b00, 1.8);
    rimLight.position.set(-5, 2, -3);
    scene.add(rimLight);

    // Cold Specular Backlight for Glass Transmission
    const backLight = new THREE.DirectionalLight(0x00d4ff, 1.4);
    backLight.position.set(3, -2, -4);
    scene.add(backLight);

    // Floating Ground Shadow Light
    const spotLight = new THREE.SpotLight(0xffffff, 1.5, 12, Math.PI / 6, 0.5);
    spotLight.position.set(0, 6, 2);
    scene.add(spotLight);

    // 5. Build The JIMKEG 2.2L Procedural 3D Bottle Assembly
    const bottleGroup = new THREE.Group();
    bottleGroup.position.set(0, 0, 0);
    scene.add(bottleGroup);

    // Procedural Textures
    const camoTex = createCamoTexture();
    const blackTex = createBlackStealthTexture();
    const measureTex = createMeasurementTexture();
    const bumpTex = createNeopreneBumpTexture();

    // Sleeve Material with dynamic texture swap
    const sleeveMaterial = new THREE.MeshStandardMaterial({
      map: stateRef.current.activeColor === 'camo' ? camoTex : blackTex,
      bumpMap: bumpTex,
      bumpScale: 0.05,
      roughness: 0.75,
      metalness: 0.15,
    });

    // ----------------------------------------------------
    // Sub-group A: Cap & Spout Assembly (moves up in despiece)
    // ----------------------------------------------------
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 1.9, 0);

    // Screw Collar
    const collarGeo = new THREE.CylinderGeometry(0.56, 0.58, 0.32, 48);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.35, metalness: 0.6 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.castShadow = true;
    capGroup.add(collar);

    // Flip Lid Top
    const lidGeo = new THREE.CylinderGeometry(0.44, 0.52, 0.22, 32);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.3, metalness: 0.4 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.25;
    lid.castShadow = true;
    capGroup.add(lid);

    // Tactical Push Button Latch (Orange)
    const latchGeo = new THREE.BoxGeometry(0.14, 0.18, 0.2);
    const latchMat = new THREE.MeshStandardMaterial({ color: 0xff7b00, roughness: 0.2, metalness: 0.7 });
    const latch = new THREE.Mesh(latchGeo, latchMat);
    latch.position.set(0.48, 0.24, 0);
    capGroup.add(latch);

    // Heavy Duty Carry Loop
    const loopGeo = new THREE.TorusGeometry(0.36, 0.08, 16, 48, Math.PI);
    const loopMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.4, metalness: 0.6 });
    const loop = new THREE.Mesh(loopGeo, loopMat);
    loop.rotation.x = Math.PI / 2;
    loop.position.y = 0.48;
    capGroup.add(loop);

    // Stainless Steel Carabiner D-Ring
    const ringGeo = new THREE.TorusGeometry(0.16, 0.035, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xdde5ee, roughness: 0.15, metalness: 0.95 });
    const carabiner = new THREE.Mesh(ringGeo, ringMat);
    carabiner.position.set(-0.4, 0.48, 0);
    carabiner.rotation.z = Math.PI / 4;
    capGroup.add(carabiner);

    bottleGroup.add(capGroup);

    // ----------------------------------------------------
    // Sub-group B: Food-Grade Silicone Seal Ring (floats)
    // ----------------------------------------------------
    const sealGeo = new THREE.TorusGeometry(0.52, 0.05, 16, 48);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xff7b00,
      roughness: 0.2,
      emissive: 0xff7b00,
      emissiveIntensity: 0.25,
    });
    const seal = new THREE.Mesh(sealGeo, sealMat);
    seal.position.set(0, 1.68, 0);
    bottleGroup.add(seal);

    // ----------------------------------------------------
    // Sub-group C: Inner 2.2L Tritan Jug with Measurement Scale
    // ----------------------------------------------------
    const jugGroup = new THREE.Group();
    jugGroup.position.set(0, 0, 0);

    // Main Cylindrical Jug
    const bodyGeo = new THREE.CylinderGeometry(1.22, 1.22, 2.85, 48);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x101824,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.85,
      ior: 1.48,
      thickness: 1.6,
      transparent: true,
      opacity: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    jugGroup.add(body);

    // Shoulder Taper
    const shoulderGeo = new THREE.CylinderGeometry(0.54, 1.22, 0.58, 48);
    const shoulder = new THREE.Mesh(shoulderGeo, bodyMat);
    shoulder.position.y = 1.62;
    jugGroup.add(shoulder);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.35, 48);
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.4, metalness: 0.5 });
    const neck = new THREE.Mesh(neckGeo, neckMat);
    neck.position.y = 2.0;
    jugGroup.add(neck);

    // Inside Measurement Scale Decal
    const measureGeo = new THREE.CylinderGeometry(1.225, 1.225, 2.75, 48, 1, true);
    const measureMat = new THREE.MeshBasicMaterial({
      map: measureTex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const measureMesh = new THREE.Mesh(measureGeo, measureMat);
    measureMesh.rotation.y = Math.PI * 0.75;
    jugGroup.add(measureMesh);

    // Water Liquid Level inside the jug (cyan glowing water)
    const liquidGeo = new THREE.CylinderGeometry(1.18, 1.18, 2.1, 32);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.9,
      ior: 1.33,
      transparent: true,
      opacity: 0.78,
      attenuationColor: 0x0066aa,
      attenuationDistance: 1.2,
    });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = -0.3;
    jugGroup.add(liquid);

    bottleGroup.add(jugGroup);

    // ----------------------------------------------------
    // Sub-group D: Tactical Neoprene Sleeve (slides down)
    // ----------------------------------------------------
    const sleeveGroup = new THREE.Group();
    sleeveGroup.position.set(0, -0.15, 0);

    // Main Insulated Cylinder
    const sleeveGeo = new THREE.CylinderGeometry(1.28, 1.28, 2.5, 64);
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMaterial);
    sleeve.castShadow = true;
    sleeve.receiveShadow = true;
    sleeveGroup.add(sleeve);

    // Top Stitched Rim
    const rimTopGeo = new THREE.TorusGeometry(1.28, 0.045, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.85 });
    const rimTop = new THREE.Mesh(rimTopGeo, rimMat);
    rimTop.position.y = 1.25;
    sleeveGroup.add(rimTop);

    // Bottom Stitched Rim
    const rimBottom = new THREE.Mesh(rimTopGeo, rimMat);
    rimBottom.position.y = -1.25;
    sleeveGroup.add(rimBottom);

    // Front Phone Pocket (fits iPhone Pro Max)
    const pocketGroup = new THREE.Group();
    pocketGroup.position.set(0, -0.05, 1.28);

    const pocketGeo = new THREE.BoxGeometry(1.15, 1.6, 0.12);
    const pocket = new THREE.Mesh(pocketGeo, sleeveMaterial);
    pocket.castShadow = true;
    pocketGroup.add(pocket);

    // Pocket Stitched Rim
    const pocketRimGeo = new THREE.BoxGeometry(1.16, 0.06, 0.08);
    const pocketRim = new THREE.Mesh(pocketRimGeo, rimMat);
    pocketRim.position.y = 0.8;
    pocketGroup.add(pocketRim);

    // Realistic Smartphone Silhouette inside pocket
    const phoneGeo = new THREE.BoxGeometry(0.88, 1.48, 0.05);
    const phoneMat = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.15, metalness: 0.95 });
    const phone = new THREE.Mesh(phoneGeo, phoneMat);
    phone.position.set(0, 0.32, 0.02);
    phone.rotation.x = -0.05;
    pocketGroup.add(phone);

    sleeveGroup.add(pocketGroup);

    // Ergonomic Side Handle
    const handleGroup = new THREE.Group();
    handleGroup.position.set(-1.42, 0, 0);

    const handleGripGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.85, 24);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.5, metalness: 0.3 });
    const handleGrip = new THREE.Mesh(handleGripGeo, handleMat);
    handleGrip.castShadow = true;
    handleGroup.add(handleGrip);

    const mountGeo = new THREE.BoxGeometry(0.32, 0.12, 0.16);
    const mountTop = new THREE.Mesh(mountGeo, rimMat);
    mountTop.position.set(0.18, 0.86, 0);
    handleGroup.add(mountTop);

    const mountBottom = new THREE.Mesh(mountGeo, rimMat);
    mountBottom.position.set(0.18, -0.86, 0);
    handleGroup.add(mountBottom);

    sleeveGroup.add(handleGroup);

    // Steel D-Rings for Shoulder Strap
    const dRingGeo = new THREE.TorusGeometry(0.14, 0.03, 16, 32);
    const dRingMat = new THREE.MeshStandardMaterial({ color: 0xc8d0d8, roughness: 0.15, metalness: 0.95 });
    const dRingTop = new THREE.Mesh(dRingGeo, dRingMat);
    dRingTop.position.set(1.33, 0.9, 0);
    dRingTop.rotation.z = Math.PI / 2;
    sleeveGroup.add(dRingTop);

    const dRingBottom = new THREE.Mesh(dRingGeo, dRingMat);
    dRingBottom.position.set(1.33, -0.9, 0);
    dRingBottom.rotation.z = Math.PI / 2;
    sleeveGroup.add(dRingBottom);

    bottleGroup.add(sleeveGroup);

    // 6. Resize Handler
    const handleResize = () => {
      const w = containerRef.current ? containerRef.current.clientWidth : window.innerWidth;
      const h = containerRef.current ? containerRef.current.clientHeight : window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // 7. Mouse & Touch Drag Handlers for 360° Inspection
    const onPointerDown = (e) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    };

    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      // Mouse tilt parallax
      const normY = -(clientY / window.innerHeight) * 2 + 1;
      stateRef.current.targetRotX = -normY * 0.15;

      if (stateRef.current.isDragging) {
        const deltaX = clientX - stateRef.current.prevMouseX;
        stateRef.current.targetRotY += deltaX * 0.012;
        stateRef.current.prevMouseX = clientX;
      }
    };

    const onPointerUp = () => {
      stateRef.current.isDragging = false;
    };

    const canvasDom = canvasRef.current;
    canvasDom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvasDom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 8. Render Loop with Kinematics & Hotspot Projection
    let animId;
    let clock = new THREE.Clock();

    const projectToScreen = (vec3) => {
      const v = vec3.clone();
      v.project(camera);
      const w = containerRef.current ? containerRef.current.clientWidth : window.innerWidth;
      const h = containerRef.current ? containerRef.current.clientHeight : window.innerHeight;
      return {
        x: ((v.x + 1) * w) / 2,
        y: ((-v.y + 1) * h) / 2,
        visible: v.z < 1,
      };
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Update sleeve texture if color changed
      if (sleeveMaterial) {
        const targetTex = stateRef.current.activeColor === 'camo' ? camoTex : blackTex;
        if (sleeveMaterial.map !== targetTex) {
          sleeveMaterial.map = targetTex;
          sleeveMaterial.needsUpdate = true;
        }
      }

      // Auto-rotation in "giro" mode when not dragging
      if (stateRef.current.activeAct === 'giro' && !stateRef.current.isDragging) {
        stateRef.current.targetRotY += delta * 0.35;
      }

      // Smooth Lerp Rotations
      stateRef.current.rotY = THREE.MathUtils.lerp(stateRef.current.rotY, stateRef.current.targetRotY, delta * 6);
      stateRef.current.rotX = THREE.MathUtils.lerp(stateRef.current.rotX, stateRef.current.targetRotX, delta * 5);
      stateRef.current.explodedVal = THREE.MathUtils.lerp(
        stateRef.current.explodedVal,
        stateRef.current.targetExploded,
        delta * 6
      );

      bottleGroup.rotation.y = stateRef.current.rotY;
      bottleGroup.rotation.x = stateRef.current.rotX;

      // Gentle Floating Bob
      bottleGroup.position.y = Math.sin(time * 1.5) * 0.06;

      // Exploded View kinematics
      const exp = stateRef.current.explodedVal;
      capGroup.position.y = 1.9 + exp * 1.6;
      capGroup.rotation.z = exp * 0.25;

      seal.position.y = 1.68 + exp * 0.8;

      sleeveGroup.position.y = -0.15 - exp * 1.5;

      // Liquid wave animation
      liquid.rotation.y = time * 0.2;
      liquid.scale.y = 1 + Math.sin(time * 3) * 0.015;

      // Update projected 2D coordinates for leader lines during "partes"
      if (stateRef.current.activeAct === 'partes' && exp > 0.3) {
        const capWorld = new THREE.Vector3(0.5, capGroup.position.y + 0.3, 0).applyMatrix4(bottleGroup.matrixWorld);
        const sealWorld = new THREE.Vector3(-0.6, seal.position.y, 0).applyMatrix4(bottleGroup.matrixWorld);
        const bodyWorld = new THREE.Vector3(1.3, jugGroup.position.y + 0.8, 0).applyMatrix4(bottleGroup.matrixWorld);
        const sleeveWorld = new THREE.Vector3(-1.3, sleeveGroup.position.y, 0).applyMatrix4(bottleGroup.matrixWorld);
        const pocketWorld = new THREE.Vector3(0.2, sleeveGroup.position.y - 0.2, 1.3).applyMatrix4(bottleGroup.matrixWorld);

        setHotspotCoords({
          cap: projectToScreen(capWorld),
          seal: projectToScreen(sealWorld),
          body: projectToScreen(bodyWorld),
          sleeve: projectToScreen(sleeveWorld),
          pocket: projectToScreen(pocketWorld),
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvasDom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvasDom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="pure-studio-container" ref={containerRef}>
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="pure-studio-canvas" />

      {/* Act Indicator HUD (Inspired by Elementra) */}
      <div className="studio-hud">
        <div className="hud-pill">
          <span className="hud-dot"></span>
          <span className="hud-label">ESTUDIO 3D •</span>
          <strong className="hud-act-name">
            {activeAct === 'giro' && '01. VISTA 360°'}
            {activeAct === 'partes' && '02. DESPIECE TÉCNICO (POR PARTES)'}
            {activeAct === 'color' && '03. SELECCIÓN DE COLOR'}
          </strong>
        </div>
      </div>

      {/* Floating 3D Leader Lines & Labels (Visible in "partes" act) */}
      {activeAct === 'partes' && (
        <div className="hotspots-overlay-layer">
          {/* 1. Cap Label */}
          {hotspotCoords.cap.visible && (
            <div
              className="hotspot-callout callout-right"
              style={{
                left: `${hotspotCoords.cap.x}px`,
                top: `${hotspotCoords.cap.y}px`,
              }}
            >
              <div className="callout-dot"></div>
              <div className="callout-line"></div>
              <div className="callout-card">
                <span className="callout-tag">COMPONENTE 01</span>
                <h4 className="callout-title">Tapa Flip-Lock Antifugas</h4>
                <p className="callout-desc">Boquilla de succión protegida y asa ergonómica con mosquetón de acero.</p>
              </div>
            </div>
          )}

          {/* 2. Seal Label */}
          {hotspotCoords.seal.visible && (
            <div
              className="hotspot-callout callout-left"
              style={{
                left: `${hotspotCoords.seal.x}px`,
                top: `${hotspotCoords.seal.y}px`,
              }}
            >
              <div className="callout-dot"></div>
              <div className="callout-line"></div>
              <div className="callout-card">
                <span className="callout-tag">COMPONENTE 02</span>
                <h4 className="callout-title">Junta Estanca de Silicona</h4>
                <p className="callout-desc">Sellado 100% hermético de grado alimentario. Cero pérdidas ni derrames.</p>
              </div>
            </div>
          )}

          {/* 3. Body Tritan Label */}
          {hotspotCoords.body.visible && (
            <div
              className="hotspot-callout callout-right"
              style={{
                left: `${hotspotCoords.body.x}px`,
                top: `${hotspotCoords.body.y}px`,
              }}
            >
              <div className="callout-dot"></div>
              <div className="callout-line"></div>
              <div className="callout-card">
                <span className="callout-tag">COMPONENTE 03</span>
                <h4 className="callout-title">Cuerpo Tritán 2.2L (Libre BPA)</h4>
                <p className="callout-desc">Resiste hasta 90°C y golpes. Marcadores horarios de ingesta de agua.</p>
              </div>
            </div>
          )}

          {/* 4. Neoprene Sleeve Label */}
          {hotspotCoords.sleeve.visible && (
            <div
              className="hotspot-callout callout-left"
              style={{
                left: `${hotspotCoords.sleeve.x}px`,
                top: `${hotspotCoords.sleeve.y}px`,
              }}
            >
              <div className="callout-dot"></div>
              <div className="callout-line"></div>
              <div className="callout-card">
                <span className="callout-tag">COMPONENTE 04</span>
                <h4 className="callout-title">Funda de Neopreno 5mm</h4>
                <p className="callout-desc">Elimina el sudor por condensación y mantiene el agua fría durante horas.</p>
              </div>
            </div>
          )}

          {/* 5. Phone Pocket Label */}
          {hotspotCoords.pocket.visible && (
            <div
              className="hotspot-callout callout-right"
              style={{
                left: `${hotspotCoords.pocket.x}px`,
                top: `${hotspotCoords.pocket.y}px`,
              }}
            >
              <div className="callout-dot"></div>
              <div className="callout-line"></div>
              <div className="callout-card">
                <span className="callout-tag">COMPONENTE 05</span>
                <h4 className="callout-title">Bolsillo Smartphone Blindado</h4>
                <p className="callout-desc">Compatible hasta iPhone 16 Pro Max. Se acabaron los móviles en el suelo.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Act Controller Bar (Like Elementra's Actos) */}
      <div className="acts-control-nav">
        <button
          className={`act-tab ${activeAct === 'giro' ? 'active' : ''}`}
          onClick={() => {
            sound.playSwitch();
            onActChange('giro');
          }}
        >
          <span className="act-num">01</span>
          <span className="act-txt">Giro 360°</span>
        </button>

        <button
          className={`act-tab ${activeAct === 'partes' ? 'active' : ''}`}
          onClick={() => {
            sound.playHotspot();
            onActChange('partes');
          }}
        >
          <span className="act-num">02</span>
          <span className="act-txt">Por Partes (Despiece)</span>
        </button>

        <button
          className={`act-tab ${activeAct === 'color' ? 'active' : ''}`}
          onClick={() => {
            sound.playClick();
            onActChange('color');
          }}
        >
          <span className="act-num">03</span>
          <span className="act-txt">Colores</span>
        </button>
      </div>

      {/* Color Selector Pills (When in "color" or "giro" act) */}
      <div className="studio-color-pill-selector">
        <button
          className={`color-pill ${activeColor === 'camo' ? 'active' : ''}`}
          onClick={() => {
            sound.playSwitch();
            onColorChange('camo');
          }}
        >
          <span className="pill-dot camo-dot"></span>
          <span>Camuflaje Gris</span>
        </button>

        <button
          className={`color-pill ${activeColor === 'black' ? 'active' : ''}`}
          onClick={() => {
            sound.playSwitch();
            onColorChange('black');
          }}
        >
          <span className="pill-dot black-dot"></span>
          <span>Negro Stealth</span>
        </button>
      </div>

      {/* Drag Hint */}
      <div className="drag-hint-pill">
        <span>↔ Arrastra con el ratón o dedo para rotar 360°</span>
      </div>
    </div>
  );
}
