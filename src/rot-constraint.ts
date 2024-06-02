import { Matrix, matrix } from "mathjs";
import { relativeToGlobalPos, relativeToGlobalVector } from "./cord-sys-utils.js";
import { substractVectors } from "./vector-utils.js";
import { Body } from "./body.js";

export class RotConstraint {
    /**
     * Body A
     */
    public bodyA: Body;

    /**
     * Contraint position relative to bodyA frame of reference
     */
    private anchorA: Vector;

    /**
     * Body B
     */
    public bodyB: Body;

    /**
     * Constraint position relative to bodyB frame of reference
     */
    private anchorB: Vector;

    /**
     * Rotational constraint constructor
     * @param bodyA constraint's body A
     * @param anchorA position (relative to body A coordinate system) where
     * it is constrained.
     * @param bodyB constraint's body B
     * @param anchorB position (relative to body B coordinate system) where
     * it is constrained.
     */
    constructor(bodyA: Body, anchorA: Vector, bodyB: Body, anchorB: Vector) {
        if(bodyA.id === bodyB.id) {
            throw new Error(`A body cannot be constraint to itself. Body id: ${bodyA.id}`);
        }
        this.bodyA = bodyA;
        this.anchorA = anchorA;
        this.bodyB = bodyB;
        this.anchorB = anchorB;
    }

    f(xa: number, ya: number, thetaA: number, xb: number, yb: number, thetaB: number): [number, number] {
        const cmA = {x: xa, y: ya};
        const cmB = {x: xb, y: yb};
        const anchAglobal = relativeToGlobalPos(this.anchorA, cmA, thetaA);
        const anchBglobal = relativeToGlobalPos(this.anchorB, cmB, thetaB);
        const resultVec =  substractVectors(anchAglobal, anchBglobal);
        
        return [resultVec.x, resultVec.y];
    }
}