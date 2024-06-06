import { Matrix, abs, fix, index, matrix, number, range, sign, sort, string, zeros } from "mathjs";
import { Body } from "./body.js";
import { FixedConstraint } from "./fixed-constraint.js";
import { RotConstraint } from "./rot-constraint.js";
import { Differentiator, Solver } from "fsolve-js";

/**
 * Set of bodies, rotational constraints
 * and fixed constraints.
 */
export class World {
    private rotConstraints: RotConstraint[];
    private fixConstraints: FixedConstraint[];
    private bodies: { [id: string]: Body };
    private bodiesLst: Body[] = [];
    private errors: string[] = [];
    private indices: { [bodyId: string]: {x: number, y: number, theta: number} } = {};
    private x0: Matrix;
    private dof: number;
    

    /**
     * World constructor.
     * @param rotConstraints set of rotational constraints
     * @param fixConstraints set of fixed constraints
     * @throws `WorldSetupError` if set of constraints is
     * inconsistent or usolvable.
     */
    constructor(
        rotConstraints: RotConstraint[],
        fixConstraints: FixedConstraint[]
    ) {
        this.bodies = {}; // Initialize bodies dictionary
        this.rotConstraints = rotConstraints; // Initialize rotConstraints
        this.fixConstraints = fixConstraints; // Initialize fixConstraints
        this.loadBodies(); // Fill bodies dictionary and bodies list
        this.x0 = matrix(zeros([this.bodiesLst.length * 3, 1])); // Initialize x0 vector

        this.dof = this.validateDegsOfFreedom(); // validate if system has enough dof

        if (this.errors.length > 0) {
            throw new WorldSetupError(this.errors);
        }
    }

    /**
     * Loops through rotConstraints and fixConstraints
     * and adds bodies to bodies dictionary.
     * If errors are found, appends error to `this.errors`
     */
    private loadBodies() {
        this.rotConstraints.forEach((rc) => {
            const bodyA = rc.bodyA;
            const bodyB = rc.bodyB;

            if(bodyA.id === bodyB.id) {
                this.errors.push(`A body can't have a rotational constraint with it self. Body id: ${bodyA.id}`);
            }
            this.bodies[bodyA.id] = bodyA;
            this.bodies[bodyB.id] = bodyB;
        });

        this.fixConstraints.forEach((fc) => {
            const body = fc.body;
            this.bodies[body.id] = body;
        });

        this.bodiesLst = Object.values(this.bodies);
    }

    /**
     * Validates if system's degrees of freedom are greater or equal to 0.
     * If not, appends an error to `this.errors`
     */
    private validateDegsOfFreedom() {
        const r = this.rotConstraints.length;
        const f = this.fixConstraints.length;
        const b = Object.keys(this.bodies).length;
        const dof = World.degOfFreedom(b, r, f);
        if (dof < 0) {
            this.errors.push(`Unsolvable system: system is over constrained (degrees of freedom: ${dof})`);
        }
        return dof;
    }

    /**
     * Calculates the degrees of freedom of a system with
     * b bodies, r rotational constraints and f degrees of
     * freedom.
     * It follows the formula `deg_of_freedom = 3*b - 2*r - 3*f`
     * @param b number of bodies
     * @param r number of rotational constraints
     * @param f number of fixed constraints
     */
    private static degOfFreedom(b: number, r: number, f: number): number {
        return 3*b - 2*r - 3*f;
    }

    /**
     * Solves the set of constraints and bodies.
     * Updates the bodies to their solved positions
     * @param solver (optional) `fsolve-js.Solver`
     * @throws UnableToSolveError if solver is unable to solve the system.
     */
    solve(solver?: Solver): World {
        if(!solver) {
            solver = new Solver();
        }

        // load initial x0 vector
        const nBodies = this.bodiesLst.length;
        const n = 3*nBodies - this.dof;
        this.loadInitialX0AndIndices();

        // Select variables to solve
        const diff = new Differentiator();
        const J = diff.jacobian(this.f, this.x0);
        const selectedIndices = this.selectSolverVariableIndices(J);

        // Rearrange x0 based on selected variables
        const newX0 = this.loadIndicesDictAndGetX0(selectedIndices);
        this.x0 = newX0;
        const solverX = newX0.subset(index(range(0,n), 0));

        // Solve
        const sol = solver.solve(this.f, solverX);
        if(!sol.solved()) {
            throw new UnableToSolveError(sol.message());
        }

        // Update bodies
        this.bodiesLst.forEach((body) => {
            this.setBodyPosition(sol.getX(), body);
        });

        return this;
    }

    private loadIndicesDictAndGetX0(selectedIndices: {[index: number]: boolean}): Matrix {
        const x0Length = this.bodiesLst.length * 3;
        const x0 = matrix(zeros([x0Length, 0]));
        let xVecIndex = 0;
        let constIndex = x0Length;
        this.bodiesLst.forEach((body, bodyIndex) => {
            const xIndex = bodyIndex * 3;
            const yIndex = bodyIndex * 3 + 1;
            const tIndex = bodyIndex * 3 + 2;
            this.indices[body.id] = {x: NaN, y: NaN, theta: NaN};
            if(selectedIndices[xIndex]) {
                this.indices[body.id].x = xVecIndex++;
            } else {
                this.indices[body.id].x = constIndex++;
            }
            x0.set([this.indices[body.id].x, 0], body.x);

            if(selectedIndices[yIndex]) {
                this.indices[body.id].y = xVecIndex++;
            } else {
                this.indices[body.id].y = constIndex++;
            }
            x0.set([this.indices[body.id].y, 0], body.y);

            if(selectedIndices[tIndex]) {
                this.indices[body.id].theta = xVecIndex++;
            } else {
                this.indices[body.id].theta = constIndex++;
            }
            x0.set([this.indices[body.id].theta, 0], body.theta);
        });

        return x0;
    }

    private loadInitialX0AndIndices() {
        const bIds = Object.keys(this.bodies);
        bIds.forEach((id, i) => {
            const body = this.bodies[id];

            // set up indices
            const startIndex = 3*i;
            this.indices[id] = {x: startIndex, y: startIndex + 1, theta: startIndex + 2};

            // fill x0
            this.x0.set([startIndex, 0],     body.x);
            this.x0.set([startIndex + 1, 0], body.y);
            this.x0.set([startIndex + 2, 0], body.theta);
        });
    }

    private selectSolverVariableIndices(J: Matrix): {[index: number]: boolean} {
        const m = J.size()[1];
        const rowSums = this.sumRows(abs(sign(J)));
        rowSums.sort((a, b) => {
            return a.sum - b.sum;
        });

        const selectedIndicesDict: {[index: number]: boolean} = {};

        rowSums.forEach((row) => {
            const i = row.i;
            let selectedj = -1;
            for(let j = 0; j < m; j++) {
                const absJij = Math.abs(J.get([i, j]));
                if(absJij > 0 && (!selectedIndicesDict[j])) {
                    selectedj = j;
                    break;
                }
            }
            if(selectedj === -1) {
                throw new UnableToSolveError("Unale to find enough independent variables to solve the system");
            }
            selectedIndicesDict[selectedj] = true;
        });

        return selectedIndicesDict;
    }

    /**
     * Returns object where keys are bodies ids, values are bodies intances.
     */
    getBodies() {
        return this.bodies;
    }

    private f = (xVec: Matrix): Matrix => {
        const n = this.rotConstraints.length * 2 + this.fixConstraints.length * 2;
        const y = matrix(zeros([n, 1]));
        let i = 0;
        this.rotConstraints.forEach((rc) => {
            const res = this.rotConstraintF(rc, xVec);
            y.set([i++, 0], res[0]);
            y.set([i++, 0], res[1]);
        });
        this.fixConstraints.forEach((fc) => {
            const res = this.fixConstraintF(fc, xVec);
            y.set([i++, 0], res[0]);
            y.set([i++, 0], res[1]);
            y.set([i++, 0], res[2]);
        })

        return y;
    }

    private rotConstraintF(rotConstraint: RotConstraint, xVec: Matrix): [number, number] {
        const bodyAPos = this.getBodyPosition(xVec, rotConstraint.bodyA);
        const bodyBPos = this.getBodyPosition(xVec, rotConstraint.bodyB);
        return rotConstraint.f(
            bodyAPos.x,
            bodyAPos.y,
            bodyAPos.theta,
            bodyBPos.x,
            bodyBPos.y,
            bodyBPos.theta
        );
    }

    private fixConstraintF(fixConstraint: FixedConstraint, xVec: Matrix): [number, number, number] {
        const bodyPos = this.getBodyPosition(xVec, fixConstraint.body);
        return fixConstraint.f(
            bodyPos.x,
            bodyPos.y,
            bodyPos.theta
        );
    }

    private getBodyPosition(xVec: Matrix, body: Body): BodyPosition {
        const maxIndex = xVec.size()[0] - 1;
        const indices = this.indices[body.id];
        const ret = {x: 0, y: 0, theta: 0}
        if(indices.x > maxIndex) {
            ret.x = this.x0!.get([indices.x, 0]);
        } else {
            ret.x = xVec.get([indices.x, 0]);
        }

        if(indices.y > maxIndex) {
            ret.y = this.x0!.get([indices.y, 0]);
        } else {
            ret.y = xVec.get([indices.y, 0]);
        }

        if(indices.theta > maxIndex) {
            ret.theta = this.x0!.get([indices.theta, 0]);
        } else {
            ret.theta = xVec.get([indices.theta, 0]);
        }

        return ret;
    }

    private setBodyPosition(solVec: Matrix, body: Body) {
        const maxIndex = solVec.size()[0] - 1;
        const indices = this.indices[body.id];
        if(indices.x <= maxIndex) {
            body.x = solVec.get([indices.x, 0]);
        }

        if(indices.y <= maxIndex) {
            body.y = solVec.get([indices.y, 0]);
        }

        if(indices.theta <= maxIndex) {
            body.theta = solVec.get([indices.theta, 0]);
        }
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

class WorldSetupError extends Error {
    name: string = "WorldSetupError";
    constructor(errors: string[]) {
        let msg = "Errors occured setting up the world:\n";
        errors.forEach((error) => {
            msg += "  - " + error + "\n";
        });
        super(msg);
    }
}

class UnableToSolveError extends Error {
    name: string = "UnableToSolveError";
    constructor(solverMessage: string | String) {
        super(`Unable to solve world - solver message: ${solverMessage}`);
    }
}
