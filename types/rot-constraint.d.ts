import { Body } from "./body.js";
export declare class RotConstraint {
    /**
     * Body A
     */
    bodyA: Body;
    /**
     * Contraint position relative to bodyA frame of reference
     */
    private anchorA;
    /**
     * Body B
     */
    bodyB: Body;
    /**
     * Constraint position relative to bodyB frame of reference
     */
    private anchorB;
    /**
     * Rotational constraint constructor
     * @param bodyA constraint's body A
     * @param anchorA position (relative to body A coordinate system) where
     * it is constrained.
     * @param bodyB constraint's body B
     * @param anchorB position (relative to body B coordinate system) where
     * it is constrained.
     */
    constructor(bodyA: Body, anchorA: Vector, bodyB: Body, anchorB: Vector);
    f(xa: number, ya: number, thetaA: number, xb: number, yb: number, thetaB: number): [number, number];
}
