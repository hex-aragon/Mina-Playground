import { Field, Poseidon, Provable } from 'o1js';

function knowsPreimage(value: Field) {
  let hash = Poseidon.hash([value]);
  hash.assertEquals(expectedHash);
}

const correctValue = Field(1);
const incorrectValue = Field(2);
const expectedHash = Poseidon.hash([correctValue]);

//knowsPreimage(incorrectValue);
knowsPreimage(correctValue);
Provable.log(knowsPreimage(correctValue));
Provable.log(correctValue);
