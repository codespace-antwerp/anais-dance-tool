// Adapted from https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/BVHLoader.js

import { Quaternion, Vector3 } from 'three';

// Returns the next non-empty line
function _nextLine(lines) {
    let line;
    // Skip empty lines
    while ((line = lines.shift().trim()).length === 0) { }
    return line;
}

// Recursively parses the HIERARCHY section of a BVH file
// @param lines: array of lines
// @param firstLine: first line of the current node
// @param list: list of bones
// @return: a BVH node including children
function _readNode(lines, firstLine, list) {
    const node = { name: '', type: '', frames: [] };
    list.push(node);

    // Parse node type and name
    let tokens = firstLine.split(/[\s]+/);
    if (tokens[0].toUpperCase() === 'END' && tokens[1].toUpperCase() === 'SITE') {
        node.type = 'ENDSITE';
        node.name = 'ENDSITE'; // BVH end sites have no name
    } else {
        node.type = tokens[0];
        node.name = tokens[1].toUpperCase();
    }

    if (_nextLine(lines) !== '{') {
        throw new Error('BVHLoader: { expected after type and name.');
    }

    // Parse OFFSET
    tokens = _nextLine(lines).split(/[\s]+/);
    if (tokens[0] !== 'OFFSET') {
        throw new Error('BVHLoader: OFFSET expected but got ' + tokens[0]);
    }
    if (tokens.length !== 4) {
        throw new Error('BVHLoader: OFFSET has invalid number of values.');
    }

    const offset = new Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
    if (isNaN(offset.x) || isNaN(offset.y) || isNaN(offset.z)) {
        throw new Error('BVHLoader: OFFSET has invalid values.');
    }
    node.offset = offset;

    // Parse CHANNELS
    if (node.type !== 'ENDSITE') {
        tokens = _nextLine(lines).split(/[\s]+/);
        if (tokens[0] !== 'CHANNELS') {
            throw new Error('BVHLoader: CHANNELS expected but got ' + tokens[0]);
        }
        const numChannels = parseInt(tokens[1]);
        if (isNaN(numChannels)) {
            throw new Error('BVHLoader: CHANNELS has invalid number of values.');
        }
        if (tokens.length !== numChannels + 2) {
            throw new Error('BVHLoader: CHANNELS has invalid number of values.');
        }
        node.channels = tokens.splice(2, numChannels);
        node.children = [];
    }

    // Read children
    while (true) {
        const line = _nextLine(lines);
        if (line === '}') {
            break;
        } else {
            node.children.push(_readNode(lines, line, list));
        }
    }

    return node;
}

function _readFrameData(data, frameTime, bone) {
    // End sites have no motion data
    if (bone.type === 'ENDSITE') {
        return;
    }

    // Add keyframe
    const frame = { time: frameTime, position: new Vector3(), rotation: new Quaternion() };
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
            case 'Xposition':
                frame.position.x = parseFloat(data.shift().trim());
                break;
            case 'Yposition':
                frame.position.y = parseFloat(data.shift().trim());
                break;
            case 'Zposition':
                frame.position.z = parseFloat(data.shift().trim());
                break;
            case 'Xrotation':
                quat.setFromAxisAngle(vx, parseFloat(data.shift().trim()) * Math.PI / 180);
                frame.rotation.multiply(quat);
                break;
            case 'Yrotation':
                quat.setFromAxisAngle(vy, parseFloat(data.shift().trim()) * Math.PI / 180);
                frame.rotation.multiply(quat);
                break;
            case 'Zrotation':
                quat.setFromAxisAngle(vz, parseFloat(data.shift().trim()) * Math.PI / 180);
                frame.rotation.multiply(quat);
                break;
            default:
                throw new Error('BVHLoader: Invalid channel type ' + channel);
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
    if (_nextLine(lines) !== 'HIERARCHY') {
        throw new Error('BVHLoader: HIERARCHY expected.');
    }

    const list = [];
    const root = _readNode(lines, _nextLine(lines), list);

    // Read motion data
    if (_nextLine(lines) !== 'MOTION') {
        throw new Error('BVHLoader: MOTION expected.');
    }

    // Number of frames
    let tokens = _nextLine(lines).split(/[\s]+/);
    if (tokens[0] !== 'Frames:') {
        throw new Error('BVHLoader: Frames: expected but got ' + tokens[0]);
    }
    const numFrames = parseInt(tokens[1]);
    if (isNaN(numFrames)) {
        throw new Error('BVHLoader: Frames: has invalid number of values.');
    }

    // Frame time
    tokens = _nextLine(lines).split(/[\s]+/);
    if (tokens[0] !== 'Frame' || tokens[1] !== 'Time:') {
        throw new Error('BVHLoader: Frame Time: expected but got ' + tokens[0] + ' ' + tokens[1]);
    }
    const frameTime = parseFloat(tokens[2]);
    if (isNaN(frameTime)) {
        throw new Error('BVHLoader: Frame Time: has invalid value.');
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

function calculateAbsolutePositions(bones, parentBone = null) {
    for (let bone of bones) {
        if (bone.type === 'ENDSITE') {
            continue;
        }

        // Get position and rotation from frame data
        for (let frameIndex = 0; frameIndex < bone.frames.length; frameIndex++) {
            let absolutePosition;
            let parentRotation;
            if (parentBone) {
                // Start from the absolute position of the parent bone
                const parentFrame = parentBone.frames[frameIndex];
                absolutePosition = parentFrame.absolutePosition.clone();
                parentRotation = parentFrame.rotation.clone();
            } else {
                absolutePosition = new Vector3();
                parentRotation = new Quaternion();
            }
            // Add the bone offset position
            // absolutePosition.add(bone.offset);
            // Add the frame position and rotation
            const frame = bone.frames[frameIndex];
            const offset = bone.offset.clone();
            offset.add(frame.position);
            offset.applyQuaternion(frame.rotation);
            absolutePosition.add(offset);
            // Update the frame's absolute position
            frame.absolutePosition = absolutePosition;
        }

        // Recursively calculate absolute positions for child bones
        if (bone.children) {
            calculateAbsolutePositions(bone.children, bone);
        }
    }
}

export function parseBvh(text) {
    const lines = text.split(/[\r\n]+/g);
    const bones = _readBvh(lines);
    calculateAbsolutePositions(bones, 0);
    return bones;
}

// Match the bones to the Mediapipe pose landmarks
// https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
export function calculatePoseData(bones) {
    function _findBoneByName(name) {
        return bones.find(bone => bone.name === name);
    }

    const boneList = [];
    boneList.push(_findBoneByName('HEAD')); // 0 - nose
    boneList.push(_findBoneByName('HEAD')); // 1 - left eye (inner)
    boneList.push(_findBoneByName('HEAD')); // 2 - left eye
    boneList.push(_findBoneByName('HEAD')); // 3 - left eye (outer)
    boneList.push(_findBoneByName('HEAD')); // 4 - right eye (inner)
    boneList.push(_findBoneByName('HEAD')); // 5 - right eye
    boneList.push(_findBoneByName('HEAD')); // 6 - right eye (outer)
    boneList.push(_findBoneByName('HEAD')); // 7 - left ear
    boneList.push(_findBoneByName('HEAD')); // 8 - right ear
    boneList.push(_findBoneByName('HEAD')); // 9 - mouth (left)
    boneList.push(_findBoneByName('HEAD')); // 10 - mouth (right)
    boneList.push(_findBoneByName('LEFTSHOULDER')); // 11 - left shoulder
    boneList.push(_findBoneByName('RIGHTSHOULDER')); // 12 - right shoulder
    boneList.push(_findBoneByName('LEFTFOREARM')); // 13 - left elbow
    boneList.push(_findBoneByName('RIGHTFOREARM')); // 14 - right elbow
    boneList.push(_findBoneByName('LEFTHAND')); // 15 - left wrist
    boneList.push(_findBoneByName('RIGHTHAND')); // 16 - right wrist
    boneList.push(_findBoneByName('LEFTHANDPINKY1')); // 17 - left pinky
    boneList.push(_findBoneByName('RIGHTHANDPINKY1')); // 18 - right pinky
    boneList.push(_findBoneByName('LEFTHANDINDEX1')); // 19 - left index
    boneList.push(_findBoneByName('RIGHTHANDINDEX1')); // 20 - right index
    boneList.push(_findBoneByName('LEFTHANDTHUMB1')); // 21 - left thumb
    boneList.push(_findBoneByName('RIGHTHANDTHUMB1')); // 22 - right thumb
    boneList.push(_findBoneByName('LEFTUPLEG')); // 23 - left hip
    boneList.push(_findBoneByName('RIGHTUPLEG')); // 24 - right hip
    boneList.push(_findBoneByName('LEFTLEG')); // 25 - left knee
    boneList.push(_findBoneByName('RIGHTLEG')); // 26 - right knee
    boneList.push(_findBoneByName('LEFTFOOT')); // 27 - left ankle
    boneList.push(_findBoneByName('RIGHTFOOT')); // 28 - right ankle
    boneList.push(_findBoneByName('LEFTFOOT')); // 29 - left heel
    boneList.push(_findBoneByName('RIGHTFOOT')); // 30 - right heel
    boneList.push(_findBoneByName('LEFTTOEBASE')); // 31 - left foot index
    boneList.push(_findBoneByName('RIGHTTOEBASE')); // 32 - right foot index

    const frames = [];
    for (let frameIndex = 0; frameIndex < bones.numFrames; frameIndex++) {
        const frame = [];
        for (const bone of boneList) {
            frame.push(bone.frames[frameIndex].absolutePosition.divideScalar(200).addScalar(0.1));
        }
        frames.push(frame);
    }
    return { frameRate: 1000 / bones.frameTime, frameCount: bones.numFrames, width: 640, height: 480, frames };
}
