import { Matrix, matrix } from "mathjs";
import { Body } from "./body";

export class FixedConstraint {
    private x: number;
    private y: number;
    private theta: number;
    public body: Body;

    constructor(body: Body) {
        this.x = body.x;
        this.y = body.y;
        this.theta = body.theta;
        this.body = body;
    }

    _f(x: number, y: number, theta: number): [number, number, number] {
        return [x - this.x, y - this.y, theta - this.theta];
    }

    f(vec: Matrix): Matrix {
        const x     = vec.get([0,0]);
        const y     = vec.get([1,0]);
        const theta = vec.get([2,0]);
        const res = this._f(x, y, theta);
        return matrix([
            [res[0]],
            [res[1]],
            [res[2]]
        ]);
    }
}