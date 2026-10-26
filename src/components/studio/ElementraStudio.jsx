import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  RotateCcw,
  Check,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Unlock,
  Lock,
  Layers,
  Sun,
  Droplets,
  Thermometer,
  Smartphone,
} from 'lucide-react';
import {
  createCamoTexture,
  createBlackStealthTexture,
  createNeopreneBumpTexture,
  createMeasurementTexture,
  createPhoneScreenTexture,
  createWebbingTexture,
} from '../../textures/proceduralTextures';
import { sound } from '../../audio/soundFx';

const ENGINEERING_PARTS = [
  {
    id: '01',
    key: 'cap',
    tag: '01 · TAPA FLIP-LOCK',
    title: 'Black Tactical Lid',
    desc: 'Boquilla de alto flujo protegida por tapa abatible con apertura de muelle a 120° y asa ergonómica basculante.',
    spec: 'Apertura con pulsador táctico y sellado estanco',
    img: '/images/parts/part_01_tactical_lid.png',
  },
  {
    id: '02',
    key: 'paracord',
    tag: '02 · CUERDAS TÁCTICAS',
    title: 'Paracord Gasket / Braided Cord',
    desc: 'Bobina de supervivencia de 7 filamentos de nylon militar 550 trenzada al cuello con pasador ajustable.',
    spec: 'Resistencia a tracción: 250 kg',
    img: '/images/parts/part_02_paracord_cord.png',
  },
  {
    id: '03',
    key: 'body',
    tag: '03 · CUERPO CILÍNDRICO',
    title: 'Cylindrical Bottle Body 2.2L',
    desc: 'Cuerpo cilíndrico limpio sin asas plásticas que obstruyan la funda. Polímero Eastman Tritan™ libre de BPA/BPS.',
    spec: 'Capacidad 2.200 ml con escala serigrafiada',
    img: '/images/parts/part_03_bottle_body.png',
  },
  {
    id: '04',
    key: 'sleeve',
    tag: '04 · FUNDA TÁCTICA',
    title: 'Tactical Camouflage Pouch',
    desc: 'Funda de neopreno de 5 mm en Camuflaje Gris Ártico oficial. Absorbe impactos y elimina toda condensación exterior.',
    spec: 'Aislamiento térmico hasta 6h continuas',
    img: '/images/parts/part_04_camo_pouch.png',
  },
  {
    id: '05',
    key: 'pocket',
    tag: '05 · COMPARTIMENTO SMARTPHONE',
    title: 'Tactical Cell Phone Pocket',
    desc: 'Bolsillo frontal de acceso rápido para mantener el smartphone y llaves elevados del suelo del gimnasio o tierra.',
    spec: 'Compatible con teléfonos de hasta 6.8"',
    img: '/images/parts/part_05_cell_phone.png',
  },
  {
    id: '06',
    key: 'strap',
    tag: '06 · CORREA MILITAR',
    title: 'Tactical Shoulder Strap',
    desc: 'Correa bandolera balística con hombrera acolchada ergonómica y mosquetones de acero giratorios.',
    spec: 'Ajustable de 70 cm a 140 cm con enganches D-Ring',
    img: '/images/parts/part_06_tactical_strap.png',
  },
];

export default function ElementraStudio({
  activeAct = 'giro', // 'giro' | 'partes' | 'specs'
  activeColor = 'camo', // 'camo' | 'black'
  onActChange = () => {},
  onColorChange = () => {},
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // In-Emulator Action Controls State
  const [isAutoSpin, setIsAutoSpin] = useState(true);
  const [isLidOpen, setIsLidOpen] = useState(false);
  const [isSleeveOff, setIsSleeveOff] = useState(false);
  const [lightingMode, setLightingMode] = useState('studio'); // 'studio' | 'dramatic' | 'outdoor'
  const [cameraView, setCameraView] = useState('front'); // 'front' | 'angle' | 'top' | 'pocket'
  const [selectedPartId, setSelectedPartId] = useState('01');

  // Internal mutable state for the Three.js 60fps render loop
  const stateRef = useRef({
    activeAct: 'giro',
    activeColor: 'camo',
    isAutoSpin: true,
    isLidOpen: false,
    isSleeveOff: false,
    lightingMode: 'studio',
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotY: 0,
    targetRotY: 0,
    rotX: 0,
    targetRotX: 0,
    camDist: 7.8,
    targetCamDist: 7.8,
    explodedVal: 0,
    targetExploded: 0,
    xrayVal: 0,
    targetXray: 0,
    lidOpenVal: 0,
    targetLidOpen: 0,
    sleeveSlideVal: 0,
    targetSleeveSlide: 0,
  });

  const [hotspotCoords, setHotspotCoords] = useState({
    cap: { x: 0, y: 0, visible: false },
    seal: { x: 0, y: 0, visible: false },
    body: { x: 0, y: 0, visible: false },
    sleeve: { x: 0, y: 0, visible: false },
    pocket: { x: 0, y: 0, visible: false },
    paracord: { x: 0, y: 0, visible: false },
  });

  // Sync React state to animation loop stateRef
  useEffect(() => {
    stateRef.current.activeAct = activeAct;
    const motion = gsap.to(stateRef.current, {
      targetExploded: activeAct === 'partes' ? 1 : 0,
      targetXray: activeAct === 'specs' ? 1 : 0,
      targetCamDist: activeAct === 'partes' ? 9.2 : 7.8,
      duration: 0.85,
      ease: 'power3.inOut',
      overwrite: true,
    });
    return () => motion.kill();
  }, [activeAct]);

  useEffect(() => {
    stateRef.current.activeColor = activeColor;
  }, [activeColor]);

  useEffect(() => {
    stateRef.current.isAutoSpin = isAutoSpin;
  }, [isAutoSpin]);

  useEffect(() => {
    stateRef.current.targetLidOpen = isLidOpen ? 1 : 0;
  }, [isLidOpen]);

  useEffect(() => {
    stateRef.current.targetSleeveSlide = isSleeveOff ? 1 : 0;
  }, [isSleeveOff]);

  useEffect(() => {
    stateRef.current.lightingMode = lightingMode;
  }, [lightingMode]);

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const maxDpr = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Scene with Dark Studio Cyclorama
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);

    // Floor Shadow Receiver Plane
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080a0d,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.8;
    floor.receiveShadow = true;
    scene.add(floor);

    // 3. Camera with Generous Framing (No clipping)
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.35, 7.2);

    // 4. Lighting Rig
    const ambLight = new THREE.AmbientLight(0xe5edf5, 0.9);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xfffbf5, 2.4);
    keyLight.position.set(4.5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(-5, 2.5, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x8da2be, 1.1);
    fillLight.position.set(3, -2, -4);
    scene.add(fillLight);

    // 5. Generate Ultra-HD 2K Procedural Textures
    const camoTex = createCamoTexture();
    const blackTex = createBlackStealthTexture();
    const bumpTex = createNeopreneBumpTexture();
    const measureTex = createMeasurementTexture();
    const phoneScreenTex = createPhoneScreenTexture();
    const webbingTex = createWebbingTexture();

    // 6. Master Bottle Group (scaled to fit comfortably without clipping)
    const bottleGroup = new THREE.Group();
    bottleGroup.position.set(0, -0.1, 0);
    bottleGroup.scale.set(0.66, 0.66, 0.66);
    scene.add(bottleGroup);

    // Sleeve PBR Material
    const sleeveMaterial = new THREE.MeshStandardMaterial({
      map: stateRef.current.activeColor === 'camo' ? camoTex : blackTex,
      bumpMap: bumpTex,
      bumpScale: 0.05,
      roughness: stateRef.current.activeColor === 'camo' ? 0.9 : 0.48,
      metalness: stateRef.current.activeColor === 'camo' ? 0.03 : 0.28,
      transparent: true,
      opacity: 1.0,
    });

    // ------------------------------------------------------------------------
    // Part A: Mechanical Cap Assembly (Lid springs open in 3D)
    // ------------------------------------------------------------------------
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 1.9, 0);

    // Collar
    const collarGeo = new THREE.CylinderGeometry(0.56, 0.58, 0.32, 48);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x16181e,
      roughness: 0.35,
      metalness: 0.6,
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.castShadow = true;
    capGroup.add(collar);

    // Silicone Drinking Spout (visible when lid is opened!)
    const spoutGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.38, 32);
    const spoutMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e2430,
      roughness: 0.2,
      transmission: 0.3,
      thickness: 0.5,
    });
    const spout = new THREE.Mesh(spoutGeo, spoutMat);
    spout.position.set(0, 0.26, 0.18);
    capGroup.add(spout);

    // Flip Lid Hinge Pivot Group (Rotates backwards ~120 degrees on X axis!)
    const lidPivotGroup = new THREE.Group();
    lidPivotGroup.position.set(0, 0.26, -0.42); // Hinge location on back of collar

    const lidGeo = new THREE.CylinderGeometry(0.44, 0.52, 0.22, 32);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x22262f,
      roughness: 0.3,
      metalness: 0.45,
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(0, 0, 0.42); // Offset from pivot so it sits concentric over collar
    lid.castShadow = true;
    lidPivotGroup.add(lid);

    // Tactical Push-Button Latch (Amber Accent) on front
    const latchGeo = new THREE.BoxGeometry(0.16, 0.18, 0.14);
    const latchMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.7,
    });
    const latch = new THREE.Mesh(latchGeo, latchMat);
    latch.position.set(0, 0, 0.88);
    lidPivotGroup.add(latch);

    capGroup.add(lidPivotGroup);

    // Rigid Ergonomic Carry Handle Loop
    const handleLoopGeo = new THREE.TorusGeometry(0.36, 0.08, 16, 48, Math.PI);
    const handleLoopMat = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      roughness: 0.45,
      metalness: 0.55,
    });
    const handleLoop = new THREE.Mesh(handleLoopGeo, handleLoopMat);
    handleLoop.rotation.x = Math.PI / 2 + 0.25;
    handleLoop.position.set(0, 0.36, -0.44);
    capGroup.add(handleLoop);

    // ========================================================================
    // CUERDA 1: PARACORD SURVIVAL WEAVE AROUND NECK & HANDLE ("las cuerdas")
    // ========================================================================
    const paracordGroup = new THREE.Group();

    // Braided helical paracord coils around the neck
    const helixPoints = [];
    const helixRadius = 0.62;
    const helixTurns = 5;
    for (let t = 0; t <= Math.PI * 2 * helixTurns; t += 0.25) {
      const hY = 0.05 + (t / (Math.PI * 2 * helixTurns)) * 0.22;
      helixPoints.push(
        new THREE.Vector3(Math.cos(t) * helixRadius, hY, Math.sin(t) * helixRadius)
      );
    }
    const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
    const helixGeo = new THREE.TubeGeometry(helixCurve, 90, 0.032, 12, false);
    const paracordMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber paracord
      roughness: 0.65,
      metalness: 0.15,
      bumpMap: bumpTex,
      bumpScale: 0.04,
    });
    const paracordHelix = new THREE.Mesh(helixGeo, paracordMat);
    paracordGroup.add(paracordHelix);

    // Hanging Paracord Survival Loop & Knot with Titanium Bead
    const lanyardPoints = [
      new THREE.Vector3(-0.4, 0.48, 0),
      new THREE.Vector3(-0.65, 0.2, 0.15),
      new THREE.Vector3(-0.8, -0.2, 0.2),
      new THREE.Vector3(-0.6, -0.65, 0.15),
      new THREE.Vector3(-0.45, -0.4, 0.05),
      new THREE.Vector3(-0.4, 0.48, 0),
    ];
    const lanyardCurve = new THREE.CatmullRomCurve3(lanyardPoints);
    const lanyardGeo = new THREE.TubeGeometry(lanyardCurve, 40, 0.028, 10, true);
    const paracordLanyard = new THREE.Mesh(lanyardGeo, paracordMat);
    paracordGroup.add(paracordLanyard);

    // Titanium Bead on Paracord
    const beadGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16);
    const beadMat = new THREE.MeshStandardMaterial({
      color: 0xdde5ee,
      roughness: 0.18,
      metalness: 0.95,
    });
    const bead = new THREE.Mesh(beadGeo, beadMat);
    bead.position.set(-0.75, -0.1, 0.18);
    bead.rotation.z = Math.PI / 4;
    paracordGroup.add(bead);

    capGroup.add(paracordGroup);

    // Titanium Carabiner D-Ring on Cap
    const ringGeo = new THREE.TorusGeometry(0.16, 0.035, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xdde5ee,
      roughness: 0.2,
      metalness: 0.95,
    });
    const carabiner = new THREE.Mesh(ringGeo, ringMat);
    carabiner.position.set(-0.4, 0.48, 0);
    carabiner.rotation.z = Math.PI / 4;
    capGroup.add(carabiner);

    bottleGroup.add(capGroup);

    // ------------------------------------------------------------------------
    // Part B: Airtight Food-Grade Silicone Gasket
    // ------------------------------------------------------------------------
    const sealGeo = new THREE.TorusGeometry(0.52, 0.05, 16, 48);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.1,
    });
    const seal = new THREE.Mesh(sealGeo, sealMat);
    seal.position.set(0, 1.68, 0);
    bottleGroup.add(seal);

    // ------------------------------------------------------------------------
    // Part C: Inner 2.2L Tritan Jug Body with Hydration Measurement Scale
    // ------------------------------------------------------------------------
    const jugGroup = new THREE.Group();
    jugGroup.position.set(0, 0, 0);

    // Main Tritan Polymer Cylinder
    const bodyGeo = new THREE.CylinderGeometry(1.22, 1.22, 2.85, 48);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x111620,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.88,
      ior: 1.48,
      thickness: 1.5,
      transparent: true,
      opacity: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
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

    // Threaded Neck
    const neckGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.35, 48);
    const neckMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.4,
      metalness: 0.5,
    });
    const neck = new THREE.Mesh(neckGeo, neckMat);
    neck.position.y = 2.0;
    jugGroup.add(neck);

    // Measurement Scale Decal Cylinder (Inside Bottle)
    const measureGeo = new THREE.CylinderGeometry(1.225, 1.225, 2.75, 48, 1, true);
    const measureMat = new THREE.MeshBasicMaterial({
      map: measureTex,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const measureMesh = new THREE.Mesh(measureGeo, measureMat);
    measureMesh.rotation.y = Math.PI * 0.75;
    jugGroup.add(measureMesh);

    // Realistic Water Fluid Volume (Refractive Mineral Water)
    const liquidGeo = new THREE.CylinderGeometry(1.18, 1.18, 2.1, 32);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0xd0e8f8,
      roughness: 0.04,
      metalness: 0.0,
      transmission: 0.95,
      ior: 1.333,
      transparent: true,
      opacity: 0.78,
      attenuationColor: 0x8ab4f8,
      attenuationDistance: 2.0,
    });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = -0.3;
    jugGroup.add(liquid);

    bottleGroup.add(jugGroup);

    // ------------------------------------------------------------------------
    // Part D: 5mm Neoprene Sleeve with Stitches, Phone Pocket & Webbing
    // ------------------------------------------------------------------------
    const sleeveGroup = new THREE.Group();
    sleeveGroup.position.set(0, -0.15, 0);

    // Main Insulated Cylinder
    const sleeveGeo = new THREE.CylinderGeometry(1.28, 1.28, 2.5, 64);
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMaterial);
    sleeve.castShadow = true;
    sleeve.receiveShadow = true;
    sleeveGroup.add(sleeve);

    // Reinforced Top & Bottom Stitched Rims
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.85,
    });
    const rimTopGeo = new THREE.TorusGeometry(1.28, 0.045, 16, 64);
    const rimTop = new THREE.Mesh(rimTopGeo, rimMat);
    rimTop.position.y = 1.25;
    sleeveGroup.add(rimTop);

    const rimBottom = new THREE.Mesh(rimTopGeo, rimMat);
    rimBottom.position.y = -1.25;
    sleeveGroup.add(rimBottom);

    // Front Smartphone Pocket
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

    // High-Resolution Smartphone with Glowing Fitness UI
    const phoneGeo = new THREE.BoxGeometry(0.9, 1.5, 0.04);
    const phoneMat = new THREE.MeshStandardMaterial({
      map: phoneScreenTex,
      roughness: 0.15,
      metalness: 0.8,
      emissive: 0xffffff,
      emissiveMap: phoneScreenTex,
      emissiveIntensity: 0.35,
    });
    const phone = new THREE.Mesh(phoneGeo, phoneMat);
    phone.position.set(0, 0.32, 0.03);
    phone.rotation.x = -0.05;
    pocketGroup.add(phone);

    sleeveGroup.add(pocketGroup);

    // Side Handle with Molded Grip
    const handleGroup = new THREE.Group();
    handleGroup.position.set(-1.42, 0, 0);

    const handleGripGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.85, 24);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x101318,
      roughness: 0.5,
      metalness: 0.3,
    });
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
    const dRingMat = new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      roughness: 0.15,
      metalness: 0.95,
    });
    const dRingTop = new THREE.Mesh(dRingGeo, dRingMat);
    dRingTop.position.set(1.33, 0.9, 0);
    dRingTop.rotation.z = Math.PI / 2;
    sleeveGroup.add(dRingTop);

    const dRingBottom = new THREE.Mesh(dRingGeo, dRingMat);
    dRingBottom.position.set(1.33, -0.9, 0);
    dRingBottom.rotation.z = Math.PI / 2;
    sleeveGroup.add(dRingBottom);

    // ========================================================================
    // CUERDA 2: CORREA DE HOMBRO TÁCTICA ACOLCHADA (Tactical Shoulder Sling)
    // ========================================================================
    const strapPoints = [
      new THREE.Vector3(1.33, 0.9, 0),
      new THREE.Vector3(1.85, 0.45, 0.35),
      new THREE.Vector3(2.1, 0.0, 0.5),
      new THREE.Vector3(1.9, -0.5, 0.35),
      new THREE.Vector3(1.33, -0.9, 0),
    ];
    const strapCurve = new THREE.CatmullRomCurve3(strapPoints);
    const strapGeo = new THREE.TubeGeometry(strapCurve, 32, 0.045, 10, false);
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d24,
      map: webbingTex,
      roughness: 0.75,
      metalness: 0.2,
    });
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.castShadow = true;
    sleeveGroup.add(strapMesh);

    // Cushioned Shoulder Pad on Strap
    const padGeo = new THREE.BoxGeometry(0.18, 0.7, 0.12);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x121418,
      roughness: 0.85,
      bumpMap: bumpTex,
      bumpScale: 0.04,
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(2.05, 0.0, 0.48);
    padMesh.rotation.y = Math.PI / 4;
    sleeveGroup.add(padMesh);

    bottleGroup.add(sleeveGroup);

    // ------------------------------------------------------------------------
    // 7. Interactive Event Handlers (Drag 360°, Tilt, Wheel Zoom)
    // ------------------------------------------------------------------------
    const handleResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      const w = containerRef.current ? containerRef.current.clientWidth : 800;
      const h = containerRef.current ? containerRef.current.clientHeight : 600;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    handleResize();
      window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    const onPointerDown = (e) => {
      stateRef.current.isDragging = true;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      stateRef.current.prevMouseX = clientX;
      stateRef.current.prevMouseY = clientY;
    };

    const onPointerMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

      if (stateRef.current.isDragging) {
        const deltaX = clientX - stateRef.current.prevMouseX;
        const deltaY = clientY - stateRef.current.prevMouseY;

        stateRef.current.targetRotY = THREE.MathUtils.clamp(stateRef.current.targetRotY + deltaX * 0.012, -Math.PI * 2, Math.PI * 2);
        stateRef.current.targetRotX = Math.max(
          -0.5,
          Math.min(0.5, stateRef.current.targetRotX + deltaY * 0.008)
        );

        stateRef.current.prevMouseX = clientX;
        stateRef.current.prevMouseY = clientY;
      }
    };

    const onPointerUp = () => {
      stateRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.003;
      stateRef.current.targetCamDist = Math.max(
        4.8,
        Math.min(9.0, stateRef.current.targetCamDist + zoomDelta)
      );
    };

    const canvasDom = canvasRef.current;
    canvasDom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvasDom.addEventListener('wheel', onWheel, { passive: false });

    canvasDom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // ------------------------------------------------------------------------
    // 8. 3D-to-2D Screen Projection for Technical Hotspots
    // ------------------------------------------------------------------------
    const projectToScreen = (vec3) => {
      const v = vec3.clone();
      v.project(camera);
      const w = containerRef.current ? containerRef.current.clientWidth : 800;
      const h = containerRef.current ? containerRef.current.clientHeight : 600;
      return {
        x: ((v.x + 1) * w) / 2,
        y: ((-v.y + 1) * h) / 2,
        visible: v.z < 1,
      };
    };

    // ------------------------------------------------------------------------
    // 9. Main Animation Loop with Kinematics
    // ------------------------------------------------------------------------
    let animId;
    let lastHotspotUpdate = 0;
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) clock.getDelta();
    });
    if (containerRef.current) visibilityObserver.observe(containerRef.current);
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Dynamic Texture Swap
      if (sleeveMaterial) {
        const targetTex = stateRef.current.activeColor === 'camo' ? camoTex : blackTex;
        if (sleeveMaterial.map !== targetTex) {
          sleeveMaterial.map = targetTex;
          sleeveMaterial.roughness = stateRef.current.activeColor === 'camo' ? 0.9 : 0.48;
          sleeveMaterial.metalness = stateRef.current.activeColor === 'camo' ? 0.03 : 0.28;
          sleeveMaterial.needsUpdate = true;
        }
      }

      // Dynamic Lighting Presets
      if (stateRef.current.lightingMode === 'dramatic') {
        keyLight.intensity = 1.0;
        rimLight.intensity = 3.2;
        rimLight.color.setHex(0xf59e0b);
        ambLight.intensity = 0.4;
      } else if (stateRef.current.lightingMode === 'outdoor') {
        keyLight.intensity = 3.2;
        keyLight.position.set(2, 9, 4);
        rimLight.intensity = 1.2;
        rimLight.color.setHex(0xffe4b5);
        ambLight.intensity = 1.2;
      } else {
        // Standard Studio
        keyLight.intensity = 2.4;
        keyLight.position.set(4.5, 7, 5);
        rimLight.intensity = 1.8;
        rimLight.color.setHex(0xf59e0b);
        ambLight.intensity = 0.9;
      }

      // Auto-rotation toggle
      if (stateRef.current.isAutoSpin && !stateRef.current.isDragging) {
        stateRef.current.targetRotY += delta * 0.4;
      }

      // Smooth Lerp Damping
      stateRef.current.rotY = THREE.MathUtils.lerp(
        stateRef.current.rotY,
        stateRef.current.targetRotY,
        delta * 6
      );
      stateRef.current.rotX = THREE.MathUtils.lerp(
        stateRef.current.rotX,
        stateRef.current.targetRotX,
        delta * 6
      );
      stateRef.current.camDist = THREE.MathUtils.lerp(
        stateRef.current.camDist,
        stateRef.current.targetCamDist,
        delta * 6
      );
      stateRef.current.explodedVal = THREE.MathUtils.lerp(
        stateRef.current.explodedVal,
        stateRef.current.targetExploded,
        delta * 6
      );
      stateRef.current.xrayVal = THREE.MathUtils.lerp(
        stateRef.current.xrayVal,
        stateRef.current.targetXray,
        delta * 6
      );
      stateRef.current.lidOpenVal = THREE.MathUtils.lerp(
        stateRef.current.lidOpenVal,
        stateRef.current.targetLidOpen,
        delta * 8
      );
      stateRef.current.sleeveSlideVal = THREE.MathUtils.lerp(
        stateRef.current.sleeveSlideVal,
        stateRef.current.targetSleeveSlide,
        delta * 6
      );

      camera.position.z = stateRef.current.camDist;
      bottleGroup.rotation.y = stateRef.current.rotY;
      bottleGroup.rotation.x = stateRef.current.rotX;

      // Mechanical Flip Lid spring rotation (Rotates 120 degrees backwards on X axis without clipping)
      const lidAngle = stateRef.current.lidOpenVal * 2.1;
      lidPivotGroup.rotation.x = -lidAngle;
      lidPivotGroup.rotation.z = 0;

      // Sleeve Removal Slide Down
      const sleeveSlideY = stateRef.current.sleeveSlideVal * -1.8;
      const exp = stateRef.current.explodedVal;

      // Combined Kinematics
      capGroup.position.y = 1.9 + exp * 1.6;
      capGroup.rotation.z = exp * 0.22;
      seal.position.y = 1.68 + exp * 0.85;
      sleeveGroup.position.y = -0.15 - exp * 1.55 + sleeveSlideY;

      // X-Ray Ghost Mode for Act 3
      const xray = stateRef.current.xrayVal;
      if (sleeveMaterial) {
        sleeveMaterial.opacity = THREE.MathUtils.lerp(1.0, 0.2, xray);
      }

      // Gentle floating bob
      bottleGroup.position.y = -0.1 + Math.sin(time * 1.5) * 0.04;

      // Fluid slosh
      liquid.rotation.y = time * 0.2;
      liquid.scale.y = 1 + Math.sin(time * 2.5) * 0.015;

      // Calculate 3D hotspots screen coordinates when in exploded view
      if (stateRef.current.activeAct === 'partes' && exp > 0.3 && time - lastHotspotUpdate > 1 / 20) {
        lastHotspotUpdate = time;
        bottleGroup.updateMatrixWorld(true);
        const capWorld = new THREE.Vector3(0, capGroup.position.y + 0.35, 0).applyMatrix4(
          bottleGroup.matrixWorld
        );
        const paracordWorld = new THREE.Vector3(
          -0.65,
          capGroup.position.y - 0.05,
          0.1
        ).applyMatrix4(bottleGroup.matrixWorld);
        const bodyWorld = new THREE.Vector3(1.15, jugGroup.position.y + 0.5, 0).applyMatrix4(
          bottleGroup.matrixWorld
        );
        const sleeveWorld = new THREE.Vector3(-1.15, sleeveGroup.position.y, 0).applyMatrix4(
          bottleGroup.matrixWorld
        );
        const pocketWorld = new THREE.Vector3(
          0,
          sleeveGroup.position.y - 0.1,
          1.3
        ).applyMatrix4(bottleGroup.matrixWorld);
        const strapWorld = new THREE.Vector3(
          1.25,
          sleeveGroup.position.y - 0.4,
          0.3
        ).applyMatrix4(bottleGroup.matrixWorld);

        setHotspotCoords({
          cap: projectToScreen(capWorld),
          paracord: projectToScreen(paracordWorld),
          body: projectToScreen(bodyWorld),
          sleeve: projectToScreen(sleeveWorld),
          pocket: projectToScreen(pocketWorld),
          strap: projectToScreen(strapWorld),
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvasDom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvasDom.removeEventListener('wheel', onWheel);
      canvasDom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      [camoTex, blackTex, bumpTex, measureTex, phoneScreenTex, webbingTex].forEach((texture) => texture.dispose());
      keyLight.shadow.map?.dispose();
      renderer.dispose();
    };
  }, []);

  // Quick Camera Presets Handler
  const handleCameraPreset = (preset) => {
    sound.playSwitch();
    setCameraView(preset);
    setIsAutoSpin(false);

    const isExploded = stateRef.current.activeAct === 'partes';

    if (preset === 'front') {
      stateRef.current.targetRotY = 0;
      stateRef.current.targetRotX = 0;
      stateRef.current.targetCamDist = isExploded ? 9.2 : 7.8;
    } else if (preset === 'angle') {
      stateRef.current.targetRotY = Math.PI / 4;
      stateRef.current.targetRotX = 0.12;
      stateRef.current.targetCamDist = isExploded ? 9.2 : 7.8;
    } else if (preset === 'top') {
      stateRef.current.targetRotY = 0;
      stateRef.current.targetRotX = -0.42;
      stateRef.current.targetCamDist = isExploded ? 9.0 : 7.8;
    } else if (preset === 'pocket') {
      stateRef.current.targetRotY = 0;
      stateRef.current.targetRotX = 0.05;
      stateRef.current.targetCamDist = 6.8;
    }
  };

  // Zoom Step Handler
  const handleZoom = (direction) => {
    sound.playClick();
    const step = direction === 'in' ? -0.8 : 0.8;
    stateRef.current.targetCamDist = Math.max(
      4.8,
      Math.min(9.0, stateRef.current.targetCamDist + step)
    );
  };

  return (
    <div className="elementra-studio" ref={containerRef}>
      {/* Real Three.js WebGL 3D Canvas */}
      <canvas ref={canvasRef} className="pure-studio-canvas" role="img" aria-label="Modelo 3D de la botella. Arrastra para rotar y usa los controles para explorar sus piezas." />

      {/* Studio Header Act Indicator & Model Center Button */}
      <div className="studio-top-bar">
        <div className="studio-status">
          <span className="studio-dot"></span>
          <span className="studio-label">ESTUDIO 3D •</span>
          <strong className="studio-act-title">
            {activeAct === 'giro' && 'ACTO I · VISTA 3D INTERACTIVA'}
            {activeAct === 'partes' && 'ACTO II · DESPIECE DE INGENIERÍA'}
            {activeAct === 'specs' && 'ACTO III · CAPACIDAD & RAYOS X'}
          </strong>
        </div>

        {/* Center / Reset Button */}
        <button
          className="studio-reset-btn"
          onClick={() => {
            sound.playClick();
            stateRef.current.targetRotY = 0;
            stateRef.current.targetRotX = 0;
            stateRef.current.targetCamDist = 7.2;
            setIsLidOpen(false);
            setIsSleeveOff(false);
            setIsAutoSpin(true);
            setLightingMode('studio');
            setCameraView('front');
          }}
          title="Restaurar posición y estado original del modelo"
        >
          <RotateCcw size={14} />
          <span>Reset Completo</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* IN-EMULATOR ACTION CONTROLS HUD (User Request: "controles de accion") */}
      {/* ==================================================================== */}
      <div className="emulator-action-controls">
        {/* Row 1: Physical Actions (Open Cap & Slide Off Sleeve) */}
        <div className="action-pills-row">
          <button
            className={`action-pill-btn ${isLidOpen ? 'active' : ''}`}
            onClick={() => {
              sound.playHotspot();
              setIsLidOpen(!isLidOpen);
            }}
            title="Abrir o cerrar la tapa flip-lock en 3D"
          >
            {isLidOpen ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{isLidOpen ? 'Cerrar Tapa' : 'Abrir Tapa 3D'}</span>
          </button>

          <button
            className={`action-pill-btn ${isSleeveOff ? 'active' : ''}`}
            onClick={() => {
              sound.playSwitch();
              setIsSleeveOff(!isSleeveOff);
            }}
            title="Desmontar o colocar la funda de neopreno militar"
          >
            <Layers size={14} />
            <span>{isSleeveOff ? 'Colocar Funda' : 'Desmontar Funda'}</span>
          </button>

          <button
            className={`action-pill-btn ${isAutoSpin ? 'active' : ''}`}
            onClick={() => {
              sound.playClick();
              setIsAutoSpin(!isAutoSpin);
            }}
            title="Pausar o activar el giro continuo 360°"
          >
            {isAutoSpin ? <Pause size={14} /> : <Play size={14} />}
            <span>{isAutoSpin ? 'Pausar Giro' : 'Auto-Giro 360°'}</span>
          </button>
        </div>

        {/* Row 2: Camera Angles & Studio Lighting */}
        <div className="action-pills-row">
          <div className="camera-presets-group">
            <button
              className={`preset-btn ${cameraView === 'front' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('front')}
            >
              Frontal
            </button>
            <button
              className={`preset-btn ${cameraView === 'angle' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('angle')}
            >
              45°
            </button>
            <button
              className={`preset-btn ${cameraView === 'top' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('top')}
            >
              Cenital
            </button>
            <button
              className={`preset-btn ${cameraView === 'pocket' ? 'active' : ''}`}
              onClick={() => handleCameraPreset('pocket')}
            >
              Bolsillo
            </button>
          </div>

          {/* Lighting Mode Selector */}
          <button
            className="lighting-toggle-btn"
            onClick={() => {
              sound.playClick();
              const nextMode =
                lightingMode === 'studio'
                  ? 'dramatic'
                  : lightingMode === 'dramatic'
                  ? 'outdoor'
                  : 'studio';
              setLightingMode(nextMode);
            }}
            title="Cambiar iluminación del estudio fotográfico"
          >
            <Sun size={14} />
            <span>
              {lightingMode === 'studio' && 'Luz Estudio'}
              {lightingMode === 'dramatic' && 'Luz Contraluz'}
              {lightingMode === 'outdoor' && 'Luz Exterior'}
            </span>
          </button>

          {/* Manual Zoom Buttons */}
          <div className="zoom-controls-group">
            <button
              className="zoom-btn"
              onClick={() => handleZoom('in')}
              title="Acercar cámara"
            >
              <ZoomIn size={14} />
            </button>
            <button
              className="zoom-btn"
              onClick={() => handleZoom('out')}
              title="Alejar cámara"
            >
              <ZoomOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Elegant Non-Intrusive 3D Pins & Docked Engineering Inspector (Act 2: Despiece) */}
      {activeAct === 'partes' && (
        <>
          {/* Subtle 3D Pins Layer (Does NOT block buttons or 3D model) */}
          <div className="hotspots-pins-layer">
            {ENGINEERING_PARTS.map((part) => {
              const coords = hotspotCoords[part.key];
              if (!coords || !coords.visible) return null;
              const isSelected = selectedPartId === part.id;
              return (
                <button
                  key={part.id}
                  className={`hotspot-3d-pin ${isSelected ? 'active' : ''}`}
                  style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
                  onClick={() => {
                    sound.playHotspot();
                    setSelectedPartId(part.id);
                  }}
                  title={part.title}
                >
                  <span className="pin-pulse-wave"></span>
                  <span className="pin-num">{part.id}</span>
                </button>
              );
            })}
          </div>

          {/* Docked Engineering Inspector Panel (Housed in safe area, zero collision with action buttons) */}
          {(() => {
            const activePart =
              ENGINEERING_PARTS.find((p) => p.id === selectedPartId) ||
              ENGINEERING_PARTS[0];
            return (
              <div className="engineering-docked-inspector">
                <div className="inspector-top-row">
                  <span className="inspector-kicker">{activePart.tag}</span>
                  <span className="inspector-counter">{activePart.id} / 06</span>
                </div>
                <div className="inspector-content-row">
                  {activePart.img && (
                    <div className="inspector-thumb-frame">
                      <img
                        src={activePart.img}
                        alt={activePart.title}
                        className="inspector-thumb-img"
                      />
                    </div>
                  )}
                  <div className="inspector-text-col">
                    <h4 className="inspector-title">{activePart.title}</h4>
                    <p className="inspector-desc">{activePart.desc}</p>
                  </div>
                </div>
                <div className="inspector-spec-pill">
                  <span className="spec-indicator-dot"></span>
                  <span>{activePart.spec}</span>
                </div>

                {/* 6-Part Quick Navigation Tabs */}
                <div className="inspector-selector-row">
                  {ENGINEERING_PARTS.map((p) => (
                    <button
                      key={p.id}
                      className={`inspector-part-pill ${selectedPartId === p.id ? 'active' : ''}`}
                      onClick={() => {
                        sound.playClick();
                        setSelectedPartId(p.id);
                      }}
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Act 3 HUD: Capacity & Thermal Isolation Overlay */}
      {activeAct === 'specs' && (
        <div className="specs-overlay-hud">
          <div className="spec-stat-card">
            <Droplets size={20} className="text-amber" />
            <div>
              <strong>2.200 ML (74 OZ)</strong>
              <small>Capacidad diaria recomendada en 1 sola carga</small>
            </div>
          </div>

          <div className="spec-stat-card">
            <Thermometer size={20} className="text-amber" />
            <div>
              <strong>HASTA 6H FRÍO · -10°C A 90°C</strong>
              <small>Neopreno 5mm de densidad militar anti-sudor</small>
            </div>
          </div>

          <div className="spec-stat-card">
            <Smartphone size={20} className="text-amber" />
            <div>
              <strong>PHONE POCKET INTEGRADO</strong>
              <small>Protección contra caídas y suelo sucio de máquinas</small>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Hint Bar */}
      <div className="studio-hint-bar">
        <span>Arrastra para rotar libremente · Usa los controles de acción superiores para interactuar</span>
      </div>

      {/* Studio Bottom Navigation: 3 Distinct Acts + Color Dock */}
      <div className="studio-bottom-nav">
        <div className="acts-pill-nav">
          <button
            className={`act-pill-btn ${activeAct === 'giro' ? 'active' : ''}`}
            onClick={() => {
              sound.playSwitch();
              onActChange('giro');
            }}
          >
            <span className="pill-index">01</span>
            <span className="pill-text">Vista 3D 360°</span>
          </button>

          <button
            className={`act-pill-btn ${activeAct === 'partes' ? 'active' : ''}`}
            onClick={() => {
              sound.playHotspot();
              onActChange('partes');
            }}
          >
            <span className="pill-index">02</span>
            <span className="pill-text">Despiece de Ingeniería</span>
          </button>

          <button
            className={`act-pill-btn ${activeAct === 'specs' ? 'active' : ''}`}
            onClick={() => {
              sound.playClick();
              onActChange('specs');
            }}
          >
            <span className="pill-index">03</span>
            <span className="pill-text">Capacidad & Rayos X</span>
          </button>
        </div>

        {/* Live Color Dock */}
        <div className="studio-color-dock">
          <button
            className={`color-dock-btn ${activeColor === 'camo' ? 'active' : ''}`}
            onClick={() => {
              sound.playSwitch();
              onColorChange('camo');
            }}
          >
            <span className="swatch-circle swatch-camo"></span>
            <span className="swatch-name">Camuflaje Ártico</span>
            {activeColor === 'camo' && <Check size={14} className="text-amber" />}
          </button>

          <button
            className={`color-dock-btn ${activeColor === 'black' ? 'active' : ''}`}
            onClick={() => {
              sound.playSwitch();
              onColorChange('black');
            }}
          >
            <span className="swatch-circle swatch-black"></span>
            <span className="swatch-name">Negro Stealth</span>
            {activeColor === 'black' && <Check size={14} className="text-amber" />}
          </button>
        </div>
      </div>
    </div>
  );
}
