import cv2
import mediapipe as mp
import numpy as np
import json

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose


def fround(v):
    return round(v * 10000) / 10000


import sys
import os

if len(sys.argv) < 2:
    print("Usage: python3 scripts/convert.py <video file>")
    exit(1)

filename = sys.argv[1]


cap = cv2.VideoCapture(filename)
output = {
    "frameRate": fround(cap.get(cv2.CAP_PROP_FPS)),
    "filename": os.path.basename(filename),
    "frameCount": 0,
    "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
    "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
    "poses": [],
}
frames = []
frame_count = 0
with mp_pose.Pose(
    static_image_mode=False,
    model_complexity=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
) as pose:
    print("Open pose library")
    while cap.isOpened():
        print(".", end="", flush=True)
        frame_count += 1
        success, image = cap.read()
        if not success:
            print("End of video.")
            break
        # To improve performance, optionally mark the image as not writeable to
        # pass by reference.
        image.flags.writeable = False
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = pose.process(image)
        if results.pose_landmarks is None:
            frames.append([])
            continue
        landmarks = results.pose_landmarks.landmark
        landmarks = [
            {
                "x": fround(landmark.x),
                "y": fround(landmark.y),
                "z": fround(landmark.z),
                "visibility": fround(landmark.visibility),
            }
            for landmark in landmarks
        ]
        frames.append(list(landmarks))
print()

output["frames"] = frames
output["frameCount"] = frame_count
cap.release()

with open("public/pose_data.json", "w") as outfile:
    json.dump(output, outfile)
