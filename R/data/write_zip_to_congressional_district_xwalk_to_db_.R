## HUD crosswalk sourced here: https://www.huduser.gov/apps/public/uspscrosswalk/home
## ZIP-CD as of Q1 2022
library(dplyr)

xwalk <- readxl::read_excel("xwalk/zip_cd_032022.xlsx")

xwalk <- xwalk %>% 
  select(
    zipcode = ZIP, 
    congressional_district = CD
  )

con <- cori.db::connect_to_db('proj_acp')
cori.db::write_db(con, 'zip_to_congressional_district_xwalk', xwalk)
DBI::dbDisconnect(con)
