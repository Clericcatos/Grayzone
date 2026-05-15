Unity import guide

Files:
- map_500x500_ground_2048.png: ground/base texture
- map_500x500_minimap_512.png: minimap texture
- map_500x500_layout_overlay_2048.png: transparent guide/collider overlay
- map_500x500_ground_with_layout_overlay_2048.png: preview with overlay
- unity_map_coordinates.csv: building and road placement coordinates

Unity setup:
1. Create Plane at position (0,0,0). Unity default Plane is 10m x 10m, so set scale to (50,1,50) for 500m x 500m.
2. Apply map_500x500_ground_2048.png as Albedo/Base Map.
3. Use map_500x500_minimap_512.png for UI minimap.
4. Place buildings using unity_map_coordinates.csv.
