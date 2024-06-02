import { Matrix, matrix } from "mathjs";
import { relativeToGlobalPos, relativeToGlobalVector } from "./cord-sys-utils";
import { substractVectors } from "./vector-utils";

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

    constructor(bodyA: Body, anchorA: Vector, bodyB: Body, anchorB: Vector) {
        this.bodyA = bodyA;
        this.anchorA = anchorA;
        this.bodyB = bodyB;
        this.anchorB = anchorB;
    }

    _f(xa: number, ya: number, thetaA: number, xb: number, yb: number, thetaB: number): Vector {
        const cmA = {x: xa, y: ya};
        const cmB = {x: xb, y: yb};
        const anchAglobal = relativeToGlobalPos(this.anchorA, cmA, thetaA);
        const anchBglobal = relativeToGlobalPos(this.anchorB, cmB, thetaB);
        
        return substractVectors(anchAglobal, anchBglobal);
    }

    f(x: Matrix): Matrix {
        const xa =      x.get([0,0]);
        const ya =      x.get([1,0]);
        const thetaA =  x.get([2,0]);
        const xb =      x.get([3,0]);
        const yb =      x.get([4,0]);
        const thetaB =  x.get([5,0]);
        const vec = this._f(xa, ya, thetaA, xb, yb, thetaB);
        return matrix([[vec.x], [vec.y]]);
    }
}