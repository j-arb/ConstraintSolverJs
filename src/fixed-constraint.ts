import { Matrix, matrix } from "mathjs";
import { Body } from "./body.js";

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

    f(x: number, y: number, theta: number): [number, number, number] {
        return [x - this.x, y - this.y, theta - this.theta];
    }
}