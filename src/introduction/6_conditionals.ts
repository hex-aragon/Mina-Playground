import { Field, Bool, Provable } from "o1js";

const a = new Field(1);
const b = new Field(2);
const foo = Bool(true);

const x = Provable.if(new Bool(foo), a, b);
Provable.log("x is now:", x);

const foo2 = Bool(false);
const y = Provable.if(new Bool(foo2), a, b);
Provable.log("y is now ", y);
