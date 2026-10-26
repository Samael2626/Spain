import bpy
import bmesh
from mathutils import Vector

filepath = r"d:\Proyectos\Paginas\Spain\public\images\3D\Meshy_AI_Urban_Camo_Hydration__1026064237_generate.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=filepath)
orig_obj = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]

def create_slice(obj, z_low, z_high, name):
    new_data = obj.data.copy()
    new_obj = bpy.data.objects.new(name, new_data)
    bpy.context.scene.collection.objects.link(new_obj)
    
    bm = bmesh.new()
    bm.from_mesh(new_data)
    
    # Bisect upper plane if z_high is set
    if z_high is not None:
        bmesh.ops.bisect_plane(
            bm,
            geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
            plane_co=(0, 0, z_high),
            plane_no=(0, 0, 1),
            clear_outer=True,
            clear_inner=False
        )
    # Bisect lower plane if z_low is set
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
    print(f"Created slice '{name}': {len(new_data.vertices)} vertices, {len(new_data.polygons)} polys")
    return new_obj

# Create the slices
cap = create_slice(orig_obj, 0.44, None, "Part_01_TacticalCap")
paracord = create_slice(orig_obj, 0.32, 0.44, "Part_02_ParacordNeck")
sleeve = create_slice(orig_obj, -0.52, 0.32, "Part_04_NeopreneSleeve")
strap = create_slice(orig_obj, None, -0.52, "Part_06_BaseStrap")

# Remove original monolithic object
bpy.data.objects.remove(orig_obj)
print("Segmentation test passed.")
