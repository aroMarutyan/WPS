export interface DBQuery {
  queryId: string;
  chatid: string;
  active: boolean;
  latestOfferId: string;
  query: string;
  filterParams: FilterParams;
}

export interface FilterParams {
  condition: Condition;
  is_shippable: boolean;
  max_sale_price: string;
  min_sale_price: string;
};

interface Condition {
  new: boolean;
  as_good_as_new: boolean;
  good: boolean;
  fair: boolean;
  has_given_it_all: boolean;
};
