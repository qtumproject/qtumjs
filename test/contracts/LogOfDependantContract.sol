pragma solidity ^0.4.18;

import "./LogOfDependantContractChild.sol";

// https://github.com/qtumproject/qtumjs/issues/4
contract LogOfDependantContract {
  LogOfDependantContractChild testContract;

  function LogOfDependantContract() public {
    testContract = new LogOfDependantContractChild();
  }

  function emitLog() public {
    testContract.emitFoo();
  }
}
