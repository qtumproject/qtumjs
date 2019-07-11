pragma solidity ^0.5.8;

contract Logs {

  event FooEvent(string a);
  event BarEvent(string a);
  event BazEvent(string a);

  function emitFooEvent(string memory a) public returns(string memory) {
    emit FooEvent(a);
    return a;
  }

  function emitMultipleEvents(string memory a) public returns(string memory) {
    emit FooEvent(a);
    emit BarEvent(a);
    emit BazEvent(a);
    return a;
  }
}
