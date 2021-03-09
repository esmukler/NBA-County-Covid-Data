import csv
import requests
import os

nyt_counties_url = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties-recent.csv'
col_keys = ['team', 'county', 'state', 'date', 'case_inc_avg']

with requests.Session() as s:
    download = s.get(nyt_counties_url)

    decoded_content = download.content.decode('utf-8')

    cr = csv.DictReader(decoded_content.splitlines(), delimiter=',')
    county_date_data = list(cr)


def match_county(county_date, team_county):
    if team_county['county'] == 'New York City':
        return county_date['county'] == 'New York City'
    else:
        return county_date['fips'] == team_county['fips']


def final_row(cda):
    values = []
    for col_key in col_keys:
        values.append(cda[col_key])
    return values


def not_included(cda_list, cda):
    for check_cda in cda_list:
        if cda['team'] == check_cda['team'] and cda['date'] == check_cda['date']:
            return False

    return True


with open('data/counties.csv', newline='') as counties_csv:
    counties_reader = csv.DictReader(counties_csv)
    county_date_averages = []

    for team_county in counties_reader:
        county_dates = [cd for cd in county_date_data if match_county(cd, team_county)]
        county_pop = int(team_county['population'])

        for idx, county_date in enumerate(county_dates):
            if idx > 6:
                current_cases = int(county_date['cases'])
                last_weeks_cases = int(county_dates[idx - 7]['cases'])
                last_week_case_diff = current_cases - last_weeks_cases

                case_inc_avg = 100000 * (last_week_case_diff)/(7*county_pop)
                county_date_averages.append({
                    'county': county_date['county'],
                    'state': county_date['state'],
                    'date': county_date['date'],
                    'case_inc_avg': round(case_inc_avg, 2),
                    'team': team_county['team'],
                })

os.rename('data/case_inc_avg.csv', 'data/case_inc_avg_old.csv')

with open('data/case_inc_avg_old.csv') as old_csvfile:
    old_csvreader = csv.DictReader(old_csvfile)

    with open('data/case_inc_avg.csv', 'w', newline='\n') as new_csvfile:
        writer = csv.writer(new_csvfile, delimiter=',')
        writer.writerow(col_keys)

        old_rows = [old_cda for old_cda in old_csvreader if not_included(county_date_averages, old_cda)]

        for old_cda in old_rows:
            writer.writerow(final_row(old_cda))

        for cda in county_date_averages:
            writer.writerow(final_row(cda))
