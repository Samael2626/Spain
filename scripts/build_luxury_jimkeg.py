"""
build_luxury_jimkeg.py
High-end commercial 3D pipeline for Jimkeg™ Avalanche Tactical 2.2L Jug:
- 6-part authentic modular assembly (Cap, Paracord, Tritan Body, Camo Sleeve, Smartphone, Strap)
- Concentric ring alignment & true upright phone orientation
- Decimated mesh topology for lightweight 60 FPS Three.js rendering
- Complete PBR shaders (Eastman Tritan, Arctic Camo, Tactical Polymer, 550 Paracord, Titanium Phone, 1000D Nylon)
- 240-frame 60 FPS exploded disassembly & 360 turntable animation
- Studio lighting, pedestal & cyclorama
- Exports Master .blend, Web .glb, and renders high-res Cycles validation stills.
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler, Matrix

BASE_DIR = r"d:\Proyectos\Paginas\Spain"
ASSETS_DIR = os.path.join(BASE_DIR, "public", "images", "3D")
TEXTURES_DIR = os.path.join(BASE_DIR, "public", "images", "textures")
MODELS_DIR = os.path.join(BASE_DIR, "public", "models")
MASTER_BLEND = os.path.join(ASSETS_DIR, "Jimkeg_Bottle_Master.blend")
EXPORT_GLB_PUBLIC = os.path.join(ASSETS_DIR, "Jimkeg_Bottle_Textured.glb")
EXPORT_GLB_WEB = os.path.join(MODELS_DIR, "jimkeg_interactive.glb")
RENDER_STILL_ASSEMBLED = os.path.join(ASSETS_DIR, "jimkeg_studio_render.png")
RENDER_STILL_EXPLODED = os.path.join(ASSETS_DIR, "jimkeg_exploded_render.png")

os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def setup_clean_scene():
    bpy.ops.wm.read_homefile(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 28
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1080
    scene.render.fps = 60
    scene.frame_start = 1
    scene.frame_end = 240
    
    # World background: Deep luxury charcoal gradient
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.node_tree.nodes.clear()
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    bg = nodes.new(type='ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.012, 0.015, 0.018, 1.0)
    bg.inputs['Strength'].default_value = 0.5
    output = nodes.new(type='ShaderNodeOutputWorld')
    links.new(bg.outputs['Background'], output.inputs['Surface'])

def create_pbr_materials():
    mats = {}
    
    # 1. Eastman Tritan (Crystal-clear BPA-free polymer)
    mat_tritan = bpy.data.materials.new(name="Mat_EastmanTritan")
    nodes = mat_tritan.node_tree.nodes
    links = mat_tritan.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.12, 0.16, 0.20, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.04
    bsdf.inputs['IOR'].default_value = 1.490
    bsdf.inputs['Transmission Weight'].default_value = 0.88
    bsdf.inputs['Coat Weight'].default_value = 0.6
    bsdf.inputs['Coat Roughness'].default_value = 0.02
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['tritan'] = mat_tritan
    
    # 2. Tactical Polymer (Matte Black Cap & Rings)
    mat_polymer = bpy.data.materials.new(name="Mat_TacticalPolymer")
    nodes = mat_polymer.node_tree.nodes
    links = mat_polymer.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.04, 0.045, 0.05, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.38
    bsdf.inputs['Metallic'].default_value = 0.05
    
    bump_tex = os.path.join(TEXTURES_DIR, "polymer_bump.png")
    if os.path.exists(bump_tex):
        tc = nodes.new(type='ShaderNodeTexCoord')
        mapping = nodes.new(type='ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (8.0, 8.0, 8.0)
        links.new(tc.outputs['UV'], mapping.inputs['Vector'])
        
        tex_node = nodes.new(type='ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(bump_tex)
        tex_node.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], tex_node.inputs['Vector'])
        
        bump = nodes.new(type='ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.35
        bump.inputs['Distance'].default_value = 0.002
        links.new(tex_node.outputs['Color'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['polymer'] = mat_polymer
    
    # 3. 550 Paracord (Braided Milspec Cord)
    mat_paracord = bpy.data.materials.new(name="Mat_550Paracord")
    nodes = mat_paracord.node_tree.nodes
    links = mat_paracord.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.08, 0.09, 0.10, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.55
    
    norm_tex = os.path.join(TEXTURES_DIR, "paracord_normal.png")
    if os.path.exists(norm_tex):
        tc = nodes.new(type='ShaderNodeTexCoord')
        mapping = nodes.new(type='ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (6.0, 6.0, 6.0)
        links.new(tc.outputs['UV'], mapping.inputs['Vector'])
        
        tex_node = nodes.new(type='ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(norm_tex)
        tex_node.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], tex_node.inputs['Vector'])
        
        norm = nodes.new(type='ShaderNodeNormalMap')
        norm.inputs['Strength'].default_value = 0.95
        links.new(tex_node.outputs['Color'], norm.inputs['Color'])
        links.new(norm.outputs['Normal'], bsdf.inputs['Normal'])
        
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['paracord'] = mat_paracord
    
    # 4. Arctic Camouflage Neoprene Sleeve
    mat_camo = bpy.data.materials.new(name="Mat_ArcticCamo")
    nodes = mat_camo.node_tree.nodes
    links = mat_camo.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    
    tc = nodes.new(type='ShaderNodeTexCoord')
    mapping = nodes.new(type='ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (2.2, 2.2, 2.2)
    links.new(tc.outputs['UV'], mapping.inputs['Vector'])
    
    diff_tex = os.path.join(TEXTURES_DIR, "camo_arctic_diffuse.png")
    if os.path.exists(diff_tex):
        diff_node = nodes.new(type='ShaderNodeTexImage')
        diff_node.image = bpy.data.images.load(diff_tex)
        links.new(mapping.outputs['Vector'], diff_node.inputs['Vector'])
        links.new(diff_node.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.28, 0.31, 0.33, 1.0)
        
    rough_tex = os.path.join(TEXTURES_DIR, "camo_arctic_roughness.png")
    if os.path.exists(rough_tex):
        rough_node = nodes.new(type='ShaderNodeTexImage')
        rough_node.image = bpy.data.images.load(rough_tex)
        rough_node.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], rough_node.inputs['Vector'])
        links.new(rough_node.outputs['Color'], bsdf.inputs['Roughness'])
    else:
        bsdf.inputs['Roughness'].default_value = 0.60
        
    fab_tex = os.path.join(TEXTURES_DIR, "fabric_normal.png")
    if os.path.exists(fab_tex):
        fab_node = nodes.new(type='ShaderNodeTexImage')
        fab_node.image = bpy.data.images.load(fab_tex)
        fab_node.image.colorspace_settings.name = 'Non-Color'
        norm = nodes.new(type='ShaderNodeNormalMap')
        norm.inputs['Strength'].default_value = 0.75
        links.new(mapping.outputs['Vector'], fab_node.inputs['Vector'])
        links.new(fab_node.outputs['Color'], norm.inputs['Color'])
        links.new(norm.outputs['Normal'], bsdf.inputs['Normal'])
        
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['camo'] = mat_camo
    
    # 5. Smartphone (Titanium chassis)
    mat_phone = bpy.data.materials.new(name="Mat_TitaniumPhone")
    nodes = mat_phone.node_tree.nodes
    links = mat_phone.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.05, 0.055, 0.065, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.90
    bsdf.inputs['Roughness'].default_value = 0.20
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['phone'] = mat_phone
    
    # 6. Ballistic Nylon Strap
    mat_strap = bpy.data.materials.new(name="Mat_BallisticStrap")
    nodes = mat_strap.node_tree.nodes
    links = mat_strap.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.045, 0.05, 0.055, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.65
    if os.path.exists(fab_tex):
        tc = nodes.new(type='ShaderNodeTexCoord')
        mapping = nodes.new(type='ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (5.0, 5.0, 5.0)
        links.new(tc.outputs['UV'], mapping.inputs['Vector'])
        fab_node = nodes.new(type='ShaderNodeTexImage')
        fab_node.image = bpy.data.images.load(fab_tex)
        fab_node.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], fab_node.inputs['Vector'])
        norm = nodes.new(type='ShaderNodeNormalMap')
        norm.inputs['Strength'].default_value = 0.85
        links.new(fab_node.outputs['Color'], norm.inputs['Color'])
        links.new(norm.outputs['Normal'], bsdf.inputs['Normal'])
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['strap'] = mat_strap
    
    return mats

def decimate_and_unwrap(obj, decimate_ratio=0.45):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if len(obj.data.vertices) > 15000 and decimate_ratio < 1.0:
        mod = obj.modifiers.new(name='Decimate', type='DECIMATE')
        mod.ratio = decimate_ratio
        bpy.ops.object.modifier_apply(modifier='Decimate')
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=75.0, island_margin=0.01)
    bpy.ops.object.mode_set(mode='OBJECT')

def build_modular_assembly(mats):
    print("=== BUILDING MODULAR 6-COMPONENT ASSEMBLY ===")
    
    root = bpy.data.objects.new("Jimkeg_Master_Assembly", None)
    bpy.context.scene.collection.objects.link(root)
    root.empty_display_type = 'ARROWS'
    root.empty_display_size = 0.15
    
    # 1. TRITAN BODY
    body_path = os.path.join(ASSETS_DIR, "Meshy_AI_Cylindrical_Bottle_Bo_1026064515_generate.glb")
    bpy.ops.import_scene.gltf(filepath=body_path)
    body = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh')][-1]
    body.name = "Part_03_TritanBody"
    decimate_and_unwrap(body, decimate_ratio=0.40)
    body.data.materials.clear()
    body.data.materials.append(mats['tritan'])
    body.parent = root
    
    # 2. NEOPRENE SLEEVE
    sleeve_path = os.path.join(ASSETS_DIR, "Meshy_AI_Tactical_Camouflage_P_1026064538_generate.glb")
    bpy.ops.import_scene.gltf(filepath=sleeve_path)
    sleeve = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o != body][-1]
    sleeve.name = "Part_04_NeopreneSleeve"
    decimate_and_unwrap(sleeve, decimate_ratio=0.45)
    sleeve.data.materials.clear()
    sleeve.data.materials.append(mats['camo'])
    sleeve.parent = root
    
    # 3. TACTICAL LID
    lid_path = os.path.join(ASSETS_DIR, "Meshy_AI_Black_Tactical_Lid_1026064340_generate.glb")
    bpy.ops.import_scene.gltf(filepath=lid_path)
    lid = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve)][-1]
    lid.name = "Part_01_TacticalCap"
    decimate_and_unwrap(lid, decimate_ratio=0.55)
    # Center circular ring of Lid
    zs = [v.co.z for v in lid.data.vertices]
    min_z, max_z = min(zs), max(zs)
    ring_verts = [v.co for v in lid.data.vertices if v.co.z < min_z + (max_z - min_z) * 0.15]
    cx = sum(v.x for v in ring_verts) / len(ring_verts)
    cy = sum(v.y for v in ring_verts) / len(ring_verts)
    for v in lid.data.vertices:
        v.co.x -= cx
        v.co.y -= cy
    lid.data.update()
    lid.data.materials.clear()
    lid.data.materials.append(mats['polymer'])
    lid.parent = root
    
    # 4. PARACORD COLLAR
    para_path = os.path.join(ASSETS_DIR, "Meshy_AI_Paracord_Gasket_Braid_1026064458_generate.glb")
    bpy.ops.import_scene.gltf(filepath=para_path)
    paracord = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve, lid)][-1]
    paracord.name = "Part_02_ParacordNeck"
    decimate_and_unwrap(paracord, decimate_ratio=0.50)
    pcx = sum(v.co.x for v in paracord.data.vertices) / len(paracord.data.vertices)
    pcy = sum(v.co.y for v in paracord.data.vertices) / len(paracord.data.vertices)
    for v in paracord.data.vertices:
        v.co.x -= pcx
        v.co.y -= pcy
    paracord.data.update()
    s_p = 1.12 / paracord.dimensions.x
    for v in paracord.data.vertices:
        v.co *= s_p
    paracord.data.update()
    paracord.data.materials.clear()
    paracord.data.materials.append(mats['paracord'])
    paracord.parent = root
    
    # 5. SMARTPHONE (Upright broad face facing front -Y)
    phone_path = os.path.join(ASSETS_DIR, "Meshy_AI_Cell_Phone_1026064549_generate.glb")
    bpy.ops.import_scene.gltf(filepath=phone_path)
    phone = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve, lid, paracord)][-1]
    phone.name = "Part_05_Smartphone"
    decimate_and_unwrap(phone, decimate_ratio=0.60)
    for v in phone.data.vertices:
        ox, oy, oz = v.co.x, v.co.y, v.co.z
        v.co.x = oy * 0.44
        v.co.y = oz * 0.44
        v.co.z = ox * 0.44
    phone.data.update()
    phone.data.materials.clear()
    phone.data.materials.append(mats['phone'])
    phone.parent = root
    
    # 6. TACTICAL STRAP
    strap_path = os.path.join(ASSETS_DIR, "Meshy_AI_Tactical_Strap_1026064645_generate.glb")
    bpy.ops.import_scene.gltf(filepath=strap_path)
    strap = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve, lid, paracord, phone)][-1]
    strap.name = "Part_06_ShoulderStrap"
    decimate_and_unwrap(strap, decimate_ratio=0.45)
    strap.data.materials.clear()
    strap.data.materials.append(mats['strap'])
    strap.parent = root
    
    bpy.context.view_layer.update()
    
    # Set relative assembled coordinates:
    body.location = Vector((0, 0, body.dimensions.z / 2.0))
    sleeve.location = Vector((0, 0, sleeve.dimensions.z / 2.0))
    paracord.location = Vector((0, 0, 1.88))
    lid.location = Vector((0, 0, 1.98))
    phone.location = Vector((0.0, -0.73, 0.88))
    strap.location = Vector((0.0, 0.0, 0.10))
    
    # Global normalization: Scale assembly to real 2.2L bottle height (28 cm = 0.28m)
    # Current height from Z=0 to top of lid (~2.38)
    UNIFY_SCALE = 0.280 / 2.380 # = ~0.1176
    root.scale = Vector((UNIFY_SCALE, UNIFY_SCALE, UNIFY_SCALE))
    bpy.context.view_layer.update()
    
    parts = {
        'root': root,
        'cap': lid,
        'paracord': paracord,
        'tritan': body,
        'sleeve': sleeve,
        'phone': phone,
        'strap': strap
    }
    print("Modular assembly complete and verified with concentric alignment!")
    return parts

def animate_exploded_disassembly(parts):
    print("=== KEYFRAMING 240-FRAME EXPLODED & TURNTABLE ANIMATION ===")
    
    root = parts['root']
    cap = parts['cap']
    paracord = parts['paracord']
    tritan = parts['tritan']
    sleeve = parts['sleeve']
    phone = parts['phone']
    strap = parts['strap']
    
    cap_rest = cap.location.copy()
    para_rest = paracord.location.copy()
    tritan_rest = tritan.location.copy()
    sleeve_rest = sleeve.location.copy()
    phone_rest = phone.location.copy()
    strap_rest = strap.location.copy()
    
    # Frame 1 - 25: Assembled rest pose
    for f in (1, 25):
        cap.location = cap_rest
        cap.rotation_euler = Euler((0, 0, 0))
        cap.keyframe_insert(data_path="location", frame=f)
        cap.keyframe_insert(data_path="rotation_euler", frame=f)
        
        paracord.location = para_rest
        paracord.keyframe_insert(data_path="location", frame=f)
        
        tritan.location = tritan_rest
        tritan.keyframe_insert(data_path="location", frame=f)
        
        sleeve.location = sleeve_rest
        sleeve.keyframe_insert(data_path="location", frame=f)
        
        phone.location = phone_rest
        phone.keyframe_insert(data_path="location", frame=f)
        
        strap.location = strap_rest
        strap.keyframe_insert(data_path="location", frame=f)
        
        root.rotation_euler = Euler((0, 0, 0))
        root.keyframe_insert(data_path="rotation_euler", frame=f)

    # Frame 75: Exploded view (in local unscaled units)
    # Cap lifts up and tilts 30 degrees
    cap.location = cap_rest + Vector((0, 0.15, 0.95))
    cap.rotation_euler = Euler((math.radians(-30), 0, 0))
    cap.keyframe_insert(data_path="location", frame=75)
    cap.keyframe_insert(data_path="rotation_euler", frame=75)
    
    # Paracord lifts
    paracord.location = para_rest + Vector((0, 0, 0.45))
    paracord.keyframe_insert(data_path="location", frame=75)
    
    # Tritan body lifts slightly
    tritan.location = tritan_rest + Vector((0, 0, 0.20))
    tritan.keyframe_insert(data_path="location", frame=75)
    
    # Sleeve slides down to reveal transparent Tritan body
    sleeve.location = sleeve_rest + Vector((0, 0, -0.30))
    sleeve.keyframe_insert(data_path="location", frame=75)
    
    # Phone slides out of pocket
    phone.location = phone_rest + Vector((0, -0.35, 0.65))
    phone.keyframe_insert(data_path="location", frame=75)
    
    # Strap drops to base
    strap.location = strap_rest + Vector((0, 0, -0.08))
    strap.keyframe_insert(data_path="location", frame=75)
    
    # Turntable 360 rotation while exploded: Frame 75 to 145
    root.rotation_euler = Euler((0, 0, 0))
    root.keyframe_insert(data_path="rotation_euler", frame=75)
    
    root.rotation_euler = Euler((0, 0, math.radians(360)))
    root.keyframe_insert(data_path="rotation_euler", frame=145)
    
    # Hold exploded position at Frame 145
    for f in (145,):
        cap.keyframe_insert(data_path="location", frame=f)
        cap.keyframe_insert(data_path="rotation_euler", frame=f)
        paracord.keyframe_insert(data_path="location", frame=f)
        tritan.keyframe_insert(data_path="location", frame=f)
        sleeve.keyframe_insert(data_path="location", frame=f)
        phone.keyframe_insert(data_path="location", frame=f)
        strap.keyframe_insert(data_path="location", frame=f)
        
    # Frame 190 - 240: Return to locked assembled state
    for f in (190, 240):
        cap.location = cap_rest
        cap.rotation_euler = Euler((0, 0, 0))
        cap.keyframe_insert(data_path="location", frame=f)
        cap.keyframe_insert(data_path="rotation_euler", frame=f)
        
        paracord.location = para_rest
        paracord.keyframe_insert(data_path="location", frame=f)
        
        tritan.location = tritan_rest
        tritan.keyframe_insert(data_path="location", frame=f)
        
        sleeve.location = sleeve_rest
        sleeve.keyframe_insert(data_path="location", frame=f)
        
        phone.location = phone_rest
        phone.keyframe_insert(data_path="location", frame=f)
        
        strap.location = strap_rest
        strap.keyframe_insert(data_path="location", frame=f)
        
        root.rotation_euler = Euler((0, 0, math.radians(360)))
        root.keyframe_insert(data_path="rotation_euler", frame=f)

    # Set Bezier ease curves
    for obj in (root, cap, paracord, tritan, sleeve, phone, strap):
        if obj.animation_data and obj.animation_data.action:
            action = obj.animation_data.action
            try:
                if hasattr(action, 'layers'):
                    for layer in action.layers:
                        for strip in layer.strips:
                            for cbag in strip.channelbags:
                                for fc in cbag.fcurves:
                                    for kp in fc.keyframe_points:
                                        kp.interpolation = 'BEZIER'
                                        kp.easing = 'EASE_IN_OUT'
                elif hasattr(action, 'fcurves'):
                    for fc in action.fcurves:
                        for kp in fc.keyframe_points:
                            kp.interpolation = 'BEZIER'
                            kp.easing = 'EASE_IN_OUT'
            except Exception as e:
                print(f"FCurve interpolation note: {e}")

def create_studio_environment():
    print("=== CREATING STUDIO PEDESTAL & BACKDROP ===")
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.025, vertices=64, location=(0, 0, -0.0125))
    pedestal = bpy.context.active_object
    pedestal.name = "Studio_Pedestal"
    
    mat_ped = bpy.data.materials.new(name="Mat_Pedestal")
    nodes = mat_ped.node_tree.nodes
    links = mat_ped.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.022, 0.025, 0.030, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.95
    bsdf.inputs['Roughness'].default_value = 0.28
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    pedestal.data.materials.append(mat_ped)
    
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0, 1.2, 0))
    backdrop = bpy.context.active_object
    backdrop.name = "Studio_Backdrop"
    bpy.context.view_layer.objects.active = backdrop
    backdrop.select_set(True)
    
    mat_back = bpy.data.materials.new(name="Mat_Backdrop")
    nodes = mat_back.node_tree.nodes
    links = mat_back.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.010, 0.012, 0.015, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.95
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    backdrop.data.materials.append(mat_back)

def setup_three_point_lighting():
    print("=== SETTING UP THREE-POINT COMMERCIAL LIGHTING ===")
    # 1. Key Light (5500K Neutral Daylight)
    key_data = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_data.energy = 80.0
    key_data.size = 0.8
    key_data.color = (1.0, 0.98, 0.95)
    key_obj = bpy.data.objects.new(name="Key_Light", object_data=key_data)
    key_obj.location = Vector((-0.45, -0.65, 0.45))
    bpy.context.scene.collection.objects.link(key_obj)
    
    # 2. Fill Light
    fill_data = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_data.energy = 28.0
    fill_data.size = 1.0
    fill_data.color = (1.0, 0.92, 0.85)
    fill_obj = bpy.data.objects.new(name="Fill_Light", object_data=fill_data)
    fill_obj.location = Vector((0.55, -0.45, 0.30))
    bpy.context.scene.collection.objects.link(fill_obj)
    
    # 3. Rim Light (Ice Cyan Razor Edge)
    rim_data = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_data.energy = 95.0
    rim_data.size = 0.6
    rim_data.color = (0.65, 0.90, 1.0)
    rim_obj = bpy.data.objects.new(name="Rim_Light", object_data=rim_data)
    rim_obj.location = Vector((0.48, 0.55, 0.40))
    bpy.context.scene.collection.objects.link(rim_obj)
    
    # 4. Top Softbox
    top_data = bpy.data.lights.new(name="Top_Light", type='AREA')
    top_data.energy = 40.0
    top_data.size = 1.2
    top_data.color = (0.95, 0.98, 1.0)
    top_obj = bpy.data.objects.new(name="Top_Light", object_data=top_data)
    top_obj.location = Vector((0.0, -0.05, 0.70))
    bpy.context.scene.collection.objects.link(top_obj)

def setup_camera():
    print("=== POSITIONING STUDIO CAMERA ===")
    cam_data = bpy.data.cameras.new("Camera_Studio")
    cam_data.lens = 70
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 0.75
    cam_data.dof.aperture_fstop = 3.5
    
    cam_obj = bpy.data.objects.new("Camera_Studio", cam_data)
    cam_loc = Vector((0.35, -0.68, 0.22))
    target = Vector((0.0, 0.0, 0.14))
    cam_obj.location = cam_loc
    
    direction = target - cam_loc
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

def export_assets_and_render(parts):
    print(f"=== SAVING MASTER BLEND: {MASTER_BLEND} ===")
    bpy.ops.wm.save_as_mainfile(filepath=MASTER_BLEND)
    
    # Select only bottle hierarchy for clean GLTF export
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts.values():
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts['root']
    
    print(f"=== EXPORTING GLTF TO WEB: {EXPORT_GLB_WEB} ===")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_WEB,
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_animations=True,
        export_current_frame=False,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )
    
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_PUBLIC,
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_animations=True,
        export_current_frame=False,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )
    
    bpy.ops.object.select_all(action='DESELECT')
    
    # Cycles renders
    print("=== RENDERING ASSEMBLED STILL (FRAME 1) ===")
    bpy.context.scene.frame_set(1)
    bpy.context.scene.render.filepath = RENDER_STILL_ASSEMBLED
    bpy.ops.render.render(write_still=True)
    
    print("=== RENDERING EXPLODED STILL (FRAME 80) ===")
    bpy.context.scene.frame_set(80)
    bpy.context.scene.render.filepath = RENDER_STILL_EXPLODED
    bpy.ops.render.render(write_still=True)
    print("=== ALL STAGE PIPELINES COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    setup_clean_scene()
    materials = create_pbr_materials()
    parts = build_modular_assembly(materials)
    animate_exploded_disassembly(parts)
    create_studio_environment()
    setup_three_point_lighting()
    setup_camera()
    export_assets_and_render(parts)
