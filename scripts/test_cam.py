import bpy
import mathutils
from mathutils import Vector

scene = bpy.context.scene
cam = bpy.data.objects["Camera_Hero_ThreeQuarter"]
target = Vector((0.0, 0.0, 0.14))
loc = Vector((0.35, -0.55, 0.25))

# Remove constraints and set rotation directly
cam.constraints.clear()
cam.location = loc
direction = target - loc
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

# Fast test render with Workbench / EEVEE / Cycles 4 samples
scene.camera = cam
scene.render.engine = 'CYCLES'
scene.cycles.samples = 4
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.filepath = r"d:\Proyectos\Paginas\Spain\public\images\3D\test_cam_render.png"

bpy.context.view_layer.update()
bpy.ops.render.render(write_still=True)
print("Rendered test cam successfully.")
