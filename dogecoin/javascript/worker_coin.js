require("@babel/polyfill");
window.bitcoin = require('bitcoinjs-lib');
window.wif = require('wif');
window.bip32 = require('bip32');
window.bip39 = require('bip39');

function worker_coin_generate_outputs(private_key_string, coin_split_key_boolean) {
  var word_list_string = window.bip39.entropyToMnemonic(private_key_string); // Private key is an entropy seed for mnemonic
  var private_seed_string = window.bip39.mnemonicToSeedHex(word_list_string);
  var root = window.bip32.fromSeed(Buffer.from(private_seed_string, 'hex')); 
  var derived_path = root.derivePath("m/44'/3'/0'/0/0"); // 3 = Dogecoin, https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  var formatted_private_key_string = window.wif.encode(158, new Buffer(derived_path.privateKey, 'hex'), true)
  // https://github.com/libbitcoin/libbitcoin/wiki/Altcoin-Version-Mappings
  var address_string = window.bitcoin.payments.p2pkh({ pubkey: derived_path.publicKey, network: { pubKeyHash: 0x1e }}).address;
  return_generated_outputs(private_key_string, formatted_private_key_string, address_string, word_list_string, coin_split_key_boolean);
}

function worker_coin_decode_word_list(word_list_string) {
  var private_key_string = false;
  if (window.bip39.validateMnemonic(word_list_string)) {
    var private_key_string = window.bip39.mnemonicToEntropy(word_list_string);
  }
  return_decoded_private_key(private_key_string);
}
