require("@babel/polyfill");
window.bip39 = require('bip39');

function worker_coin_generate_outputs(private_key_string, coin_split_key_boolean) {
  var private_key_hex_string = coin_private_key_number_from_string(private_key_string).toString(16);
  var word_list_string = window.bip39.entropyToMnemonic(private_key_hex_string); // Private key is an entropy seed for mnemonic
  private_key_hex_string = window.bip39.mnemonicToEntropy(word_list_string); // Taking through BIP to deal with % 4 issue
  var formatted_private_key_string = coin_private_key_string_from_number(bigInt(private_key_hex_string, 16));
  if (formatted_private_key_string.length != 81) {
    throw "Formatted private key not of the right length, issue!";
  }

  var iota = new window.IOTA()
  var options_hash = {};

  options_hash.index = 0;
  options_hash.security = 2;
  options_hash.deterministic = "off";
  options_hash.checksum = true;
  options_hash.total = 1;
  iota.api.getNewAddress(formatted_private_key_string, options_hash, function(e, addresses_array) {
    return_generated_outputs(private_key_string, formatted_private_key_string, addresses_array[0], word_list_string, coin_split_key_boolean);
  });
}

function worker_coin_decode_word_list(word_list_string) {
  var private_key_string = false;
  if (window.bip39.validateMnemonic(word_list_string)) {
    var private_key_hex_string = window.bip39.mnemonicToEntropy(word_list_string);
    private_key_string = coin_private_key_string_from_number(bigInt(private_key_hex_string, 16));
  }
  return_decoded_private_key(private_key_string);
}

function coin_private_key_string_from_number(private_key_big_integer) {
  var private_key_string = (private_key_big_integer).toString(27);
  var new_private_key_string = "";
  for (var i = 0; i < private_key_string.length; i++) {
    var code = private_key_string.charCodeAt(i);
    if (code == 113) {
      new_private_key_string += String.fromCharCode(57);
    } else if (code < 58) {
      new_private_key_string += String.fromCharCode(code + 17);
    } else if (code > 96) {
      new_private_key_string += String.fromCharCode(code - 22);
    }
  }
  return new_private_key_string
}

function coin_private_key_number_from_string(private_key_string) {
  var private_key_number_string = "";
  for (var i = 0; i < private_key_string.length; i++) {
    var code = private_key_string.charCodeAt(i);
    if (code == 57) {
      private_key_number_string += String.fromCharCode(113);
    } else if (code < 75) {
      private_key_number_string += String.fromCharCode(code - 17);
    } else if (code > 74) {
      private_key_number_string += String.fromCharCode(code + 22);
    }
  }
  return bigInt(private_key_number_string, 27);
}
