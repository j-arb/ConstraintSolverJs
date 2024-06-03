import { Body } from "./body.js";
export declare class FixedConstraint {
    private x;
    private y;
    private theta;
    body: Body;
    constructor(body: Body);
    f(x: number, y: number, theta: number): [number, number, number];
}
