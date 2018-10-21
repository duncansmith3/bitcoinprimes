const bApi = require('./lib/bitcoinapi');
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.listen(10000);

app.get('/primes', async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;
  if (!(/^\d{4}-\d{2}-\d{2}$/.test(startDate)) || !(/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
    return res.status(400).send('Please send dates in the form YYYY-MM-DD');
  }
  let startTime = (new Date(startDate)).getTime();
  let endTime = (new Date(endDate)).getTime();
  let details = await bApi.getPrimesBetween(startTime, endTime);;
  res.send(details);
});
