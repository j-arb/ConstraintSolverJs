import { Body } from "./body.js";
import { FixedConstraint } from "./fixed-constraint.js";
import { RotConstraint } from "./rot-constraint.js";
import { Solver } from "nr-solver";
/**
 * Set of bodies, rotational constraints
 * and fixed constraints.
 */
export declare class World {
    private rotConstraints;
    private fixConstraints;
    private bodies;
    private errors;
    private indices;
    private x0;
    private dof;
    /**
     * World constructor.
     * @param rotConstraints set of rotational constraints
     * @param fixConstraints set of fixed constraints
     * @throws `WorldSetupError` if set of constraints is
     * inconsistent or usolvable.
     */
    constructor(rotConstraints: RotConstraint[], fixConstraints: FixedConstraint[]);
    /**
     * Loops through bodies to fill x0 vector
     * and asign vector's indicees to each body.
     */
    private loadX0andIndices;
    /**
     * Loops through rotConstraints and fixConstraints
     * and adds bodies to bodies dictionary.
     * If errors are found, appends error to `this.errors`
     */
    private loadBodies;
    /**
     * Validates if system's degrees of freedom are greater or equal to 0.
     * If not, appends an error to `this.errors`
     */
    private validateDegsOfFreedom;
    /**
     * Calculates the degrees of freedom of a system with
     * b bodies, r rotational constraints and f degrees of
     * freedom.
     * It follows the formula `deg_of_freedom = 3*b - 2*r - 3*f`
     * @param b number of bodies
     * @param r number of rotational constraints
     * @param f number of fixed constraints
     */
    private static degOfFreedom;
    /**
     * Solves the set of constraints and bodies.
     * Updates the bodies to their solved positions
     * @param solver (optional) `nr-solver.Solver`
     * @throws UnableToSolveError if solver is unable to solve the system.
     */
    solve(solver?: Solver): World;
    /**
     * Returns object where keys are bodies ids, values are bodies intances.
     */
    getBodies(): {
        [id: string]: Body;
    };
    private f;
    private rotConstraintF;
    private fixConstraintF;
    private getBodyPosition;
    private setBodyPosition;
}
