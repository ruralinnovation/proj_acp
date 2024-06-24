library(dplyr)


## data source url: https://www.usac.org/about/affordable-connectivity-program/acp-enrollment-and-claims-tracker/#enrollment-and-claims-by-zipcode-and-county


enrollment_urls <- c(
  'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-January-June-2022.xlsx',
  'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-July-December-2022.xlsx',
  'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-January-December-2023.xlsx',
  'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-January-February-8-2024.xlsx')


acp_enrollment_src <- lapply(enrollment_urls, function(enrollment_url){
  out <- rio::import(enrollment_url) %>%
    janitor::clean_names() 
  
  names(out)<-gsub("\\_","",names(out))
  
  
  out <- out %>% 
    select(
      zipcode,
      totalsubscribers,
      datamonth
    ) %>% 
    mutate(
      zipcode = stringr::str_pad(zipcode, 5, 'left', '0')
    )
  
  return(out)
}
) %>% 
  bind_rows()

acp_enrollment_src$date = lubridate::as_date(acp_enrollment_src$datamonth)

out <- acp_enrollment_src %>% 
  arrange(date, zipcode) %>% 
  group_by(zipcode) %>% 
  mutate(
    pct_change_subscribers = (totalsubscribers/lag(totalsubscribers) - 1),
    year = lubridate::year(date), 
    month = lubridate::month(date) 
    
    ) %>% 
  select(
    -datamonth
  )


zip_tl <- tigris::zctas(year = 2020) %>% 
  select(
    zipcode = GEOID20,
    geometry
  )

### filter for zips WITH tigerline geometry
out <- out %>% 
  filter(
    zipcode %in% zip_tl$zipcode
  )

### write draft data out -----

con <- cori.db::connect_to_db('proj_acp')
cori.db::write_db(con, 'draft_acp_dta_zip', out)
DBI::dbDisconnect(con)

# scratch work ------------------------------------------------------------

## no geo
# zip_tl_nogeo <- zip_tl %>% sf::st_drop_geometry()


## check
# pct_zip_w_geo = nrow(acp_enrollment_src %>% filter(zipcode %in% zip_tl$zipcode)) / nrow(acp_enrollment_src)
     