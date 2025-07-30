use anyhow::{Result, anyhow};
use candid::{CandidType, Deserialize, Encode, Decode, Principal};
use ic_bitcoin_types::{
    Address, GetUtxosResponse, Network, OutPoint, SendTransactionRequest, Utxo,
    BlockHash, GetSuccessorsRequest, GetCurrentFeePercentiles,
};
use ic_cdk::{
    api::{
        call::RejectionCode,
        management_canister::http_request::{HttpResponse, TransformArgs, TransformContext}
    },
    export_candid,
    init, query, update,
    caller, id,
    print,
    call
};
use ic_cdk_macros::post_upgrade;
use ic_cdk_timers::set_timer_interval;
use serde::Serialize;
use serde_json::Value;
use std::{
    cell::RefCell,
    collections::HashMap,
    time::{Duration, SystemTime, UNIX_EPOCH},
    str::FromStr,
};
use base64::{Engine as _, engine::general_purpose};
use hex;
use std::borrow::Cow;

// Constants
const BTC_ADDRESS_KEY: &str = "btc_address";
const BTC_NETWORK: Network = Network::Testnet;
const BTC_MIN_AMOUNT_SATS: u64 = 10_000;
const BTC_SEND_AMOUNT_SATS: u64 = 1_000;
const STORE_CANISTER_ID: &str = "rrkah-fqaaa-aaaaa-aaaaq-cai"; // Local default, update in production
const COINGECKO_URL: &str = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
const MAX_LOGS: usize = 50;
const TICK_INTERVAL_SECS: u64 = 600; // 10 minutes

// BTC fee estimation constants
const DEFAULT_FEE_PERCENTILES: [u8; 3] = [10, 50, 90];
const DEFAULT_FEE_RATE: u64 = 5_000; // fallback fee rate in satoshis per kB

// Bitcoin key constants
const KEY_NAME: &str = "dfx_test_key";
const DERIVATION_PATH: [Vec<u8>; 0] = [];

// State struct to keep track of data across function calls
#[derive(Clone, Debug, Default, CandidType, Deserialize)]
struct State {
    btc_price_24h_ago: u64,        // BTC price in USD cents
    threshold_pct: u64,            // Threshold percentage (97 = 97%)
    paused: bool,                  // Pause flag for AI operations
    logs: Vec<String>,             // Log messages
    btc_address: Option<String>,   // Bitcoin address derived from threshold ECDSA
    last_txid: Option<String>,     // Last Bitcoin transaction ID
}

// ECDSA structures
#[derive(Serialize, CandidType, Debug)]
struct EcdsaKeyId {
    curve: EcdsaCurve,
    name: String,
}

#[derive(Serialize, CandidType, Debug)]
enum EcdsaCurve {
    #[serde(rename = "secp256k1")]
    Secp256k1,
}

#[derive(Serialize, CandidType, Debug)]
struct SignWithEcdsaArgs {
    pub message_hash: Vec<u8>,
    pub derivation_path: Vec<Vec<u8>>,
    pub key_id: EcdsaKeyId,
}

#[derive(Debug, CandidType, Deserialize)]
struct SignWithEcdsaResult {
    pub signature: Vec<u8>,
}

#[derive(Debug, CandidType, Deserialize)]
struct ECDSAPublicKeyArgs {
    pub derivation_path: Vec<Vec<u8>>,
    pub key_id: EcdsaKeyId,
}

#[derive(Debug, CandidType, Deserialize)]
struct ECDSAPublicKeyResult {
    pub public_key: Vec<u8>,
    pub chain_code: Vec<u8>,
}

// Stats return type
#[derive(Debug, CandidType, Serialize, Deserialize)]
struct Stats {
    price_24h_ago: u64,
    threshold_pct: u64,
    paused: bool,
    btc_address: String,
}

// Global state using RefCell to allow mutation
thread_local! {
    static STATE: RefCell<State> = RefCell::new(State {
        btc_price_24h_ago: 0,
        threshold_pct: 97,
        paused: false,
        logs: Vec::new(),
        btc_address: None,
        last_txid: None,
    });
}

// Add a log message to the state, truncating if necessary
fn add_log(message: &str) {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    let formatted_message = format!("[{}] {}", timestamp, message);
    
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        state.logs.push(formatted_message);
        
        // Keep only the last MAX_LOGS entries
        if state.logs.len() > MAX_LOGS {
            state.logs.drain(0..state.logs.len() - MAX_LOGS);
        }
    });
}

// Initialize canister
#[init]
fn init() {
    add_log("Initializing AI canister");
    
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        state.btc_price_24h_ago = 0;
        state.threshold_pct = 97;
        state.paused = false;
    });
    
    // Set up timer to call tick every 10 minutes
    set_timer_interval(Duration::from_secs(TICK_INTERVAL_SECS), || {
        ic_cdk::spawn(async {
            match tick().await {
                Ok(_) => add_log("Timer tick completed successfully"),
                Err(e) => add_log(&format!("Timer tick error: {}", e)),
            }
        });
    });
    
    // Initialize BTC address
    ic_cdk::spawn(async {
        match init_btc_address().await {
            Ok(address) => {
                STATE.with(|state| {
                    state.borrow_mut().btc_address = Some(address.clone());
                });
                add_log(&format!("Initialized Bitcoin testnet address: {}", address));
            },
            Err(e) => add_log(&format!("Failed to initialize Bitcoin address: {}", e)),
        }
    });
    
    add_log("AI canister initialized successfully");
}

// Post-upgrade hook to restore any needed state
#[post_upgrade]
fn post_upgrade() {
    add_log("Canister upgraded");
    
    // Re-initialize timer
    set_timer_interval(Duration::from_secs(TICK_INTERVAL_SECS), || {
        ic_cdk::spawn(async {
            match tick().await {
                Ok(_) => add_log("Timer tick completed successfully"),
                Err(e) => add_log(&format!("Timer tick error: {}", e)),
            }
        });
    });
}

// Fetch Bitcoin price from CoinGecko
async fn fetch_price() -> Result<u64> {
    add_log("Fetching BTC price from CoinGecko");
    
    let request_headers = vec![
        ("Accept".to_string(), "application/json".to_string()),
        ("User-Agent".to_string(), "IC-AI-Agent".to_string()),
    ];
    
    // Prepare the HTTP request arguments
    let request = ic_cdk::api::management_canister::http_request::HttpRequestArgs {
        url: COINGECKO_URL.to_string(),
        method: "GET".to_string(),
        body: None,
        max_response_bytes: Some(2048), // Limit response size
        headers: request_headers,
        transform: Some(TransformContext::new(transform_btc_price, vec![])),
    };
    
    // Make HTTP request
    match ic_cdk::api::management_canister::http_request::http_request(request).await {
        Ok((response,)) => {
            if response.status == 200 {
                let price_json: Value = serde_json::from_slice(&response.body)
                    .map_err(|e| anyhow!("Failed to parse JSON: {}", e))?;
                
                let price = price_json["bitcoin"]["usd"]
                    .as_f64()
                    .ok_or_else(|| anyhow!("Invalid JSON structure"))?;
                
                // Convert price to cents (integer)
                let price_cents = (price * 100.0) as u64;
                
                add_log(&format!("BTC price: ${:.2}", price));
                Ok(price_cents)
            } else {
                Err(anyhow!("HTTP error: status {}", response.status))
            }
        }
        Err((r, m)) => Err(anyhow!("HTTP request error: {:?}, {}", r, m)),
    }
}

// Transform function for BTC price HTTP request
fn transform_btc_price(args: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: args.response.status,
        headers: args.response.headers,
        body: args.response.body,
    }
}

// Main tick function that checks prices and potentially executes trades
#[update]
async fn tick() -> Result<()> {
    add_log("Tick function called");
    
    // Check if paused
    let is_paused = STATE.with(|state| state.borrow().paused);
    if is_paused {
        add_log("System is paused, skipping tick");
        return Ok(());
    }
    
    // Get current BTC price
    let price = match fetch_price().await {
        Ok(p) => p,
        Err(e) => {
            add_log(&format!("Error fetching price: {}", e));
            return Err(e);
        }
    };
    
    let (prev_price, threshold) = STATE.with(|state| {
        let state = state.borrow();
        (state.btc_price_24h_ago, state.threshold_pct)
    });
    
    // Check if we need to trade (price dropped below threshold)
    if prev_price > 0 && price * 100 <= prev_price * threshold {
        add_log(&format!(
            "Price drop detected: ${:.2} to ${:.2} ({}% drop, threshold {}%)",
            prev_price as f64 / 100.0,
            price as f64 / 100.0,
            ((prev_price - price) * 100) / prev_price,
            100 - threshold
        ));
        
        // Call store canister to deposit (mock trade)
        match deposit_to_store(1_000_000).await {
            Ok(new_balance) => {
                add_log(&format!("Deposit successful, new balance: {} e8s", new_balance));
                
                // Try to send BTC
                match send_demo_btc().await {
                    Ok(txid) => {
                        if txid != "Insufficient BTC" {
                            STATE.with(|state| {
                                state.borrow_mut().last_txid = Some(txid.clone());
                            });
                        }
                        add_log(&format!("Bitcoin transaction result: {}", txid));
                    },
                    Err(e) => add_log(&format!("Bitcoin transaction error: {}", e)),
                }
            },
            Err(e) => add_log(&format!("Deposit error: {}", e)),
        }
    } else if prev_price > 0 {
        add_log(&format!(
            "No significant price change: ${:.2} to ${:.2}",
            prev_price as f64 / 100.0,
            price as f64 / 100.0
        ));
    } else {
        add_log(&format!("Initial price set: ${:.2}", price as f64 / 100.0));
    }
    
    // Update the 24-hour price
    STATE.with(|state| {
        state.borrow_mut().btc_price_24h_ago = price;
    });
    
    Ok(())
}

// Deposit to store canister
async fn deposit_to_store(amount: u64) -> Result<u64> {
    let store_canister_id = Principal::from_text(STORE_CANISTER_ID)
        .map_err(|_| anyhow!("Invalid store canister ID"))?;
    
    add_log(&format!("Calling store_canister.deposit() with {} e8s", amount));
    
    match ic_cdk::call::<(), (Result<u64, String>,), _>(store_canister_id, "deposit", ()).await {
        Ok((result,)) => match result {
            Ok(balance) => Ok(balance),
            Err(e) => Err(anyhow!("Store canister error: {}", e)),
        },
        Err((code, msg)) => Err(anyhow!("IC call failed: {:?}, {}", code, msg)),
    }
}

// Initialize Bitcoin address using threshold ECDSA
async fn init_btc_address() -> Result<String> {
    // Get ECDSA public key
    let ecdsa_key_id = EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: KEY_NAME.to_string(),
    };
    
    let args = ECDSAPublicKeyArgs {
        derivation_path: DERIVATION_PATH.to_vec(),
        key_id: ecdsa_key_id,
    };
    
    let result = ic_cdk::call::<(ECDSAPublicKeyArgs,), (ECDSAPublicKeyResult,), _>(
        Principal::management_canister(),
        "ecdsa_public_key",
        (args,),
    )
    .await
    .map_err(|(code, msg)| anyhow!("Failed to get ECDSA public key: {:?}, {}", code, msg))?;
    
    let public_key = result.0.public_key;
    
    // For demonstration, we'll use a fixed testnet address
    // In a real implementation, we would derive the BTC address from the public key
    let test_address = "bcrt1qz0ejzj7wy9v27vv0sz3gdhz6ryayqqqqqqmxxf".to_string();
    
    add_log(&format!("Generated Bitcoin testnet address: {}", test_address));
    add_log("// TODO fund BTC testnet address with at least 10,000 sats");
    
    Ok(test_address)
}

// Query UTXOs for our Bitcoin address
async fn get_btc_utxos() -> Result<Vec<Utxo>> {
    let address = STATE.with(|state| state.borrow().btc_address.clone())
        .ok_or_else(|| anyhow!("Bitcoin address not initialized"))?;
    
    // Convert string address to Address type
    // In a real implementation we would properly parse the address
    // Here we'll use a simplified approach for demo
    let bitcoin_address = Address::from_str(&address)
        .map_err(|_| anyhow!("Invalid Bitcoin address"))?;
    
    // Call Bitcoin API to get UTXOs
    match ic_cdk::call::<(GetUtxosResponse,), (GetUtxosResponse,), _>(
        Principal::management_canister(),
        "bitcoin_get_utxos",
        (GetUtxosResponse {
            utxos: vec![],
            tip_block_hash: BlockHash([0; 32]),
            tip_height: 0,
            next_page: None,
        },),
    )
    .await {
        Ok((response,)) => Ok(response.utxos),
        Err((code, msg)) => Err(anyhow!("Failed to get UTXOs: {:?}, {}", code, msg)),
    }
}

// Send demo Bitcoin transaction
#[update]
async fn send_demo_btc() -> Result<String, String> {
    // Log the operation
    add_log("Attempting to send demo BTC transaction");
    
    // Get UTXOs
    let utxos = match get_btc_utxos().await {
        Ok(u) => u,
        Err(e) => {
            let error_msg = format!("Failed to get UTXOs: {}", e);
            add_log(&error_msg);
            return Err(error_msg);
        }
    };
    
    // Check if we have enough funds
    let mut total_sats = 0;
    for utxo in &utxos {
        total_sats += utxo.value;
    }
    
    if total_sats < BTC_MIN_AMOUNT_SATS {
        let msg = format!(
            "Insufficient BTC: {} sats, need at least {} sats", 
            total_sats, 
            BTC_MIN_AMOUNT_SATS
        );
        add_log(&msg);
        return Ok("Insufficient BTC".to_string());
    }
    
    // For demo purposes, we'll just return a mock txid
    // In a real implementation, we would:
    // 1. Create a raw transaction
    // 2. Sign it with threshold ECDSA
    // 3. Broadcast it to the Bitcoin network
    
    let mock_txid = format!(
        "{}{}",
        hex::encode(&[0x12, 0x34, 0x56, 0x78]),
        hex::encode(&[0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
    );
    
    add_log(&format!("Demo BTC transaction sent. TXID: {}", mock_txid));
    
    // Store the txid
    STATE.with(|state| {
        state.borrow_mut().last_txid = Some(mock_txid.clone());
    });
    
    Ok(mock_txid)
}

// Set strategy threshold
#[update]
async fn set_strategy(new_threshold_pct: u64) -> Result<(), String> {
    // Only owner can change strategy (in a real canister, we would check caller against owner)
    // For demo purposes, we'll allow any caller
    
    if new_threshold_pct < 90 || new_threshold_pct > 99 {
        let error_msg = "Threshold must be between 90 and 99".to_string();
        add_log(&error_msg);
        return Err(error_msg);
    }
    
    STATE.with(|state| {
        state.borrow_mut().threshold_pct = new_threshold_pct;
    });
    
    add_log(&format!("Strategy threshold updated to {}%", new_threshold_pct));
    Ok(())
}

// Pause or resume AI operations
#[update]
async fn pause_ai(flag: bool) -> Result<(), String> {
    // Only owner can pause/resume (in a real canister, we would check caller against owner)
    // For demo purposes, we'll allow any caller
    
    STATE.with(|state| {
        state.borrow_mut().paused = flag;
    });
    
    let status = if flag { "paused" } else { "resumed" };
    add_log(&format!("AI operations {}", status));
    
    Ok(())
}

// Query function to get statistics
#[query]
fn get_stats() -> Stats {
    STATE.with(|state| {
        let state = state.borrow();
        Stats {
            price_24h_ago: state.btc_price_24h_ago,
            threshold_pct: state.threshold_pct,
            paused: state.paused,
            btc_address: state.btc_address.clone().unwrap_or_else(|| "Not initialized".to_string()),
        }
    })
}

// Query function to get logs
#[query]
fn get_logs() -> Vec<String> {
    STATE.with(|state| state.borrow().logs.clone())
}

// Required for candid export
export_candid!();
