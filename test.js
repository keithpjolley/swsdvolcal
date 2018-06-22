const express = require('express')
const app = express()

// https://github.com/d3/d3-fetch/issues/19
if (typeof fetch !== 'function') {
  global.fetch = require('node-fetch-polyfill');
}
const text = require('d3-fetch').text;
var me = "";

text("file://./test.js")
  .then(data => me = data)
  .catch(err => console.log(err));

app.get('/', (req, res) => res.send(me))

app.listen(3000, () => console.log('Example app listening on port 3000!'))
