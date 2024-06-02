/**
 * Represents a rigid body
 */
export class Body {
    /**
     * Body id
     */
    public id: string;
    /**
     * Body's center of mass x position
     */
    public x: number;

    /**
     * Body's center of mass y position
     */
    public y: number

    /**
     * Body's rotation in radians
     */
    public theta: number;

    /**
     * Body constructor
     * @param id body id
     * @param x Body's center of mass x position
     * @param y Body's center of mass y position
     * @param theta Body's rotation in radians
     */
    constructor(id: string, x: number, y: number, theta: number) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.theta = theta;
    }
}