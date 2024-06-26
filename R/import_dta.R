library(dplyr)

d = sf::st_read("~/Downloads/acp_uptake_wide.gpkg",query="select * from acp_uptake_wide")
d_geo <- d %>% 
  select(
    zipcode = 'Zipcode',
    geom
  )


d_geo <- d %>% 
  select(
    zipcode = 'Zipcode',
    geom
  )

d_tidy <- d %>% 
  rename(zipcode = 'Zipcode') %>% 
  sf::st_drop_geometry() %>% 
  tidyr::pivot_longer(
    cols = !zipcode,
    names_to = 'variable',
    values_to = 'value',
  ) %>% 
  mutate(
    value = as.numeric(value),
    month = ifelse(variable == 'Eligible', NA, stringr::str_sub(variable, -5, -4)),
    year = ifelse(variable == 'Eligible', NA, stringr::str_sub(variable, -10, -7)), 
    variable = tolower(ifelse(variable == 'Eligible', variable, stringr::str_sub(variable, 1, -12)))
  )

# 
# example <- d_tidy %>% 
#   filter(
#     zipcode == '03585'
#   )

## create codebook -----

codebook <- data.frame(
  'variable' = c(
    'zipcode',
    'eligible', 
    'subscribed',
    'percent',
    'change_subscribed',
    'change_percent'
  ), 
  'description' = c(
    'zipcode associated with acp subscribers and elibility estimates',
    'eligible households as estimated by the RuralLisc method', 
    'households subscribed to ACP in then year/month', 
    'subscribed / eligible *100',
    'count difference between then month-year "subscribed" and base month-year subscribed" (diff in relative to Jan 2022 )',
    'percentage point difference between then month-year "percent" and base month-year "percent"(diff in relative to Jan 2022 )'
  )
)



# write out ---------------------------------------------------------------
con <- cori.db::connect_to_db('proj_acp')
cori.db::write_db(con, 'acp_dta_zip', d_tidy)
cori.db::write_db(con, 'codebook', codebook)
DBI::dbDisconnect(con)




### eligible: eligible households as estimated by the RuralLisc method - https://www.lisc.org/media/filer_public/13/4d/134d8f53-fe33-4ab9-b54b-5523c0193c80/acp_methodology_faqs_1_20_2023.pdf
### subscribed: households subscribed to ACP
### percent: subscribed / eligible *100
### change_subscribed: count difference between then month-year "subscribed" and base month-year subscribed" (diff in relative to Jan 2022 )
### change_percent: percentage point difference between then month-year "percent" and base month-year "percent"(diff in relative to Jan 2022 )

