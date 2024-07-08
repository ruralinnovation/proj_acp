## prompt: Check participation rate range

library(dplyr)
con <- cori.db::connect_to_db('proj_acp')
dta <- cori.db::read_db(con, 'acp_dta_zip')


## check when it's above 100
nrow(dta %>% 
  filter(
    variable == 'percent'
  ) %>% filter( value > 100))
