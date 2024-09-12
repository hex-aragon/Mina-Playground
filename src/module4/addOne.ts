import { SelfProof, Field, ZkProgram, verify } from 'o1js';

//무한 재귀 프로그램???
const AddOne = ZkProgram({
  name: 'AddOne-Program',
  publicInput: Field,

  methods: {
    baseCase: {
      privateInputs: [],

      //퍼블릭 인풋은 Field(0)과같다? 유한필드 0?
      async method(publicInput: Field) {
        publicInput.assertEquals(Field(0));
      },
    },

    //step 단계에서 앞에서 증명한 값에서 1씩 더한값이 같다?
    step: {
      privateInputs: [SelfProof],

      async method(publicInput: Field, earlierProof: SelfProof<Field, void>) {
        earlierProof.verify();
        earlierProof.publicInput.add(1).assertEquals(publicInput);
      },
    },
  },
});

const { verificationKey } = await AddOne.compile();

console.log('proving base case...');
let proof = await AddOne.baseCase(Field(0));

//필드0을 프루프로 증명한 값과 AddOne Zkprogram을 컴파일한 값은 같다?
//서명으로 검증?
let ok = await verify(proof, verificationKey);
console.log('Is baseCase proven? : ', ok);

let proof1 = await AddOne.step(Field(1), proof);
let ok2 = await verify(proof1, verificationKey);
console.log('Is step1 proven? : ', ok2);

let proof2 = await AddOne.step(Field(2), proof1);
let ok3 = await verify(proof2, verificationKey);
console.log('Is step2 proven? : ', ok3);
