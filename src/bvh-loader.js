// Adapted from https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/BVHLoader.js

import { Quaternion, Vector3, Matrix4 } from "three";

// Returns the next non-empty line
function _nextLine(lines) {
  let line;
  // Skip empty lines
  while ((line = lines.shift().trim()).length === 0) {}
  return line;
}

// Recursively parses the HIERARCHY section of a BVH file
// @param lines: array of lines
// @param firstLine: first line of the current node
// @param list: list of bones
// @return: a BVH node including children
function _readNode(lines, firstLine, list) {
  const node = { name: "", type: "", frames: [] };
  list.push(node);

  // Parse node type and name
  let tokens = firstLine.split(/[\s]+/);
  if (tokens[0].toUpperCase() === "END" && tokens[1].toUpperCase() === "SITE") {
    node.type = "ENDSITE";
    node.name = "EndSite"; // BVH end sites have no name
  } else {
    node.type = tokens[0];
    node.name = tokens[1];
  }

  if (_nextLine(lines) !== "{") {
    throw new Error("BVHLoader: { expected after type and name.");
  }

  // Parse OFFSET
  tokens = _nextLine(lines).split(/[\s]+/);
  if (tokens[0] !== "OFFSET") {
    throw new Error("BVHLoader: OFFSET expected but got " + tokens[0]);
  }
  if (tokens.length !== 4) {
    throw new Error("BVHLoader: OFFSET has invalid number of values.");
  }

  const offset = new Vector3(
    parseFloat(tokens[1]),
    parseFloat(tokens[2]),
    parseFloat(tokens[3])
  );
  if (isNaN(offset.x) || isNaN(offset.y) || isNaN(offset.z)) {
    throw new Error("BVHLoader: OFFSET has invalid values.");
  }
  node.offset = offset;

  // Parse CHANNELS
  if (node.type !== "ENDSITE") {
    tokens = _nextLine(lines).split(/[\s]+/);
    if (tokens[0] !== "CHANNELS") {
      throw new Error("BVHLoader: CHANNELS expected but got " + tokens[0]);
    }
    const numChannels = parseInt(tokens[1]);
    if (isNaN(numChannels)) {
      throw new Error("BVHLoader: CHANNELS has invalid number of values.");
    }
    if (tokens.length !== numChannels + 2) {
      throw new Error("BVHLoader: CHANNELS has invalid number of values.");
    }
    node.channels = tokens.splice(2, numChannels);
    node.children = [];
  }

  // Read children
  while (true) {
    const line = _nextLine(lines);
    if (line === "}") {
      break;
    } else {
      node.children.push(_readNode(lines, line, list));
    }
  }

  return node;
}

function _readFrameData(data, frameTime, bone) {
  // End sites have no motion data
  if (bone.type === "ENDSITE") {
    return;
  }

  // Add keyframe
  const frame = {
    time: frameTime,
    position: new Vector3(),
    rotation: new Quaternion(),
  };
  bone.frames.push(frame);

  const quat = new Quaternion();

  const vx = new Vector3(1, 0, 0);
  const vy = new Vector3(0, 1, 0);
  const vz = new Vector3(0, 0, 1);

  // Quaternion magic

  // Parse values for each channel
  for (let i = 0; i < bone.channels.length; i++) {
    const channel = bone.channels[i];
    switch (channel) {
      case "Xposition":
        frame.position.x = parseFloat(data.shift().trim());
        break;
      case "Yposition":
        frame.position.y = parseFloat(data.shift().trim());
        break;
      case "Zposition":
        frame.position.z = parseFloat(data.shift().trim());
        break;
      case "Xrotation":
        quat.setFromAxisAngle(
          vx,
          (parseFloat(data.shift().trim()) * Math.PI) / 180
        );
        frame.rotation.multiply(quat);
        break;
      case "Yrotation":
        quat.setFromAxisAngle(
          vy,
          (parseFloat(data.shift().trim()) * Math.PI) / 180
        );
        frame.rotation.multiply(quat);
        break;
      case "Zrotation":
        quat.setFromAxisAngle(
          vz,
          (parseFloat(data.shift().trim()) * Math.PI) / 180
        );
        frame.rotation.multiply(quat);
        break;
      default:
        throw new Error("BVHLoader: Invalid channel type " + channel);
    }
  }

  // Parse child nodes
  for (let i = 0; i < bone.children.length; i++) {
    _readFrameData(data, frameTime, bone.children[i]);
  }
}

// Reads an array of lines from a BVH file
// And outputs a skeleton structure including motion data.
function _readBvh(lines) {
  // Read model structure
  if (_nextLine(lines) !== "HIERARCHY") {
    throw new Error("BVHLoader: HIERARCHY expected.");
  }

  const list = [];
  const root = _readNode(lines, _nextLine(lines), list);

  // Read motion data
  if (_nextLine(lines) !== "MOTION") {
    throw new Error("BVHLoader: MOTION expected.");
  }

  // Number of frames
  let tokens = _nextLine(lines).split(/[\s]+/);
  if (tokens[0] !== "Frames:") {
    throw new Error("BVHLoader: Frames: expected but got " + tokens[0]);
  }
  const numFrames = parseInt(tokens[1]);
  if (isNaN(numFrames)) {
    throw new Error("BVHLoader: Frames: has invalid number of values.");
  }

  // Frame time
  tokens = _nextLine(lines).split(/[\s]+/);
  if (tokens[0] !== "Frame" || tokens[1] !== "Time:") {
    throw new Error(
      "BVHLoader: Frame Time: expected but got " + tokens[0] + " " + tokens[1]
    );
  }
  const frameTime = parseFloat(tokens[2]);
  if (isNaN(frameTime)) {
    throw new Error("BVHLoader: Frame Time: has invalid value.");
  }

  // Parse frames
  for (let i = 0; i < numFrames; i++) {
    tokens = _nextLine(lines).split(/[\s]+/);
    _readFrameData(tokens, i * frameTime, root);
  }

  list.numFrames = numFrames;
  list.frameTime = frameTime;
  return list;
}

const ONE = new Vector3(1, 1, 1);

function calculateAbsoluteTransforms(bone, parentBone = null) {
  if (bone.type === "ENDSITE") {
    return;
  }

  for (let frameIndex = 0; frameIndex < bone.frames.length; frameIndex++) {
    let parentTransform;
    if (parentBone) {
      parentTransform = parentBone.frames[frameIndex].transform.clone();
    } else {
      parentTransform = new Matrix4(); // Identity matrix
    }

    const frame = bone.frames[frameIndex];
    const boneTransform = new Matrix4();
    const offsetTransform = new Matrix4();

    // Create a matrix from the frame's position, rotation, and scale
    boneTransform.compose(frame.position, frame.rotation, ONE);

    // Create a matrix from the bone's offset
    offsetTransform.setPosition(bone.offset);

    // Combine the offset and bone transforms
    boneTransform.premultiply(offsetTransform);

    // Multiply the parent's transform matrix by the bone's to get the
    // absolute transform matrix
    const absoluteTransform = parentTransform.multiply(boneTransform);

    // Store the absolute transform matrix in the frame
    frame.transform = absoluteTransform;
    frame.absolutePosition = new Vector3();
    frame.absolutePosition.setFromMatrixPosition(absoluteTransform);
  }

  if (bone.children) {
    for (let childBone of bone.children) {
      calculateAbsoluteTransforms(childBone, bone);
    }
  }
}

export function parseBvh(text) {
  const lines = text.split(/[\r\n]+/g);
  const bones = _readBvh(lines);
  calculateAbsoluteTransforms(bones[0]);
  return bones;
}

// Match the bones to the Mediapipe pose landmarks
// https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
export function calculatePoseData(bones) {
  function _findBoneByName(name) {
    const bone = bones.find((bone) => bone.name === name);
    if (!bone) {
      throw new Error(`Bone ${name} not found`);
    }
    return bone;
  }

  const boneList = [];
  boneList.push(_findBoneByName("HeadTip")); // 0 - nose
  boneList.push(_findBoneByName("HeadTip")); // 1 - left eye (inner)
  boneList.push(_findBoneByName("HeadTip")); // 2 - left eye
  boneList.push(_findBoneByName("HeadTip")); // 3 - left eye (outer)
  boneList.push(_findBoneByName("HeadTip")); // 4 - right eye (inner)
  boneList.push(_findBoneByName("HeadTip")); // 5 - right eye
  boneList.push(_findBoneByName("HeadTip")); // 6 - right eye (outer)
  boneList.push(_findBoneByName("HeadTip")); // 7 - left ear
  boneList.push(_findBoneByName("HeadTip")); // 8 - right ear
  boneList.push(_findBoneByName("HeadTip")); // 9 - mouth (left)
  boneList.push(_findBoneByName("HeadTip")); // 10 - mouth (right)
  boneList.push(_findBoneByName("LeftShoulder")); // 11 - left shoulder
  boneList.push(_findBoneByName("RightShoulder")); // 12 - right shoulder
  boneList.push(_findBoneByName("LeftForeArm")); // 13 - left elbow
  boneList.push(_findBoneByName("RightForeArm")); // 14 - right elbow
  boneList.push(_findBoneByName("LeftHand")); // 15 - left wrist
  boneList.push(_findBoneByName("RightHand")); // 16 - right wrist
  boneList.push(_findBoneByName("LeftFinger5Tip")); // 17 - left pinky
  boneList.push(_findBoneByName("RightFinger5Tip")); // 18 - right pinky
  boneList.push(_findBoneByName("LeftFinger2Tip")); // 19 - left index
  boneList.push(_findBoneByName("RightFinger2Tip")); // 20 - right index
  boneList.push(_findBoneByName("LeftFinger1Tip")); // 21 - left thumb
  boneList.push(_findBoneByName("RightFinger1Tip")); // 22 - right thumb
  boneList.push(_findBoneByName("LeftThigh")); // 23 - left hip
  boneList.push(_findBoneByName("RightThigh")); // 24 - right hip
  boneList.push(_findBoneByName("LeftShin")); // 25 - left knee
  boneList.push(_findBoneByName("RightShin")); // 26 - right knee
  boneList.push(_findBoneByName("LeftFoot")); // 27 - left ankle
  boneList.push(_findBoneByName("RightFoot")); // 28 - right ankle
  boneList.push(_findBoneByName("LeftToe")); // 29 - left heel
  boneList.push(_findBoneByName("RightToe")); // 30 - right heel
  boneList.push(_findBoneByName("LeftToeTip")); // 31 - left foot index
  boneList.push(_findBoneByName("RightToeTip")); // 32 - right foot index

  const frames = [];
  for (let frameIndex = 0; frameIndex < bones.numFrames; frameIndex++) {
    const frame = [];
    for (const bone of boneList) {
      frame.push(
        bone.frames[frameIndex].absolutePosition
          .divideScalar(-750)
          .add(new Vector3(0.5, 0.8, 0))
      );
    }
    frames.push(frame);
  }
  return {
    frameRate: 1 / bones.frameTime,
    frameCount: bones.numFrames,
    width: 1280,
    height: 1024,
    frames,
  };
}
