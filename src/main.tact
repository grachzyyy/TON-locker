import "@stdlib/ownable";

contract Locker() {
    // empty receiver for deployment
    receive() {
        cashback(sender());
    }
}
