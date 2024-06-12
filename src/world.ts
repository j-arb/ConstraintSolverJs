import { Matrix, abs, fix, index, matrix, number, range, sign, sort, string, zeros } from "mathjs";
import { Body } from "./body.js";
import { FixedConstraint } from "./fixed-constraint.js";
import { RotConstraint } from "./rot-constraint.js";
import { Solver } from "./solver.js";

/**
 * Set of bodies, rotational constraints
 * and fixed constraints.
 */
export class World {
    private rotConstraints: RotConstraint[];
    private fixConstraints: FixedConstraint[];
    private bodies: { [id: string]: Body };
    private bodiesLst: Body[] = [];
    private indices: { [bodyId: string]: {x: number, y: number, theta: number} } = {};
    private errors: string[] = [];
    private dof: number;
    private x: Matrix;
    

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
        this.loadIndices(); // Fill indices dictionary
        this.x = matrix(zeros([this.bodiesLst.length * 3, 1])); // Initialize x vector
        this.loadX0(); // Load initial x vector
        this.dof = this.calcDegsOfFreedom();
        if(this.dof < 0) {
            this.errors.push(`System has negative number of degrees of freedom. (dof = ${this.dof})`)
        }
        const solverVars = this.bodiesLst.length * 3 - this.dof;

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

    private loadIndices() {
        this.bodiesLst.forEach((body, i) => {
            const bid = body.id;
            const xIndex = i * 3;
            const yIndex = i * 3 + 1;
            const thetaIndex = i * 3 + 2;
            this.indices[bid] = {x: xIndex, y: yIndex, theta: thetaIndex};
        });
    }

    private loadX0() {
        this.bodiesLst.forEach((body) => {
            const bid = body.id;
            const bodyIndices = this.indices[bid];
            this.x.set([bodyIndices.x, 0], body.x);
            this.x.set([bodyIndices.y, 0], body.y);
            this.x.set([bodyIndices.theta, 0], body.theta);
        });
    }

    /**
     * Calculates the degrees of freedom of a system with
     * b bodies, r rotational constraints and f degrees of
     * freedom.
     * It follows the formula `deg_of_freedom = 3*b - 2*r - 3*f`
     */
    private calcDegsOfFreedom(): number {
        const b = this.bodiesLst.length;
        const r = this.rotConstraints.length;
        const f = this.fixConstraints.length;
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

        const sol = solver.solve(this.f, this.x);
        if(!sol.solved()) {
            throw new UnableToSolveError(sol.message());
        }

        this.bodiesLst.forEach((body) => {
            this.setBodyPosition(sol.getX(), body);
        });

        return this;
        // // load initial x0 vector
        // const nBodies = this.bodiesLst.length;
        // const n = 3*nBodies - this.dof;
        // this.loadInitialX0AndIndices();

        // // Select variables to solve
        // const J = diff.jacobian(this.f, this.x0);
        // const selectedIndices = this.selectSolverVariableIndices(J);

        // // Rearrange x0 based on selected variables
        // const newX0 = this.loadIndicesDictAndGetX0(selectedIndices);
        // this.x0 = newX0;
        // const solverX = newX0.subset(index(range(0,n), 0));

        // // Solve
        // const sol = solver.solve(this.f, solverX);
        // if(!sol.solved()) {
        //     throw new UnableToSolveError(sol.message());
        // }

        // Update bodies
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
        const indices = this.indices[body.id];
        const ret = {x: 0, y: 0, theta: 0}
        ret.x = xVec.get([indices.x, 0]);
        ret.y = xVec.get([indices.y, 0]);
        ret.theta = xVec.get([indices.theta, 0]);

        return ret;
    }

    private setBodyPosition(solVec: Matrix, body: Body) {
        const indices = this.indices[body.id];
        body.x = solVec.get([indices.x, 0]);
        body.y = solVec.get([indices.y, 0]);
        body.theta = solVec.get([indices.theta, 0]);
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
