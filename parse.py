import csv
import requests

nyt_counties_url = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties-recent.csv'

with requests.Session() as s:
    download = s.get(nyt_counties_url)

    decoded_content = download.content.decode('utf-8')

    cr = csv.DictReader(decoded_content.splitlines(), delimiter=',')
    county_date_data = list(cr)


def match(county_date, team_county):
    if team_county['county'] == 'New York City':
        return county_date['county'] == 'New York City'
    else:
        return county_date['fips'] == team_county['fips']


def get_case_inc_avg(team_county):
    return team_county['case_inc_avg']


with open('counties.csv', newline='') as counties_csv:
    reader = csv.DictReader(counties_csv)
    team_counties = []
    for team_county in reader:
        if team_county['team']:
            county_dates = [cd for cd in county_date_data if match(cd, team_county)]
            last_week_case_diff = int(county_dates[-1]['cases']) - int(county_dates[-7]['cases'])
            case_inc_avg = 100000 * (last_week_case_diff)/(7*int(team_county['population']))
            team_county['case_inc_avg'] = case_inc_avg
            # print(team_county['team'], team_county['county'], round(case_inc_avg, 2))
            team_counties.append(team_county)

    sortedlist = sorted(team_counties, key=get_case_inc_avg, reverse=True)

    with open('case_inc_avg.csv', 'w', newline='\n') as csvfile:
        writer = csv.writer(csvfile, delimiter=',')
        writer.writerow(['Team', 'County', 'Population', 'New Case Daily Avg/100K'])
        for tc in sortedlist:
            writer.writerow([tc['team'], tc['county'], tc['population'], get_case_inc_avg(tc)])
