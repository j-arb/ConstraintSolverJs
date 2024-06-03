import { Body } from "./body.js";
import { v4 as uuidv4 } from 'uuid';
import { FixedConstraint } from "./fixed-constraint.js";
import { RotConstraint } from "./rot-constraint.js";
import { World } from "./world.js";

const bodyA = new Body(uuidv4(), 0, 0, Math.PI / 2);
const bodyB = new Body(uuidv4(), 2, 1, 40);
const fixConstraint = new FixedConstraint(bodyA);
const fixConstraint2 = new FixedConstraint(bodyB);
const rotConstraint = new RotConstraint(bodyA, {x:1,y:0}, bodyB, {x:0,y:0});

const world = new World([rotConstraint], [fixConstraint]);
console.log(world.solve().getBodies());