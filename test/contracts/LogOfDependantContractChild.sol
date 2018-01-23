pragma solidity ^0.4.18;

// Related to: LogOfDependantContract.sol
// https://github.com/qtumproject/qtumjs/issues/4

contract LogOfDependantContractChild {
  event FooEvent(string data);

  function emitFoo() public {
    FooEvent("Foo!");
  }
}
