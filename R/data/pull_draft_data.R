library(dplyr)
library(rio)

s3_bucket_name <- "proj-acp"
s3_prefix <- "raw"
local_dir <- here::here("inst/ext_data")

if (! file.exists("data")) dir.create("data")
if (! file.exists(local_dir)) dir.create(local_dir, recursive = TRUE, showWarnings = FALSE)

zip_tl <- tigris::zctas(year = 2020) %>% 
  select(
    zipcode = GEOID20,
    geometry
  )

# ## data source url: https://www.usac.org/about/affordable-connectivity-program/acp-enrollment-and-claims-tracker/#enrollment-and-claims-by-zipcode-and-county
# enrollment_uris <- c(
#   'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-January-June-2022.xlsx',
#   'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-July-December-2022.xlsx',
#   'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-January-December-2023.xlsx',
#   'https://www.usac.org/wp-content/uploads/about/documents/acp/ACP-Households-by-Zip-January-February-8-2024.xlsx')

enrollment_uris <- c(
  'ACP-Households-by-Zip-January-June-2022.xlsx',
  'ACP-Households-by-Zip-July-December-2022.xlsx',
  'ACP-Households-by-Zip-January-December-2023.xlsx',
  'ACP-Households-by-Zip-January-February-8-2024.xlsx'
)

acp_enrollment_src <- lapply(enrollment_uris, function(enrollment_uri){

  s3_files <- cori.db::list_s3_objects(bucket_name = s3_bucket_name) %>%
    dplyr::filter(grepl(paste0("^", s3_prefix), key)) %>%
    dplyr::filter(grepl(enrollment_uri, key))

  xlsx_file <- lapply(
    s3_files$key, function(s3_key) {
      file <- paste0(local_dir, "/", s3_key)

      if (!file.exists(file)) {
        cori.db::get_s3_object(s3_bucket_name, s3_key, local_dir)
      }
      return(file)
    }
  )[[1]]

  out <- readxl::read_excel(
    xlsx_file,
    col_types = c(
      "date",     # datamonth
      "text",    # zip_code
      rep("guess", 10)  # other columns (adjust count as needed)
    )
  ) %>%
    janitor::clean_names() 
  
  names(out) <- gsub("\\_","",names(out))
  
  
  out <- out %>% 
    mutate(
      zipcode = stringr::str_pad(zipcode, 5, 'left', '0')
    )
  
  return(out)
}) %>% 
  bind_rows()

acp_enrollment_src$date = lubridate::as_date(acp_enrollment_src$datamonth)

draft_acp_dta_zip <- acp_enrollment_src %>% 
  arrange(date, zipcode) %>% 
  group_by(zipcode) %>% 
  mutate(
    pct_change_subscribers = (totalsubscribers/lag(totalsubscribers) - 1),
    year = lubridate::year(date), 
    month = lubridate::month(date)
  ) %>% 
  select(
    zipcode,
    month,
    year,
    date,
    totalsubscribers,
    pct_change_subscribers
  )

### filter for zips WITH tigerline geometry
out <- draft_acp_dta_zip %>% 
  filter(
    zipcode %in% zip_tl$zipcode
  ) |>
arrange(zipcode, year, month)

### write draft data out -----

con <- cori.db::connect_to_db('proj_acp')
cori.db::write_db(con, 'draft_acp_dta_zip', out)
DBI::dbDisconnect(con)

# scratch work ------------------------------------------------------------

## no geo
# zip_tl_nogeo <- zip_tl %>% sf::st_drop_geometry()


## check
# pct_zip_w_geo = nrow(acp_enrollment_src %>% filter(zipcode %in% zip_tl$zipcode)) / nrow(acp_enrollment_src)
     