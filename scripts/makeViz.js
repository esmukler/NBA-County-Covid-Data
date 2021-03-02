// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 40, left: 60},
    width = 460 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("data/case_inc_avg.csv",

  // massage the data
  (d) => ({
    date: d3.timeParse("%Y-%m-%d")(d['Date']),
    caseIncAvg: parseFloat(d['New Case Daily Avg/100K']),
    team: d['Team'],
  }),

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
