import bpy

filepath = r"d:\Proyectos\Paginas\Spain\public\images\3D\Meshy_AI_Urban_Camo_Hydration__1026064237_generate.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=filepath)
obj = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]

bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.mesh.separate(type="LOOSE")
separated = [o for o in bpy.context.scene.objects if o.type == "MESH"]
print(f"Separated count: {len(separated)}")
for i, o in enumerate(sorted(separated, key=lambda x: len(x.data.polygons), reverse=True)[:10]):
    print(f"  Part {i}: {o.name}, polys: {len(o.data.polygons)}, dim: {[round(x,3) for x in o.dimensions]}")
