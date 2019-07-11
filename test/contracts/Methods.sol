pragma solidity ^0.5.8;

contract Methods {

  uint256 foo;

  function setFoo(uint256 _foo) public {
    foo = _foo;
  }

  function getFoo() public view returns(uint256) {
    return foo;
  }
}
