pragma solidity ^0.4.18;

contract Logs {

  event FooEvent(string a);
  event BarEvent(string a);
  event BazEvent(string a);

  function emitFooEvent(string a) public returns(string) {
    emit FooEvent(a);
    return a;
  }

  function emitMultipleEvents(string a) public returns(string) {
    emit FooEvent(a);
    emit BarEvent(a);
    emit BazEvent(a);
    return a;
  }
}
