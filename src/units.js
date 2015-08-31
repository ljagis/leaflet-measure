// units.js
// Unit configurations
// Factor is with respect to meters/sqmeters

module.exports = {
  acres: {
    factor: 0.00024711,
    display: 'Acres',
    decimals: 2
  },
  feet: {
    factor: 3.2808,
    display: 'Feet',
    decimals: 0
  },
  kilometers: {
    factor: 0.001,
    display: 'Kilometers',
    decimals: 2
  },
  hectares: {
    factor: 0.0001,
    display: 'Hectares',
    decimals: 2
  },
  meters: {
    factor: 1,
    display: 'Meters',
    decimals: 0
  },
  miles: {
    factor: 3.2808 / 5280,
    display: 'Miles',
    decimals: 2
  },
  sqfeet: {
    factor: 10.7639,
    display: 'Sq Feet',
    decimals: 0
  },
  sqmeters: {
    factor: 1,
    display: 'Sq Meters',
    decimals: 0
  },
  sqmiles: {
    factor: 0.000000386102,
    display: 'Sq Miles',
    decimals: 2
  }
};