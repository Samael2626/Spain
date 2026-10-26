import bpy
import os
import math
import mathutils

models_dir = r"d:\Proyectos\Paginas\Spain\public\images\3D"
preview_dir = r"d:\Proyectos\Paginas\Spain\public\images\3D\previews"
os.makedirs(preview_dir, exist_ok=True)

files = [f for f in os.listdir(models_dir) if f.startswith("Meshy_") and f.endswith(".glb")]

for f in sorted(files):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 16
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    
    # Import GLB
    filepath = os.path.join(models_dir, f)
    bpy.ops.import_scene.gltf(filepath=filepath)
    
    # Find mesh object
    mesh_objs = [o for o in scene.objects if o.type == 'MESH']
    if not mesh_objs:
        continue
    obj = mesh_objs[0]
    
    # Give a neutral clay/metallic material
    mat = bpy.data.materials.new(name="PreviewMat")
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (0.7, 0.72, 0.75, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.4
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    
    # Smooth shading
    for p in obj.data.polygons:
        p.use_smooth = True
        
    # Camera
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    
    # Position camera to frame object
    # Center of bound
    center = 0.125 * sum((mathutils.Vector(b) for b in obj.bound_box), mathutils.Vector())
    max_dim = max(obj.dimensions)
    dist = max_dim * 2.2
    cam_obj.location = mathutils.Vector((dist * 0.7, -dist * 0.7, dist * 0.5)) + center
    
    # Track to constraint
    track = cam_obj.constraints.new(type='TRACK_TO')
    track.target = obj
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    # Key light
    light_data = bpy.data.lights.new("KeyLight", type='SUN')
    light_data.energy = 3.0
    light_obj = bpy.data.objects.new("KeyLight", light_data)
    light_obj.rotation_euler = (math.radians(45), math.radians(30), math.radians(45))
    scene.collection.objects.link(light_obj)
    
    # Fill light
    fill_data = bpy.data.lights.new("FillLight", type='SUN')
    fill_data.energy = 1.0
    fill_obj = bpy.data.objects.new("FillLight", fill_data)
    fill_obj.rotation_euler = (math.radians(-30), math.radians(-45), math.radians(-30))
    scene.collection.objects.link(fill_obj)
    
    out_name = f.replace(".glb", ".png")
    scene.render.filepath = os.path.join(preview_dir, out_name)
    bpy.ops.render.render(write_still=True)
    print("Rendered:", out_name)
