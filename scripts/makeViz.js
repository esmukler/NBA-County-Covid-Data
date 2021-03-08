// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 40, left: 60},
    width = 900 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

const colors = {
  defaultGray: '#CCC',
  defaultOrange: '#FA8320'
}

const formatTheData = (d) => ({
  date: d3.timeParse("%Y-%m-%d")(d['Date']),
  caseIncAvg: parseFloat(d['New Case Daily Avg/100K']),
  team: d['Team'],
  county: d['County'],
  state: d['State'],
});

// append the svg object to the body of the page
var svgBar = d3.select("#bar-graph")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Define the div for the tooltip
var tooltipDiv = d3.select("#bar-graph")
  .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Parse the Data
d3.csv("./data/case_inc_avg.csv", formatTheData,

function(err, rawData) {
  if (err) throw(err);

  const mostRecentData = {};
  rawData.forEach(d => {
    const existing = mostRecentData[d.team];
    if (!existing || d.date >= existing.date) {
      mostRecentData[d.team] = d;
    }
  });
  data = Object.values(mostRecentData);

  data.sort((a, b) => b.caseIncAvg - a.caseIncAvg);


  // X axis
  const maxCaseAvg = d3.max(data.map(d => d.caseIncAvg));
  const x = d3.scaleLinear()
    .domain([0, maxCaseAvg * 1.10])
    .range([0, width]);
  svgBar.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))

  // Y axis
  var y = d3.scaleBand()
    .domain(data.map(d => d.team))
    .range([ 0, height ])
    .padding(0.2);
  svgBar.append("g")
    .call(d3.axisLeft(y));

  // Bars
  svgBar.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
      .attr("class", d => d.team)
      .attr("x", () => x(0) + 1 )
      .attr("y", d => y(d.team))
      .attr("width", d => x(d.caseIncAvg))
      .attr("height", y.bandwidth())
      .attr("fill", colors.defaultGray)
      .on("mouseover", function(d) {
          d3.select(this).attr("fill", colors.defaultOrange);
          tooltipDiv.transition()
              .duration(200)
              .style("opacity", .9);
          tooltipDiv.html(d.caseIncAvg + "<br/>"  + d.team + "<br/>" + d.county + " County")
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
          })
      .on("mouseout", function(d) {
          d3.select(this).attr("fill", colors.defaultGray);
          tooltipDiv.transition()
              .duration(200)
              .style("opacity", 0);
      });
})

// append the svg object to the body of the page
var svg = d3.select("#lines-graph")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("data/case_inc_avg.csv", formatTheData,

// Now I can use this dataset:
function(data) {
  var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
    .key(d => d.team)
    .entries(data);

  // Add X axis --> it is a date format
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.date; }))
    .range([ 0, width ])

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b %e')))
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr('transform', 'rotate(-65)');

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return +d.caseIncAvg; })])
    .range([ height, 0 ]);

  svg.append("g")
    .call(d3.axisLeft(y));

  // var res = sumstat.map(d => d.team) // list of group names
  // var color = d3.scaleOrdinal()
  //   .domain(res)
  //   .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

  // Add the line
  svg.selectAll(".line")
    .data(sumstat)
    .enter()
    .append("path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      // .attr("stroke", function(d){ return color(d.team) })
      .attr("stroke-width", 1.5)
      .attr("d", function(d) {
          return d3.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.caseIncAvg); })
            (d.values)
        })
})
