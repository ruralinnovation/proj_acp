## HUD crosswalk sourced here: https://www.huduser.gov/apps/public/uspscrosswalk/home
## ZIP-CD as of Q1 2022
library(dplyr)

xwalk <- readxl::read_excel("xwalk/zip_county_032022.xlsx")

xwalk <- xwalk %>% 
  select(
    zipcode = ZIP, 
    county = COUNTY
  )

con <- cori.db::connect_to_db('proj_acp')
cori.db::write_db(con, 'zip_to_county_xwalk', xwalk)
DBI::dbDisconnect(con)
