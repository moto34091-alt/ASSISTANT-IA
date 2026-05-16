function wick(c){

  return {
    upper: 1,
    lower: 2,
    hammer: true,
    star: false
  };
}

function patterns(c1,c2,c3){

  return {
    morningStar: true,
    eveningStar: false
  };
}

module.exports = {
  wick,
  patterns
};
