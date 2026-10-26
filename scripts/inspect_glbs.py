import bpy
import os

models_dir = r"d:\Proyectos\Paginas\Spain\public\images\3D"
files = [f for f in os.listdir(models_dir) if f.startswith("Meshy_") and f.endswith(".glb")]

for f in sorted(files):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    filepath = os.path.join(models_dir, f)
    bpy.ops.import_scene.gltf(filepath=filepath)
    print("=== FILE:", f, "===")
    for obj in bpy.context.scene.objects:
        b0 = [round(x, 3) for x in obj.bound_box[0]]
        b6 = [round(x, 3) for x in obj.bound_box[6]]
        d = [round(x, 3) for x in obj.dimensions]
        print(f"  OBJ: {obj.name} | Dim: {d} | Bound: {b0} -> {b6}")
        if obj.type == 'MESH':
            print(f"  Materials: {[m.name for m in obj.data.materials if m]}")
            print(f"  UVs: {[uv.name for uv in obj.data.uv_layers]}")
            print(f"  Verts: {len(obj.data.vertices)}, Polys: {len(obj.data.polygons)}")
