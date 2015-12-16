// Loads an external JS file and append it to the head, from:
// http://zcourts.com/2011/10/06/dynamically-requireinclude-a-javascript-file-into-a-page-and-be-notified-when-its-loaded
function require(file,callback){
  var head=document.getElementsByTagName("head")[0]; 
  var script=document.createElement('script');
  script.src=file; 
  script.type='text/javascript'; 
  // real browsers:
  script.onload=callback; 
  // MSIE:
  script.onreadystatechange = function() { 
    if (_this.readyState == 'complete') 
      callback();
  };
  head.appendChild(script); 
}



document.addEventListener('DOMContentLoaded', function () {
  function Donate() {
    return {
      stripeHandler: null,
      checkoutJSloaded: false,
      StripeCheckoutLoadRetries: 25,

      addEvent: function (el, type, handler) {
        // if (!el) {console.log("Element not defined"); return;}
        if (el.attachEvent) el.attachEvent('on' + type, handler);
        else el.addEventListener(type, handler);
      },

      jsSupported: function () {
        document.querySelector('body').className.replace(new RegExp('\\bnojs\\b', 'g'), '');
      },

      setupSubscriptionButtons: function () {
        var that = this;
        var subButtons = document.getElementById('subscription_buttons');
        var oneButtons = document.getElementById('oneoff_buttons');
        oneButtons.style.display = "block";
        subButtons.style.display = "none";
        this.addEvent(document.getElementById('type_subscription'), 'change', function (ev) {
          if (ev.target.checked) {
            subButtons.style.display = "block";
            oneButtons.style.display = "none";
            document.getElementById('amount_10').checked = true;
          }
        });

        this.addEvent(document.getElementById('type_oneoff'), 'change', function (ev) {
          if (ev.target.checked) {
            subButtons.style.display = "none";
            oneButtons.style.display = "block";
            document.getElementById('amount_50').checked = true;
          }
        });
      },

      uncheckOnOwnAmount: function () {
        this.addEvent(document.getElementById('amount_custom'), 'click', function (ev) {
          document.getElementById('custamt').checked = true;
        });
      },

      addCloseSupport: function () {
        this.addEvent(document.getElementById("donate-close"), 'click', function () {
          document.getElementById('donate-banner').style.display = "none";
        });
      },

      setupStripeHandler: function(callback) {
        var donate = this;
        var maxRetries = 25;
        if (donate.stripeHandler !== null){
          callback();
          return;
        }

        if (typeof(StripeCheckout)=='undefined'){
          donate.StripeCheckoutLoadRetries--;
          if (donate.StripeCheckoutLoadRetries > 0){
            if (typeof(console)!='undefined'  &&  typeof(console.log)!='undefined')
              console.log('wait 1 sec and recheck setup... '+donate.StripeCheckoutLoadRetries+' reload attempts left..');
            setTimeout(function(){ donate.setupStripeHandler(callback); }, 1000);
            return;
          }
        }
          
        
        var public_key = document.getElementById('stripe_public_key').value;

        donate.stripeHandler = StripeCheckout.configure({
          key: public_key,
          image: "https://archive.org/images/logo_arches.png",
          token: function (token) {
            // Use the token to create the charge with a server-side script.
            // You can access the token ID with `token.id`
            donationtype = document.querySelector(".donationtype input[name='type']:checked").value;
            amount = getDonationAmount(1);
            var formData = new FormData();
            formData.append('chargeToken', token.id);
            formData.append('email', token.email);
            formData.append('type', donationtype);
            formData.append('amount', amount);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "//archive.org/donate/stripeCharge.php", true);
            xhr.onreadystatechange = function () {
              if (xhr.readyState != 4 || xhr.status != 200) {
                // alert("We apologize but something went wrong.  Will you please try again?");
                return;
              }
              // alert("Success: " + xhr.responseText);
              data = JSON.parse(xhr.responseText);
              //console.log(data);
              if (data.status == "error") {
                if (data.error == "Error_Card") {
                  alert("We apologize but there was an error:\n" + data.error_details.message);
                } else {
                  alert("We apologize but something went wrong.  Will you please try again?");
                }
              } else {
                document.querySelector("#stripeComplete input[name='email']").value = token.email;
                document.querySelector("#stripeComplete input[name='type']").value = donationtype;
                document.querySelector("#stripeComplete input[name='amount']").value = amount;
                document.querySelector("#stripeComplete input[name='transaction_id']").value = data.transaction_id;
                // successful charge, redirect to thank you page...
                document.getElementById("stripeComplete").submit();
              }
            };

            xhr.send(formData);
          }
        });

        callback();
      },

      addStripeSupport: function () {
        // Stripe necessary script

        var public_key = document.getElementById('stripe_public_key').value;
        if (!public_key) {
          // console.log("Stripe public key not defined.");
          return;
        }
        var donate = this;

        var payWithStripe = function(description, panelLabel){
          var amount = getDonationAmount(1);
          if (amount == false)
            return;
          var cents = amount * 100;
          
          donate.setupStripeHandler(function(){
            donate.stripeHandler.open({
              image: "https://archive.org/images/logo_arches.png",
              name: "Internet Archive",
              description: description,
              amount: cents,
              panelLabel: panelLabel
            });
          });
        };
        var payWithStripe1 = function(){
          donate.checkoutJSloaded = true;
          payWithStripe("One Time Donation", "Donate {{amount}}");
          return false;
        };
        var payWithStripeM = function(){
          donate.checkoutJSloaded = true;
          payWithStripe("Monthly Donation", "Donate {{amount}} Monthly");
          return false;
        };
        
        
        // When clicked -- open Checkout with further options
        
        // ONLY include the JS  *on demand* (ie: user pressing a [Credit] button)
        // because Stripe loads and iframe and all sorts of resources from stripe.com
        // and their CDN and that would mean a "drive by" bugging of our IA users
        // just loading a page w/ a donation banner on it and nothing more.
        //    -tracey dec 2015
        this.addEvent(document.getElementById("stripeOneTime"), "click", function (e) {
          if (e.preventDefault) // IE, oh facepalm
            e.preventDefault();
          if (!donate.checkoutJSloaded){
            require("https://checkout.stripe.com/checkout.js", function(){
              return payWithStripe1();
            });
          }
          return payWithStripe1();
        });
        
        this.addEvent(document.getElementById("stripeMonthly"), "click", function (e) {
          if (e.preventDefault) // IE, oh facepalm
            e.preventDefault();
          if (!donate.checkoutJSloaded){
            require("https://checkout.stripe.com/checkout.js", function(){
              return payWithStripeM();
            });
          }
          return payWithStripeM();
        });
        
        // Close Checkout on page navigation
        this.addEvent(window, "popstate", function () {
          donate.setupStripeHandler(function(){
            donate.stripeHandler.close();
          });
        });
      }

    };
  }

  var d = new Donate();
  d.jsSupported();
  d.setupSubscriptionButtons();
  d.uncheckOnOwnAmount();
  d.addCloseSupport();
  d.addStripeSupport();

});

function getDonationAmount(i, service) {

  // regex the number from the string & return, else null
  function valid_int(val) {
    // only accept a number, possibly preceded by '$', and possibly containing a decimal
    var re = /^\$?\s*(\d+\.?\d*)\s*$/;
    var m;

    if ((m = re.exec(val)) !== null) {
      if (m.index === re.lastIndex) {
        re.lastIndex++;
      }
      // return the matched number group, parsed as Float
      return parseFloat(m[1]);
    }
    return null;
  }

  var v = document.querySelector("input[name=amount]:checked").value;
  if (v == null || v === '') {
    v = document.getElementById('amount_custom').value;
  }
  if (i != 3 && (v == null || v === '')) {
    alert('Please choose an amount for your donation!');
    return false;
  }
  // confirm only a number, no stray characters & not '0'
  v = valid_int(v);
  if (v == null || v == 0 || v == '0') {
    alert('Please choose a valid number for your donation!');
    return false;
  }
  var el = document.getElementById('a' + i);
  if (el) el.value = v; // for paypal
  return v;
}
