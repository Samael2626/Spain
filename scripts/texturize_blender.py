import bpy
import os

models_dir = r"d:\Proyectos\Paginas\Spain\public\images\3D"
blend_out_path = os.path.join(models_dir, "Jimkeg_Bottle_Master.blend")
glb_out_path = os.path.join(models_dir, "Jimkeg_Bottle_Textured.glb")
camo_tex_path = r"d:\Proyectos\Paginas\Spain\public\images\parts\part_04_camo_pouch.png"

# 1. Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'

# 2. Material Helper function using Principled BSDF
def create_pbr_material(name, base_color=(0.1, 0.1, 0.1, 1.0), metallic=0.0, roughness=0.5, transmission=0.0, ior=1.45, image_path=None):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    
    def set_socket(name, val):
        if name in node_bsdf.inputs:
            node_bsdf.inputs[name].default_value = val

    set_socket('Base Color', base_color)
    set_socket('Metallic', metallic)
    set_socket('Roughness', roughness)
    set_socket('Transmission Weight', transmission)
    set_socket('Transmission', transmission)
    set_socket('IOR', ior)
    
    if image_path and os.path.exists(image_path):
        tex_node = nodes.new(type='ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(image_path)
        links.new(tex_node.outputs['Color'], node_bsdf.inputs['Base Color'])
    
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

# Create Core Tactical PBR Materials
mat_tritan = create_pbr_material("Mat_EastmanTritan", base_color=(0.95, 0.98, 1.0, 1.0), roughness=0.04, transmission=1.0, ior=1.49)
mat_lid = create_pbr_material("Mat_BlackTacticalPolymer", base_color=(0.04, 0.04, 0.05, 1.0), metallic=0.08, roughness=0.38)
mat_paracord = create_pbr_material("Mat_BraidedParacord550", base_color=(0.03, 0.03, 0.03, 1.0), metallic=0.02, roughness=0.85)
mat_camo_sleeve = create_pbr_material("Mat_ArcticGreyCamoSleeve", base_color=(0.5, 0.5, 0.5, 1.0), metallic=0.0, roughness=0.72, image_path=camo_tex_path)
mat_phone = create_pbr_material("Mat_TacticalCellPhone", base_color=(0.02, 0.02, 0.02, 1.0), metallic=0.88, roughness=0.22)
mat_strap = create_pbr_material("Mat_BallisticNylonStrap", base_color=(0.03, 0.03, 0.03, 1.0), metallic=0.05, roughness=0.8)

file_mappings = [
    ("Meshy_AI_Black_Tactical_Lid_1026064340_generate.glb", mat_lid, "Part_01_Lid"),
    ("Meshy_AI_Paracord_Gasket_Braid_1026064458_generate.glb", mat_paracord, "Part_02_Paracord"),
    ("Meshy_AI_Cylindrical_Bottle_Bo_1026064515_generate.glb", mat_tritan, "Part_03_Body"),
    ("Meshy_AI_Tactical_Camouflage_P_1026064538_generate.glb", mat_camo_sleeve, "Part_04_Sleeve"),
    ("Meshy_AI_Cell_Phone_1026064549_generate.glb", mat_phone, "Part_05_Phone"),
    ("Meshy_AI_Tactical_Strap_1026064645_generate.glb", mat_strap, "Part_06_Strap"),
]

for filename, mat, collection_name in file_mappings:
    filepath = os.path.join(models_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping missing file: {filepath}")
        continue
        
    coll = bpy.data.collections.new(collection_name)
    scene.collection.children.link(coll)
    
    prior_objs = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=filepath)
    new_objs = set(bpy.data.objects) - prior_objs
    
    for obj in new_objs:
        for c in list(obj.users_collection):
            c.objects.unlink(obj)
        coll.objects.link(obj)
        
        if obj.type == 'MESH':
            obj.data.materials.clear()
            obj.data.materials.append(mat)
            print(f"Assigned {mat.name} to {obj.name} in {collection_name}")

# Import full assembled model in separate collection for reference
full_model_path = os.path.join(models_dir, "Meshy_AI_Urban_Camo_Hydration__1026064237_generate.glb")
if os.path.exists(full_model_path):
    coll_full = bpy.data.collections.new("Model_Full_Assembled")
    scene.collection.children.link(coll_full)
    prior_objs = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=full_model_path)
    new_objs = set(bpy.data.objects) - prior_objs
    for obj in new_objs:
        for c in list(obj.users_collection):
            c.objects.unlink(obj)
        coll_full.objects.link(obj)
        if obj.type == 'MESH':
            obj.data.materials.clear()
            obj.data.materials.append(mat_camo_sleeve)

# Save Master .blend file
bpy.ops.wm.save_as_mainfile(filepath=blend_out_path)
print(f"Successfully saved Master Blender project: {blend_out_path}")

# Export combined textured GLB
bpy.ops.export_scene.gltf(
    filepath=glb_out_path,
    export_format='GLB',
    use_selection=False,
    export_materials='EXPORT',
    export_apply=True
)
print(f"Successfully exported textured GLB: {glb_out_path}")
