export function formatSearchToHTML(search) {
  const isActive = search.active ? 'Yes' : 'No';
  const minPrice = search.minPrice ? `\n<b>MIN PRICE:</b> ${search.minPrice}` : '';
  const maxPrice = search.maxPrice ? `\n<b>MAX PRICE:</b> ${search.maxPrice}` : '';
  const range = search.range ? `\n<b>RANGE:</b> ${search.range}` : '';
  const condition = Array.from(search?.condition).join(', ');
  const conditionText = `\n<b>CONDITION:</b> ${condition ? condition : 'All'}`;

  const mainText = `<b>ALIAS:</b> ${search.alias} \n<b>IS ACTIVE:</b> ${isActive} \n<b>SEARCH TERM:</b> ${search.searchTerm} \n<b>SEARCH ID:</b> ${search.searchId}`;
  const filters = `${minPrice} ${maxPrice} ${range} ${conditionText}`;

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
