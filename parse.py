import csv
import requests

nyt_counties_url = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties-recent.csv'

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


with open('data/counties.csv', newline='') as counties_csv:
    reader = csv.DictReader(counties_csv)
    county_date_averages = []

    for team_county in reader:
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

    with open('data/case_inc_avg.csv', 'w', newline='\n') as csvfile:
        writer = csv.writer(csvfile, delimiter=',')
        writer.writerow(['Team', 'County', 'State', 'Date', 'New Case Daily Avg/100K'])
        for cda in county_date_averages:
            writer.writerow([cda['team'], cda['county'], cda['state'], cda['date'], cda['case_inc_avg']])
