function coin_name() { return "IOTA"; }
function coin_dir() { return "iota"; }
function coin_private_key_name() { return "seed"; }
function coin_private_key_length() { return 81; }
function coin_color() { return "#696eb2"; }
function coin_split_key() { return true; }

function coin_private_key_tokens() {
  var tokens_array = []
  for (var i = 0; i < 26; i++) {
    tokens_array.push(String.fromCharCode(65 + i));
  }
  tokens_array.push('9');
  return tokens_array;
}
