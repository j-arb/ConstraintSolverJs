import { Differentiator } from "fsolve-js";
import { Matrix, abs, add, index, inv, max, multiply, range, sign } from "mathjs";
import { SolverSolution } from "./solver-solution.js";

export class Solver {
    /**
     * Minimum error to stop solver
     */
    private stopError: number;

    /**
     * Maximum number of iterations to stop solver
     */
    private maxIterations: number;

    /**
     * Solver timeout (in ms)
     */
    private timeOut: number;

    /**
     * Numerical differentiation delta
     */
    private delta: number;

    private diff: Differentiator;

    /**
     * Solver constructor
     * @param stopError - Minimum error to stop solver.
     * @param maxIterations - Maximum number of iterations to stop solver.
     * @param timeOut - Solver timeout (in ms)
     * @param delta Numerical differentiation delta.
     */
    constructor(stopError: number = 1e-6, maxIterations: number = 1e3, timeOut: number = 3.6e6, delta: number = 1e-9) {
        this.stopError = stopError;
        this.maxIterations = maxIterations;
        this.timeOut = timeOut;
        this.delta = delta;
        this.diff = new Differentiator(delta);
    }

    solve(f: (x: Matrix) => Matrix, x: Matrix): SolverSolution {
        const n = x.size()[0];
        const m = f(x).size()[0];

        if(n === m) {
            return this.solveDetermined(f, x);
        } else if (n > m) {
            return this.solveUnderdetermined(f, x);
        } else {
            throw new Error("Unable to solve. System has more equations than variables");
        }
    }

    solveUnderdetermined(f: (x: Matrix) => Matrix, x: Matrix): SolverSolution {
        const n = x.size()[0];
        const m = f(x).size()[0];

        if(m > n) {
            throw new Error("Unable to solve. System has more equations than variables.");
        }
        if (m == n) {
            console.warn("System has as many variables as equations. Use solveDetermined for better performance.");
        }

        let error = Infinity;
        let iter = 0;
        const initialTime = Date.now();
        let selIndices: number[] = [];


        while (error >= this.stopError) {
            // Update selected indices every 10 iterations
            if(iter % 10 === 0) {
                selIndices = this.selectIndices(f, x);
            }
            const y = f(x);
            const J = this.diff.jacobian(f, x);
            const smallJ = J.subset(index(range(0, m), selIndices))
            let smallX = x.subset(index(selIndices, 0));
            if(iter >= this.maxIterations) {
                SolverSolution.maxIterReached(x);
            } else if((Date.now() - initialTime) >= this.timeOut) {
                SolverSolution.timeOut(x);
            }

            const b = multiply(y, -1);
            let invJ = smallJ;
            try {
                invJ = inv(smallJ);
            } catch (e) {
                selIndices = this.selectIndices(f, x);
                continue;
            }
            const h = multiply(invJ, b);
            smallX = add(smallX, h);
            // update x
            selIndices.forEach((bigXi, smallXi) => {
                const xi = smallX.get([smallXi, 0]);
                x.set([bigXi, 0], xi);
            });
            error = max(abs(f(x))) as number;
            iter += 1;
        }

        return SolverSolution.success(x);
    }

    solveDetermined(f: (x: Matrix) => Matrix, x: Matrix): SolverSolution {
        const n = x.size()[0];
        const m = f(x).size()[0];
        if (m !== n) {
            throw new Error("Unable to solve. System has different number of equations and variables.");
        }
        
        let error = Infinity;
        let iter = 0;
        const initialTime = Date.now();

        while (error >= this.stopError) {
            if(iter >= this.maxIterations) {
                return SolverSolution.maxIterReached(x);
            } else if((Date.now() - initialTime) >= this.timeOut) {
                return SolverSolution.timeOut(x);
            }

            const y0 = f(x);
            const J = this.diff.jacobian(f, x);
            const b = multiply(y0, -1);
            const invJ = inv(J);
            const h = multiply(invJ, b);
            x = add(x, h);
            error = max(abs(f(x))) as number;
            iter += 1;
        }

        return SolverSolution.success(x);
    }

    private selectIndices(f: (x: Matrix) => Matrix, x: Matrix): number[] {
        const J = this.diff.jacobian(f, x);
        const m = J.size()[1];
        const rowSums = this.sumRows(abs(sign(J)));
        rowSums.sort((a, b) => {
            return a.sum - b.sum;
        });

        const selectedIndicesDict: {[index: number]: boolean} = {};
        const selectedIndices: number[] = [];

        rowSums.forEach((row) => {
            const i = row.i;
            let selectedjs = [];
            // let selectedj = -1;
            for(let j = 0; j < m; j++) {
                const absJij = Math.abs(J.get([i, j]));
                let max = 0;
                if(absJij > max && (!selectedIndicesDict[j])) {
                    selectedjs.push(j);
                    // selectedj = j;
                    max = absJij;
                }
            }
            if(selectedjs.length === 0) {
                throw new Error("Unale to find enough independent variables to solve the system.");
            }
            const selectedj = selectedjs[Math.floor(Math.random() * selectedjs.length)];
            selectedIndicesDict[selectedj] = true;
            selectedIndices.push(selectedj);
        });
            
        selectedIndices.sort();
        return selectedIndices;
    }

    private sumRows(mat: Matrix): {sum: number, i: number}[] {
        const n = mat.size()[0];
        const m = mat.size()[1];
        const ret = [];
        for(let i = 0; i < n; i++) {
            let sum = 0;
            for(let j = 0; j < m; j++) {
                sum += mat.get([i, j]);
            } 
            ret.push({sum: sum, i: i});
        }

        return ret;
    }
}