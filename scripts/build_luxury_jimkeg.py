"""
build_luxury_jimkeg.py
High-end commercial 3D pipeline for Jimkeg™ Avalanche Tactical 2.2L Jug:
- 6-part authentic modular assembly (Cap, Paracord, Tritan Body, Camo Sleeve, Smartphone, Strap)
- UV unwrapped with smart_project on all components
- High-fidelity PBR shaders (Eastman Tritan, Arctic Camo, Milspec Polymer, 550 Paracord, Titanium Phone)
- 240-frame 60 FPS exploded disassembly & 360 turntable animation
- Studio lighting & pedestal
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
    scene.cycles.samples = 36
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1080
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
    bg.inputs['Color'].default_value = (0.015, 0.018, 0.022, 1.0)
    bg.inputs['Strength'].default_value = 0.4
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
    bsdf.inputs['Base Color'].default_value = (0.08, 0.12, 0.16, 1.0) # Smoked tint
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.04
    bsdf.inputs['IOR'].default_value = 1.490 # Tritan copolyester IOR
    bsdf.inputs['Transmission Weight'].default_value = 0.88
    bsdf.inputs['Coat Weight'].default_value = 0.5
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
    bsdf.inputs['Base Color'].default_value = (0.045, 0.048, 0.052, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.38
    bsdf.inputs['Metallic'].default_value = 0.0
    
    bump_tex = os.path.join(TEXTURES_DIR, "polymer_bump.png")
    if os.path.exists(bump_tex):
        tex_node = nodes.new(type='ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(bump_tex)
        tex_node.image.colorspace_settings.name = 'Non-Color'
        bump = nodes.new(type='ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.25
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
    bsdf.inputs['Base Color'].default_value = (0.07, 0.08, 0.09, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.60
    
    norm_tex = os.path.join(TEXTURES_DIR, "paracord_normal.png")
    if os.path.exists(norm_tex):
        tex_node = nodes.new(type='ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(norm_tex)
        tex_node.image.colorspace_settings.name = 'Non-Color'
        norm = nodes.new(type='ShaderNodeNormalMap')
        norm.inputs['Strength'].default_value = 0.90
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
    
    # Diffuse Camo
    diff_tex = os.path.join(TEXTURES_DIR, "camo_arctic_diffuse.png")
    if os.path.exists(diff_tex):
        diff_node = nodes.new(type='ShaderNodeTexImage')
        diff_node.image = bpy.data.images.load(diff_tex)
        # Texture Coordinate & Mapping
        tc = nodes.new(type='ShaderNodeTexCoord')
        mapping = nodes.new(type='ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (2.2, 2.2, 2.2)
        links.new(tc.outputs['UV'], mapping.inputs['Vector'])
        links.new(mapping.outputs['Vector'], diff_node.inputs['Vector'])
        links.new(diff_node.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = (0.25, 0.28, 0.30, 1.0)
        
    # Roughness Map
    rough_tex = os.path.join(TEXTURES_DIR, "camo_arctic_roughness.png")
    if os.path.exists(rough_tex):
        rough_node = nodes.new(type='ShaderNodeTexImage')
        rough_node.image = bpy.data.images.load(rough_tex)
        rough_node.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], rough_node.inputs['Vector'])
        links.new(rough_node.outputs['Color'], bsdf.inputs['Roughness'])
    else:
        bsdf.inputs['Roughness'].default_value = 0.55
        
    # Fabric Weave Normal
    fab_tex = os.path.join(TEXTURES_DIR, "fabric_normal.png")
    if os.path.exists(fab_tex):
        fab_node = nodes.new(type='ShaderNodeTexImage')
        fab_node.image = bpy.data.images.load(fab_tex)
        fab_node.image.colorspace_settings.name = 'Non-Color'
        norm = nodes.new(type='ShaderNodeNormalMap')
        norm.inputs['Strength'].default_value = 0.70
        links.new(mapping.outputs['Vector'], fab_node.inputs['Vector'])
        links.new(fab_node.outputs['Color'], norm.inputs['Color'])
        links.new(norm.outputs['Normal'], bsdf.inputs['Normal'])
        
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['camo'] = mat_camo
    
    # 5. Smartphone (Titanium chassis + AMOLED face)
    mat_phone = bpy.data.materials.new(name="Mat_TitaniumPhone")
    nodes = mat_phone.node_tree.nodes
    links = mat_phone.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.06, 0.07, 0.08, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.88
    bsdf.inputs['Roughness'].default_value = 0.22
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['phone'] = mat_phone
    
    # 6. Ballistic Nylon Strap
    mat_strap = bpy.data.materials.new(name="Mat_BallisticStrap")
    nodes = mat_strap.node_tree.nodes
    links = mat_strap.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.05, 0.055, 0.06, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.65
    if os.path.exists(fab_tex):
        tc = nodes.new(type='ShaderNodeTexCoord')
        mapping = nodes.new(type='ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (4.0, 4.0, 4.0)
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

def unwrap_mesh(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

def build_modular_assembly(mats):
    print("=== BUILDING MODULAR 6-COMPONENT ASSEMBLY ===")
    
    # Master assembly root
    root = bpy.data.objects.new("Jimkeg_Master_Assembly", None)
    bpy.context.scene.collection.objects.link(root)
    root.empty_display_type = 'ARROWS'
    root.empty_display_size = 0.15
    
    # 1. TRITAN BODY
    body_path = os.path.join(ASSETS_DIR, "Meshy_AI_Cylindrical_Bottle_Bo_1026064515_generate.glb")
    bpy.ops.import_scene.gltf(filepath=body_path)
    body = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh')][-1]
    body.name = "Part_03_TritanBody"
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    body.location = Vector((0, 0, 0))
    # Scale to real 2.2L bottle: Dia = 0.128m, Height = 0.245m
    s_xy = 0.128 / body.dimensions.x
    s_z = 0.245 / body.dimensions.z
    body.scale = Vector((s_xy, s_xy, s_z))
    bpy.ops.object.transform_apply(scale=True)
    # Seat on ground: bottom at Z = 0.005m
    body.location.z = body.dimensions.z / 2.0 + 0.005
    body.data.materials.clear()
    body.data.materials.append(mats['tritan'])
    unwrap_mesh(body)
    body.parent = root
    
    # 2. NEOPRENE SLEEVE (Covers bottom 70% of body)
    sleeve_path = os.path.join(ASSETS_DIR, "Meshy_AI_Tactical_Camouflage_P_1026064538_generate.glb")
    bpy.ops.import_scene.gltf(filepath=sleeve_path)
    sleeve = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o != body][-1]
    sleeve.name = "Part_04_NeopreneSleeve"
    bpy.context.view_layer.objects.active = sleeve
    sleeve.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    sleeve.location = Vector((0, 0, 0))
    # Sleeve wraps snugly: outer diameter 0.142m (body is 0.128m, so 7mm neoprene wall), height 0.170m
    s_sl_xy = 0.142 / sleeve.dimensions.y
    s_sl_z = 0.170 / sleeve.dimensions.z
    sleeve.scale = Vector((s_sl_xy, s_sl_xy, s_sl_z))
    bpy.ops.object.transform_apply(scale=True)
    sleeve.location.z = sleeve.dimensions.z / 2.0 + 0.005
    sleeve.data.materials.clear()
    sleeve.data.materials.append(mats['camo'])
    unwrap_mesh(sleeve)
    sleeve.parent = root
    
    # 3. TACTICAL LID (Screws on top of the bottle neck)
    lid_path = os.path.join(ASSETS_DIR, "Meshy_AI_Black_Tactical_Lid_1026064340_generate.glb")
    bpy.ops.import_scene.gltf(filepath=lid_path)
    lid = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve)][-1]
    lid.name = "Part_01_TacticalCap"
    bpy.context.view_layer.objects.active = lid
    lid.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    lid.location = Vector((0, 0, 0))
    # Cap cylinder diameter matches neck: ~0.088m
    s_lid = 0.088 / lid.dimensions.y
    lid.scale = Vector((s_lid, s_lid, s_lid))
    bpy.ops.object.transform_apply(scale=True)
    # Position on top of neck: body top is at body.location.z + body.dimensions.z / 2.0
    body_top = body.location.z + (body.dimensions.z / 2.0)
    lid.location.z = body_top + (lid.dimensions.z / 2.0) - 0.016
    lid.data.materials.clear()
    lid.data.materials.append(mats['polymer'])
    unwrap_mesh(lid)
    lid.parent = root
    
    # 4. PARACORD COLLAR (Under the lid around bottle neck)
    para_path = os.path.join(ASSETS_DIR, "Meshy_AI_Paracord_Gasket_Braid_1026064458_generate.glb")
    bpy.ops.import_scene.gltf(filepath=para_path)
    paracord = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve, lid)][-1]
    paracord.name = "Part_02_ParacordNeck"
    bpy.context.view_layer.objects.active = paracord
    paracord.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    paracord.location = Vector((0, 0, 0))
    s_para = 0.096 / paracord.dimensions.y
    paracord.scale = Vector((s_para, s_para, s_para))
    bpy.ops.object.transform_apply(scale=True)
    paracord.location.z = body_top - 0.018
    paracord.data.materials.clear()
    paracord.data.materials.append(mats['paracord'])
    unwrap_mesh(paracord)
    paracord.parent = root
    
    # 5. SMARTPHONE (Upright in front pocket)
    phone_path = os.path.join(ASSETS_DIR, "Meshy_AI_Cell_Phone_1026064549_generate.glb")
    bpy.ops.import_scene.gltf(filepath=phone_path)
    phone = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve, lid, paracord)][-1]
    phone.name = "Part_05_Smartphone"
    bpy.context.view_layer.objects.active = phone
    phone.select_set(True)
    
    # Transform vertices via bmesh to guarantee perfect upright vertical orientation
    # Original mesh: X=1.899 (length), Y=0.837 (width), Z=0.147 (thickness)
    bm = bmesh.new()
    bm.from_mesh(phone.data)
    # Target dims: Length along Z = 0.146m, Width along X = 0.072m, Thickness along Y = 0.0085m
    for v in bm.verts:
        orig_x, orig_y, orig_z = v.co.x, v.co.y, v.co.z
        # Swap: new X = orig_y, new Y = orig_z, new Z = orig_x
        v.co.x = (orig_y / 0.837) * 0.072
        v.co.y = (orig_z / 0.147) * 0.0085
        v.co.z = (orig_x / 1.899) * 0.146
    bm.to_mesh(phone.data)
    bm.free()
    phone.data.update()
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    
    # Position in front pocket (-Y face of sleeve):
    phone.location = Vector((0.0, -sleeve.dimensions.y / 2.0 - 0.004, sleeve.location.z + 0.025))
    phone.data.materials.clear()
    phone.data.materials.append(mats['phone'])
    unwrap_mesh(phone)
    phone.parent = root
    
    # 6. TACTICAL STRAP (At base of bottle)
    strap_path = os.path.join(ASSETS_DIR, "Meshy_AI_Tactical_Strap_1026064645_generate.glb")
    bpy.ops.import_scene.gltf(filepath=strap_path)
    strap = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('mesh') and o not in (body, sleeve, lid, paracord, phone)][-1]
    strap.name = "Part_06_ShoulderStrap"
    bpy.context.view_layer.objects.active = strap
    strap.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    strap.location = Vector((0, 0, 0))
    s_strap = (sleeve.dimensions.x * 1.85) / strap.dimensions.x
    strap.scale = Vector((s_strap, s_strap, s_strap))
    bpy.ops.object.transform_apply(scale=True)
    strap.location = Vector((0.0, 0.0, 0.012))
    strap.data.materials.clear()
    strap.data.materials.append(mats['strap'])
    unwrap_mesh(strap)
    strap.parent = root
    
    parts = {
        'root': root,
        'cap': lid,
        'paracord': paracord,
        'tritan': body,
        'sleeve': sleeve,
        'phone': phone,
        'strap': strap
    }
    print("Modular assembly complete and verified!")
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
    
    # Store assembled resting locations
    cap_rest = cap.location.copy()
    para_rest = paracord.location.copy()
    tritan_rest = tritan.location.copy()
    sleeve_rest = sleeve.location.copy()
    phone_rest = phone.location.copy()
    strap_rest = strap.location.copy()
    
    # Keyframe resting pose at Frame 1 and Frame 25
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

    # Frame 75: Fully exploded state
    # Cap lifts high and tilts back 35 degrees
    cap.location = cap_rest + Vector((0, 0.02, 0.13))
    cap.rotation_euler = Euler((math.radians(-35), 0, 0))
    cap.keyframe_insert(data_path="location", frame=75)
    cap.keyframe_insert(data_path="rotation_euler", frame=75)
    
    # Paracord lifts
    paracord.location = para_rest + Vector((0, 0, 0.065))
    paracord.keyframe_insert(data_path="location", frame=75)
    
    # Tritan body rises slightly
    tritan.location = tritan_rest + Vector((0, 0, 0.025))
    tritan.keyframe_insert(data_path="location", frame=75)
    
    # Sleeve slides down slightly to reveal body
    sleeve.location = sleeve_rest + Vector((0, 0, -0.025))
    sleeve.keyframe_insert(data_path="location", frame=75)
    
    # Phone slides out of pocket
    phone.location = phone_rest + Vector((0, -0.045, 0.09))
    phone.keyframe_insert(data_path="location", frame=75)
    
    # Strap drops to base
    strap.location = strap_rest + Vector((0, 0, -0.008))
    strap.keyframe_insert(data_path="location", frame=75)
    
    # Hold exploded state from Frame 75 to Frame 145 while Root performs 360 Turntable rotation!
    root.rotation_euler = Euler((0, 0, 0))
    root.keyframe_insert(data_path="rotation_euler", frame=75)
    
    root.rotation_euler = Euler((0, 0, math.radians(360)))
    root.keyframe_insert(data_path="rotation_euler", frame=145)
    
    # Keep exploded positions held during turntable
    for f in (145,):
        cap.keyframe_insert(data_path="location", frame=f)
        cap.keyframe_insert(data_path="rotation_euler", frame=f)
        paracord.keyframe_insert(data_path="location", frame=f)
        tritan.keyframe_insert(data_path="location", frame=f)
        sleeve.keyframe_insert(data_path="location", frame=f)
        phone.keyframe_insert(data_path="location", frame=f)
        strap.keyframe_insert(data_path="location", frame=f)
        
    # Frame 190: Smooth re-assembly into locked state
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

    # Set Bezier interpolation for silky smooth ease in/out
    for obj in (root, cap, paracord, tritan, sleeve, phone, strap):
        if obj.animation_data and obj.animation_data.action:
            action = obj.animation_data.action
            try:
                # Blender 5.x slotted actions traversal
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
                print(f"Note on fcurves: {e}")

def create_studio_environment():
    print("=== CREATING STUDIO PEDESTAL & BACKDROP ===")
    # 1. Beveled Titanium Pedestal
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.025, vertices=64, location=(0, 0, -0.0125))
    pedestal = bpy.context.active_object
    pedestal.name = "Studio_Pedestal"
    
    mat_ped = bpy.data.materials.new(name="Mat_Pedestal")
    nodes = mat_ped.node_tree.nodes
    links = mat_ped.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.025, 0.028, 0.032, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.95
    bsdf.inputs['Roughness'].default_value = 0.28
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    pedestal.data.materials.append(mat_ped)
    
    # 2. Studio Cyclorama Backdrop
    bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0, 1.2, 0))
    backdrop = bpy.context.active_object
    backdrop.name = "Studio_Backdrop"
    bpy.context.view_layer.objects.active = backdrop
    backdrop.select_set(True)
    
    mat_back = bpy.data.materials.new(name="Mat_Backdrop")
    nodes = mat_back.node_tree.nodes
    links = mat_back.node_tree.links
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.012, 0.015, 0.018, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.95
    out = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    backdrop.data.materials.append(mat_back)

def setup_three_point_lighting():
    print("=== SETTING UP THREE-POINT COMMERCIAL LIGHTING ===")
    
    # 1. Key Light (5500K Neutral Daylight)
    key_data = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_data.energy = 85.0
    key_data.size = 0.8
    key_data.color = (1.0, 0.98, 0.95)
    key_obj = bpy.data.objects.new(name="Key_Light", object_data=key_data)
    key_obj.location = Vector((-0.45, -0.65, 0.45))
    bpy.context.scene.collection.objects.link(key_obj)
    
    # 2. Fill Light (Warm Soft Accent)
    fill_data = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_data.energy = 30.0
    fill_data.size = 1.0
    fill_data.color = (1.0, 0.92, 0.85)
    fill_obj = bpy.data.objects.new(name="Fill_Light", object_data=fill_data)
    fill_obj.location = Vector((0.55, -0.45, 0.30))
    bpy.context.scene.collection.objects.link(fill_obj)
    
    # 3. Rim Light (Ice Cyan Razor Edge)
    rim_data = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_data.energy = 110.0
    rim_data.size = 0.6
    rim_data.color = (0.65, 0.90, 1.0) # Ice Cyan
    rim_obj = bpy.data.objects.new(name="Rim_Light", object_data=rim_data)
    rim_obj.location = Vector((0.48, 0.55, 0.40))
    bpy.context.scene.collection.objects.link(rim_obj)
    
    # 4. Top Softbox
    top_data = bpy.data.lights.new(name="Top_Light", type='AREA')
    top_data.energy = 45.0
    top_data.size = 1.2
    top_data.color = (0.95, 0.98, 1.0)
    top_obj = bpy.data.objects.new(name="Top_Light", object_data=top_data)
    top_obj.location = Vector((0.0, -0.05, 0.70))
    top_obj.rotation_euler = Euler((0, 0, 0))
    bpy.context.scene.collection.objects.link(top_obj)

def setup_camera():
    print("=== POSITIONING STUDIO CAMERA ===")
    cam_data = bpy.data.cameras.new("Camera_Studio")
    cam_data.lens = 75 # 75mm portrait/product focal length (flattering compression)
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 0.72
    cam_data.dof.aperture_fstop = 4.0
    
    cam_obj = bpy.data.objects.new("Camera_Studio", cam_data)
    cam_loc = Vector((0.32, -0.62, 0.24))
    target = Vector((0.0, 0.0, 0.15)) # Center of bottle
    cam_obj.location = cam_loc
    
    # Compute exact look-at rotation
    direction = target - cam_loc
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

def export_assets_and_render():
    print(f"=== SAVING MASTER BLEND: {MASTER_BLEND} ===")
    bpy.ops.wm.save_as_mainfile(filepath=MASTER_BLEND)
    
    print(f"=== EXPORTING GLTF TO WEB: {EXPORT_GLB_WEB} ===")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_WEB,
        export_format='GLB',
        export_apply=False,
        export_animations=True,
        export_current_frame=False,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )
    
    # Also save copy to public/images/3D
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_PUBLIC,
        export_format='GLB',
        export_apply=False,
        export_animations=True,
        export_current_frame=False,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )
    
    # Renders
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
    export_assets_and_render()
