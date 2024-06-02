import { addVectors, rotateVector, substractVectors } from "./vector-utils.js";

/**
 * Translate a a position (x,y) from the global
 * coordinate system, to a relative coordinate system
 * @param {{x: number, y: number}} globalPos global position to translate
 * @param {{x: number, y: number}} relCordOrigin position of the relative
 * coordinate system
 * @param {number} relCordRot rotation of the relative coordinate system in
 * radians.
 * 
 * @returns {{x: number, y: number}} position in the relative coordinate system
 */
export function globalToRelativePos(globalPos: Vector, relCordOrigin: Vector, relCordRot: number): Vector {
    const translatedPos = substractVectors(globalPos, relCordOrigin);
    const translatedRotatedPos = rotateVector(translatedPos, -relCordRot);

    return translatedRotatedPos;
}

/**
 * Translate a position (x,y) from a relative coordinate system
 * to the global coordinate system.
 * @param {{x: number, y: number}} relPos relative position to translate 
 * @param {{x: number, y: number}} relCordOrigin position of the relatieve
 * coordinate system
 * @param {number} relCordRot rotation of the relative coordinate system in
 * radians.
 * 
 * @returns {{x: number, y: number}} position in the global coordinate system
 */
export function relativeToGlobalPos(relPos: Vector, relCordOrigin: Vector, relCordRot: number = 0): Vector {
    const rotPos = rotateVector(relPos, relCordRot);
    const translatedRotatedPos = addVectors(rotPos, relCordOrigin);

    return translatedRotatedPos;
}

/**
 * Translate a vector (x,y) from a relative coordinate system to the
 * global coordinate system.
 * @param relVector Relative vector
 * @param relCordRot Rotation of the relative coordinate system in radians.
 * @returns vector in global coordinate system
 */
export function relativeToGlobalVector(relVector: Vector, relCordRot: number) {
    const rotVec = rotateVector(relVector, relCordRot);
    return rotVec;
}

/**
 * Translate a vector (x,y) from the global coordinate system to a relative
 * coordinate system
 * @param relVector Global vector
 * @param relCordRot Rotation of the relative coordinate system in radians.
 * @returns vector in relative coordinate system.
 */
export function globalToRelativeVec(vector: Vector, relCordRot: number) {
    const rotVec = rotateVector(vector, -relCordRot);
    return rotVec;
}