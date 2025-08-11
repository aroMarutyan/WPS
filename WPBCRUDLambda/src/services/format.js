export function formatSearchToHTML(search) {
  const isActive = search.active ? 'Yes' : 'No';
  const condition = Array.from(search?.condition).join(', ');
  const minSalePrice = search.minSalePrice ? `\n<b>MIN SALE PRICE:</b> ${search.minSalePrice}` : '';
  const maxSalePrice = search.maxSalePrice ? `\n<b>MAX SALE PRICE:</b> ${search.maxSalePrice}` : '';
  const conditionText = `\n<b>CONDITION:</b> ${condition ? condition : 'All'}`;

  const mainText = `<b>ALIAS:</b> ${search.alias} \n<b>IS ACTIVE:</b> ${isActive} \n<b>SEARCH TERM:</b> ${search.searchTerm} \n<b>SEARCH ID:</b> ${search.searchId}`;
  const filters = `${minSalePrice} ${maxSalePrice} ${conditionText}`;

  return `${mainText} ${filters}`;
}

export function formatConditions(condition) {
  if (!condition) return new Set(['']);

  const validConditions = ['as_good_as_new', 'new', 'good', 'fair', 'has_given_it_all', 'all'];
  const conditionsArray = condition.split(',').map(condition => condition.trim());

  return new Set(conditionsArray.includes('all')
    ? ['']
    : conditionsArray.filter(condition => validConditions.includes(condition)));
}
