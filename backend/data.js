async function getPrice(symbol) {

try {

const API_KEY = process.env.TWELVE_API_KEY;

const url =
`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;

const response = await fetch(url);
const data = await response.json();

if (!data || !data.price) return null;

return Number(data.price);

} catch (err) {

return null;

}

}

module.exports = { getPrice };
