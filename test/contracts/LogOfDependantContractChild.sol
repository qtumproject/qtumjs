pragma solidity ^0.5.8;

// Related to: LogOfDependantContract.sol
// https://github.com/qtumproject/qtumjs/issues/4

contract LogOfDependantContractChild {
  event LogOfDependantContractChildEvent(string data);

  function emitFoo() public {
    emit LogOfDependantContractChildEvent("Foo!");
  }
}
