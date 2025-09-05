library(DBI)
library(cori.db)
library(dplyr)
library(tidyverse)

data_dir <- here::here("data")
s3_bucket_name <- "proj-acp"
s3_prefix <- "dev"
out_dir <- paste0(data_dir, "/", s3_prefix )

if (! dir.exists(data_dir)) dir.create(data_dir)
if (! dir.exists(out_dir)) dir.create(out_dir)

con <- cori.db::connect_to_db('proj_acp')
acp_codebook <- cori.db::read_db(con, 'codebook')
acp_dta_zip_tidy <- cori.db::read_db(con, 'acp_dta_zip')

# Separate eligible and subscribed data for proper pivot
eligible_data <- acp_dta_zip_tidy |>
  filter(variable == "eligible") |>
  select(zipcode, eligible = value)

subscribed_data <- acp_dta_zip_tidy |>
  filter(variable == "subscribed") |>
  select(zipcode, month, year, subscribed = value)

# Join to create data frame with zipcode, month, year, eligible, subscribed columns
acp_dta_zip_wide <- subscribed_data |>
  left_join(eligible_data, by = "zipcode") |>
  select(zipcode, month, year, eligible, subscribed) |>
  arrange(zipcode, year, month)

cori.db::write_db(con, 'acp_dta_zip_wide', acp_dta_zip_wide, overwrite = TRUE)
DBI::dbDisconnect(con)

acp_dta_zip_release <- acp_dta_zip_wide |>
  mutate(
    percent = ifelse(eligible == 0, NA, subscribed / eligible),
    change_subscribed = (subscribed - lag(subscribed)),
    change_percent = (subscribed/lag(subscribed) - 1)
  ) |>
  # # Compare these numbers to data in draft_acp_dta_zip...
  # left_join(draft_acp_dta_zip |>
  #   mutate(
  #     month = stringr::str_pad(month, 2, 'left', '0'),
  #     year = as.character(year)
  #   ), by = c("zipcode", "month", "year")
  # ) |>
  select(
    zipcode,
    month,
    year,
    eligible,
    subscribed,
    percent,
    change_subscribed,
    change_percent
  )


## create codebook -----

acp_codebook <- data.frame(
  'variable' = c(
    'zipcode',
    'month',
    'year',
    'eligible', 
    'subscribed',
    'percent',
    'change_subscribed',
    'change_percent'
  ), 
  'description' = c(
    'zipcode associated with acp subscribers and elibility estimates',
    'month of data update',
    'year of data',
    'eligible households as estimated by the RuralLisc method', 
    'households subscribed to ACP in then year/month', 
    'subscribed / eligible',
    'count difference between then month-year "subscribed" and base month-year subscribed" (diff in relative to Jan 2022 )',
    'percentage point difference between then month-year "percent" and base month-year "percent"(diff in relative to Jan 2022 )'
  )
)


write_csv(acp_dta_zip_release, paste0(out_dir, "/acp_dta_zip_release.csv"))
write_csv(acp_codebook, paste0(out_dir, "/acp_dta_codebook.csv"))

cori.db::put_s3_objects_recursive(s3_bucket_name, s3_prefix, out_dir)
