import bpy
import bmesh
from mathutils import Vector

filepath = r"d:\Proyectos\Paginas\Spain\public\images\3D\Meshy_AI_Urban_Camo_Hydration__1026064237_generate.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=filepath)
obj = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]

# Inspect where vertices extend along X, Y, Z
# We know the strap coils around the base and sticks out
# Let's find the cylindrical center of the bottle (body) between Z = -0.2 and 0.2
body_verts = [v for v in obj.data.vertices if -0.2 < v.co.z < 0.2]
center_x = sum(v.co.x for v in body_verts) / len(body_verts)
center_y = sum(v.co.y for v in body_verts) / len(body_verts)
print(f"Estimated bottle center: X={center_x:.3f}, Y={center_y:.3f}")

# Radial distance from center: r = sqrt((x-cx)^2 + (y-cy)^2)
rads = [((v.co.x - center_x)**2 + (v.co.y - center_y)**2)**0.5 for v in body_verts]
print(f"Body radius range: {min(rads):.3f} to {max(rads):.3f}")

# Find protruding features:
# Pocket / phone should protrude on one side (min or max Y, or min or max X)
for v in body_verts:
    r = ((v.co.x - center_x)**2 + (v.co.y - center_y)**2)**0.5
    if r > 0.6:  # Protrudes beyond the cylindrical radius (~0.5)
        # print some outlier locations
        pass

outliers_x = [v.co.x for v in body_verts if ((v.co.x - center_x)**2 + (v.co.y - center_y)**2)**0.5 > 0.55]
outliers_y = [v.co.y for v in body_verts if ((v.co.x - center_x)**2 + (v.co.y - center_y)**2)**0.5 > 0.55]
if outliers_x and outliers_y:
    print(f"Protrusions around body: X [{min(outliers_x):.3f} : {max(outliers_x):.3f}], Y [{min(outliers_y):.3f} : {max(outliers_y):.3f}]")
