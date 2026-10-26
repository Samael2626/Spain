import bpy
import bmesh
import mathutils
from mathutils import Vector, Euler
import math
import os

print("=== BUILDING LUXURY JIMKEG 3D STUDIO SCENE ===")

base_dir = r"d:\Proyectos\Paginas\Spain\public\images\3D"
tex_dir = r"d:\Proyectos\Paginas\Spain\public\images\textures"
blend_path = os.path.join(base_dir, "Jimkeg_Bottle_Master.blend")
glb_out_path = os.path.join(base_dir, "Jimkeg_Bottle_Textured.glb")
render_out_path = os.path.join(base_dir, "jimkeg_studio_render.png")

# Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 60
scene.frame_start = 1
scene.frame_end = 240
scene.render.engine = 'BLENDER_EEVEE'

# World setup (Deep dark studio slate #0B0D11)
world = bpy.data.worlds.new(name="StudioWorld")
scene.world = world
world.use_nodes = True
bg_node = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
bg_node.inputs['Color'].default_value = (0.012, 0.015, 0.020, 1.0)
bg_node.inputs['Strength'].default_value = 0.45

# -------------------------------------------------------------
# 1. PBR MATERIALS
# -------------------------------------------------------------
print("Configuring PBR materials...")

# Material 1: Eastman Tritan (Smoked shatterproof dark polymer)
mat_tritan = bpy.data.materials.new(name="Mat_EastmanTritan")
mat_tritan.use_nodes = True
bsdf_tritan = next(n for n in mat_tritan.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_tritan.inputs['Base Color'].default_value = (0.06, 0.08, 0.12, 1.0)
bsdf_tritan.inputs['Roughness'].default_value = 0.09
bsdf_tritan.inputs['IOR'].default_value = 1.49
bsdf_tritan.inputs['Transmission Weight'].default_value = 0.80
bsdf_tritan.inputs['Specular IOR Level'].default_value = 0.50

# Material 2: Black Tactical Polymer (Matte molded cap, handle, clips)
mat_polymer = bpy.data.materials.new(name="Mat_BlackTacticalPolymer")
mat_polymer.use_nodes = True
nodes_poly = mat_polymer.node_tree.nodes
bsdf_poly = next(n for n in nodes_poly if n.type == 'BSDF_PRINCIPLED')
bsdf_poly.inputs['Base Color'].default_value = (0.032, 0.035, 0.040, 1.0)
bsdf_poly.inputs['Roughness'].default_value = 0.36
bsdf_poly.inputs['Specular IOR Level'].default_value = 0.45
tex_poly_path = os.path.join(tex_dir, "polymer_bump.png")
if os.path.exists(tex_poly_path):
    tex_img = nodes_poly.new('ShaderNodeTexImage')
    tex_img.image = bpy.data.images.load(tex_poly_path)
    bump_node = nodes_poly.new('ShaderNodeBump')
    bump_node.inputs['Strength'].default_value = 0.06
    bump_node.inputs['Distance'].default_value = 0.01
    mat_polymer.node_tree.links.new(tex_img.outputs['Color'], bump_node.inputs['Height'])
    mat_polymer.node_tree.links.new(bump_node.outputs['Normal'], bsdf_poly.inputs['Normal'])

# Material 3: 550 Paracord Braid (High-tensile woven cordage)
mat_paracord = bpy.data.materials.new(name="Mat_550Paracord")
mat_paracord.use_nodes = True
nodes_pc = mat_paracord.node_tree.nodes
bsdf_pc = next(n for n in nodes_pc if n.type == 'BSDF_PRINCIPLED')
bsdf_pc.inputs['Base Color'].default_value = (0.05, 0.055, 0.065, 1.0)
bsdf_pc.inputs['Roughness'].default_value = 0.60
bsdf_pc.inputs['Sheen Weight'].default_value = 0.45
tex_pc_path = os.path.join(tex_dir, "paracord_normal.png")
if os.path.exists(tex_pc_path):
    tex_img_pc = nodes_pc.new('ShaderNodeTexImage')
    tex_img_pc.image = bpy.data.images.load(tex_pc_path)
    tex_img_pc.image.colorspace_settings.name = 'Non-Color'
    norm_node = nodes_pc.new('ShaderNodeNormalMap')
    norm_node.inputs['Strength'].default_value = 0.70
    mat_paracord.node_tree.links.new(tex_img_pc.outputs['Color'], norm_node.inputs['Color'])
    mat_paracord.node_tree.links.new(norm_node.outputs['Normal'], bsdf_pc.inputs['Normal'])

# Material 4: Arctic Grey Camo Neoprene Sleeve (Triplanar Box Projection)
mat_camo = bpy.data.materials.new(name="Mat_ArcticCamoSleeve")
mat_camo.use_nodes = True
nodes_camo = mat_camo.node_tree.nodes
bsdf_camo = next(n for n in nodes_camo if n.type == 'BSDF_PRINCIPLED')
bsdf_camo.inputs['Roughness'].default_value = 0.70
bsdf_camo.inputs['Sheen Weight'].default_value = 0.50

# Triplanar Object Mapping
node_coord = nodes_camo.new('ShaderNodeTexCoord')
node_mapping = nodes_camo.new('ShaderNodeMapping')
node_mapping.inputs['Scale'].default_value = (5.0, 5.0, 5.0)
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

# Material 5: Ballistic Nylon Strap
mat_strap = bpy.data.materials.new(name="Mat_BallisticNylon")
mat_strap.use_nodes = True
nodes_strap = mat_strap.node_tree.nodes
bsdf_strap = next(n for n in nodes_strap if n.type == 'BSDF_PRINCIPLED')
bsdf_strap.inputs['Base Color'].default_value = (0.040, 0.043, 0.050, 1.0)
bsdf_strap.inputs['Roughness'].default_value = 0.58
if os.path.exists(tex_camo_norm):
    tex_strap_norm = nodes_strap.new('ShaderNodeTexImage')
    tex_strap_norm.image = bpy.data.images.load(tex_camo_norm)
    tex_strap_norm.image.colorspace_settings.name = 'Non-Color'
    norm_st = nodes_strap.new('ShaderNodeNormalMap')
    norm_st.inputs['Strength'].default_value = 0.50
    mat_strap.node_tree.links.new(tex_strap_norm.outputs['Color'], norm_st.inputs['Color'])
    mat_strap.node_tree.links.new(norm_st.outputs['Normal'], bsdf_strap.inputs['Normal'])

# Material 6: Tactical Smartphone
mat_phone = bpy.data.materials.new(name="Mat_TacticalPhone")
mat_phone.use_nodes = True
bsdf_phone = next(n for n in mat_phone.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_phone.inputs['Base Color'].default_value = (0.06, 0.07, 0.08, 1.0)
bsdf_phone.inputs['Metallic'].default_value = 0.85
bsdf_phone.inputs['Roughness'].default_value = 0.20

# Material 7: Studio Pedestal
mat_pedestal = bpy.data.materials.new(name="Mat_StudioPedestal")
mat_pedestal.use_nodes = True
bsdf_ped = next(n for n in mat_pedestal.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_ped.inputs['Base Color'].default_value = (0.022, 0.025, 0.030, 1.0)
bsdf_ped.inputs['Metallic'].default_value = 0.75
bsdf_ped.inputs['Roughness'].default_value = 0.32

# -------------------------------------------------------------
# 2. HELPER FUNCTIONS
# -------------------------------------------------------------
def smart_uv_and_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for p in obj.data.polygons:
        p.use_smooth = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)

def import_glb_mesh(filepath, name, collection, material):
    pre_objs = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=filepath)
    new_objs = [o for o in scene.objects if o not in pre_objs and o.type == 'MESH']
    if not new_objs:
        return None
    obj = new_objs[0]
    obj.name = name
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.clear()
    obj.data.materials.append(material)
    
    # If phone, rotate vertices directly in mesh space so it stands upright
    if "Phone" in name:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        rot_mat = Euler((0, math.radians(90), math.radians(90)), 'XYZ').to_matrix()
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot_mat, verts=bm.verts)
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        
    smart_uv_and_smooth(obj)
    return obj

# -------------------------------------------------------------
# 3. BUILD COLLECTIONS
# -------------------------------------------------------------
col_hero = bpy.data.collections.new("01_Hero_Assembled")
col_lineup = bpy.data.collections.new("02_Modular_Teardown_Lineup")
col_exploded = bpy.data.collections.new("03_Exploded_Assembly_Stack")
col_stage = bpy.data.collections.new("04_Studio_Stage")
col_lights = bpy.data.collections.new("05_Lighting_Rig")

scene.collection.children.link(col_hero)
scene.collection.children.link(col_lineup)
scene.collection.children.link(col_exploded)
scene.collection.children.link(col_stage)
scene.collection.children.link(col_lights)

# Hide non-primary collections from render
col_lineup.hide_render = True
col_exploded.hide_render = True

# -------------------------------------------------------------
# 4. BUILD HERO ASSEMBLED MODULAR BOTTLE (All 6 PBR Materials)
# -------------------------------------------------------------
print("Building Hero Assembled Modular Bottle...")
# Body is 0.115 (fits inside sleeve), Sleeve is 0.125, Neck collar at Z=0.23, Lid sits on threads at Z=0.245
hero_specs = [
    # (file, name, mat, scale, loc, rot)
    ("Meshy_AI_Cylindrical_Bottle_Bo_1026064515_generate.glb", "Hero_03_TritanBody", mat_tritan, 0.115, (0.0, 0.0, 0.115), (0, 0, 0)),
    ("Meshy_AI_Tactical_Camouflage_P_1026064538_generate.glb", "Hero_04_CamoSleeve", mat_camo, 0.128, (0.0, 0.0, 0.098), (0, 0, 0)),
    ("Meshy_AI_Paracord_Gasket_Braid_1026064458_generate.glb", "Hero_02_ParacordNeck", mat_paracord, 0.046, (0.0, 0.0, 0.222), (0, 0, 0)),
    ("Meshy_AI_Black_Tactical_Lid_1026064340_generate.glb", "Hero_01_TacticalLid", mat_polymer, 0.076, (0.0, 0.0, 0.240), (0, 0, math.radians(90))),
    ("Meshy_AI_Cell_Phone_1026064549_generate.glb", "Hero_05_PhoneInPocket", mat_phone, 0.070, (0.0, -0.082, 0.125), (0, 0, 0)),
    ("Meshy_AI_Tactical_Strap_1026064645_generate.glb", "Hero_06_BaseStrap", mat_strap, 0.115, (0.0, 0.0, 0.005), (0, 0, 0)),
]

hero_root = bpy.data.objects.new("Jimkeg_Hero_Master_Root", None)
hero_root.location = (0, 0, 0)
col_hero.objects.link(hero_root)

for filename, obj_name, obj_mat, s_val, loc_val, rot_val in hero_specs:
    filepath = os.path.join(base_dir, filename)
    obj = import_glb_mesh(filepath, obj_name, col_hero, obj_mat)
    if not obj:
        continue
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    obj.scale = (s_val, s_val, s_val)
    obj.rotation_euler = rot_val
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.location = loc_val
    obj.parent = hero_root
    obj.select_set(False)

# Add seamless 360 Turntable rotation on hero root
hero_root.animation_data_create()
hero_root.rotation_mode = 'XYZ'
hero_root.rotation_euler = (0, 0, 0)
hero_root.keyframe_insert(data_path="rotation_euler", frame=1)
hero_root.rotation_euler = (0, 0, math.radians(360))
hero_root.keyframe_insert(data_path="rotation_euler", frame=241)

try:
    action = hero_root.animation_data.action
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'LINEAR'
except Exception as e:
    print("Linear turntable interpolation set:", e)

# -------------------------------------------------------------
# 5. MODULAR TEARDOWN LINEUP (6 Individual Pods)
# -------------------------------------------------------------
print("Building Modular Teardown Lineup...")
lineup_defs = [
    ("Meshy_AI_Black_Tactical_Lid_1026064340_generate.glb", "Lineup_01_TacticalLid", mat_polymer, 0.08, -0.60, (0,0,0)),
    ("Meshy_AI_Paracord_Gasket_Braid_1026064458_generate.glb", "Lineup_02_ParacordHandle", mat_paracord, 0.08, -0.36, (0,0,0)),
    ("Meshy_AI_Cylindrical_Bottle_Bo_1026064515_generate.glb", "Lineup_03_TritanBody", mat_tritan, 0.26, -0.12, (0,0,0)),
    ("Meshy_AI_Tactical_Camouflage_P_1026064538_generate.glb", "Lineup_04_CamoSleeve", mat_camo, 0.20, +0.12, (0,0,0)),
    ("Meshy_AI_Cell_Phone_1026064549_generate.glb", "Lineup_05_Smartphone", mat_phone, 0.16, +0.36, (0, math.radians(90), math.radians(90))),
    ("Meshy_AI_Tactical_Strap_1026064645_generate.glb", "Lineup_06_ShoulderStrap", mat_strap, 0.22, +0.60, (0,0,0)),
]

for filename, part_name, part_mat, target_size, x_pos, rot in lineup_defs:
    filepath = os.path.join(base_dir, filename)
    p_obj = import_glb_mesh(filepath, part_name, col_lineup, part_mat)
    if not p_obj:
        continue
    bpy.context.view_layer.objects.active = p_obj
    p_obj.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    p_obj.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    cur_max = max(p_obj.dimensions)
    if cur_max > 0:
        s = target_size / cur_max
        p_obj.scale = (s, s, s)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    p_obj.location = (x_pos, 0.0, p_obj.dimensions.z / 2.0)
    p_obj.select_set(False)

# -------------------------------------------------------------
# 6. EXPLODED ASSEMBLY STACK
# -------------------------------------------------------------
print("Building Exploded Assembly Stack...")
exploded_defs = [
    ("Meshy_AI_Tactical_Camouflage_P_1026064538_generate.glb", "Exploded_04_Sleeve", mat_camo, 0.11, (0, 0, 0.06), (0,0,0)),
    ("Meshy_AI_Cylindrical_Bottle_Bo_1026064515_generate.glb", "Exploded_03_Body", mat_tritan, 0.14, (0, 0, 0.16), (0,0,0)),
    ("Meshy_AI_Paracord_Gasket_Braid_1026064458_generate.glb", "Exploded_02_Paracord", mat_paracord, 0.048, (0, 0, 0.28), (0,0,0)),
    ("Meshy_AI_Black_Tactical_Lid_1026064340_generate.glb", "Exploded_01_Lid", mat_polymer, 0.082, (0, 0, 0.36), (math.radians(15), 0, 0)),
    ("Meshy_AI_Cell_Phone_1026064549_generate.glb", "Exploded_05_Phone", mat_phone, 0.075, (-0.14, -0.06, 0.14), (0, math.radians(90), math.radians(90))),
    ("Meshy_AI_Tactical_Strap_1026064645_generate.glb", "Exploded_06_Strap", mat_strap, 0.12, (0, 0, 0.00), (0,0,0)),
]

for filename, part_name, part_mat, s_val, loc_val, rot_val in exploded_defs:
    filepath = os.path.join(base_dir, filename)
    exp_obj = import_glb_mesh(filepath, part_name, col_exploded, part_mat)
    if not exp_obj:
        continue
    bpy.context.view_layer.objects.active = exp_obj
    exp_obj.select_set(True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    exp_obj.rotation_euler = rot_val
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    exp_obj.scale = (s_val, s_val, s_val)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    exp_obj.location = loc_val
    exp_obj.select_set(False)

# -------------------------------------------------------------
# 7. STUDIO PEDESTAL & BACKDROP
# -------------------------------------------------------------
print("Building Studio Stage & Backdrop...")
bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.03, vertices=64, location=(0, 0, -0.015))
pedestal = bpy.context.active_object
pedestal.name = "Studio_Pedestal"
pedestal.data.materials.append(mat_pedestal)
for p in pedestal.data.polygons:
    p.use_smooth = True
mod_bev = pedestal.modifiers.new("Bevel", type='BEVEL')
mod_bev.width = 0.004
mod_bev.segments = 3
for c in list(pedestal.users_collection):
    c.objects.unlink(pedestal)
col_stage.objects.link(pedestal)

# Curved Studio Cyclorama Backdrop
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=32, y_segments=32, size=3.0)
mesh_bg = bpy.data.meshes.new("BackdropMesh")
bm.to_mesh(mesh_bg)
bm.free()
bg_obj = bpy.data.objects.new("Studio_Backdrop", mesh_bg)
bg_obj.location = (0, 0.8, 0)
col_stage.objects.link(bg_obj)
for v in bg_obj.data.vertices:
    if v.co.y > 0.2:
        dist_y = v.co.y - 0.2
        v.co.z += (dist_y ** 2) * 0.8
for p in bg_obj.data.polygons:
    p.use_smooth = True
mat_backdrop = bpy.data.materials.new("Mat_StudioBackdrop")
mat_backdrop.use_nodes = True
bsdf_bd = next(n for n in mat_backdrop.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf_bd.inputs['Base Color'].default_value = (0.010, 0.013, 0.018, 1.0)
bsdf_bd.inputs['Roughness'].default_value = 0.95
bg_obj.data.materials.append(mat_backdrop)

# -------------------------------------------------------------
# 8. THREE-POINT LIGHTING RIG
# -------------------------------------------------------------
print("Setting up Three-Point Studio Lighting...")

# Key Light
key_data = bpy.data.lights.new("Key_Light_5500K", type='AREA')
key_data.energy = 55.0
key_data.color = (1.0, 0.98, 0.95)
key_data.size = 0.55
key_obj = bpy.data.objects.new("Key_Light_5500K", key_data)
key_obj.location = (-0.45, -0.55, 0.45)
key_obj.rotation_euler = (math.radians(48), math.radians(18), math.radians(-38))
col_lights.objects.link(key_obj)

# Rim / Edge Light (Ice cyan tactical edge accent)
rim_data = bpy.data.lights.new("Rim_Light_Cyan", type='AREA')
rim_data.energy = 75.0
rim_data.color = (0.60, 0.85, 1.0)
rim_data.size = 0.40
rim_obj = bpy.data.objects.new("Rim_Light_Cyan", rim_data)
rim_obj.location = (0.42, 0.48, 0.38)
rim_obj.rotation_euler = (math.radians(-45), math.radians(-25), math.radians(135))
col_lights.objects.link(rim_obj)

# Fill Light (Warm ambient lift)
fill_data = bpy.data.lights.new("Fill_Light_Warm", type='AREA')
fill_data.energy = 20.0
fill_data.color = (1.0, 0.92, 0.84)
fill_data.size = 0.70
fill_obj = bpy.data.objects.new("Fill_Light_Warm", fill_data)
fill_obj.location = (0.50, -0.40, 0.25)
fill_obj.rotation_euler = (math.radians(52), math.radians(-22), math.radians(45))
col_lights.objects.link(fill_obj)

# Top Softbox
top_data = bpy.data.lights.new("Top_Accent_Light", type='AREA')
top_data.energy = 28.0
top_data.color = (0.95, 0.98, 1.0)
top_data.size = 0.35
top_obj = bpy.data.objects.new("Top_Accent_Light", top_data)
top_obj.location = (0.0, -0.05, 0.62)
top_obj.rotation_euler = (math.radians(10), 0, 0)
col_lights.objects.link(top_obj)

# -------------------------------------------------------------
# 9. CINEMATIC CAMERAS (Explicit Rotation Matrices)
# -------------------------------------------------------------
print("Configuring Cameras with Direct Rotation Matrices...")

# Target position at bottle center
target = Vector((0.0, 0.0, 0.14))

# Hero Camera (65mm focal length)
cam_hero_data = bpy.data.cameras.new("Camera_Hero_ThreeQuarter")
cam_hero_data.lens = 65.0
cam_hero_data.clip_start = 0.05
cam_hero_data.clip_end = 20.0
cam_hero_obj = bpy.data.objects.new("Camera_Hero_ThreeQuarter", cam_hero_data)
cam_hero_loc = Vector((0.36, -0.58, 0.26))
cam_hero_obj.location = cam_hero_loc
dir_hero = target - cam_hero_loc
cam_hero_obj.rotation_euler = dir_hero.to_track_quat('-Z', 'Y').to_euler()
col_stage.objects.link(cam_hero_obj)
scene.camera = cam_hero_obj

# Lineup Camera (38mm wide lens)
cam_lineup_data = bpy.data.cameras.new("Camera_Lineup_Wide")
cam_lineup_data.lens = 38.0
cam_lineup_obj = bpy.data.objects.new("Camera_Lineup_Wide", cam_lineup_data)
cam_lineup_loc = Vector((0.0, -1.25, 0.35))
cam_lineup_obj.location = cam_lineup_loc
dir_lineup = target - cam_lineup_loc
cam_lineup_obj.rotation_euler = dir_lineup.to_track_quat('-Z', 'Y').to_euler()
col_stage.objects.link(cam_lineup_obj)

# -------------------------------------------------------------
# 10. SAVE MASTER .BLEND & EXPORT PRODUCTION GLB
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

# -------------------------------------------------------------
# 11. STILL RENDER (Cycles)
# -------------------------------------------------------------
print("Rendering Master Still Preview with Cycles...")
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.render.resolution_x = 1080
scene.render.resolution_y = 1080
scene.render.filepath = render_out_path

bpy.context.view_layer.update()
bpy.ops.render.render(write_still=True)
print(f"Master Still Render saved to: {render_out_path}")

print("=== LUXURY JIMKEG 3D STUDIO SCENE COMPLETE ===")
