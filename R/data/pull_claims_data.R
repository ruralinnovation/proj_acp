library(dplyr)
library(rio)

s3_bucket_name <- "proj-acp"
s3_prefix <- "raw"
local_dir <- here::here("inst/ext_data")

if (! file.exists("data")) dir.create("data")
if (! file.exists(local_dir)) dir.create(local_dir, recursive = TRUE, showWarnings = FALSE)

# ## data source url: https://www.usac.org/about/affordable-connectivity-program/acp-enrollment-and-claims-tracker/#enrollment-and-claims-by-zipcode-and-county
# claims_uris <- c(
#   'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Claims-by-Zip-January-December-2022.xlsx',
#   'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Claims-by-Zip-January-December-2023.xlsx',
#   'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Claims-by-Zip-January-April-2024.xlsx')

claims_uris <- c(
  'ACP-Claims-by-Zip-January-December-2022.xlsx',
  'ACP-Claims-by-Zip-January-December-2023.xlsx',
  'ACP-Claims-by-Zip-January-April-2024.xlsx'
)


acp_claims_src <- lapply(claims_uris, function(claims_uri){

  s3_files <- cori.db::list_s3_objects(bucket_name = s3_bucket_name) %>%
    dplyr::filter(grepl(paste0("^", s3_prefix), key)) %>%
    dplyr::filter(grepl(claims_uri, key))

  xlsx_file <- lapply(
    s3_files$key, function(s3_key) {
      file <- paste0(local_dir, "/", s3_key)

      if (!file.exists(file)) {
        cori.db::get_s3_object(s3_bucket_name, s3_key, local_dir)
      }
      return(file)
    }
  )[[1]]

  message(paste0("Importing ", claims_uri))

  out <- rio::import(xlsx_file) %>%
    janitor::clean_names() 
  
  names(out) <- gsub("\\_","",names(out))
  
  View(out)
  
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
}) %>% 
  bind_rows()


codebook = data.frame(
  variable = 'total_claimed_support', 
  description = 'Total claimed support as reported in the monthly ACP claims ZIP'
)

con <- cori.db::connect_to_db('proj_acp')
db_tbl <- cori.db::read_db(con, 'acp_dta_zip')

acp_claims_src <- acp_claims_src %>% 
    filter(
      zipcode %in% unique(db_tbl$zipcode)
    )

con <- cori.db::connect_to_db('proj_acp')
# # TODO: THIS IS ALSO BAD!
# # We need to track which code created acp_dta_zip in the db (see import_dta.R)
# # Create a new table, please! 
# cori.db::write_db(con, 'acp_dta_zip', acp_claims_src, append = TRUE)
cori.db::write_db(con, 'acp_claims_src', acp_claims_src, append = TRUE)
# # TODO: Same here!
# cori.db::write_db(con, 'codebook', codebook, append = TRUE)
cori.db::write_db(con, 'acp_claims_codebook', codebook, append = TRUE)
DBI::dbDisconnect(con)

