library(dplyr)
library(coriverse)


# load ACP data ----------------------------------------------------------------

con <- connect_to_db('proj_acp')
tables <- search_db_tables(con)
acp_db <- read_db(con, 'acp_dta_zip')
codebook <- read_db(con, 'codebook')
DBI::dbDisconnect(con)


# crosswalk zipcode to county and add rural def and persistent poverty flag ----

## load persistent poverty counties

con <- connect_to_db('rwjf')
persistent_pov_co <- read_db(con, 'persistent_poverty_counties')
DBI::dbDisconnect(con)

## load zip-to-county xwalk from HUD
hud_link <- 'https://www.huduser.gov/portal/datasets/usps/ZIP_COUNTY_122021.xlsx'
hud_fp <- file.path(tempdir(), 'ZIP_COUNTY_122021.xlsx')
download.file(hud_link, hud_fp, mode = 'wb')
xwalk_file <- readxl::read_excel(hud_fp)

## associate 1 county with every zipcode
zip_to_county_xwalk <- xwalk_file %>% 
  group_by(zip) %>% 
  slice_max(res_ratio, n = 1) %>% # keep only the county with the greatest share of zipcode residential addresses
  slice_max(tot_ratio, n = 1) %>% # 22 zipcodes don't have a larger portion of res addresses in a single county.  Now slice by all addresses
  ungroup() %>% # NOTE: two zipcodes (51603, 58325) do not have a greater portion of any address types in a single county
  select(
    zipcode = zip,
    geoid_co = county
  ) %>% 
  mutate(
    geoid_co = ifelse(geoid_co == '46113', '46102', geoid_co),
    geoid_co = ifelse(geoid_co == '02270', '02158', geoid_co),
    geoid_co = ifelse(geoid_co == '02261', '02066', geoid_co)
  )

## rural def for 2021 counties
rural_def_co <- tigris::counties(year = 2021) %>% 
  sf::st_drop_geometry() %>% 
  left_join(cori.utils::state_id_crosswalk %>% select(!state_name), by = c('STATEFP' = 'state_fips')) %>% 
  select(
    geoid_co = GEOID,
    name_co = NAME,
    state_abbr,
    geoid_cbsa = CBSAFP
  ) %>% 
  left_join(
    tigris::core_based_statistical_areas(year = 2021) %>% 
      sf::st_drop_geometry() %>% 
      select(
        geoid_cbsa = GEOID,
        rurality = LSAD
      ),
    by = 'geoid_cbsa'
  ) %>% 
  mutate(rural_def_2021 = case_when(
    rurality == 'M1' ~ 0,
    rurality == 'M2' ~ 1,
    is.na(rurality) ~ 1
  )) %>% 
  select(
    geoid_co,
    name_co,
    state_abbr,
    rural_def_2021
  ) %>% 
  mutate(persistent_pov_flag = ifelse(geoid_co %in% persistent_pov_co$geoid_co, 1, 0))

## join county rural def with ACP data
### NOTE: 730 zipcodes do not match with the HUD xwalk
acp_rural_def <- acp_db %>% 
  left_join(zip_to_county_xwalk, by = c('zipcode')) %>% 
  left_join(rural_def_co, by = 'geoid_co')


# Calc stats -------------------------------------------------------------------

## Program participation rate --------------------------------------------------

### national - monthly
participation_rate_us <- acp_rural_def %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year, month) %>% 
  summarise(
    subscribed = sum(subscribed, na.rm = TRUE),
    eligible = sum(eligible, na.rm = TRUE),
    pct_participation = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  tidyr::pivot_longer(cols = c(pct_participation, subscribed),
                      names_to = 'variable',
                      values_to = 'value') %>% 
  arrange(variable, year, month) %>% 
  mutate(
    location = 'US',
    variable = ifelse(variable == 'pct_participation', 'Participation Rate', 'Number of Subscribers')
  ) %>% 
  select(
    year,
    month,
    variable,
    location,
    value 
  )

### national - annual average
yearly_participation_rate_us <- acp_rural_def %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    subscribed = sum(subscribed, na.rm = TRUE) / length(unique(month)),
    eligible = sum(eligible, na.rm = TRUE) / length(unique(month)),
    pct_participation = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'US',
    variable = 'Average Participation Rate'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = pct_participation
  )

### rural - monthly
participation_rate_rural <- acp_rural_def %>% 
  filter(rural_def_2021 == 1) %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year, month) %>% 
  summarise(
    subscribed = sum(subscribed, na.rm = TRUE),
    eligible = sum(eligible, na.rm = TRUE),
    pct_participation = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  tidyr::pivot_longer(cols = c(pct_participation, subscribed),
                      names_to = 'variable',
                      values_to = 'value') %>% 
  arrange(variable, year, month) %>% 
  mutate(
    location = 'Zips in Rural Counties',
    variable = ifelse(variable == 'pct_participation', 'Participation Rate', 'Number of Subscribers')
  ) %>% 
  select(
    year,
    month,
    variable,
    location,
    value 
  )


### rural - annual average
yearly_participation_rate_rural <- acp_rural_def %>% 
  filter(rural_def_2021 == 1) %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    subscribed = sum(subscribed, na.rm = TRUE) / length(unique(month)),
    eligible = sum(eligible, na.rm = TRUE) / length(unique(month)),
    pct_participation = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'Zips in Rural Counties',
    variable = 'Average Participation Rate'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = pct_participation
  )


## Average monthly subscribers -------------------------------------------------

### national
avg_monthly_us <- acp_rural_def %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    subscribed = sum(subscribed, na.rm = TRUE) / length(unique(month)),
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'US',
    variable = 'Average Number of Subscribers'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = subscribed
  )
  

### rural
avg_monthly_rural <- acp_rural_def %>% 
  filter(rural_def_2021 == 1) %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    subscribed = sum(subscribed, na.rm = TRUE) / length(unique(month)),
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'Zips in Rural Counties',
    variable = 'Average Number of Subscribers'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = subscribed
  )


## Average annual claimed support ----------------------------------------------

### national
claimed_support_us <- acp_rural_def %>% 
  filter(variable %in% c('total_claimed_support')) %>% 
  filter(year == 2022 | year == 2023 | (year == 2024 & month %in% c(1, 2))) %>% # drop 2024 months after Feb
  rename(total_claimed_support = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    avg_claimed_support = sum(total_claimed_support, na.rm = TRUE) / length(unique(month)),
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'US',
    variable = 'Average Claimed Support'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = avg_claimed_support
  )

### rural
claimed_support_rural <- acp_rural_def %>% 
  filter(rural_def_2021 == 1) %>% 
  filter(variable %in% c('total_claimed_support')) %>% 
  filter(year == 2022 | year == 2023 | (year == 2024 & month %in% c(1, 2))) %>%  # drop 2024 months after Feb
  rename(total_claimed_support = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    avg_claimed_support = sum(total_claimed_support, na.rm = TRUE) / length(unique(month)),
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'Zips in Rural Counties',
    variable = 'Average Claimed Support'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = avg_claimed_support
  )


## persistent poverty ----------------------------------------------------------

### ppov - monthly subscribers and participation rate
participation_rate_pp <- acp_rural_def %>% 
  filter(persistent_pov_flag == 1) %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year, month) %>% 
  summarise(
    subscribed = sum(subscribed, na.rm = TRUE),
    eligible = sum(eligible, na.rm = TRUE),
    pct_participation = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  tidyr::pivot_longer(cols = c(pct_participation, subscribed),
                      names_to = 'variable',
                      values_to = 'value') %>% 
  arrange(variable, year, month) %>% 
  mutate(
    location = 'Zips in Persistent Poverty Counties',
    variable = ifelse(variable == 'pct_participation', 'Participation Rate', 'Number of Subscribers')
  ) %>% 
  select(
    year,
    month,
    variable,
    location,
    value 
  )

### annual average participation rate
yearly_participation_rate_pp <- acp_rural_def %>% 
  filter(persistent_pov_flag == 1) %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    subscribed = sum(subscribed, na.rm = TRUE) / length(unique(month)),
    eligible = sum(eligible, na.rm = TRUE) / length(unique(month)),
    pct_participation = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'Zips in Persistent Poverty Counties',
    variable = 'Average Participation Rate'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = pct_participation
  )


### avg monthly subscribers
avg_monthly_pp <- acp_rural_def %>% 
  filter(persistent_pov_flag == 1) %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    subscribed = sum(subscribed, na.rm = TRUE) / length(unique(month)),
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'Zips in Persistent Poverty Counties',
    variable = 'Average Number of Subscribers'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = subscribed
  )


### avg annual claimed support
claimed_support_pp <- acp_rural_def %>% 
  filter(persistent_pov_flag == 1) %>% 
  filter(variable %in% c('total_claimed_support')) %>% 
  filter(year == 2022 | year == 2023 | (year == 2024 & month %in% c(1, 2))) %>%  # drop 2024 months after Feb
  rename(total_claimed_support = value) %>% 
  group_by(year) %>% 
  summarise(
    n_months = length(unique(month)),
    avg_claimed_support = sum(total_claimed_support, na.rm = TRUE) / length(unique(month)),
  ) %>% 
  ungroup() %>% 
  mutate(
    location = 'Zips in Persistent Poverty Counties',
    variable = 'Average Claimed Support'
  ) %>% 
  select(
    year,
    variable,
    location,
    value = avg_claimed_support
  )


## Counties with largest changes throughout program's existence ----------------

### Participation rates --------------------------------------------------------

#### national
top10_change_participation_rate_us <- acp_rural_def %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(!is.na(geoid_co)) %>% 
  filter(variable %in% c('subscribed')) %>% 
  rename(subscribed = value) %>% 
  group_by(year, month, geoid_co, name_co, state_abbr) %>%
  summarise(
    subscribed = sum(subscribed, na.rm = TRUE),
    eligible = sum(eligible, na.rm = TRUE),
    participation_rate = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  filter((year == '2022' & month == '01') | (year == '2024' & month == '02')) %>% 
  mutate(month = ifelse(month == '01', 'jan22', 'feb24')) %>% 
  tidyr::pivot_wider(id_cols = c(geoid_co, name_co, state_abbr),
                     names_from = month,
                     values_from = participation_rate,
                     names_glue = '{.value}_{month}') %>% 
  mutate(participation_rate_change = participation_rate_feb24 - participation_rate_jan22) %>% 
  slice_max(participation_rate_change, n = 10) %>% 
  mutate(
    change_rank_among_counties_in_location = row_number(),
    location = 'US'
  )

#### rural
top10_change_participation_rate_rural <- acp_rural_def %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(!is.na(geoid_co)) %>% 
  filter(variable %in% c('subscribed')) %>% 
  filter(rural_def_2021 == 1) %>% 
  rename(subscribed = value) %>% 
  group_by(year, month, geoid_co, name_co, state_abbr) %>%
  summarise(
    subscribed = sum(subscribed, na.rm = TRUE),
    eligible = sum(eligible, na.rm = TRUE),
    participation_rate = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  filter((year == '2022' & month == '01') | (year == '2024' & month == '02')) %>% 
  mutate(month = ifelse(month == '01', 'jan22', 'feb24')) %>% 
  tidyr::pivot_wider(id_cols = c(geoid_co, name_co, state_abbr),
                     names_from = month,
                     values_from = participation_rate,
                     names_glue = '{.value}_{month}') %>% 
  mutate(participation_rate_change = participation_rate_feb24 - participation_rate_jan22) %>% 
  slice_max(participation_rate_change, n = 10) %>% 
  mutate(
    change_rank_among_counties_in_location = row_number(),
    location = 'Zips in Rural Counties'
  )

#### persistent poverty
top10_change_participation_rate_pp <- acp_rural_def %>% 
  left_join(filter(., variable == 'eligible') %>% 
              select(zipcode, eligible = value),
            by = 'zipcode') %>% 
  filter(!is.na(geoid_co)) %>% 
  filter(variable %in% c('subscribed')) %>% 
  filter(persistent_pov_flag == 1) %>% 
  rename(subscribed = value) %>% 
  group_by(year, month, geoid_co, name_co, state_abbr) %>%
  summarise(
    subscribed = sum(subscribed, na.rm = TRUE),
    eligible = sum(eligible, na.rm = TRUE),
    participation_rate = subscribed / eligible
  ) %>% 
  ungroup() %>% 
  filter((year == '2022' & month == '01') | (year == '2024' & month == '02')) %>% 
  mutate(month = ifelse(month == '01', 'jan22', 'feb24')) %>% 
  tidyr::pivot_wider(id_cols = c(geoid_co, name_co, state_abbr),
                     names_from = month,
                     values_from = participation_rate,
                     names_glue = '{.value}_{month}') %>% 
  mutate(participation_rate_change = participation_rate_feb24 - participation_rate_jan22) %>% 
  slice_max(participation_rate_change, n = 10) %>% 
  mutate(
    change_rank_among_counties_in_location = row_number(),
    location = 'Zips in Persistent Poverty Counties'
  )


### Average Support ------------------------------------------------------------

### national
top10_change_claimed_support_us <- acp_rural_def %>% 
  filter(variable %in% c('total_claimed_support')) %>% 
  filter((year == '2022' & month == '1') | (year == '2024' & month == '2')) %>% 
  group_by(year, month, geoid_co, name_co, state_abbr) %>%
  summarise(
    total_claimed_support = sum(value, na.rm = TRUE)
  ) %>% 
  ungroup() %>% 
  mutate(month = ifelse(month == '1', 'jan22', 'feb24')) %>% 
  tidyr::pivot_wider(id_cols = c(geoid_co, name_co, state_abbr),
                     names_from = month,
                     values_from = total_claimed_support,
                     names_glue = '{.value}_{month}') %>% 
  mutate(pct_change_total_claimed_support = (total_claimed_support_feb24 - total_claimed_support_jan22) / total_claimed_support_jan22) %>% 
  slice_max(pct_change_total_claimed_support, n = 10) %>% 
  mutate(
    change_rank_among_counties_in_location = row_number(),
    location = 'US'
  )

### rural
top10_change_claimed_support_rural <- acp_rural_def %>% 
  filter(variable %in% c('total_claimed_support')) %>% 
  filter((year == '2022' & month == '1') | (year == '2024' & month == '2')) %>% 
  filter(rural_def_2021 == 1) %>% 
  group_by(year, month, geoid_co, name_co, state_abbr) %>%
  summarise(
    total_claimed_support = sum(value, na.rm = TRUE)
  ) %>% 
  ungroup() %>% 
  mutate(month = ifelse(month == '1', 'jan22', 'feb24')) %>% 
  tidyr::pivot_wider(id_cols = c(geoid_co, name_co, state_abbr),
                     names_from = month,
                     values_from = total_claimed_support,
                     names_glue = '{.value}_{month}') %>% 
  mutate(pct_change_total_claimed_support = (total_claimed_support_feb24 - total_claimed_support_jan22) / total_claimed_support_jan22) %>% 
  slice_max(pct_change_total_claimed_support, n = 10) %>% 
  mutate(
    change_rank_among_counties_in_location = row_number(),
    location = 'Zips in Rural Counties'
  )

### persistent poverty
top10_change_claimed_support_pp <- acp_rural_def %>% 
  filter(variable %in% c('total_claimed_support')) %>% 
  filter((year == '2022' & month == '1') | (year == '2024' & month == '2')) %>% 
  filter(persistent_pov_flag == 1) %>% 
  group_by(year, month, geoid_co, name_co, state_abbr) %>%
  summarise(
    total_claimed_support = sum(value, na.rm = TRUE)
  ) %>% 
  ungroup() %>% 
  mutate(month = ifelse(month == '1', 'jan22', 'feb24')) %>% 
  tidyr::pivot_wider(id_cols = c(geoid_co, name_co, state_abbr),
                     names_from = month,
                     values_from = total_claimed_support,
                     names_glue = '{.value}_{month}') %>% 
  mutate(pct_change_total_claimed_support = (total_claimed_support_feb24 - total_claimed_support_jan22) / total_claimed_support_jan22) %>% 
  slice_max(pct_change_total_claimed_support, n = 10) %>% 
  mutate(
    change_rank_among_counties_in_location = row_number(),
    location = 'Zips in Persistent Poverty Counties'
  )


# join stats and write to sheets -----------------------------------------------

monthly_stats <- participation_rate_us %>% 
  bind_rows(
    participation_rate_rural,
    participation_rate_pp
  )

annual_stats <- yearly_participation_rate_us %>% 
  bind_rows(
    yearly_participation_rate_rural,
    yearly_participation_rate_pp,
    avg_monthly_us,
    avg_monthly_rural,
    avg_monthly_pp,
    claimed_support_us,
    claimed_support_rural,
    claimed_support_pp
  )

participation_rank_stats <- top10_change_participation_rate_us %>% 
  bind_rows(
    top10_change_participation_rate_rural,
    top10_change_participation_rate_pp
  ) %>% 
  select(location, change_rank_among_counties_in_location, everything())

claims_rank_stats <- top10_change_claimed_support_us %>% 
  bind_rows(
    top10_change_claimed_support_rural,
    top10_change_claimed_support_pp
  ) %>% 
  select(location, change_rank_among_counties_in_location, everything())


googlesheets4::sheet_write(data = annual_stats,
                           ss = 'https://docs.google.com/spreadsheets/d/1sKojrspXH0NgzOV2X9UpT0F6JHMckelLPPNpELJHVAc/edit?gid=0#gid=0',
                           sheet = 'Year Average stats')

googlesheets4::sheet_write(data = monthly_stats,
                           ss = 'https://docs.google.com/spreadsheets/d/1sKojrspXH0NgzOV2X9UpT0F6JHMckelLPPNpELJHVAc/edit?gid=0#gid=0',
                           sheet = 'Month stats')
        



