import { Field, Provable } from "o1js";

let x = new Field(1); // x = 1

const addOneAndDouble = (x: Field): Field => {
  return x.add(1).mul(2);
};

const multiplyTwo = (y: Field): Field => {
  return y.mul(2);
};

const a = addOneAndDouble(x);
Provable.log("a is ", a);

const b = multiplyTwo(a);
Provable.log("b is ", b);

const isEqual = b.equals(8);
const isEqual2 = a.equals(4);

Provable.log("isEquals is", isEqual);
Provable.log("isEquals2 is", isEqual2);
