require("@babel/polyfill");
window.bip39 = require('bip39');
window.ecc = require('eosjs-ecc');

function worker_coin_generate_outputs(private_key_string, coin_split_key_boolean) {
  var word_list_string = window.bip39.entropyToMnemonic(private_key_string); // Private key is an entropy seed for mnemonic
  var private_seed_string = window.bip39.mnemonicToSeedHex(word_list_string);
  var formatted_private_key_string = window.ecc.seedPrivate(private_seed_string);
  var address_string = window.ecc.privateToPublic(formatted_private_key_string, 'EOS');
  return_generated_outputs(private_key_string, formatted_private_key_string, address_string, word_list_string, coin_split_key_boolean);
}

function worker_coin_decode_word_list(word_list_string) {
  var private_key_string = false;
  if (window.bip39.validateMnemonic(word_list_string)) {
    var private_key_string = window.bip39.mnemonicToEntropy(word_list_string);
  }
  return_decoded_private_key(private_key_string);
}
