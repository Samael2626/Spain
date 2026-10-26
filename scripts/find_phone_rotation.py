import bpy
import math

filepath = r"d:\Proyectos\Paginas\Spain\public\images\3D\Meshy_AI_Cell_Phone_1026064549_generate.glb"
tests = [
    ("rot_X90", (math.radians(90), 0, 0)),
    ("rot_Y90", (0, math.radians(90), 0)),
    ("rot_Z90", (0, 0, math.radians(90))),
    ("rot_X90_Z90", (math.radians(90), 0, math.radians(90))),
    ("rot_Y90_Z90", (0, math.radians(90), math.radians(90))),
    ("rot_X90_Y90", (math.radians(90), math.radians(90), 0)),
]

for label, rot in tests:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=filepath)
    mesh_objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    obj = mesh_objs[0]
    obj.rotation_euler = rot
    bpy.context.view_layer.update()
    coords = [obj.matrix_world @ v.co for v in obj.data.vertices]
    dim = [
        round(max(c[0] for c in coords) - min(c[0] for c in coords), 3),
        round(max(c[1] for c in coords) - min(c[1] for c in coords), 3),
        round(max(c[2] for c in coords) - min(c[2] for c in coords), 3)
    ]
    print(f"{label}: X(width)={dim[0]}, Y(depth)={dim[1]}, Z(height)={dim[2]}")
