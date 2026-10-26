import bpy

scene = bpy.context.scene
cam = bpy.data.objects.get("Camera_Hero_ThreeQuarter")
target = bpy.data.objects.get("Camera_Target")
hero = bpy.data.objects.get("Jimkeg_Hero_Assembled")
ped = bpy.data.objects.get("Studio_Pedestal")

print("--- DEBUG CAMERA & HERO ---")
if hero:
    print("Hero loc:", hero.location, "dim:", hero.dimensions, "hide_render:", hero.hide_render)
    print("Hero bound:", [round(x, 3) for x in hero.bound_box[0]], "to", [round(x, 3) for x in hero.bound_box[6]])
if cam:
    print("Cam loc:", cam.location)
    print("Cam constraints:", [c.type for c in cam.constraints])
    print("Active scene cam:", scene.camera.name if scene.camera else "None")
if ped:
    print("Pedestal loc:", ped.location, "dim:", ped.dimensions)
for c in bpy.data.collections:
    print(f"Col '{c.name}': hide_render={c.hide_render}, hide_viewport={c.hide_viewport}, objects={[o.name for o in c.objects]}")
