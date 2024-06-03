/**
 * Represents a rigid body
 */
export declare class Body {
    /**
     * Body id
     */
    id: string;
    /**
     * Body's center of mass x position
     */
    x: number;
    /**
     * Body's center of mass y position
     */
    y: number;
    /**
     * Body's rotation in radians
     */
    theta: number;
    /**
     * Body constructor
     * @param id body id. No two bodies should have the same ID.
     * @param x Body's center of mass x position
     * @param y Body's center of mass y position
     * @param theta Body's rotation in radians
     */
    constructor(id: string, x: number, y: number, theta: number);
}
