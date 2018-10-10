function return_generated_outputs(private_key_string, formatted_private_key_string, address_string,
                                  word_list_string, coin_split_key_boolean) {
  if (window.in_worker) {
    self.postMessage(private_key_string + "|" + formatted_private_key_string + "|" + 
                     address_string + "|" + word_list_string + "|" + coin_split_key_boolean);
  } else {
    generate_paper_wallet(private_key_string, formatted_private_key_string,
                          address_string, word_list_string, coin_split_key_boolean);
    update_outputs(formatted_private_key_string, address_string, word_list_string, false);
  }
}

function delayed_generate_outputs(private_key_string, coin_split_key_boolean) {
  setTimeout(function() {
    worker_coin_generate_outputs(private_key_string, coin_split_key_boolean);
  }, 3000); // Prevent page from hangs
}

function return_decoded_private_key(private_key_string) {
  if (window.in_worker) {
    self.postMessage(private_key_string);
  } else {
    done_decoding_word_list(private_key_string);
  }
}

function delayed_decode_word_list(word_list_string) {
  setTimeout(function() {
    worker_coin_decode_word_list(word_list_string);
  }, 500); // Prevent page from hangs
}

window.in_worker = false;
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  window.in_worker = true;
}

if (window.in_worker) {
  self.addEventListener('message', function(e) {
    var parts_array = e.data.split("|");
    if (parts_array.length > 1) {
      var private_key_string = parts_array[0];
      var coin_split_key_boolean = (parts_array[1] == "true");
      worker_coin_generate_outputs(private_key_string, coin_split_key_boolean);
    } else {
      var word_list_string = parts_array[0];
      worker_coin_decode_word_list(word_list_string);
    }
  }, false);
} else {
  if (window.private_key_to_worker_string) {
    var private_key_string = window.private_key_to_worker_string;
    window.private_key_to_worker_string = null;
    delayed_generate_outputs(private_key_string, coin_split_key());
  } else {
    var word_list_string = window.word_list_to_worker_string;
    window.word_list_to_worker_string = null;
    delayed_decode_word_list(word_list_string);
  }
}
