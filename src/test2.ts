import { Body, RotConstraint, World } from "./index.js";
import { Solver } from "fsolve-js";

const bodyf9 = new Body("f9", 487, 115, 0);
const bodyb8 = new Body("b8", 625, 113.5, 0);
const bodya0 = new Body("a0", 949, 107, 0); 

const rotCnstr = new RotConstraint(bodyf9, {x:0, y:-3}, bodyb8, {x:-138,y:-1.5});
const rotCnstr2 = new RotConstraint(bodyb8, {x:134,y:-5.5}, bodya0, {x: -4, y:0});

const solver = new World([rotCnstr, rotCnstr2], []);
console.log(solver.solve().getBodies());