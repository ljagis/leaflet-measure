// NOTE. inspired from https://github.com/taijinlee/humanize
export function numberFormat(number, decimals = 2, decPoint = '.', thousandsSep = ',') {
  const sign = number < 0 ? '-' : '';
  const num = Math.abs(+number || 0);
  const intPart = parseInt(num.toFixed(decimals), 10) + '';
  const j = intPart.length > 3 ? intPart.length % 3 : 0;

  return [
    sign,
    j ? intPart.substr(0, j) + thousandsSep : '',
    intPart.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousandsSep),
    decimals
      ? `${decPoint}${Math.abs(num - intPart)
          .toFixed(decimals)
          .slice(2)}`
      : ''
  ].join('');
}
