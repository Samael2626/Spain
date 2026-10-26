import bpy
import time

print("[Blender Init] Loading Jimkeg master scene...")
try:
    bpy.ops.blendermcp.start_server()
    print("[Blender Init] Blender MCP Server started successfully on port", bpy.context.scene.blendermcp_port)
except Exception as e:
    print("[Blender Init] Failed to start server:", e)
