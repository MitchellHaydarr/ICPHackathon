import StoreCanister "../main";
import Debug "mo:base/Debug";

actor {
  public func run() : async () {
    Debug.print("Running store_canister tests...");
    let result = await StoreCanister.runTests();
    Debug.print(result);
  };
}
