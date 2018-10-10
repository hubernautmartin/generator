function coin_name() { return "EOS"; }
function coin_dir() { return "eos"; }
function coin_private_key_name() { return "private key"; }
function coin_private_key_length() { return 64; }
function coin_color() { return "#443f54"; }
function coin_split_key() { return false; }

function coin_private_key_tokens() {
  var tokens_array = []
  for (var i = 0; i < 10; i++) {
    tokens_array.push(String.fromCharCode(48 + i));
  }
  for (var i = 0; i < 6; i++) {
    tokens_array.push(String.fromCharCode(65 + i));
  }
  return tokens_array;
}
