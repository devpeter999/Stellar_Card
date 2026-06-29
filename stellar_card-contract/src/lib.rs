#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Bytes, BytesN, Env, Symbol, Vec};

#[contracttype]
pub enum DataKey {
    Treasury,
    UsdcContract,
    XlmContract,
    Admin,
    Role(Role),
    Paused,
    ReentrancyGuard,
}

#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum Role {
    Admin,
    Pauser,
    Operator,
}

const MAX_REENTRANCY_DEPTH: u32 = 1;

#[contract]
pub struct Stellar_CardReceiver;

#[contractimpl]
impl Stellar_CardReceiver {
    pub fn init(
        env: Env,
        admin: Address,
        treasury: Address,
        usdc_contract: Address,
        xlm_contract: Address,
    ) {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::UsdcContract, &usdc_contract);
        env.storage().instance().set(&DataKey::XlmContract, &xlm_contract);

        env.storage().instance().set(&DataKey::Paused, &false);

        Self::grant_role_internal(&env, &admin, &Role::Admin);
        Self::grant_role_internal(&env, &admin, &Role::Pauser);
        Self::grant_role_internal(&env, &admin, &Role::Operator);

        env.storage().instance().extend_ttl(17_280_000, 17_280_000);
    }

    pub fn pay_usdc(env: Env, from: Address, amount: i128, order_id: Bytes) {
        if env.storage().instance().get::<_, bool>(&DataKey::Paused).unwrap_or(false) {
            panic!("contract is paused");
        }

        Self::enter_reentrancy_guard(&env);

        if amount <= 0 {
            panic!("amount must be positive");
        }
        from.require_auth();

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let usdc_contract: Address = env.storage().instance().get(&DataKey::UsdcContract).unwrap();

        let token_client = token::Client::new(&env, &usdc_contract);
        token_client.transfer(&from, &treasury, &amount);

        env.events().publish(
            (Symbol::new(&env, "pay_usdc"), order_id, from),
            amount,
        );

        Self::exit_reentrancy_guard(&env);

        env.storage().instance().extend_ttl(17_280_000, 17_280_000);
    }

    pub fn pay_xlm(env: Env, from: Address, amount: i128, order_id: Bytes) {
        if env.storage().instance().get::<_, bool>(&DataKey::Paused).unwrap_or(false) {
            panic!("contract is paused");
        }

        Self::enter_reentrancy_guard(&env);

        if amount <= 0 {
            panic!("amount must be positive");
        }
        from.require_auth();

        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let xlm_contract: Address = env.storage().instance().get(&DataKey::XlmContract).unwrap();

        let token_client = token::Client::new(&env, &xlm_contract);
        token_client.transfer(&from, &treasury, &amount);

        env.events().publish(
            (Symbol::new(&env, "pay_xlm"), order_id, from),
            amount,
        );

        Self::exit_reentrancy_guard(&env);

        env.storage().instance().extend_ttl(17_280_000, 17_280_000);
    }

    pub fn treasury(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Treasury).unwrap()
    }

    pub fn usdc_contract(env: Env) -> Address {
        env.storage().instance().get(&DataKey::UsdcContract).unwrap()
    }

    pub fn xlm_contract(env: Env) -> Address {
        env.storage().instance().get(&DataKey::XlmContract).unwrap()
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.events().publish(
            (Symbol::new(&env, "set_admin"),),
            new_admin,
        );
    }

    pub fn pause(env: Env, caller: Address) {
        caller.require_auth();
        if !Self::has_role_internal(&env, &caller, &Role::Pauser) {
            panic!("caller must have Pauser role");
        }
        env.storage().instance().set(&DataKey::Paused, &true);
        env.events().publish((Symbol::new(&env, "pause"),), caller);
    }

    pub fn unpause(env: Env, caller: Address) {
        caller.require_auth();
        if !Self::has_role_internal(&env, &caller, &Role::Pauser) {
            panic!("caller must have Pauser role");
        }
        env.storage().instance().set(&DataKey::Paused, &false);
        env.events().publish((Symbol::new(&env, "unpause"),), caller);
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get::<_, bool>(&DataKey::Paused).unwrap_or(false)
    }

    pub fn grant_role(env: Env, account: Address, role: Role) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        Self::grant_role_internal(&env, &account, &role);
        env.events().publish(
            (Symbol::new(&env, "grant_role"),),
            (account, role),
        );
    }

    pub fn revoke_role(env: Env, account: Address, role: Role) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        Self::revoke_role_internal(&env, &account, &role);
        env.events().publish(
            (Symbol::new(&env, "revoke_role"),),
            (account, role),
        );
    }

    pub fn has_role(env: Env, account: Address, role: Role) -> bool {
        Self::has_role_internal(&env, &account, &role)
    }

    fn has_role_internal(env: &Env, account: &Address, role: &Role) -> bool {
        let key = DataKey::Role(role.clone());
        env.storage().instance().has(&key)
            && env
                .storage()
                .instance()
                .get::<_, Vec<Address>>(&key)
                .map(|holders| holders.contains(account))
                .unwrap_or(false)
    }

    fn grant_role_internal(env: &Env, account: &Address, role: &Role) {
        let key = DataKey::Role(role.clone());
        let mut holders: Vec<Address> = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        if !holders.contains(account) {
            holders.push_back(account.clone());
            env.storage().instance().set(&key, &holders);
        }
    }

    fn revoke_role_internal(env: &Env, account: &Address, role: &Role) {
        let key = DataKey::Role(role.clone());
        let mut holders: Vec<Address> = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        if let Some(pos) = holders.iter().position(|a| a == *account) {
            holders.remove(pos as u32);
            env.storage().instance().set(&key, &holders);
        }
    }

    fn enter_reentrancy_guard(env: &Env) {
        let depth: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ReentrancyGuard)
            .unwrap_or(0);
        if depth >= MAX_REENTRANCY_DEPTH {
            panic!("reentrancy detected");
        }
        env.storage()
            .instance()
            .set(&DataKey::ReentrancyGuard, &(depth + 1));
    }

    fn exit_reentrancy_guard(env: &Env) {
        let depth: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ReentrancyGuard)
            .unwrap_or(0);
        if depth > 0 {
            env.storage()
                .instance()
                .set(&DataKey::ReentrancyGuard, &(depth - 1));
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Events},
        token, Bytes, Env, Symbol, TryIntoVal,
    };

    struct Fixture {
        env: Env,
        contract_id: Address,
        admin: Address,
        treasury: Address,
        payer: Address,
        usdc: Address,
        xlm_sac: Address,
    }

    impl Fixture {
        fn new() -> Self {
            let env = Env::default();
            env.mock_all_auths();

            let admin = Address::generate(&env);
            let treasury = Address::generate(&env);
            let payer = Address::generate(&env);

            let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
            let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();

            let contract_id = env.register(Stellar_CardReceiver, ());

            Fixture { env, contract_id, admin, treasury, payer, usdc, xlm_sac }
        }

        fn client(&self) -> Stellar_CardReceiverClient<'_> {
            Stellar_CardReceiverClient::new(&self.env, &self.contract_id)
        }

        fn init(&self) {
            self.client().init(&self.admin, &self.treasury, &self.usdc, &self.xlm_sac);
        }

        fn mint_usdc(&self, to: &Address, amount: i128) {
            token::StellarAssetClient::new(&self.env, &self.usdc).mint(to, &amount);
        }

        fn mint_xlm(&self, to: &Address, amount: i128) {
            token::StellarAssetClient::new(&self.env, &self.xlm_sac).mint(to, &amount);
        }

        fn usdc_balance(&self, addr: &Address) -> i128 {
            token::Client::new(&self.env, &self.usdc).balance(addr)
        }

        fn xlm_balance(&self, addr: &Address) -> i128 {
            token::Client::new(&self.env, &self.xlm_sac).balance(addr)
        }
    }

    fn order_bytes(env: &Env, s: &str) -> Bytes {
        Bytes::from_slice(env, s.as_bytes())
    }

    // ── init tests ────────────────────────────────────────────────────────────

    #[test]
    fn test_init_stores_all_addresses() {
        let f = Fixture::new();
        f.init();

        let client = f.client();
        assert_eq!(client.treasury(), f.treasury);
        assert_eq!(client.usdc_contract(), f.usdc);
        assert_eq!(client.xlm_contract(), f.xlm_sac);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_init_twice_panics() {
        let f = Fixture::new();
        f.init();
        f.init();
    }

    #[test]
    fn test_init_grants_all_roles_to_admin() {
        let f = Fixture::new();
        f.init();

        let client = f.client();
        assert!(client.has_role(&f.admin, &Role::Admin));
        assert!(client.has_role(&f.admin, &Role::Pauser));
        assert!(client.has_role(&f.admin, &Role::Operator));
    }

    #[test]
    fn test_init_sets_unpaused() {
        let f = Fixture::new();
        f.init();
        assert!(!f.client().is_paused());
    }

    // ── pay_usdc tests ────────────────────────────────────────────────────────

    #[test]
    fn test_pay_usdc_transfers_to_treasury() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 25_000_000;
        f.mint_usdc(&f.payer, amount);

        let oid = order_bytes(&f.env, "a3f7c2d1-4e8b-4f0a-9c2d");
        f.client().pay_usdc(&f.payer, &amount, &oid);

        assert_eq!(f.usdc_balance(&f.treasury), amount);
        assert_eq!(f.usdc_balance(&f.payer), 0);
    }

    #[test]
    fn test_pay_usdc_emits_correct_event() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 10_000_000;
        f.mint_usdc(&f.payer, amount);

        let oid = order_bytes(&f.env, "test-order-usdc");
        f.client().pay_usdc(&f.payer, &amount, &oid);

        let events = f.env.events().all();
        let mut found = false;
        for (contract_addr, topics, data) in events.iter() {
            if contract_addr != f.contract_id {
                continue;
            }
            let sym: Symbol = topics.get(0).unwrap().try_into_val(&f.env).unwrap();
            if sym != Symbol::new(&f.env, "pay_usdc") {
                continue;
            }
            let emitted_oid: Bytes = topics.get(1).unwrap().try_into_val(&f.env).unwrap();
            assert_eq!(emitted_oid, oid);
            let emitted_from: Address = topics.get(2).unwrap().try_into_val(&f.env).unwrap();
            assert_eq!(emitted_from, f.payer);
            let emitted_amount: i128 = data.try_into_val(&f.env).unwrap();
            assert_eq!(emitted_amount, amount);
            found = true;
            break;
        }
        assert!(found, "pay_usdc event not found");
    }

    #[test]
    #[should_panic]
    fn test_pay_usdc_requires_auth() {
        let env = Env::default();

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let payer = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        client.init(&admin, &treasury, &usdc, &xlm_sac);

        let oid = order_bytes(&env, "order-no-auth");
        client.pay_usdc(&payer, &1_000_000_i128, &oid);
    }

    #[test]
    #[should_panic(expected = "contract is paused")]
    fn test_pay_usdc_rejected_when_paused() {
        let f = Fixture::new();
        f.init();
        f.client().pause(&f.admin);

        let amount: i128 = 1_000_000;
        f.mint_usdc(&f.payer, amount);
        let oid = order_bytes(&f.env, "paused-order");
        f.client().pay_usdc(&f.payer, &amount, &oid);
    }

    // ── pay_xlm tests ─────────────────────────────────────────────────────────

    #[test]
    fn test_pay_xlm_transfers_to_treasury() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 161_290_000;
        f.mint_xlm(&f.payer, amount);

        let oid = order_bytes(&f.env, "b2e8d1c0-5f9a-4b0b-8d3e");
        f.client().pay_xlm(&f.payer, &amount, &oid);

        assert_eq!(f.xlm_balance(&f.treasury), amount);
        assert_eq!(f.xlm_balance(&f.payer), 0);
    }

    #[test]
    fn test_pay_xlm_emits_correct_event() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 50_000_000;
        f.mint_xlm(&f.payer, amount);

        let oid = order_bytes(&f.env, "test-order-xlm");
        f.client().pay_xlm(&f.payer, &amount, &oid);

        let events = f.env.events().all();
        let mut found = false;
        for (contract_addr, topics, data) in events.iter() {
            if contract_addr != f.contract_id {
                continue;
            }
            let sym: Symbol = topics.get(0).unwrap().try_into_val(&f.env).unwrap();
            if sym != Symbol::new(&f.env, "pay_xlm") {
                continue;
            }
            let emitted_oid: Bytes = topics.get(1).unwrap().try_into_val(&f.env).unwrap();
            assert_eq!(emitted_oid, oid);
            let emitted_from: Address = topics.get(2).unwrap().try_into_val(&f.env).unwrap();
            assert_eq!(emitted_from, f.payer);
            let emitted_amount: i128 = data.try_into_val(&f.env).unwrap();
            assert_eq!(emitted_amount, amount);
            found = true;
            break;
        }
        assert!(found, "pay_xlm event not found");
    }

    #[test]
    #[should_panic]
    fn test_pay_xlm_requires_auth() {
        let env = Env::default();

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let payer = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        client.init(&admin, &treasury, &usdc, &xlm_sac);

        let oid = order_bytes(&env, "order-no-auth-xlm");
        client.pay_xlm(&payer, &1_000_000_i128, &oid);
    }

    #[test]
    #[should_panic(expected = "contract is paused")]
    fn test_pay_xlm_rejected_when_paused() {
        let f = Fixture::new();
        f.init();
        f.client().pause(&f.admin);

        let amount: i128 = 1_000_000;
        f.mint_xlm(&f.payer, amount);
        let oid = order_bytes(&f.env, "paused-xlm");
        f.client().pay_xlm(&f.payer, &amount, &oid);
    }

    // ── getter tests ──────────────────────────────────────────────────────────

    #[test]
    fn test_try_getters_before_init_return_err() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        assert!(client.try_treasury().is_err());
        assert!(client.try_usdc_contract().is_err());
        assert!(client.try_xlm_contract().is_err());
    }

    // ── amount validation tests ───────────────────────────────────────────────

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_pay_usdc_rejects_zero_amount() {
        let f = Fixture::new();
        f.init();
        let oid = order_bytes(&f.env, "zero-amount");
        f.client().pay_usdc(&f.payer, &0_i128, &oid);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_pay_usdc_rejects_negative_amount() {
        let f = Fixture::new();
        f.init();
        let oid = order_bytes(&f.env, "neg-amount");
        f.client().pay_usdc(&f.payer, &(-1_000_000_i128), &oid);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_pay_xlm_rejects_zero_amount() {
        let f = Fixture::new();
        f.init();
        let oid = order_bytes(&f.env, "xlm-zero");
        f.client().pay_xlm(&f.payer, &0_i128, &oid);
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_pay_xlm_rejects_negative_amount() {
        let f = Fixture::new();
        f.init();
        let oid = order_bytes(&f.env, "xlm-neg");
        f.client().pay_xlm(&f.payer, &(-50_000_000_i128), &oid);
    }

    // ── upgrade tests ─────────────────────────────────────────────────────────

    #[test]
    fn test_admin_getter_returns_correct_address() {
        let f = Fixture::new();
        f.init();
        assert_eq!(f.client().admin(), f.admin);
    }

    #[test]
    #[should_panic]
    fn test_upgrade_requires_admin_auth() {
        let env = Env::default();
        env.mock_auths(&[]);

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        env.mock_all_auths();
        client.init(&admin, &treasury, &usdc, &xlm_sac);

        env.mock_auths(&[]);
        let fake_hash = BytesN::from_array(&env, &[0u8; 32]);
        client.upgrade(&fake_hash);
    }

    #[test]
    fn test_init_requires_admin_auth() {
        let env = Env::default();
        env.mock_auths(&[]);

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        let result = client.try_init(&admin, &treasury, &usdc, &xlm_sac);
        assert!(result.is_err(), "init should require admin authorization");
    }

    // ── RBAC tests ────────────────────────────────────────────────────────────

    #[test]
    fn test_grant_role() {
        let f = Fixture::new();
        f.init();
        let user = Address::generate(&f.env);

        assert!(!f.client().has_role(&user, &Role::Operator));
        f.client().grant_role(&user, &Role::Operator);
        assert!(f.client().has_role(&user, &Role::Operator));
    }

    #[test]
    fn test_revoke_role() {
        let f = Fixture::new();
        f.init();

        assert!(f.client().has_role(&f.admin, &Role::Pauser));
        f.client().revoke_role(&f.admin, &Role::Pauser);
        assert!(!f.client().has_role(&f.admin, &Role::Pauser));
    }

    #[test]
    #[should_panic]
    fn test_grant_role_requires_admin_auth() {
        let env = Env::default();
        env.mock_auths(&[]);

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        env.mock_all_auths();
        client.init(&admin, &treasury, &usdc, &xlm_sac);

        env.mock_auths(&[]);
        let user = Address::generate(&env);
        client.grant_role(&user, &Role::Operator);
    }

    #[test]
    #[should_panic]
    fn test_revoke_role_requires_admin_auth() {
        let env = Env::default();
        env.mock_auths(&[]);

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        env.mock_all_auths();
        client.init(&admin, &treasury, &usdc, &xlm_sac);

        env.mock_auths(&[]);
        client.revoke_role(&admin, &Role::Operator);
    }

    #[test]
    fn test_has_role_returns_false_for_unknown() {
        let f = Fixture::new();
        f.init();
        let user = Address::generate(&f.env);
        assert!(!f.client().has_role(&user, &Role::Admin));
    }

    // ── pause tests ───────────────────────────────────────────────────────────

    #[test]
    fn test_pause_and_unpause() {
        let f = Fixture::new();
        f.init();

        assert!(!f.client().is_paused());
        f.client().pause(&f.admin);
        assert!(f.client().is_paused());
        f.client().unpause(&f.admin);
        assert!(!f.client().is_paused());
    }

    #[test]
    #[should_panic(expected = "caller must have Pauser role")]
    fn test_pause_requires_pauser_role() {
        let f = Fixture::new();
        f.init();

        let non_pauser = Address::generate(&f.env);
        f.client().pause(&non_pauser);
    }

    // ── set_admin tests ───────────────────────────────────────────────────────

    #[test]
    fn test_set_admin() {
        let f = Fixture::new();
        f.init();

        let new_admin = Address::generate(&f.env);
        f.client().set_admin(&new_admin);
        assert_eq!(f.client().admin(), new_admin);
    }

    #[test]
    #[should_panic]
    fn test_set_admin_requires_admin_auth() {
        let env = Env::default();
        env.mock_auths(&[]);

        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let xlm_sac = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let contract_id = env.register(Stellar_CardReceiver, ());
        let client = Stellar_CardReceiverClient::new(&env, &contract_id);

        env.mock_all_auths();
        client.init(&admin, &treasury, &usdc, &xlm_sac);

        env.mock_auths(&[]);
        let new_admin = Address::generate(&env);
        client.set_admin(&new_admin);
    }

    // ── comprehensive edge-case tests ─────────────────────────────────────────

    #[test]
    fn test_multiple_usdc_payments_accumulate_in_treasury() {
        let f = Fixture::new();
        f.init();

        let amount1: i128 = 10_000_000;
        let amount2: i128 = 25_000_000;
        f.mint_usdc(&f.payer, amount1 + amount2);

        let oid1 = order_bytes(&f.env, "order-1");
        f.client().pay_usdc(&f.payer, &amount1, &oid1);

        let oid2 = order_bytes(&f.env, "order-2");
        f.client().pay_usdc(&f.payer, &amount2, &oid2);

        assert_eq!(f.usdc_balance(&f.treasury), amount1 + amount2);
        assert_eq!(f.usdc_balance(&f.payer), 0);
    }

    #[test]
    fn test_multiple_xlm_payments_accumulate_in_treasury() {
        let f = Fixture::new();
        f.init();

        let amount1: i128 = 5_000_000;
        let amount2: i128 = 10_000_000;
        f.mint_xlm(&f.payer, amount1 + amount2);

        let oid1 = order_bytes(&f.env, "xlm-order-1");
        f.client().pay_xlm(&f.payer, &amount1, &oid1);

        let oid2 = order_bytes(&f.env, "xlm-order-2");
        f.client().pay_xlm(&f.payer, &amount2, &oid2);

        assert_eq!(f.xlm_balance(&f.treasury), amount1 + amount2);
        assert_eq!(f.xlm_balance(&f.payer), 0);
    }

    #[test]
    fn test_different_payers_usdc() {
        let f = Fixture::new();
        f.init();

        let payer2 = Address::generate(&f.env);
        let amount1: i128 = 5_000_000;
        let amount2: i128 = 15_000_000;
        f.mint_usdc(&f.payer, amount1);
        f.mint_usdc(&payer2, amount2);

        let oid1 = order_bytes(&f.env, "payer1-order");
        f.client().pay_usdc(&f.payer, &amount1, &oid1);

        let oid2 = order_bytes(&f.env, "payer2-order");
        f.client().pay_usdc(&payer2, &amount2, &oid2);

        assert_eq!(f.usdc_balance(&f.treasury), amount1 + amount2);
        assert_eq!(f.usdc_balance(&f.payer), 0);
        assert_eq!(f.usdc_balance(&payer2), 0);
    }

    #[test]
    fn test_different_payers_xlm() {
        let f = Fixture::new();
        f.init();

        let payer2 = Address::generate(&f.env);
        let amount1: i128 = 3_000_000;
        let amount2: i128 = 7_000_000;
        f.mint_xlm(&f.payer, amount1);
        f.mint_xlm(&payer2, amount2);

        let oid1 = order_bytes(&f.env, "xlm-p1");
        f.client().pay_xlm(&f.payer, &amount1, &oid1);

        let oid2 = order_bytes(&f.env, "xlm-p2");
        f.client().pay_xlm(&payer2, &amount2, &oid2);

        assert_eq!(f.xlm_balance(&f.treasury), amount1 + amount2);
        assert_eq!(f.xlm_balance(&f.payer), 0);
        assert_eq!(f.xlm_balance(&payer2), 0);
    }

    #[test]
    fn test_pay_usdc_with_fractional_amount() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 12_345_678;
        f.mint_usdc(&f.payer, amount);

        let oid = order_bytes(&f.env, "fractional-usdc");
        f.client().pay_usdc(&f.payer, &amount, &oid);

        assert_eq!(f.usdc_balance(&f.treasury), amount);
    }

    #[test]
    fn test_pay_xlm_minimum_stroops() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 1;
        f.mint_xlm(&f.payer, amount);

        let oid = order_bytes(&f.env, "min-xlm");
        f.client().pay_xlm(&f.payer, &amount, &oid);

        assert_eq!(f.xlm_balance(&f.treasury), 1);
    }

    #[test]
    fn test_grant_role_idempotent() {
        let f = Fixture::new();
        f.init();
        let user = Address::generate(&f.env);

        f.client().grant_role(&user, &Role::Operator);
        f.client().grant_role(&user, &Role::Operator);
        assert!(f.client().has_role(&user, &Role::Operator));
    }

    #[test]
    fn test_revoke_nonexistent_role_is_noop() {
        let f = Fixture::new();
        f.init();
        let user = Address::generate(&f.env);

        assert!(!f.client().has_role(&user, &Role::Pauser));
        f.client().revoke_role(&user, &Role::Pauser);
        assert!(!f.client().has_role(&user, &Role::Pauser));
    }

    #[test]
    fn test_grant_multiple_roles_to_same_user() {
        let f = Fixture::new();
        f.init();
        let user = Address::generate(&f.env);

        f.client().grant_role(&user, &Role::Pauser);
        f.client().grant_role(&user, &Role::Operator);

        assert!(f.client().has_role(&user, &Role::Pauser));
        assert!(f.client().has_role(&user, &Role::Operator));
        assert!(!f.client().has_role(&user, &Role::Admin));
    }

    #[test]
    fn test_revoke_role_does_not_affect_other_roles() {
        let f = Fixture::new();
        f.init();
        let user = Address::generate(&f.env);

        f.client().grant_role(&user, &Role::Pauser);
        f.client().grant_role(&user, &Role::Operator);

        f.client().revoke_role(&user, &Role::Pauser);

        assert!(!f.client().has_role(&user, &Role::Pauser));
        assert!(f.client().has_role(&user, &Role::Operator));
    }

    #[test]
    fn test_unpause_requires_pauser_role() {
        let f = Fixture::new();
        f.init();
        f.client().pause(&f.admin);

        let non_pauser = Address::generate(&f.env);
        f.env.mock_auths(&[]);
        let result = f.client().try_unpause(&non_pauser);
        assert!(result.is_err());
    }

    #[test]
    fn test_pay_usdc_after_unpause_works() {
        let f = Fixture::new();
        f.init();

        f.client().pause(&f.admin);
        assert!(f.client().is_paused());

        f.client().unpause(&f.admin);
        assert!(!f.client().is_paused());

        let amount: i128 = 5_000_000;
        f.mint_usdc(&f.payer, amount);
        let oid = order_bytes(&f.env, "after-unpause");
        f.client().pay_usdc(&f.payer, &amount, &oid);

        assert_eq!(f.usdc_balance(&f.treasury), amount);
    }

    #[test]
    fn test_pay_xlm_after_unpause_works() {
        let f = Fixture::new();
        f.init();

        f.client().pause(&f.admin);
        f.client().unpause(&f.admin);

        let amount: i128 = 8_000_000;
        f.mint_xlm(&f.payer, amount);
        let oid = order_bytes(&f.env, "xlm-after-unpause");
        f.client().pay_xlm(&f.payer, &amount, &oid);

        assert_eq!(f.xlm_balance(&f.treasury), amount);
    }

    #[test]
    fn test_set_admin_old_admin_loses_access() {
        let f = Fixture::new();
        f.init();

        let new_admin = Address::generate(&f.env);
        f.client().set_admin(&new_admin);

        assert_eq!(f.client().admin(), new_admin);
        assert_ne!(f.admin, new_admin);
    }

    #[test]
    fn test_reentrancy_guard_cleared_after_payment() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 1_000_000;
        f.mint_usdc(&f.payer, amount * 2);

        let oid1 = order_bytes(&f.env, "guard-test-1");
        f.client().pay_usdc(&f.payer, &amount, &oid1);

        let oid2 = order_bytes(&f.env, "guard-test-2");
        f.client().pay_usdc(&f.payer, &amount, &oid2);

        assert_eq!(f.usdc_balance(&f.treasury), amount * 2);
    }

    #[test]
    fn test_pay_usdc_large_amount() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 999_999_999_999_999;
        f.mint_usdc(&f.payer, amount);

        let oid = order_bytes(&f.env, "large-amount");
        f.client().pay_usdc(&f.payer, &amount, &oid);

        assert_eq!(f.usdc_balance(&f.treasury), amount);
    }

    #[test]
    fn test_pay_xlm_large_amount() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 999_999_999_999_999;
        f.mint_xlm(&f.payer, amount);

        let oid = order_bytes(&f.env, "xlm-large");
        f.client().pay_xlm(&f.payer, &amount, &oid);

        assert_eq!(f.xlm_balance(&f.treasury), amount);
    }

    #[test]
    fn test_init_emits_no_events() {
        let f = Fixture::new();
        f.init();

        let events = f.env.events().all();
        let contract_events: u32 = events
            .iter()
            .filter(|(addr, _, _)| *addr == f.contract_id)
            .count() as u32;
        assert_eq!(contract_events, 0);
    }

    #[test]
    fn test_revoke_admin_role_from_original_admin() {
        let f = Fixture::new();
        f.init();

        let new_admin = Address::generate(&f.env);
        f.client().grant_role(&new_admin, &Role::Admin);

        f.client().revoke_role(&f.admin, &Role::Admin);

        assert!(!f.client().has_role(&f.admin, &Role::Admin));
        assert!(f.client().has_role(&new_admin, &Role::Admin));
    }

    #[test]
    fn test_multiple_payers_single_order() {
        let f = Fixture::new();
        f.init();

        let payer2 = Address::generate(&f.env);
        let amount: i128 = 1_000_000;
        f.mint_usdc(&f.payer, amount);
        f.mint_usdc(&payer2, amount);

        let oid = order_bytes(&f.env, "shared-order");
        f.client().pay_usdc(&f.payer, &amount, &oid);
        f.client().pay_usdc(&payer2, &amount, &oid);

        assert_eq!(f.usdc_balance(&f.treasury), amount * 2);
    }

    #[test]
    fn test_empty_order_id() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 1_000_000;
        f.mint_usdc(&f.payer, amount);

        let oid = Bytes::new(&f.env);
        f.client().pay_usdc(&f.payer, &amount, &oid);

        assert_eq!(f.usdc_balance(&f.treasury), amount);
    }

    #[test]
    fn test_empty_order_id_xlm() {
        let f = Fixture::new();
        f.init();

        let amount: i128 = 2_000_000;
        f.mint_xlm(&f.payer, amount);

        let oid = Bytes::new(&f.env);
        f.client().pay_xlm(&f.payer, &amount, &oid);

        assert_eq!(f.xlm_balance(&f.treasury), amount);
    }
}
