process.on('message', msg => {
  switch(msg.event) {
    case 'generate':
      testUntil(msg.upperLimit);
  }
});

function ecppTest(num) {
  let isPrime = true;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      isPrime = false;
      break;
    }
  }
  return isPrime;
}

function testUntil(upperLimit) {
  let now = new Date().getTime();
  [...Array(upperLimit).keys()]
    .forEach(num => {
      if (num > 1 && ecppTest(num)) {
        process.send({event: 'prime', value: num});
      }
    });
  console.log('prime generation:', (new Date()).getTime() - now, 'ms');
  process.send({event: 'done'});
}

process.send({event: 'started'});
