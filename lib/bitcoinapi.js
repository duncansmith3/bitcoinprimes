const https = require('https');
const qs = require('querystring');
const cp = require('child_process');

function BitCoinAPI() {
  this.host = '' || 'https://api.gdax.com';
  this.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
  };
  this.prices = [];
  this.primes = [];
  this.init();
}

BitCoinAPI.prototype = {
  constructor: BitCoinAPI,
  getPrimesBetween: function(startTime, endTime) {
    return this.prices
             .filter(info => info.isPrime && startTime <= info.time && endTime >= info.time);
  },
  getPricesBetween: function(startDate, endDate) {
    if (!endDate) {
      return getPriceAt(startDate);
    }

    return new Promise(async (resolve, reject) => {
      try {
        startDate = startDate.substring(0, 10);
        endDate = endDate.substring(0, 10);
        let resultsURI = `${this.host}/products/BTC-USD/candles?start=${startDate}&end=${endDate}&granularity=86400`;
        let results = await httpsRequest(resultsURI, {headers: this.headers});
        resolve(results);
      } catch(err) {
        reject(err);
      }
    });
  },
  getPriceAt: function(date1) {
    return new Promise(async (resolve, reject) => {
    });
  },
  init: async function() {
    let now = new Date();
    let endDate = now.toISOString().split('T')[0];
    let startMonth = now.getMonth() - 5;
    let startYear = now.getFullYear() + (startMonth < 1 ? -1 : 0);
    startMonth = (startMonth + 12) % 12 || 12;
    let startDate = `${startYear}-${startMonth < 10 ? '0' : ''}${startMonth}-${endDate.split('-')[2]}`;
    let results = await this.getPricesBetween(startDate, endDate);
//    let results = [[1539907200, 6353.86, 6409.61, 6394.96, 6382.99, 3816.4853596300504]];
    this.prices = results
                    .map(dayInfo => { return {time: dayInfo[0]*1000, price: dayInfo[4], isPrime: null } });
    let maxPrice = Math.max.apply(null, this.prices.map(info => info.price));
    this.generatePrimes(maxPrice * 100);
  },
  generatePrimes: function(upperLimit) {
    console.log(upperLimit);
    upperLimit = Math.ceil(upperLimit || 20000) * 3;
    let pi = cp.fork('./lib/primeGenerator');
    pi.on('message', msg => {
      switch(msg.event) {
        case 'started':
          pi.send({event: 'generate', upperLimit: upperLimit});
          break;
        case 'prime':
          this.primes.push(msg.value);
          break;
        case 'done':
          this.setPricePrimes();
      }
    });
  },
  setPricePrimes: function() {
    let now = new Date().getTime();
    this.prices
      .map(info => {
        info.isPrime = this.checkIfPrime(info.price);
        return info;
      });
  },
  checkIfPrime: function(num) {
    let numPrimes = 0;
    let allDigits = num * 100;
    for (let i = 1, numLen = Math.ceil(Math.log10(allDigits)); i <= numLen; i++) {
      for (let j = 0; j < numLen - i+1; j++) {
        let digits = +(('' + allDigits).substring(j, j+i));
        if (this.primes.indexOf(digits) > -1) {
          numPrimes++;
        }
      }
    }
    return this.primes.indexOf(numPrimes) > -1;
  }
}

function httpsRequest(url, opts) {
  return new Promise((resolve, reject) => {
    opts = opts || {};
    let method = (opts.method || 'get').toUpperCase();
    let options = {method: method};
    let data = '';
    let urlArr = url.split('/');
    options.host = urlArr[2];
    options.port = '443';
    options.path = '/' + urlArr.slice(3).join('/');
    if (opts.headers) {
      options.headers = opts.headers;
    }
    options.headers = options.headers || {};
    if (opts.data) {
      data = qs.stringify(opts.data);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = https.request(options, res => {
      let body = '';

      res.on('data', chunk => { body += chunk });

      res.on('end', () => {
        let response = body;
        try {
          response = JSON.parse(body.trim());
        } catch(e) {
        }

        if (opts.returnResponse) {
          return resolve({body: response, response: res});
        }
        resolve(response);
      });
    });

    req.on('error', err => {
      if (opts.returnResponse) {
        return reject({body: body, response: err});
      }
      reject(err);
    });

    req.write(data);
    req.end();
  });
}
const bApi = new BitCoinAPI();
module.exports = bApi;
