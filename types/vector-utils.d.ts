/**
 * Rotates a vector by a given angle (in radians)
 * @param {{x: number, y: number}} vector
 * @param {number} angle
 * @returns {{x: number, y: number}}
 */
export declare function rotateVector(vector: Vector, angle: number): Vector;
/**
 * Multiplies vector by alpha constant
 * @param {{x: number, y: number}} vector
 * @param {number} alpha
 * @returns {{x: number, y: number}}
 */
export declare function multiplyVector(vector: Vector, alpha: number): Vector;
/**
 * Adds two vectors
 * @param {{x: number, y: number}} vectorA
 * @param {{x: number, y: number}} vectorB
 * @returns {{x: number, y: number}}
 */
export declare function addVectors(vectorA: Vector, vectorB: Vector): Vector;
/**
 * Substracts vectorA - vectorB
 * @param {{x: number, y: number}} vectorA
 * @param {{x: number, y: number}} vectorB
 * @returns {{x: number, y: number}}
 */
export declare function substractVectors(vectorA: Vector, vectorB: Vector): Vector;
/**
 * Returns vector magnitude
 * @param {{x: number, y: number}} vector
 * @returns {number}
 */
export declare function vectorMagnitude(vector: Vector): number;
/**
 * Returns vectors' unit vector, o [0,0] if vector is the null vector
 * @param {{x: number, y: number}} vector
 * @returns {number}
 */
export declare function unitVector(vector: Vector): Vector;
