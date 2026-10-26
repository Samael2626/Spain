import bpy
import mathutils
from mathutils import Vector

filepath = r"d:\Proyectos\Paginas\Spain\public\images\3D\Meshy_AI_Urban_Camo_Hydration__1026064237_generate.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=filepath)
obj = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]

# Vertices bounds
zs = [v.co.z for v in obj.data.vertices]
xs = [v.co.x for v in obj.data.vertices]
ys = [v.co.y for v in obj.data.vertices]

print(f"X bounds: {min(xs):.3f} to {max(xs):.3f} (dim: {max(xs)-min(xs):.3f})")
print(f"Y bounds: {min(ys):.3f} to {max(ys):.3f} (dim: {max(ys)-min(ys):.3f})")
print(f"Z bounds: {min(zs):.3f} to {max(zs):.3f} (dim: {max(zs)-min(zs):.3f})")

# Let's inspect histogram of Z
z_min, z_max = min(zs), max(zs)
step = (z_max - z_min) / 10.0
for i in range(10):
    lo = z_min + i * step
    hi = lo + step
    count = sum(1 for z in zs if lo <= z < hi)
    print(f"Slice Z [{lo:.2f} : {hi:.2f}] -> {count} vertices")
