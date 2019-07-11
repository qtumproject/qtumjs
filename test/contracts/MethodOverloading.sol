pragma solidity ^0.5.8;

contract MethodOverloading {
  event Foo1(uint256 a);
  event Foo2(uint256 a, uint256 b);

  function foo() public returns(string memory) {
    return "foo()";
  }

  function foo(uint256 _a) public returns(string memory) {
    return "foo(uint256)";
  }

  function foo(string memory _a) public returns(string memory) {
    return "foo(string)";
  }

  function foo(uint256 _a, uint256 _b) public returns(string memory) {
    return "foo(uint256,uint256)";
  }

  function foo(int256 _a, int256 _b) public returns(string memory) {
    return "foo(int256,int256)";
  }

  function foo(int256 _a, int256 _b, int256 _c) public returns(string memory) {
    return "foo(int256,int256,int256)";
  }
}
