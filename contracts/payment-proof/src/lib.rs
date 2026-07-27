#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, String,
};

const INSTANCE_BUMP_LEDGERS: u32 = 30 * 17_280;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_LEDGERS - 17_280;
const PAYMENT_BUMP_LEDGERS: u32 = 90 * 17_280;
const PAYMENT_LIFETIME_THRESHOLD: u32 = PAYMENT_BUMP_LEDGERS - 17_280;

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum PaymentStatus {
    Pending,
    Settled,
    Expired,
    Cancelled,
}
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PaymentIntent {
    pub payer: Address,
    pub recipient: Address,
    pub asset: Address,
    pub amount: i128,
    pub memo: u64,
    pub expires_ledger: u32,
    pub status: PaymentStatus,
    pub tx_ref: String,
}
#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Payment(u64),
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    PaymentExists = 3,
    PaymentNotFound = 4,
    InvalidParty = 5,
    InvalidAsset = 6,
    InvalidAmount = 7,
    InvalidExpiry = 8,
    InvalidStatus = 9,
    Expired = 10,
}

#[contract]
pub struct PaymentProofContract;
#[contractevent(data_format = "single-value")]
pub struct Initialized {
    pub admin: Address,
}
#[contractevent(data_format = "single-value")]
pub struct PaymentCreated {
    pub payment_id: u64,
}
#[contractevent(data_format = "single-value")]
pub struct PaymentSettled {
    pub payment_id: u64,
}
#[contractevent(data_format = "single-value")]
pub struct PaymentExpired {
    pub payment_id: u64,
}
#[contractevent(data_format = "single-value")]
pub struct PaymentCancelled {
    pub payment_id: u64,
}

#[contractimpl]
impl PaymentProofContract {
    pub fn initialize(e: Env, admin: Address) -> Result<(), Error> {
        if e.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_LEDGERS);
        Initialized { admin }.publish(&e);
        Ok(())
    }
    pub fn create_payment(
        e: Env,
        payment_id: u64,
        payer: Address,
        recipient: Address,
        asset: Address,
        amount: i128,
        memo: u64,
        expires_ledger: u32,
    ) -> Result<(), Error> {
        Self::read_admin(&e)?;
        if payer == recipient {
            return Err(Error::InvalidParty);
        }
        if asset == payer || asset == recipient {
            return Err(Error::InvalidAsset);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if expires_ledger <= e.ledger().sequence() {
            return Err(Error::InvalidExpiry);
        }
        let key = DataKey::Payment(payment_id);
        if e.storage().persistent().has(&key) {
            return Err(Error::PaymentExists);
        }
        payer.require_auth();
        e.storage().persistent().set(
            &key,
            &PaymentIntent {
                payer,
                recipient,
                asset,
                amount,
                memo,
                expires_ledger,
                status: PaymentStatus::Pending,
                tx_ref: String::from_str(&e, ""),
            },
        );
        e.storage()
            .persistent()
            .extend_ttl(&key, PAYMENT_LIFETIME_THRESHOLD, PAYMENT_BUMP_LEDGERS);
        PaymentCreated { payment_id }.publish(&e);
        Ok(())
    }
    pub fn get_payment(e: Env, payment_id: u64) -> Result<PaymentIntent, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Payment(payment_id))
            .ok_or(Error::PaymentNotFound)
    }
    pub fn confirm_payment(e: Env, payment_id: u64, tx_ref: String) -> Result<(), Error> {
        let admin = Self::read_admin(&e)?;
        admin.require_auth();
        let key = DataKey::Payment(payment_id);
        let mut item = Self::read_payment(&e, &key)?;
        if item.status != PaymentStatus::Pending {
            return Err(Error::InvalidStatus);
        }
        if e.ledger().sequence() >= item.expires_ledger {
            return Err(Error::Expired);
        }
        item.status = PaymentStatus::Settled;
        item.tx_ref = tx_ref;
        Self::write_payment(&e, &key, &item);
        PaymentSettled { payment_id }.publish(&e);
        Ok(())
    }
    pub fn expire_payment(e: Env, payment_id: u64) -> Result<(), Error> {
        let key = DataKey::Payment(payment_id);
        let mut item = Self::read_payment(&e, &key)?;
        if item.status != PaymentStatus::Pending {
            return Err(Error::InvalidStatus);
        }
        if e.ledger().sequence() < item.expires_ledger {
            return Err(Error::InvalidExpiry);
        }
        item.status = PaymentStatus::Expired;
        Self::write_payment(&e, &key, &item);
        PaymentExpired { payment_id }.publish(&e);
        Ok(())
    }
    pub fn cancel_payment(e: Env, payment_id: u64) -> Result<(), Error> {
        let key = DataKey::Payment(payment_id);
        let mut item = Self::read_payment(&e, &key)?;
        if item.status != PaymentStatus::Pending {
            return Err(Error::InvalidStatus);
        }
        item.payer.require_auth();
        item.status = PaymentStatus::Cancelled;
        Self::write_payment(&e, &key, &item);
        PaymentCancelled { payment_id }.publish(&e);
        Ok(())
    }
}
impl PaymentProofContract {
    fn read_admin(e: &Env) -> Result<Address, Error> {
        e.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }
    fn read_payment(e: &Env, key: &DataKey) -> Result<PaymentIntent, Error> {
        e.storage()
            .persistent()
            .get(key)
            .ok_or(Error::PaymentNotFound)
    }
    fn write_payment(e: &Env, key: &DataKey, item: &PaymentIntent) {
        e.storage().persistent().set(key, item);
        e.storage()
            .persistent()
            .extend_ttl(key, PAYMENT_LIFETIME_THRESHOLD, PAYMENT_BUMP_LEDGERS);
    }
}
#[cfg(test)]
mod test {
    extern crate std;
    use super::{Error, PaymentProofContract, PaymentProofContractClient, PaymentStatus};
    use soroban_sdk::{testutils::Address as _, Address, Env, String};
    #[test]
    fn create_and_confirm_payment() {
        let e = Env::default();
        let admin = Address::generate(&e);
        let payer = Address::generate(&e);
        let recipient = Address::generate(&e);
        let asset = Address::generate(&e);
        let id = e.register(PaymentProofContract, ());
        let client = PaymentProofContractClient::new(&e, &id);
        e.mock_all_auths();
        client.initialize(&admin);
        client.create_payment(
            &7,
            &payer,
            &recipient,
            &asset,
            &125_i128,
            &42,
            &(e.ledger().sequence() + 10),
        );
        client.confirm_payment(&7, &String::from_str(&e, "bill-tx-7"));
        assert_eq!(client.get_payment(&7).status, PaymentStatus::Settled);
    }
    #[test]
    fn cancel_is_only_pending() {
        let e = Env::default();
        let admin = Address::generate(&e);
        let payer = Address::generate(&e);
        let recipient = Address::generate(&e);
        let asset = Address::generate(&e);
        let id = e.register(PaymentProofContract, ());
        let client = PaymentProofContractClient::new(&e, &id);
        e.mock_all_auths();
        client.initialize(&admin);
        client.create_payment(
            &8,
            &payer,
            &recipient,
            &asset,
            &1_i128,
            &0,
            &(e.ledger().sequence() + 10),
        );
        client.cancel_payment(&8);
        assert_eq!(client.get_payment(&8).status, PaymentStatus::Cancelled);
        assert_eq!(
            client
                .try_confirm_payment(&8, &String::from_str(&e, "late"))
                .unwrap_err()
                .unwrap(),
            Error::InvalidStatus
        );
    }
}
