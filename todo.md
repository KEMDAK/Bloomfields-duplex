# TODO - 2D Verification First Approach

## Step 1: Create 2D top-down plan
- [ ] Build interactive 2D canvas/SVG floor plan viewer
- [ ] Apply all corrections from user annotations:
  - Internal stairs are on the RIGHT side (between guest toilet and maid's room), NOT in reception
  - Missing top section above reception (marker 2, with 5.78m dimension and sink/counter)
  - Entrance door at top-right (marker 3, door arc visible)
  - External staircase (marker 4) is OUTSIDE — do not render
  - Dashed rectangle in reception is NOT stairs (likely double-height void or terrace)
- [ ] Show all dimensions, room labels, doors, windows
- [ ] Get user confirmation that layout is correct

## Step 2: Convert to 3D
- [ ] Once 2D is confirmed, rebuild 3D model from verified data
