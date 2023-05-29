const express = require('express');
const os = require('os');
const app = express();
const config = require('./config.json');

const stripeApiKeys = config.stripeApiKeys;
const PORT = config.PORT;

function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let alias of iface) {
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

function checkCC(number, month, year, cvv, req, res) {
  const randomKey = stripeApiKeys[Math.floor(Math.random() * stripeApiKeys.length)];
  const stripe = require('stripe')(randomKey);

  stripe.customers.create({
      email: 'customer@example.com',
    })
    .then(customer => {
      stripe.tokens.create({
        card: {
          number: number,
          exp_month: month,
          exp_year: year,
          cvc: cvv
        }
      }, function (err, token) {
        if (err) {
          res.status(200).json({ success: false, message: 'internal_error3' });
        } else {
          stripe.customers.createSource(
            customer.id, {
              source: token.id
            },
            function (err, card) {
              if (err) {
                stripe.customers.del(
                  customer.id
                );
                res.status(200).json({ success: false, message: err.raw.code });
              } else {
                stripe.customers.del(customer.id);
                res.status(200).json({ success: true });
              }
            }
          );
        }
      });
    })
    .catch(error => {
      res.status(200).json({ success: false, message: 'internal_error1' });
    });
}

app.get('/:number/:month/:year/:cvv', (req, res) => {
  const number = req.params.number;
  const month = parseInt(req.params.month, 10);
  const year = parseInt(req.params.year, 10);
  const cvv = req.params.cvv;

  if (isNaN(number) || isNaN(month) || isNaN(year) || isNaN(cvv) ||
      number.length < 12 || number.length > 19 ||
      month < 1 || month > 12 ||
      year < 0 || year > 99 ||
      cvv.length < 3 || cvv.length > 4) {
    res.status(400).json({ success: false, message: 'Invalid input parameters' });
    return;
  }

  checkCC(number, month, year, cvv, req, res);
});

const banner = `   ___      _    _____         __  ___                  
  / __\\   _| |__|___ / _ __ /\\ \\ \\/ _ \\__   ____ _ ___  
 / / | | | | '_ \\ |_ \\| '__|  \\/ / | | \\ \\ / / _\` / __| 
/ /__| |_| | |_) |__) | | / /\\  /| |_| |\\ V / (_| \\__ \\ 
\\____/\\__, |_.__/____/|_| \\_\\ \\/  \\___/  \\_/ \\__,_|___/ 
      |___/                                             
`;

const telegram = 'Telegram: @Cyb3rN0vas';

app.listen(PORT, () => {
  const serverIP = getServerIP();
  console.log(banner);
  console.log(telegram);
  console.log(`Listening on ${PORT}`);
  console.log(`Usage: http://${serverIP}:${PORT}/1234123412341234/01/23/123`);
});
