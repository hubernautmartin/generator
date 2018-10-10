// === Initialization

window.done_now_boolean = false

EntropyCollector.start()

window.isIEx = /*@cc_on!@*/false || !!document.documentMode; // Internet Explorer 6-11
window.isIEe = !window.isIEx && !!window.StyleMedia; // or Edge 20+

// === Entropy collection

function update_entropy() {
  if (window.isIEe) {
    var number_of_events_integer = 212;
  } else {
    var number_of_events_integer = 96;
  }
  var percentage_report_integer = 20;

  var percentage_integer = Math.floor((EntropyCollector.eventsCaptured / number_of_events_integer) * 100);
  document.getElementById('entropy').innerHTML = percentage_integer;

  if (percentage_integer != window.last_percentage_integer &&
      percentage_integer % percentage_report_integer == 0) {
    if (percentage_integer == 100) {
      $.notify(percentage_integer + "%. All required randomness generated!", "success");
    } else {
      $.notify(percentage_integer + "% of required randomness generated!", "info");
    }
    window.last_percentage_integer = percentage_integer;
  }

  if (enough_entropy(number_of_events_integer) && !window.done_now_boolean) {
    var private_key_string = generate_random_private_key(number_of_events_integer);
    done_generating_private_key(private_key_string);
    window.done_now_boolean = true;
  }
}

function get_all_entropy() {
  var events_captured_integer = EntropyCollector.eventsCaptured;
  // Slice and start with an IE array, for... IE
  var entropy_array_IE = new Int32Array(EntropyCollector.buffer);
  // Take only the collected entropy. First is 0, so discard it.
  var entropy_array = Array.prototype.slice.call(entropy_array_IE, 1, events_captured_integer);
  if (entropy_array[0] == 0 || entropy_array[0] == entropy_array[events_captured_integer - 1]) {
    alert('IE Error! Check entropy');
  }
  return entropy_array;
}

function enough_entropy(required_events_integer) {
  return required_events_integer < EntropyCollector.eventsCaptured;
}

// === Private key generation

function generate_random_private_key() {
  var private_key_length_integer = coin_private_key_length();
  var private_key_tokens_array = coin_private_key_tokens();

  var entropy_array = get_all_entropy();
  var used_entropy_hash = {};
  var private_key_array = [];
  if (!window.isIEx && !window.isIEe && window.crypto && window.crypto.getRandomValues) {
    // Initialize randomizer with true randomness
    // Taking last mouse randomness as well as window.crypto and time.
    var rand_array = new Uint16Array(1);
    window.crypto.getRandomValues(rand_array);
    Math.seedrandom(entropy_array[entropy_array.length - 1] + (new Date()).getTime() + rand_array[0]);
  } else {
    // For IE we collected more entropy to compensate, just 
    // taking Math.random instead of crypto + same as above
    Math.seedrandom(entropy_array[entropy_array.length - 1] + (new Date()).getTime() + Math.random());
  }

  for (var i = 0; i < private_key_length_integer; i++) {
    // Append a random token to the key
    private_key_array.push(private_key_tokens_array[Math.floor(Math.random() * private_key_tokens_array.length)]);
    do {
      // Re-initialize the randomizer with a truely random int from
      // mouse entropy
      var random_index_integer = Math.floor(Math.random() * (entropy_array.length - 1));
      var new_entropy_seed_integer = entropy_array[random_index_integer];
    } while (used_entropy_hash[random_index_integer])
    used_entropy_hash[random_index_integer] = true;
    Math.seedrandom(new_entropy_seed_integer + Math.random());
  }

  var private_key_string = private_key_array.join("");

  return private_key_array.join("");
}

function done_generating_private_key(private_key_string) {
  EntropyCollector.stop();
  EntropyCollector.eventTarget.removeEventListener('mousemove', update_entropy);

  update_all_same_texts("Generating");
  load_and_start_generate_worker(private_key_string);
}

function update_all_same_texts(text_string) {
  generate_paper_wallet_text(text_string + " paper wallet...");
  update_outputs(text_string + " private key...", text_string + " receiving address...",
                 text_string + " word list...", true); 
}

// === Word lists and its calculus

function decode_words() {
  var words_string = document.getElementById("input_words").value;

  update_all_same_texts("Decoding");
  load_and_start_decode_worker(words_string);
}

function done_decoding_word_list(private_key_string) {
  if (private_key_string) {
    done_generating_private_key(private_key_string);
    $.notify("Words have been decoded!", "success");
    $.notify("Now generating derivatives!", "info");
  } else {
    $.notify("Could not decode words!", "error");
  }
}

// === Updating the UI

function update_outputs(formatted_private_key_string, address_string, words_string, disable_boolean) {
  disable_boolean = disable_boolean || false;

  document.getElementById("restart").innerHTML = '<a href="" onClick="window.location.reload()">Start again</a>.';
  document.getElementById('entropy').innerHTML = '100';

  var output = document.getElementById("output_private");
  output.innerHTML = formatted_private_key_string;

  var output_words = document.getElementById("output_words");
  output_words.innerHTML = words_string;

  var output_receiving = document.getElementById("output_receiving");
  output_receiving.innerHTML = address_string;

  document.getElementById("copy_button_private").disabled = disable_boolean;
  document.getElementById("copy_button_receiving").disabled = disable_boolean;
  document.getElementById("copy_button_words").disabled = disable_boolean;
  document.getElementById("print_button").disabled = disable_boolean;
}

// === Worker

function load_and_start_generate_worker(private_key_string) {
  window.private_key_to_worker_string = private_key_string;
  load_and_start_worker(private_key_string + "|" + coin_split_key());
}

function load_and_start_decode_worker(word_list_string) {
  window.word_list_to_worker_string = word_list_string;
  load_and_start_worker(word_list_string);
}

function load_and_start_worker(message) {
  if (typeof(Worker) !== "undefined" && /^http.*/.test(document.location.protocol)) {
    var worker = get_worker("javascript/worker_all.mini.js");
    worker.postMessage(message);
  } else {
    var tag = document.createElement("script");
    tag.type = 'text/javascript';
    tag.src = "javascript/worker_all.mini.js";
    document.head.appendChild(tag);
  }
}

function get_worker(worker_url) {
  var worker = new Worker(worker_url);

  worker.addEventListener('message', function(e) {
    var parts_array = e.data.split("|");
    var private_key_string = false
    if (parts_array[0] != "false") {
      private_key_string = parts_array[0]
    }
    if (parts_array.length > 1) {
      var formatted_private_key_string = parts_array[1];
      var address_string = parts_array[2];
      var word_list_string = parts_array[3];
      var coin_split_key_boolean = (parts_array[4] == "true");
      generate_paper_wallet(private_key_string, formatted_private_key_string, address_string,
                            word_list_string, coin_split_key_boolean);
      update_outputs(formatted_private_key_string, address_string, word_list_string);
    } else {
      done_decoding_word_list(private_key_string);
    }
  }, false);

  return worker;
}

// === Paper wallet

function generate_paper_wallet_text(text_string) {
  var image_canvas = document.getElementsByClassName('wallet_canvas')[0];
  var context = image_canvas.getContext('2d');
  context.clearRect(0, 0, image_canvas.width, image_canvas.height);
  context.font = "bold 120px sans-serif";
  context.textAlign = "center";
  context.fillText(text_string, 1840, 675);
}

function generate_paper_wallet_pre() {
  generate_paper_wallet("", "Your " + coin_name() + " " + coin_private_key_name() + " will appear after sufficient mouse movement", 
                        "Your receiving address will appear after sufficient mouse movement",
                        "Your wallet words will appear after sufficient mouse movement", false);
}

function generate_paper_wallet(private_key_string, formatted_private_key_string, address_string,
                               word_list_string, coin_split_key_boolean) {
  var words_array = word_list_string.split(" ");
  var key_slice_integer;
  var address_slice_integer;
  if (coin_split_key_boolean) {
    key_slice_integer = Math.ceil(formatted_private_key_string.length / 2);
    address_slice_integer = Math.ceil(address_string.length / 2);
  } else {
    key_slice_integer = formatted_private_key_string.length;
    address_slice_integer = address_string.length;
  }
  var image_canvas = document.getElementsByClassName('wallet_canvas')[0];
  var private_key_canvas = document.getElementsByClassName('private_key_qr_canvas')[0];
  var address_canvas = document.getElementsByClassName('address_qr_canvas')[0];

  new QRious({
    element: private_key_canvas,
    value: formatted_private_key_string,
    size: 900,
    backgroundAlpha: 0
  });

  new QRious({
    element: address_canvas,
    value: address_string,
    size: 900,
    backgroundAlpha: 0
  });

  var context = image_canvas.getContext('2d');
  context.clearRect(0, 0, image_canvas.width, image_canvas.height);

  var background = new Image;
  background.onload = function() {
    context.save();

    context.globalAlpha = 1.0;
    var pattern = context.createPattern(background, "repeat");
    context.rect(0, 0, image_canvas.width, image_canvas.height);
    context.fillStyle = pattern;
    context.fill();

    context.globalAlpha = 1.0;
    var blurs_sizes = [40, 15, 8, 4, 2]

    context.fillStyle = coin_color();
    context.textAlign = "left";
    context.font = "bold 140px sans-serif";
    context.shadowColor = "#000";
    for (var i = 0; i < blurs_sizes.length; i++) {
      context.shadowBlur = blurs_sizes[i];
      context.fillText("Your " + coin_name() + " " + coin_private_key_name(), 100, 200);
    }
    context.font = "bold 80px sans-serif";
    for (var i = 0; i < blurs_sizes.length; i++) {
      context.shadowBlur = blurs_sizes[i];
      context.fillText("Keep secure and do not show to others", 100, 300);
    }
    context.shadowBlur = 0;

    context.fillStyle = "#000";
    context.textAlign = "left";
    context.font = "normal 100px sans-serif";
    context.fillText(formatted_private_key_string.slice(0, key_slice_integer), 100, 470);
    context.fillText(formatted_private_key_string.slice(key_slice_integer, formatted_private_key_string.length), 100, 580);

    context.drawImage(private_key_canvas, 100, 650);

    context.fillStyle = coin_color();
    context.textAlign = "left";
    context.font = "bold 80px sans-serif";
    for (var i = 0; i < blurs_sizes.length; i++) {
      context.shadowBlur = blurs_sizes[i];
      context.fillText("Wallet words", 1080, 710);
    }
    context.font = "normal 80px sans-serif";
    for (var i = 0; i < blurs_sizes.length; i++) {
      context.shadowBlur = blurs_sizes[i];
      context.fillText("Enter at: http://GeneratePaperWallet.com/" + coin_dir() + "/", 1080, 810);
      context.fillText("to restore " + coin_private_key_name(), 1080, 900);
    }
    context.shadowBlur = 0;

    context.fillStyle = "#000";
    context.font = "normal 80px sans-serif";
    var jump = 4;
    var pixJump = 90;
    for (var i = 0; i * jump < words_array.length; i += 1) {
      context.fillText(words_array.slice(i * jump, i * jump + jump).join(" "), 1080, 1060 + i * pixJump);
    }

    context.fillStyle = coin_color();
    context.textAlign = "right";
    context.font = "bold 80px sans-serif";
    context.shadowColor = "#000";
    for (var i = 0; i < blurs_sizes.length; i++) {
      context.shadowBlur = blurs_sizes[i];
      context.fillText("Receiving address", 2610, 1915);
    }
    context.shadowBlur = 0;

    context.fillStyle = "#000";
    context.textAlign = "right";
    context.font = "normal 100px sans-serif";
    context.fillText(address_string.slice(0, address_slice_integer), 3580, 2060);
    context.fillText(address_string.slice(address_slice_integer, address_string.length), 3580, 2170);

    context.drawImage(address_canvas, 2680, 1020);
  };
  background.src = "images/paper_background.png";
}
