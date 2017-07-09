function update(data) {
  // Update results section
  var average = data.reduce(function(sum, d) {
    return sum + d.probability * d.count;
  }, 0);
  $('#results-average').text(average.toFixed(2));

  var variance = data.reduce(function(sum, d) {
    return sum + d.probability * d.count * d.count;
  }, 0) - average * average;
  $('#results-std').text(Math.sqrt(variance).toFixed(2));


  // Update plot
  maxVisible = d3.max(data, function(d) {
    return d.probability > 0.001 ? d.count : 0;
  })
  data = data.filter(function(d) {
    return d.count <= maxVisible;
  });

  var width = parseInt(d3.select('#chart').style('width'), 10);
  width = width - margin.left - margin.right;
  var height = width * 0.75 - margin.top - margin.bottom;

  // Adjust size of svg
  svg.style('width', (width + margin.left + margin.right) + 'px')
  svg.style('height', (height + margin.top + margin.bottom) + 'px')

  // Adjust axis scales
  x.rangeRound([0, width]);
  y.rangeRound([height - 0.5, 0]);
  d3.select(".axis.axis--y")
      .call(yAxis);
  d3.select(".axis.axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Begin data update
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
      .on("mousemove", function(d) {
        var woundText = d.count == 1 ? " wound:" : " wounds:";
        var text = "Probability of doing<br>at least " + d.count + woundText;
        text = "<b>" + text + "</b>";
        text += "<br>";
        text += (d.total_probability * 100).toFixed(1) + "%";
        showTooltip(text);
      })
      .on("mouseout", hideTooltip)
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
      .attr("dy", "-0.25em")
      .attr("text-anchor", "middle")
  // UPDATE + ENTER
    .merge(labels)
      .transition()
        .duration(300)
      .attr("x", function(d) { return x(d.count) + x.bandwidth() / 2; })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.probability); })
      .text(function(d) {
        if (height - y(d.probability) < 1) {
          return "";
        } else {
          return (d.probability * 100).toFixed(0) + "%";
        }
      })
}

function refreshdata() {
  update(getdata());
}

function showTooltip(text) {
  tooltip.style("left", (d3.event.pageX + 10) + "px");
  tooltip.style("top", (d3.event.pageY - 25) + "px");
  tooltip.style("display", "inline-block");
  tooltip.html(text);;
}

function hideTooltip(d) {
  tooltip.style("display", "none");
}

var margin = {top: 20, right: 20, bottom: 30, left: 50};

var tooltip = d3.select("body")
  .append("div")
    .attr("class", "toolTip");

var svg = d3.select("#chart svg")

var x = d3.scaleBand().padding(0.1);
var y = d3.scaleLinear();

var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y).ticks(10, "%");

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

g.append("g")
    .attr("class", "axis axis--x");

g.append("g")
    .attr("class", "axis axis--y")
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .attr("fill", "#000")
    .text("Probability");

$(function() {
  refreshdata();

  $('input, select').change(refreshdata);
  $(window).resize(refreshdata);
});
