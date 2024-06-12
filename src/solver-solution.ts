import { Matrix } from "mathjs";

/**
 * Represents a solution
 */
export class SolverSolution {
    private x: Matrix;
    private _solved: boolean;
    private msg: string;

    constructor(x: Matrix, solved: boolean, msg: string) {
        this.x = x;
        this._solved = solved;
        this.msg = msg;
    }

    /**
     * Get solution's X Vector.
     */
    getX(): Matrix {
        return this.x;
    }

    /**
     * @returns boolean indicating if the solver found a solution 
     */
    solved(): boolean {
        return this._solved;
    }

    /**
     * @returns solver's message.
     */
    message(): string {
        return this.msg;
    }

    static success(x: Matrix) {
        return new SolverSolution(x, true, "Solution achived");
    }

    static timeOut(x: Matrix) {
        return new SolverSolution(x, false, "No solution found. Solver timed out");
    }

    static maxIterReached(x: Matrix) {
        return new SolverSolution(x, false, "No solution found. Max number of iteratios reached");
    }
}