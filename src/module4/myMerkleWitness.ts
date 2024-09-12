import {
  SmartContract,
  Poseidon,
  Field,
  State,
  state,
  PublicKey,
  Mina,
  method,
  UInt32,
  AccountUpdate,
  MerkleTree,
  MerkleWitness,
  Struct,
} from 'o1js';

const doProofs = true;

class MyMerkleWitness extends MerkleWitness(8) {}

class Account extends Struct({
  publicKey: PublicKey,
  points: UInt32,
}) {
  hash(): Field {
    //sha256 과 Poseidon 해시함수가 유명한데 산술적으로 특화된 함수가
    //Poseion hash 함수라서 mina에서 사용함
    return Poseidon.hash(Account.toFields(this));
  }

  addPoints(points: number) {
    return new Account({
      publicKey: this.publicKey,
      points: this.points.add(points),
    });
  }
}
// we need the initiate tree root in order to tell the contract about our off-chain storage
// 컨트랙트에 오프체인 스토리지에 대해 알려주려면 초기화 트리 루트가 필요합니다.
let initialCommitment: Field = Field(0);
/*
  We want to write a smart contract that serves as a leaderboard,
  but only has the commitment of the off-chain storage stored in an on-chain variable.
  The accounts of all participants will be stored off-chain!
  If a participant can guess the preimage of a hash, they will be granted one point :)
  
  리더보드 역할을 하는 스마트 콘트랙트를 작성하고 싶습니다,
  하지만 오프체인 스토리지의 커미트먼트만 온체인 변수에 저장합니다.
  모든 참가자의 계정은 오프체인에 저장됩니다!
  참가자가 해시의 사전 이미지를 맞히면 1점을 받게 됩니다 :)
*/

class Leaderboard extends SmartContract {
  // a commitment is a cryptographic primitive that allows us to commit to data, with the ability to "reveal" it later
  // 커미티는 데이터를 커미트하고 나중에 '공개'할 수 있는 암호화 기본 요소입니다.

  @state(Field) commitment = State<Field>();

  @method async init() {
    super.init();
    this.commitment.set(initialCommitment);
  }

  @method
  async guessPreimage(guess: Field, account: Account, path: MyMerkleWitness) {
    // this is our hash! its the hash of the preimage "22", but keep it a secret!
    // 이것이 우리의 해시입니다! 프리이미지 “22”의 해시이지만 비밀로 유지하세요!
    let target = Field(
      '17057234437185175411792943285768571642343179330449434169483610110583519635705'
    );
    // if our guess preimage hashes to our target, we won a point!
    // 추측한 프리이미지가 타겟과 일치하면 1점을 획득한 것입니다!
    Poseidon.hash([guess]).assertEquals(target);

    // we fetch the on-chain commitment
    // 컨트랙트는 zk회로에 컴파일됨(evm은 vm에서 컴파일되므로 이더리움과 차이점?)
    //데이터는 사용자/개발자에 의해 제공됨
    let commitment = this.commitment.get();
    this.commitment.requireEquals(commitment);

    // we check that the account is within the committed Merkle Tree
    // 계정이 커밋된 머클 트리 내에 있는지 확인합니다.

    path.calculateRoot(account.hash()).assertEquals(commitment);

    // we update the account and grant one point!
    // 계정을 업데이트하고 포인트 1점을 부여합니다!
    let newAccount = account.addPoints(1);

    // we calculate the new Merkle Root, based on the account changes
    // 계정 변경 사항을 기반으로 새로운 머클 루트를 계산합니다.
    let newCommitment = path.calculateRoot(newAccount.hash());

    this.commitment.set(newCommitment);
  }
}

type Names = 'Bob' | 'Alice' | 'Charlie' | 'Olivia';

//로컬 블록체인 셋팅,?
let Local = await Mina.LocalBlockchain({ proofsEnabled: doProofs });
Mina.setActiveInstance(Local);
let initialBalance = 10_000_000_000;

let [feePayer] = Local.testAccounts;

let contractAccount = Mina.TestPublicKey.random();

// this map serves as our off-chain in-memory storage
// 이 맵은 오프체인 인메모리 스토리지 역할을 합니다.
//오프체인에서 저장소 역할을 한다?
let Accounts: Map<string, Account> = new Map<Names, Account>(
  ['Bob', 'Alice', 'Charlie', 'Olivia'].map((name: string, index: number) => {
    return [
      name as Names,
      new Account({
        publicKey: Local.testAccounts[index + 1], // `+ 1` is to avoid reusing the account aliased as `feePayer`
        points: UInt32.from(0),
      }),
    ];
  })
);

// we now need "wrap" the Merkle tree around our off-chain storage
// we initialize a new Merkle Tree with height 8
// 이제 오프체인 스토리지에 머클 트리를 “감싸는” 작업이 필요합니다.
// 높이 8의 새로운 머클 트리를 초기화합니다.
const Tree = new MerkleTree(8);

Tree.setLeaf(0n, Accounts.get('Bob')!.hash());
Tree.setLeaf(1n, Accounts.get('Alice')!.hash());
Tree.setLeaf(2n, Accounts.get('Charlie')!.hash());
Tree.setLeaf(3n, Accounts.get('Olivia')!.hash());

// now that we got our accounts set up, we need the commitment to deploy our contract!
// 이제 계정을 설정했으니, 계약을 배포하기 위한 약정이 필요합니다!
initialCommitment = Tree.getRoot();

let contract = new Leaderboard(contractAccount);
console.log('Deploying leaderboard..');
if (doProofs) {
  await Leaderboard.compile();
}

//로컬 미나 트랜잭션 설정, feePayer 설정 후 컨트랙트 어카운트에 밸런스를 설정한다
let tx = await Mina.transaction(feePayer, async () => {
  AccountUpdate.fundNewAccount(feePayer).send({
    to: contractAccount,
    amount: initialBalance,
  });
  await contract.deploy();
});

//트랜잭션 검증
await tx.prove();
//트랜잭션 서명
await tx.sign([feePayer.key, contractAccount.key]).send();

console.log('Initial points: ' + Accounts.get('Bob')?.points);

console.log('Making guess..');
await makeGuess('Bob', 0n, 22);

console.log('Final points: ' + Accounts.get('Bob')?.points);

async function makeGuess(name: Names, index: bigint, guess: number) {
  let account = Accounts.get(name)!;
  let w = Tree.getWitness(index);
  let witness = new MyMerkleWitness(w);

  let tx = await Mina.transaction(feePayer, async () => {
    await contract.guessPreimage(Field(guess), account, witness);
  });
  await tx.prove();
  await tx.sign([feePayer.key, contractAccount.key]).send();

  // if the transaction was successful, we can update our off-chain storage as well
  // 트랜잭션이 성공하면 오프체인 저장소도 업데이트할 수 있습니다.
  account.points = account.points.add(1);
  Tree.setLeaf(index, account.hash());
  contract.commitment.get().assertEquals(Tree.getRoot());
}
