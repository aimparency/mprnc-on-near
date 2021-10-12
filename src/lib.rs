use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::LookupMap;
use near_sdk::{env, near_bindgen};
use serde::{Serialize, Deserialize};

near_sdk::setup_alloc!();

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct Connection {
}

impl Connection {
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct ConnectionKey {
    pub contributor_id: String, 
    pub beneficiary_id: String
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct Aim {
    pub owner: String, 
    pub title: String
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Aimparency {
    records: LookupMap<String, String>,
    aims: LookupMap<String, Aim>,
    connections: LookupMap<ConnectionKey, Connection>
}

impl Default for Aimparency {
    fn default() -> Self {
        Self {
            records: LookupMap::new(b"r".to_vec()),
            aims: LookupMap::new(b"a".to_vec()), 
            connections: LookupMap::new(b"c".to_vec())
        }
    }
}

#[near_bindgen]
impl Aimparency {
    pub fn set_status(&mut self, message: String) {
        let account_id = env::signer_account_id();
        self.records.insert(&account_id, &message);
    }

    pub fn add_aim(&mut self, title: String, id: String) -> Result<(), String> {
        let account_id = env::signer_account_id();

        if self.aims.contains_key(&id) {
            return Err("Aim id collision".to_string()) 
        } else {
            self.aims.insert(&id, &Aim {
                owner: account_id, 
                title
            }); 

            Ok(())
        }
    }

    pub fn connect_aim(&mut self, contributor_id: String, beneficiary_id: String) -> Result<(), String> {
        let account_id = env::signer_account_id();

        match self.aims.get(&beneficiary_id) {
            Some(target) => {
                if target.owner != account_id {
                    return Err("Target aim must be owned".to_string())
                } else {
                    if !self.aims.contains_key(&contributor_id) {
                        return Err("Contributer aim does not exist".to_string())  
                    } else {
                        let key = ConnectionKey {
                            contributor_id, 
                            beneficiary_id
                        }; 
                        self.connections.insert(&key, &Connection {}); 
                        return Ok(())
                    }
                }
            }, 
            None => Err("could not find target aim".to_string()) 
        }
    }

    pub fn get_aim(&self, id: String) -> Result<Aim, String> {
        match self.aims.get(&id) {
            Some(aim) => Ok(aim), 
            None => Err("No such aim".to_string())
        }
    }

    pub fn get_connection(&self, contributor_id: String, beneficiary_id: String) -> Result<Connection, String> {
        let key = ConnectionKey {
            contributor_id, 
            beneficiary_id
        };
        match self.connections.get(&key) {
            Some(connection) => Ok(connection), 
            None => Err("No such connection".to_string())
        }
    }

    pub fn get_status(&self, account_id: String) -> Option<String> {
        return self.records.get(&account_id);
    }
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 0,
        }
    }

    #[test]
    fn set_get_message() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = Aimparency::default();
        contract.set_status("hello".to_string());
        assert_eq!(
            "hello".to_string(),
            contract.get_status("bob_near".to_string()).unwrap()
        );
    }

    #[test]
    fn get_nonexistent_message() {
        let context = get_context(vec![], true);
        testing_env!(context);
        let contract = Aimparency::default();
        assert_eq!(None, contract.get_status("francis.near".to_string()));
    }
}
