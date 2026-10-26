import bpy
import bmesh
import mathutils
from mathutils import Vector, Euler
import math
import os

print("=== STARTING CLEAN SEGMENTATION & PBR PIPELINE ===")

base_dir = r"d:\Proyectos\Paginas\Spain\public\images\3D"
tex_dir = r"d:\Proyectos\Paginas\Spain\public\images\textures"
blend_path = os.path.join(base_dir, "Jimkeg_Bottle_Master.blend")
glb_out_path = os.path.join(base_dir, "Jimkeg_Bottle_Textured.glb")
web_glb_path = r"d:\Proyectos\Paginas\Spain\public\models\jimkeg_interactive.glb"
render_out_path = os.path.join(base_dir, "jimkeg_studio_render.png")
os.makedirs(r"d:\Proyectos\Paginas\Spain\public\models", exist_ok=True)

# 1. Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 60
scene.frame_start = 1
scene.frame_end = 240
scene.render.engine = 'BLENDER_EEVEE'

# World
world = bpy.data.worlds.new(name="StudioWorld")
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs['Color'].default_value = (0.010, 0.012, 0.016, 1.0)
bg.inputs['Strength'].default_value = 0.40

# -------------------------------------------------------------
# 2. PBR MATERIALS
# -------------------------------------------------------------
print("Creating PBR materials...")

# Mat 1: Eastman Tritan (Smoked semi-transparent shatterproof polymer)
mat_tritan = bpy.data.materials.new(name="Mat_EastmanTritan")
mat_tritan.use_nodes = True
bsdf_tritan = next(n for n in mat_tritan.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_tritan.inputs['Base Color'].default_value = (0.045, 0.065, 0.095, 1.0)
bsdf_tritan.inputs['Roughness'].default_value = 0.06
bsdf_tritan.inputs['IOR'].default_value = 1.49
bsdf_tritan.inputs['Transmission Weight'].default_value = 0.85
bsdf_tritan.inputs['Specular IOR Level'].default_value = 0.50

# Mat 2: Black Tactical Polymer (Matte molded cap, handle, latch)
mat_polymer = bpy.data.materials.new(name="Mat_BlackTacticalPolymer")
mat_polymer.use_nodes = True
nodes_poly = mat_polymer.node_tree.nodes
bsdf_poly = next(n for n in nodes_poly if n.type == 'BSDF_PRINCIPLED')
bsdf_poly.inputs['Base Color'].default_value = (0.028, 0.030, 0.034, 1.0)
bsdf_poly.inputs['Roughness'].default_value = 0.38
bsdf_poly.inputs['Specular IOR Level'].default_value = 0.45
tex_poly_path = os.path.join(tex_dir, "polymer_bump.png")
if os.path.exists(tex_poly_path):
    tex_img_poly = nodes_poly.new('ShaderNodeTexImage')
    tex_img_poly.image = bpy.data.images.load(tex_poly_path)
    bump_poly = nodes_poly.new('ShaderNodeBump')
    bump_poly.inputs['Strength'].default_value = 0.08
    bump_poly.inputs['Distance'].default_value = 0.01
    mat_polymer.node_tree.links.new(tex_img_poly.outputs['Color'], bump_poly.inputs['Height'])
    mat_polymer.node_tree.links.new(bump_poly.outputs['Normal'], bsdf_poly.inputs['Normal'])

# Mat 3: 550 Paracord (Braided cordage)
mat_paracord = bpy.data.materials.new(name="Mat_550Paracord")
mat_paracord.use_nodes = True
nodes_pc = mat_paracord.node_tree.nodes
bsdf_pc = next(n for n in nodes_pc if n.type == 'BSDF_PRINCIPLED')
bsdf_pc.inputs['Base Color'].default_value = (0.040, 0.045, 0.055, 1.0)
bsdf_pc.inputs['Roughness'].default_value = 0.65
bsdf_pc.inputs['Sheen Weight'].default_value = 0.50
tex_pc_path = os.path.join(tex_dir, "paracord_normal.png")
if os.path.exists(tex_pc_path):
    tex_img_pc = nodes_pc.new('ShaderNodeTexImage')
    tex_img_pc.image = bpy.data.images.load(tex_pc_path)
    tex_img_pc.image.colorspace_settings.name = 'Non-Color'
    norm_pc = nodes_pc.new('ShaderNodeNormalMap')
    norm_pc.inputs['Strength'].default_value = 0.80
    mat_paracord.node_tree.links.new(tex_img_pc.outputs['Color'], norm_pc.inputs['Color'])
    mat_paracord.node_tree.links.new(norm_pc.outputs['Normal'], bsdf_pc.inputs['Normal'])

# Mat 4: Arctic Grey Camo Neoprene Sleeve (Triplanar Box projection)
mat_camo = bpy.data.materials.new(name="Mat_ArcticCamoSleeve")
mat_camo.use_nodes = True
nodes_camo = mat_camo.node_tree.nodes
bsdf_camo = next(n for n in nodes_camo if n.type == 'BSDF_PRINCIPLED')
bsdf_camo.inputs['Roughness'].default_value = 0.72
bsdf_camo.inputs['Sheen Weight'].default_value = 0.55
node_coord = nodes_camo.new('ShaderNodeTexCoord')
node_mapping = nodes_camo.new('ShaderNodeMapping')
node_mapping.inputs['Scale'].default_value = (5.5, 5.5, 5.5)
mat_camo.node_tree.links.new(node_coord.outputs['Object'], node_mapping.inputs['Vector'])

tex_camo_diff = os.path.join(tex_dir, "camo_arctic_diffuse.png")
if os.path.exists(tex_camo_diff):
    tex_img_camo = nodes_camo.new('ShaderNodeTexImage')
    tex_img_camo.image = bpy.data.images.load(tex_camo_diff)
    tex_img_camo.projection = 'BOX'
    tex_img_camo.projection_blend = 0.25
    mat_camo.node_tree.links.new(node_mapping.outputs['Vector'], tex_img_camo.inputs['Vector'])
    mat_camo.node_tree.links.new(tex_img_camo.outputs['Color'], bsdf_camo.inputs['Base Color'])

tex_camo_norm = os.path.join(tex_dir, "fabric_normal.png")
if os.path.exists(tex_camo_norm):
    tex_img_cn = nodes_camo.new('ShaderNodeTexImage')
    tex_img_cn.image = bpy.data.images.load(tex_camo_norm)
    tex_img_cn.image.colorspace_settings.name = 'Non-Color'
    tex_img_cn.projection = 'BOX'
    tex_img_cn.projection_blend = 0.25
    norm_camo = nodes_camo.new('ShaderNodeNormalMap')
    norm_camo.inputs['Strength'].default_value = 0.35
    mat_camo.node_tree.links.new(node_mapping.outputs['Vector'], tex_img_cn.inputs['Vector'])
    mat_camo.node_tree.links.new(tex_img_cn.outputs['Color'], norm_camo.inputs['Color'])
    mat_camo.node_tree.links.new(norm_camo.outputs['Normal'], bsdf_camo.inputs['Normal'])

# Mat 5: Ballistic Nylon Strap
mat_strap = bpy.data.materials.new(name="Mat_BallisticNylon")
mat_strap.use_nodes = True
nodes_strap = mat_strap.node_tree.nodes
bsdf_strap = next(n for n in nodes_strap if n.type == 'BSDF_PRINCIPLED')
bsdf_strap.inputs['Base Color'].default_value = (0.035, 0.038, 0.044, 1.0)
bsdf_strap.inputs['Roughness'].default_value = 0.60

# Mat 6: Tactical Smartphone (Titanium chassis + OLED display)
mat_phone = bpy.data.materials.new(name="Mat_TacticalPhone")
mat_phone.use_nodes = True
bsdf_phone = next(n for n in mat_phone.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_phone.inputs['Base Color'].default_value = (0.05, 0.06, 0.07, 1.0)
bsdf_phone.inputs['Metallic'].default_value = 0.90
bsdf_phone.inputs['Roughness'].default_value = 0.18

# Mat 7: Studio Pedestal
mat_pedestal = bpy.data.materials.new(name="Mat_StudioPedestal")
mat_pedestal.use_nodes = True
bsdf_ped = next(n for n in mat_pedestal.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_ped.inputs['Base Color'].default_value = (0.020, 0.022, 0.028, 1.0)
bsdf_ped.inputs['Metallic'].default_value = 0.80
bsdf_ped.inputs['Roughness'].default_value = 0.30

# -------------------------------------------------------------
# 3. SEGMENT MONOLITHIC MODEL INTO CLEAN MODULAR PARTS
# -------------------------------------------------------------
print("Importing and bisecting monolithic model into 1:1 matching components...")
mono_glb = os.path.join(base_dir, "Meshy_AI_Urban_Camo_Hydration__1026064237_generate.glb")
bpy.ops.import_scene.gltf(filepath=mono_glb)
mono_obj = [o for o in scene.objects if o.type == 'MESH'][0]

def create_bisect_part(src_obj, z_low, z_high, name, material):
    new_data = src_obj.data.copy()
    new_obj = bpy.data.objects.new(name, new_data)
    scene.collection.objects.link(new_obj)
    
    bm = bmesh.new()
    bm.from_mesh(new_data)
    if z_high is not None:
        bmesh.ops.bisect_plane(
            bm,
            geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
            plane_co=(0, 0, z_high),
            plane_no=(0, 0, 1),
            clear_outer=True,
            clear_inner=False
        )
    if z_low is not None:
        bmesh.ops.bisect_plane(
            bm,
            geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
            plane_co=(0, 0, z_low),
            plane_no=(0, 0, 1),
            clear_outer=False,
            clear_inner=True
        )
    bm.to_mesh(new_data)
    bm.free()
    new_data.update()
    
    new_obj.data.materials.clear()
    new_obj.data.materials.append(material)
    
    for p in new_obj.data.polygons:
        p.use_smooth = True
        
    return new_obj

# Cut exact 1:1 components from the monolithic model
part_cap = create_bisect_part(mono_obj, 0.44, None, "Part_01_TacticalCap", mat_polymer)
part_paracord = create_bisect_part(mono_obj, 0.32, 0.44, "Part_02_ParacordNeck", mat_paracord)
part_sleeve = create_bisect_part(mono_obj, -0.52, 0.32, "Part_04_NeopreneSleeve", mat_camo)
part_strap = create_bisect_part(mono_obj, None, -0.52, "Part_06_BaseStrap", mat_strap)

# Remove temporary mono object
bpy.data.objects.remove(mono_obj)

# -------------------------------------------------------------
# 4. IMPORT INNER TRITAN BODY & SMARTPHONE
# -------------------------------------------------------------
print("Importing authentic inner Tritan body and smartphone...")

# Inner Tritan Body (fits perfectly inside the sleeve)
body_glb = os.path.join(base_dir, "Meshy_AI_Cylindrical_Bottle_Bo_1026064515_generate.glb")
pre_objs = set(scene.objects)
bpy.ops.import_scene.gltf(filepath=body_glb)
part_body = [o for o in scene.objects if o not in pre_objs and o.type == 'MESH'][0]
part_body.name = "Part_03_TritanBody"
part_body.data.materials.clear()
part_body.data.materials.append(mat_tritan)
for p in part_body.data.polygons:
    p.use_smooth = True

# Scale body to fit inside sleeve:
# Monolithic sleeve diameter is ~1.0, height is ~0.84.
# Body glb is 1.1 x 1.1 x 1.9. Scale body by ~0.84 so diameter is ~0.92 (fits snugly inside sleeve 1.0):
bpy.context.view_layer.objects.active = part_body
part_body.select_set(True)
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
part_body.scale = (0.84, 0.84, 0.84)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
part_body.location = (0.03, 0.12, -0.05)
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
part_body.select_set(False)

# Smartphone (inside pocket)
phone_glb = os.path.join(base_dir, "Meshy_AI_Cell_Phone_1026064549_generate.glb")
pre_objs = set(scene.objects)
bpy.ops.import_scene.gltf(filepath=phone_glb)
part_phone = [o for o in scene.objects if o not in pre_objs and o.type == 'MESH'][0]
part_phone.name = "Part_05_Smartphone"
part_phone.data.materials.clear()
part_phone.data.materials.append(mat_phone)
for p in part_phone.data.polygons:
    p.use_smooth = True

# Rotate phone vertices with bmesh so it stands upright
bm_ph = bmesh.new()
bm_ph.from_mesh(part_phone.data)
rot_mat = Euler((0, math.radians(90), math.radians(90)), 'XYZ').to_matrix()
bmesh.ops.rotate(bm_ph, cent=(0, 0, 0), matrix=rot_mat, verts=bm_ph.verts)
bm_ph.to_mesh(part_phone.data)
bm_ph.free()
part_phone.data.update()

bpy.context.view_layer.objects.active = part_phone
part_phone.select_set(True)
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
part_phone.scale = (0.50, 0.50, 0.50)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
part_phone.location = (0.03, -0.42, -0.10)
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
part_phone.select_set(False)

# -------------------------------------------------------------
# 5. NORMALIZE ENTIRE ASSEMBLY TO REAL 28 CM HEIGHT ON PEDESTAL
# -------------------------------------------------------------
print("Normalizing full bottle to real 28cm scale on pedestal...")

all_parts = [part_cap, part_paracord, part_body, part_sleeve, part_phone, part_strap]

# Scale factor from ~1.52m down to 0.28m
scale_all = 0.28 / 1.516
for p in all_parts:
    bpy.context.view_layer.objects.active = p
    p.select_set(True)
    p.scale = (scale_all, scale_all, scale_all)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    p.select_set(False)

# Ground to Z = 0
min_z_all = min(min(v.co.z for v in p.data.vertices) for p in all_parts)
for p in all_parts:
    bpy.context.view_layer.objects.active = p
    p.select_set(True)
    p.location.z -= min_z_all
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    p.select_set(False)

# Master Root Object for Turntable and Orbit
master_root = bpy.data.objects.new("Jimkeg_Master_Assembly", None)
master_root.location = (0, 0, 0)
scene.collection.objects.link(master_root)

for p in all_parts:
    p.parent = master_root

# -------------------------------------------------------------
# 6. KEYFRAME HIGH-PRECISION EXPLODED VIEW ANIMATION (240 Frames)
# -------------------------------------------------------------
print("Keyframing Exploded Disassembly & Turntable Animation...")

# Initial rest poses at frame 1 and frame 20
for p in all_parts:
    p.keyframe_insert(data_path="location", frame=1)
    p.keyframe_insert(data_path="rotation_euler", frame=1)
    p.keyframe_insert(data_path="location", frame=25)
    p.keyframe_insert(data_path="rotation_euler", frame=25)

# Exploded View targets (Hold between frame 70 and frame 140)
# 1. Cap: Lifts +0.14m and tilts back 45°
cap_orig_z = part_cap.location.z
part_cap.location.z += 0.14
part_cap.rotation_euler = (math.radians(-35), 0, 0)
part_cap.keyframe_insert(data_path="location", frame=70)
part_cap.keyframe_insert(data_path="rotation_euler", frame=70)
part_cap.keyframe_insert(data_path="location", frame=140)
part_cap.keyframe_insert(data_path="rotation_euler", frame=140)

# 2. Paracord collar: Lifts +0.07m
part_paracord.location.z += 0.07
part_paracord.keyframe_insert(data_path="location", frame=70)
part_paracord.keyframe_insert(data_path="location", frame=140)

# 3. Smartphone: Slides diagonally UP and OUT of pocket (-Y by 0.08m, +Z by 0.06m)
part_phone.location.y -= 0.08
part_phone.location.z += 0.06
part_phone.keyframe_insert(data_path="location", frame=70)
part_phone.keyframe_insert(data_path="location", frame=140)

# 4. Neoprene Sleeve: Slides downward by -0.05m to fully expose the Tritan body
part_sleeve.location.z -= 0.05
part_sleeve.keyframe_insert(data_path="location", frame=70)
part_sleeve.keyframe_insert(data_path="location", frame=140)

# 5. Base Strap: Drops slightly with sleeve
part_strap.location.z -= 0.05
part_strap.keyframe_insert(data_path="location", frame=70)
part_strap.keyframe_insert(data_path="location", frame=140)

# 6. Tritan Body: Hovers at origin (Z = 0) as central anchor
part_body.keyframe_insert(data_path="location", frame=70)
part_body.keyframe_insert(data_path="location", frame=140)

# Re-assembly back to rest pose between frame 140 and 195
part_cap.location.z = cap_orig_z
part_cap.rotation_euler = (0, 0, 0)
part_cap.keyframe_insert(data_path="location", frame=195)
part_cap.keyframe_insert(data_path="rotation_euler", frame=195)

part_paracord.location.z -= 0.07
part_paracord.keyframe_insert(data_path="location", frame=195)

part_phone.location.y += 0.08
part_phone.location.z -= 0.06
part_phone.keyframe_insert(data_path="location", frame=195)

part_sleeve.location.z += 0.05
part_sleeve.keyframe_insert(data_path="location", frame=195)

part_strap.location.z += 0.05
part_strap.keyframe_insert(data_path="location", frame=195)

# Hold compact rest pose from frame 195 to 240
for p in all_parts:
    p.keyframe_insert(data_path="location", frame=240)
    p.keyframe_insert(data_path="rotation_euler", frame=240)

# Turntable rotation on Master Root (360° between frame 70 and 140 during exploded view)
master_root.animation_data_create()
master_root.rotation_mode = 'XYZ'
master_root.rotation_euler = (0, 0, 0)
master_root.keyframe_insert(data_path="rotation_euler", frame=1)
master_root.keyframe_insert(data_path="rotation_euler", frame=70)
master_root.rotation_euler = (0, 0, math.radians(360))
master_root.keyframe_insert(data_path="rotation_euler", frame=140)
master_root.rotation_euler = (0, 0, math.radians(360))
master_root.keyframe_insert(data_path="rotation_euler", frame=240)

# -------------------------------------------------------------
# 7. STUDIO STAGE & PEDESTAL
# -------------------------------------------------------------
print("Creating Studio Stage & Backdrop...")
bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.03, vertices=64, location=(0, 0, -0.015))
pedestal = bpy.context.active_object
pedestal.name = "Studio_Pedestal"
pedestal.data.materials.append(mat_pedestal)
for p in pedestal.data.polygons:
    p.use_smooth = True
mod_bev = pedestal.modifiers.new("Bevel", type='BEVEL')
mod_bev.width = 0.004
mod_bev.segments = 3

# Backdrop
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=32, y_segments=32, size=3.0)
mesh_bg = bpy.data.meshes.new("BackdropMesh")
bm.to_mesh(mesh_bg)
bm.free()
bg_obj = bpy.data.objects.new("Studio_Backdrop", mesh_bg)
bg_obj.location = (0, 0.8, 0)
scene.collection.objects.link(bg_obj)
for v in bg_obj.data.vertices:
    if v.co.y > 0.2:
        dist_y = v.co.y - 0.2
        v.co.z += (dist_y ** 2) * 0.8
for p in bg_obj.data.polygons:
    p.use_smooth = True
mat_backdrop = bpy.data.materials.new("Mat_StudioBackdrop")
mat_backdrop.use_nodes = True
bsdf_bd = next(n for n in mat_backdrop.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_bd.inputs['Base Color'].default_value = (0.010, 0.012, 0.016, 1.0)
bsdf_bd.inputs['Roughness'].default_value = 0.95
bg_obj.data.materials.append(mat_backdrop)

# -------------------------------------------------------------
# 8. THREE-POINT LIGHTING RIG
# -------------------------------------------------------------
print("Setting up Three-Point Studio Lighting...")

# Key Light
key_data = bpy.data.lights.new("Key_Light_5500K", type='AREA')
key_data.energy = 60.0
key_data.color = (1.0, 0.98, 0.95)
key_data.size = 0.55
key_obj = bpy.data.objects.new("Key_Light_5500K", key_data)
key_obj.location = (-0.45, -0.55, 0.45)
key_obj.rotation_euler = (math.radians(48), math.radians(18), math.radians(-38))
scene.collection.objects.link(key_obj)

# Rim / Edge Light (Ice cyan tactical edge accent)
rim_data = bpy.data.lights.new("Rim_Light_Cyan", type='AREA')
rim_data.energy = 85.0
rim_data.color = (0.60, 0.85, 1.0)
rim_data.size = 0.40
rim_obj = bpy.data.objects.new("Rim_Light_Cyan", rim_data)
rim_obj.location = (0.42, 0.48, 0.38)
rim_obj.rotation_euler = (math.radians(-45), math.radians(-25), math.radians(135))
scene.collection.objects.link(rim_obj)

# Fill Light (Warm ambient lift)
fill_data = bpy.data.lights.new("Fill_Light_Warm", type='AREA')
fill_data.energy = 22.0
fill_data.color = (1.0, 0.92, 0.84)
fill_data.size = 0.70
fill_obj = bpy.data.objects.new("Fill_Light_Warm", fill_data)
fill_obj.location = (0.50, -0.40, 0.25)
fill_obj.rotation_euler = (math.radians(52), math.radians(-22), math.radians(45))
scene.collection.objects.link(fill_obj)

# Top Softbox
top_data = bpy.data.lights.new("Top_Accent_Light", type='AREA')
top_data.energy = 30.0
top_data.color = (0.95, 0.98, 1.0)
top_data.size = 0.35
top_obj = bpy.data.objects.new("Top_Accent_Light", top_data)
top_obj.location = (0.0, -0.05, 0.62)
top_obj.rotation_euler = (math.radians(10), 0, 0)
scene.collection.objects.link(top_obj)

# -------------------------------------------------------------
# 9. CAMERA
# -------------------------------------------------------------
print("Configuring Camera...")
target = Vector((0.0, 0.0, 0.14))
cam_data = bpy.data.cameras.new("Camera_Studio")
cam_data.lens = 65.0
cam_data.clip_start = 0.05
cam_data.clip_end = 20.0
cam_obj = bpy.data.objects.new("Camera_Studio", cam_data)
cam_loc = Vector((0.36, -0.58, 0.26))
cam_obj.location = cam_loc
cam_obj.rotation_euler = (target - cam_loc).to_track_quat('-Z', 'Y').to_euler()
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# -------------------------------------------------------------
# 10. SAVE MASTER .BLEND & EXPORT PRODUCTION GLB (WEB & DESKTOP)
# -------------------------------------------------------------
print(f"Saving Master Blend File to: {blend_path}")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

print(f"Exporting Production GLB to: {glb_out_path}")
bpy.ops.export_scene.gltf(
    filepath=glb_out_path,
    export_format='GLB',
    export_materials='EXPORT',
    export_animations=True
)

# Also copy/export to public/models/jimkeg_interactive.glb for Three.js
print(f"Exporting Web Interactive GLB to: {web_glb_path}")
bpy.ops.export_scene.gltf(
    filepath=web_glb_path,
    export_format='GLB',
    export_materials='EXPORT',
    export_animations=True
)

# -------------------------------------------------------------
# 11. STILL RENDER (Cycles)
# -------------------------------------------------------------
print("Rendering Master Still Preview with Cycles (Frame 1)...")
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.render.resolution_x = 1080
scene.render.resolution_y = 1080
scene.render.filepath = render_out_path

bpy.context.view_layer.update()
scene.frame_set(1)
bpy.ops.render.render(write_still=True)
print(f"Master Still Render saved to: {render_out_path}")

# Also render an Exploded View frame (Frame 85) to verify the disassembly
exploded_render_path = os.path.join(base_dir, "jimkeg_exploded_render.png")
scene.frame_set(85)
scene.render.filepath = exploded_render_path
bpy.ops.render.render(write_still=True)
print(f"Exploded Still Render saved to: {exploded_render_path}")

print("=== CLEAN SEGMENTATION & PBR PIPELINE COMPLETED ===")
