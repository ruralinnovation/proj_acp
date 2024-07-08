library(dplyr)
library(cori.utils)

con <- cori.db::connect_to_db('proj_acp')
dta_cd <- cori.db::read_db(con, 'zip_to_congressional_district_xwalk')
dta_co <- cori.db::read_db(con, 'zip_to_county_xwalk')
acp_zips <- unique(cori.db::read_db(con, 'acp_dta_zip') %>% pull(zipcode))
DBI::dbDisconnect(con)

### pull names
cd <- tigris::congressional_districts(year = 2022) %>% sf::st_drop_geometry() %>% 
  select(
    congressional_district = GEOID20, 
    state_fips = STATEFP20, 
    CD118FP
  ) %>% 
  left_join(
    state_id_crosswalk, by = 'state_fips'
  ) %>% 
  filter( CD118FP!='ZZ') %>% 
  mutate(
    name_cd = paste0(state_abbr, '-', as.numeric(CD118FP))
  ) %>% 
  select(
    congressional_district, 
    name_cd
  )
## output State Abbr - CD#

counties <- tigris::counties(year = 2022) %>% sf::st_drop_geometry() %>% 
  select(
    county = GEOID, 
    name_co = NAME
  )


# collapse congressional districts ----------------------------------------

clean_cd <- dta_cd %>% 
  left_join(
    cd, by = 'congressional_district'
  )

no_cd <- clean_cd %>% 
  filter(
    is.na(name_cd)
  ) %>% 
  replace(is.na(.), '') %>% 
  select(
    zipcode, 
    cd_name = name_cd
  ) %>% 
  distinct()

w_cd <- clean_cd %>% 
  filter(!is.na(name_cd))


clean_cd <- w_cd %>% 
  group_by(
    zipcode
  ) %>% 
  summarise(
    cd_cnt = n(), 
    cd_name = paste(unique(name_cd), collapse = ', ')
  ) %>% 
  select(
    zipcode, 
    cd_name
  ) %>%
  bind_rows(
    no_cd %>% filter(!zipcode %in% w_cd$zipcode)
  )

# collapse counties -------------------------------------------------------

clean_co <- dta_co %>% 
  left_join(
    counties, by = 'county'
  )

no_co <- clean_co %>% 
  filter(
    is.na(name_co)
  ) %>% 
  replace(is.na(.), '') %>% 
  select(
    zipcode, 
    county_name = name_co
  ) %>% 
  distinct()

w_co <- clean_co %>% 
  filter(!is.na(name_co))


clean_co <- w_co %>% 
  group_by(
    zipcode
  ) %>% 
  summarise(
    co_cnt = n(), 
    county_name = paste(unique(name_co), collapse = ', ')
  ) %>% 
  select(
    zipcode, 
    county_name
  ) %>%
  bind_rows(
    no_co %>% filter(!zipcode %in% w_co$zipcode)
  )


# join --------------------------------------------------------------------

out <- data.frame(
  zipcode = acp_zips) %>% 
    left_join(
      clean_cd, by = 'zipcode'
    ) %>% 
    left_join(
      clean_co, by = 'zipcode'
    ) %>% 
  replace(is.na(.), '')

nrow(out %>% filter(cd_name ==''))
nrow(out %>% filter(county_name ==''))


# write to database -------------------------------------------------------

con <- cori.db::connect_to_db('proj_acp')
cori.db::write_db(con, 'zip_county_cd', out, overwrite = TRUE)
DBI::dbDisconnect(con)

