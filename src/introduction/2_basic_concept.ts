import { Field, Bool, UInt64, UInt32, Provable } from "o1js";

// const sum = 1 + 3.
// const sum = new Field(1).add(new Field(3))
// const sum = new Field(1).add(3)

// new Bool(x);   // accepts true or false
// new Field(x);  // accepts an integer, or a numeric string if you want to represent a number greater than JavaScript can represent but within the max value that a field can store.
// new UInt64(x); // accepts a Field - useful for constraining numbers to 64 bits
// new UInt32(x); // accepts a Field - useful for constraining numbers to 32 bits

const sum = Field(1).add(3);

const bool = Bool(true);

const int32 = new UInt32(123);

const int64 = new UInt64(1234);

Provable.log("sum has the value:", sum);
Provable.log("bool has the value:", bool);
Provable.log("int32 has the value:", int32);
Provable.log("int64 has the value", int64);
