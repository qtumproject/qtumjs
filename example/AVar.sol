pragma solidity ^0.4.11;

contract AVar {
  uint256 a;

  function setA(uint256 _a) {
    a = _a;
  }

  function getA() returns(uint256) {
    return a;
  }
}