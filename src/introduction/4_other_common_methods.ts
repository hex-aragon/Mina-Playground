import {
  Field,
  Poseidon,
  PrivateKey,
  PublicKey,
  Signature,
  Provable,
} from "o1js";

const x = Field(1);

const y = Field(2);

const hash = Poseidon.hash([x, y]);
Provable.log("hash is", hash);

const hash2 = Poseidon.hash([y]);
Provable.log("hash2 is", hash2);

const privKey = PrivateKey.random();
Provable.log("privakey", privKey);

const pubKey = PublicKey.fromPrivateKey(privKey);
Provable.log("pubKey", pubKey);

const msg = [hash, hash2];
Provable.log("msg", msg);

const sig = Signature.create(privKey, msg);
Provable.log("sig", sig);

const isVerified = sig.verify(pubKey, msg);
Provable.log("isVerified", isVerified);
