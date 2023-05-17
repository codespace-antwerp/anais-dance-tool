import math
import json
import numpy as np


def rotate_x(point, origin, angle):
    s = math.sin(angle)
    c = math.cos(angle)
    y = point[1] - origin[1]
    z = point[2] - origin[2]
    new_y = y * c - z * s
    new_z = y * s + z * c
    return [point[0], new_y + origin[1], new_z + origin[2]]


def rotate_y(point, origin, angle):
    s = math.sin(angle)
    c = math.cos(angle)
    x = point[0] - origin[0]
    z = point[2] - origin[2]
    new_x = x * c + z * s
    new_z = -x * s + z * c
    return [new_x + origin[0], point[1], new_z + origin[2]]


def rotate_z(point, origin, angle):
    s = math.sin(angle)
    c = math.cos(angle)
    x = point[0] - origin[0]
    y = point[1] - origin[1]
    new_x = x * c - y * s
    new_y = x * s + y * c
    return [new_x + origin[0], new_y + origin[1], point[2]]


def parse_bvh_file(filename):
    with open(filename, "r") as f:
        lines = f.readlines()

    # Find the root node
    root_index = None
    for i, line in enumerate(lines):
        if line.startswith("ROOT"):
            root_index = i
            break
    if root_index is None:
        raise ValueError("No root node found.")

    # Parse the hierarchy of bones
    bones = {}
    stack = []
    for i in range(root_index, len(lines)):
        line = lines[i].strip()
        if line.startswith("ROOT") or line.startswith("JOINT"):
            name = line.split()[1]
            parent = stack[-1] if stack else None
            bone = {
                "name": name,
                "children": [],
                "channels": [],
                "offset": np.identity(4),
            }
            bones[name] = bone
            if parent:
                parent["children"].append(bone)
            stack.append(bone)
        elif line.startswith("End Site"):
            name = stack[-1]["name"] + "_End"
            parent = stack[-1]
            bone = {
                "name": name,
                "children": [],
                "channels": [],
                "offset": np.identity(4),
            }
            bones[name] = bone
            parent["children"].append(bone)
            stack.append(bone)
        elif line.startswith("OFFSET"):
            offset = [float(x) for x in line.split()[1:]]
            m = np.identity(4)
            m[:3, 3] = offset
            stack[-1]["offset"] = m
        elif line.startswith("CHANNELS"):
            channels = line.split()[2:]
            stack[-1]["channels"] = channels
        elif line.startswith("}"):
            if len(stack) > 0:
                stack.pop()
            else:
                raise ValueError(f"Line {i}: Unmatched closing brace.")

    with open("bones.json", "w") as outfile:
       json.dump(bones["Hips"], outfile)
    # print(bones)

    # Parse the motion data
    motion_index = None
    for i, line in enumerate(lines):
        if line.startswith("MOTION"):
            motion_index = i
            break
    if motion_index is None:
        raise ValueError("No motion data found.")
    
    # Parse the number of frames
    num_frames = int(lines[motion_index + 1].split()[1])
    # Parse the frame time
    frame_time = float(lines[motion_index + 2].split()[2])
    # Parse the motion data
    motion_data = []
    for i in range(motion_index + 3, motion_index + 3 + num_frames):
        line = lines[i].strip()
        motion_data.append([float(x) for x in line.split()])
    motion_data = np.array(motion_data)

    # Calculate the absolute positions of each bone
    for bone in bones.values():
        bone["absolute_positions"] = []
        bone["absolute_rotations"] = []
        bone["absolute_transforms"] = []
        bone["absolute_positions"].append(np.array([0, 0, 0, 1]))
        bone["absolute_rotations"].append(np.identity(4))
        bone["absolute_transforms"].append(np.identity(4))
    for i in range(num_frames):
        for bone in bones.values():
            parent = bones[bone["name"]].get("parent")
            if parent:
                parent_transform = bone["absolute_transforms"][i]
                parent_rotation = bone["absolute_rotations"][i]
                parent_position = bone["absolute_positions"][i]
                parent_offset = parent["offset"]
                parent_transform = np.matmul(parent_transform, parent_offset)
                parent_rotation = np.matmul(parent_rotation, parent_offset)
                parent_position = np.matmul(parent_position, parent_offset)
                bone["absolute_transforms"].append(parent_transform)
                bone["absolute_rotations"].append(parent_rotation)
                bone["absolute_positions"].append(parent_position)
            else:
                bone["absolute_transforms"].append(bone["offset"])
                bone["absolute_rotations"].append(np.identity(4))
                bone["absolute_positions"].append(np.array([0, 0, 0, 1]))

   
    # Return the hierarchy of bones
    return bones


bones = parse_bvh_file("assets/2023-05-04-improv-1.bvh")
print(bones)
