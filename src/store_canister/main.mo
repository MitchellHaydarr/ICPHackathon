import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Float "mo:base/Float";
import Int "mo:base/Int";

actor StoreCanister {
  // Constants
  let E8S_PER_ICP : Nat = 100_000_000; // 1 ICP = 10^8 e8s
  let FEE_PERCENT : Float = 0.1; // 0.1% fee on withdrawals
  
  // Store user balances in e8s (1 ICP = 100_000_000 e8s)
  stable var ledger : Trie.Trie<Principal, Nat> = Trie.empty();
  
  // Helper function to get key from Principal
  private func key(p: Principal) : Trie.Key<Principal> {
    { key = p; hash = Principal.hash(p) };
  };
  
  // Helper function to get balance
  private func getBalance(p: Principal) : Nat {
    switch (Trie.get(ledger, key(p), Principal.equal)) {
      case null { 0 };
      case (?balance) { balance };
    };
  };
  
  // Calculate fee amount for withdrawals (0.1%, rounded up)
  private func calculateFee(amount: Nat) : Nat {
    let feeFloat : Float = Float.fromInt(amount) * FEE_PERCENT / 100.0;
    let feeInt = Float.toInt(Float.ceil(feeFloat));
    return Int.abs(feeInt); // Convert to Nat
  };
  
  // Deposit ICP (amount in e8s) using cycles as placeholder
  // In real app, this would be connected to a ledger canister
  public shared(msg) func deposit() : async Result.Result<Nat, Text> {
    let caller = msg.caller;
    
    // For demo purposes, we use 1M cycles = 1 ICP
    // In a real app, you'd interact with the ICP ledger
    let amount : Nat = 1_000_000; // Demo amount in e8s
    
    let currentBalance = getBalance(caller);
    let newBalance = currentBalance + amount;
    
    ledger := Trie.put(ledger, key(caller), Principal.equal, newBalance).0;
    
    #ok(newBalance)
  };
  
  // Withdraw ICP (amount in e8s)
  public shared(msg) func withdraw(amount: Nat) : async Result.Result<Nat, Text> {
    let caller = msg.caller;
    let currentBalance = getBalance(caller);
    
    // Calculate fee
    let fee = calculateFee(amount);
    let totalAmount = amount + fee;
    
    if (currentBalance < totalAmount) {
      return #err("Insufficient funds. Balance: " # Nat.toText(currentBalance) # 
               ", Requested: " # Nat.toText(amount) # 
               ", Fee: " # Nat.toText(fee));
    };
    
    let newBalance = currentBalance - totalAmount;
    ledger := Trie.put(ledger, key(caller), Principal.equal, newBalance).0;
    
    #ok(newBalance)
  };
  
  // Get portfolio balance for a principal (in e8s)
  public query func get_portfolio(p: Principal) : async Nat {
    return getBalance(p);
  };
  
  // Get all portfolios
  public query func get_all_portfolios() : async [(Principal, Nat)] {
    return Iter.toArray(Trie.iter(ledger));
  };
  
  // Function for running tests
  public func runTests() : async Text {
    // Test case: deposit and check balance
    let testPrincipal = Principal.fromText("2vxsx-fae"); // Anonymous principal for testing
    
    // Test 1: Initial balance should be 0
    var balance = await get_portfolio(testPrincipal);
    if (balance != 0) {
      return "Test 1 failed: Initial balance should be 0 but got " # Nat.toText(balance);
    };
    
    // Test 2: Deposit for test principal and check balance
    let depositAmount = 10_000_000; // 0.1 ICP in e8s
    
    // Simulate a deposit
    ledger := Trie.put(ledger, key(testPrincipal), Principal.equal, depositAmount).0;
    balance := await get_portfolio(testPrincipal);
    
    if (balance != depositAmount) {
      return "Test 2 failed: Balance after deposit should be " # Nat.toText(depositAmount) 
             # " but got " # Nat.toText(balance);
    };
    
    // Test 3: Withdraw with fee
    let withdrawAmount = 5_000_000; // 0.05 ICP
    let fee = calculateFee(withdrawAmount); // Should be 5,000 e8s (0.1% of 5M)
    let expectedRemainingBalance = depositAmount - withdrawAmount - fee;
    
    // Simulate withdraw
    switch (await withdraw(withdrawAmount)) {
      case (#err(message)) {
        return "Test 3 failed: Withdraw should succeed but got error: " # message;
      };
      case (#ok(newBalance)) {
        if (newBalance != expectedRemainingBalance) {
          return "Test 3 failed: Balance after withdraw should be " # Nat.toText(expectedRemainingBalance) 
                 # " but got " # Nat.toText(newBalance);
        };
      };
    };
    
    // Test 4: Try to withdraw more than balance
    let excessiveAmount = 10_000_000; // More than remaining balance
    
    switch (await withdraw(excessiveAmount)) {
      case (#err(_)) {
        // Expected error
      };
      case (#ok(_)) {
        return "Test 4 failed: Should return error when withdrawing more than balance";
      };
    };
    
    // Test 5: Fee calculation correctness
    let testAmount = 1_234_567;
    let calculatedFee = calculateFee(testAmount);
    let expectedFee = 1_235; // 0.1% of 1,234,567 rounded up
    
    if (calculatedFee != expectedFee) {
      return "Test 5 failed: Fee calculation incorrect. Expected " # Nat.toText(expectedFee) 
             # " but got " # Nat.toText(calculatedFee);
    };
    
    return "All tests passed!";
  };
  
  // System upgrade hooks
  system func preupgrade() {
    // Stable storage already configured
  };
  
  system func postupgrade() {
    // No additional steps needed
  };
}
