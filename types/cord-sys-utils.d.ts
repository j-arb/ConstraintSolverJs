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
export declare function globalToRelativePos(globalPos: Vector, relCordOrigin: Vector, relCordRot: number): Vector;
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
export declare function relativeToGlobalPos(relPos: Vector, relCordOrigin: Vector, relCordRot?: number): Vector;
/**
 * Translate a vector (x,y) from a relative coordinate system to the
 * global coordinate system.
 * @param relVector Relative vector
 * @param relCordRot Rotation of the relative coordinate system in radians.
 * @returns vector in global coordinate system
 */
export declare function relativeToGlobalVector(relVector: Vector, relCordRot: number): Vector;
/**
 * Translate a vector (x,y) from the global coordinate system to a relative
 * coordinate system
 * @param relVector Global vector
 * @param relCordRot Rotation of the relative coordinate system in radians.
 * @returns vector in relative coordinate system.
 */
export declare function globalToRelativeVec(vector: Vector, relCordRot: number): Vector;
