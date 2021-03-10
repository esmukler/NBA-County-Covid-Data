// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 40, left: 60},
    width = 900 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

const colors = {
  defaultGray: '#CCC',
  defaultOrange: '#FA8320'
}

const formatTheData = (d) => ({
  ...d,
  date: d3.timeParse("%Y-%m-%d")(d['date']),
  caseIncAvg: parseFloat(d['case_inc_avg']),
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
          d3.select(this).attr("fill", d => d.color);
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
var svgLine = d3.select("#lines-graph")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

function renderTheData(data) {
  var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
    .key(d => d.team)
    .entries(data);

  // Add X axis --> it is a date format
  var x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([ 0, width ])

  svgLine.append("g")
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

  svgLine.append("g")
    .call(d3.axisLeft(y));

  // var res = sumstat.map(d => d.team) // list of group names
  // var color = d3.scaleOrdinal()
  //   .domain(res)
  //   .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

  // Add the lines
  const path = svgLine.selectAll(".line")
    .data(sumstat)
    .enter()
    .append("path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("class", d => `team-line ${d.key}`)
      // .attr("stroke", function(d){ return color(d.team) })
      .attr("stroke-width", 1.5)
      .attr("d", function(d) {
          return d3.line()
            .x(d => x(d.date))
            .y(d => y(d.caseIncAvg))
            (d.values)
        })

  // highlight closest line
  function getClosestDatumToPoint(data, date, caseVal) {
    const datesAreOnSameDay = (first, second) =>
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate();

    const sameDayData = data.filter(row => datesAreOnSameDay(row.date, date));

    let bestDatum;
    let bestDiff;
    sameDayData.forEach(row => {
      const diff = Math.abs(row.caseIncAvg - caseVal);
      if (!bestDatum || diff < bestDiff) {
        bestDiff = diff;
        bestDatum = row;
      }
    });
    return bestDatum;
  };

  // create focus element
  const focus = svgLine.append("g")
    .style("display", "none");

  // append the circle at the intersection
  focus.append("circle")
    .attr("class", "focus")
    .style("fill", "none")
    .style("stroke", "blue")
    .attr("r", 4);

  // append the rectangle to capture mouse
  svgLine.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", "none"); })
    .on("mousemove", mousemove);

  function mousemove() {
    const [currentX, currentY] = d3.mouse(this);
    var x0 = x.invert(currentX);
    var y0 = y.invert(currentY);
    var closestRow = getClosestDatumToPoint(data, x0, y0);

    function match(row, datum) {
      return row.county === datum.values[0].county && row.state === datum.values[0].state;
    }

    path
      .style("stroke", d => match(closestRow, d) ? d.values[0].color : colors.defaultGray)
      .style("stroke-width", d => match(closestRow, d) ? 2 : 1.5)
      .filter(d => match(closestRow, d))
      .raise(); // bring to the foreground over other paths

    focus.select("circle.focus")
      .attr("transform", "translate(" + x(closestRow.date) + "," + y(closestRow.caseIncAvg) + ")");
  }
}

d3.csv("data/case_inc_avg.csv", formatTheData, renderTheData);
