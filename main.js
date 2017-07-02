function update(data) {
  x.domain(data.map(function(d) { return d.count; }));
  y.domain([0, d3.max(data, function(d) { return d.probability; })]);

  g.select('.axis.axis--x').transition().duration(300).call(xAxis);
  g.select(".axis.axis--y").transition().duration(300).call(yAxis);

  var bars = g.selectAll(".bar").data(data, function(d) {
      return d.count;
  })

  // REMOVE
  bars.exit()
    .transition()
      .duration(300)
    .attr("y", y(0))
    .attr("height", height - y(0))
    .style('fill-opacity', 1e-6)
    .remove();

  // ENTER
  bars.enter().append("rect")
      .attr("class", "bar")
      .attr("y", y(0))
      .attr("height", height - y(0))
  // UPDATE + ENTER
    .merge(bars)
      .transition()
        .duration(300)
      .attr("x", function(d) { return x(d.count); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.probability); })
      .attr("height", function(d) { return height - y(d.probability); });

  var labels = g.selectAll(".label").data(data, function(d) {
      return d.count;
  })

  // REMOVE
  labels.exit()
    .transition()
      .duration(300)
    .attr("y", y(0))
    .style('fill-opacity', 1e-6)
    .remove();

  // ENTER
  labels.enter().append("text")
      .attr("class", "label")
      .attr("y", y(0))
      .attr("dy", "1.5em")
      .attr("text-anchor", "middle")
  // UPDATE + ENTER
    .merge(labels)
      .transition()
        .duration(300)
      .attr("x", function(d) { return x(d.count) + x.bandwidth() / 2; })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.probability); })
      .text(function(d) {
        if (height - y(d.probability) < 20) {
          return "";
        } else {
          return (d.probability * 100).toFixed(0) + "%";
        }
      })
}

function refreshdata() {
  update(getdata());
}

var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
    y = d3.scaleLinear().rangeRound([height, 0]);

var xAxis = d3.axisBottom(x);

var yAxis = d3.axisLeft(y).ticks(10, "%");

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

g.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis)
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Probability");

$(function() {
  refreshdata();

  $('input, select').change(refreshdata);
});
