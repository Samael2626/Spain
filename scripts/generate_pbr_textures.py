import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out_dir = r"d:\Proyectos\Paginas\Spain\public\images\textures"
os.makedirs(out_dir, exist_ok=True)

print("[1/5] Generating Arctic Camo Diffuse (2048x2048)...")
W, H = 2048, 2048
img = Image.new('RGB', (W, H), color=(28, 32, 38))
draw = ImageDraw.Draw(img)

# Authentic Arctic Multi-Terrain Palette
camo_palette = [
    (44, 50, 60),    # Dark slate wolf grey
    (68, 76, 88),    # Mid graphite grey
    (104, 114, 130), # Frost arctic grey
    (158, 168, 182), # Light titanium grey
    (22, 25, 31),    # Stealth deep carbon
    (128, 139, 155), # Alpine granite grey
    (195, 205, 218), # Blizzard snow tint
]

np.random.seed(42)
for layer_idx, color in enumerate(camo_palette):
    num_patches = 24 + layer_idx * 8
    for i in range(num_patches):
        start_x = np.random.randint(0, W)
        start_y = np.random.randint(0, H)
        num_verts = np.random.randint(6, 12)
        base_r = np.random.randint(90, 240)
        
        points = []
        for v in range(num_verts):
            angle = (v / num_verts) * 2 * math.pi
            r = base_r * (0.6 + 0.4 * np.random.rand())
            px = (start_x + r * math.cos(angle)) % W
            py = (start_y + r * math.sin(angle)) % H
            points.append((px, py))
            
        draw.polygon(points, fill=color)

# Soft blur to create organic military camouflage edges
img = img.filter(ImageFilter.GaussianBlur(radius=3.5))

# Micro ripstop grid weave overlay
draw_rip = ImageDraw.Draw(img)
grid_step = 16
for x in range(0, W, grid_step):
    draw_rip.line([(x, 0), (x, H)], fill=(255, 255, 255, 12), width=1)
for y in range(0, H, grid_step):
    draw_rip.line([(0, y), (W, y)], fill=(255, 255, 255, 12), width=1)

camo_diffuse_path = os.path.join(out_dir, "camo_arctic_diffuse.png")
img.save(camo_diffuse_path, quality=95)
print("Saved:", camo_diffuse_path)

print("[2/5] Generating Arctic Camo Roughness (2048x2048)...")
# Convert diffuse to greyscale roughness map with fabric range (0.6 to 0.85)
gray = img.convert('L')
gray_arr = np.array(gray, dtype=np.float32) / 255.0
roughness_arr = np.clip(0.60 + gray_arr * 0.25, 0.0, 1.0)
roughness_img = Image.fromarray((roughness_arr * 255).astype(np.uint8))
camo_rough_path = os.path.join(out_dir, "camo_arctic_roughness.png")
roughness_img.save(camo_rough_path)
print("Saved:", camo_rough_path)

print("[3/5] Generating Fabric Ripstop Normal Map (1024x1024)...")
# Procedural normal map with tangent space normal (128, 128, 255) as base
FN_SIZE = 1024
norm_arr = np.full((FN_SIZE, FN_SIZE, 3), [128, 128, 255], dtype=np.uint8)
# Add subtle grid bumps
x_coords = np.arange(FN_SIZE) % 16
y_coords = np.arange(FN_SIZE) % 16
bump_x = np.where((x_coords == 0) | (x_coords == 1), 145, 128).astype(np.uint8)
bump_y = np.where((y_coords == 0) | (y_coords == 1), 145, 128).astype(np.uint8)
norm_arr[:, :, 0] = bump_x[None, :]
norm_arr[:, :, 1] = bump_y[:, None]
fabric_norm_img = Image.fromarray(norm_arr, mode='RGB').filter(ImageFilter.GaussianBlur(radius=0.8))
fabric_norm_path = os.path.join(out_dir, "fabric_normal.png")
fabric_norm_img.save(fabric_norm_path)
print("Saved:", fabric_norm_path)

print("[4/5] Generating Paracord Braid Normal Map (1024x1024)...")
PC_SIZE = 1024
pc_arr = np.full((PC_SIZE, PC_SIZE, 3), [128, 128, 255], dtype=np.float32)
# Create interlocking diamond/chevron braid pattern
yy, xx = np.mgrid[0:PC_SIZE, 0:PC_SIZE]
diag1 = np.sin((xx + yy) * 0.15)
diag2 = np.cos((xx - yy) * 0.15)
nx = 128.0 + 35.0 * diag1
ny = 128.0 + 35.0 * diag2
nz = np.sqrt(np.clip(255.0**2 - (nx-128)**2 - (ny-128)**2, 100.0, 255.0**2))
pc_arr[:, :, 0] = np.clip(nx, 0, 255)
pc_arr[:, :, 1] = np.clip(ny, 0, 255)
pc_arr[:, :, 2] = np.clip(nz, 0, 255)
pc_img = Image.fromarray(pc_arr.astype(np.uint8), mode='RGB').filter(ImageFilter.GaussianBlur(radius=0.5))
pc_norm_path = os.path.join(out_dir, "paracord_normal.png")
pc_img.save(pc_norm_path)
print("Saved:", pc_norm_path)

print("[5/5] Generating Tactical Polymer Bump Map (1024x1024)...")
# Noise bump for injection molded matte plastic
poly_noise = np.random.normal(128, 14, (1024, 1024))
poly_noise = np.clip(poly_noise, 0, 255).astype(np.uint8)
poly_img = Image.fromarray(poly_noise, mode='L').filter(ImageFilter.GaussianBlur(radius=0.6))
poly_bump_path = os.path.join(out_dir, "polymer_bump.png")
poly_img.save(poly_bump_path)
print("Saved:", poly_bump_path)

print("All PBR texture maps generated successfully.")
