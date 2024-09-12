import { SmartContract, PrivateKey, PublicKey, Provable } from 'o1js';

class HelloWorld extends SmartContract {}

const zkAppKey = PrivateKey.random();
Provable.log('zkAppKey', zkAppKey);

let zkAppAddress = PublicKey.fromPrivateKey(zkAppKey);
Provable.log('zkAppAddress', zkAppAddress);

let zkApp = new HelloWorld(zkAppAddress);
Provable.log('zkApp', zkApp);
