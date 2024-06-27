library(dplyr)

## data source url: https://www.usac.org/about/affordable-connectivity-program/acp-enrollment-and-claims-tracker/#enrollment-and-claims-by-zipcode-and-county
claim_urls <- c(
  'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Claims-by-Zip-January-December-2022.xlsx',
  'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Claims-by-Zip-January-December-2023.xlsx',
  'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Claims-by-Zip-January-April-2024.xlsx')


acp_claims_src <- lapply(claim_urls, function(claim_url){
  out <- rio::import(claim_url) %>%
    janitor::clean_names() 
  
  names(out)<-gsub("\\_","",names(out))
  
  
  out_tidy <- out %>% 
    select(
      zipcode,
      total_claimed_support = totalclaimedsupport,
      datamonth
    ) %>% 
    mutate(
      zipcode = stringr::str_pad(zipcode, 5, 'left', '0')
    ) %>% 
    tidyr::pivot_longer(
      cols = !c('zipcode', 'datamonth'), 
      names_to = 'variable',
      values_to = 'value'
    ) %>% 
    mutate(
      month = lubridate::month(datamonth), 
      year = lubridate::year(datamonth), 
    ) %>% 
    select(
      zipcode, 
      variable, 
      value, 
      month, 
      year
    )
  
  return(out_tidy)
}
) %>% 
  bind_rows()


codebook = data.frame(
  variable = 'total_claimed_support', description = 'Total claimed support as reported in the monthly ACP claims ZIP'
)

con <- cori.db::connect_to_db('proj_acp')
db_tbl <- cori.db::read_db(con, 'acp_dta_zip')

acp_claims_src <- acp_claims_src %>% 
    filter(
      zipcode %in% unique(db_tbl$zipcode)
    )

con <- cori.db::connect_to_db('proj_acp')
cori.db::write_db(con, 'acp_dta_zip', acp_claims_src, append = TRUE)
cori.db::write_db(con, 'codebook', codebook, append = TRUE)
DBI::dbDisconnect(con)

