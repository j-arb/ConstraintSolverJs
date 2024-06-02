import { Matrix, fix, index, matrix, range, zeros } from "mathjs";
import { Body } from "./body.js";
import { FixedConstraint } from "./fixed-constraint.js";
import { RotConstraint } from "./rot-constraint.js";
import { Solver } from "nr-solver";

/**
 * Set of bodies, rotational constraints
 * and fixed constraints.
 */
export class World {
    private rotConstraints: RotConstraint[];
    private fixConstraints: FixedConstraint[];
    private bodies: { [id: string]: Body };
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
        this.loadBodies(); // Fill bodies dictionary
        const nBodies = Object.keys(this.bodies).length;
        this.x0 = matrix(zeros([nBodies, 1])); // Initialize x0 vector
        this.dof = this.validateDegsOfFreedom(); // validate if system has enough dof

        if (this.errors.length > 0) {
            throw new WorldSetupError(this.errors);
        }
    }

    /**
     * Loops through bodies to fill x0 vector
     * and asign vector's indicees to each body.
     */
    private loadX0andIndices() {
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
     * 
     */
    solve(): World {
        this.loadX0andIndices(); // fill x0 vector and indicees
        const nBodies = Object.keys(this.bodies).length;
        const n = 3*nBodies - this.dof;
        let xVec = this.x0.subset(index(range(0,n), 0));
        const solver = new Solver();
        const sol = solver.solve(this.f, xVec);
        if(!sol.solved()) {
            throw new UnableToSolveError(sol.message());
        }

        const bodies = Object.values(this.bodies);

        bodies.forEach((body) => {
            this.setBodyPosition(sol.getX(), body);
        });

        return this;
    }

    getBodies() {
        return this.bodies;
    }

    private f = (xVec: Matrix): Matrix => {
        const n = xVec.size()[0];
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
            ret.x = this.x0.get([indices.x, 0]);
        } else {
            ret.x = xVec.get([indices.x, 0]);
        }

        if(indices.y > maxIndex) {
            ret.y = this.x0.get([indices.y, 0]);
        } else {
            ret.y = xVec.get([indices.y, 0]);
        }

        if(indices.theta > maxIndex) {
            ret.theta = this.x0.get([indices.theta, 0]);
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
