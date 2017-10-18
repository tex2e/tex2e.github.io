'use strict';

var langs = [
  // Somehow first 2 lang label didn't print unless put 2 meaningless padding
  { lang: '', favorite: -100, devSpeed: -100, loc: 0 },
  { lang: '', favorite: -100, devSpeed: -100, loc: 0 },
  { lang: 'C',            favorite: 30, devSpeed: 45, loc: 25 },
  { lang: 'C++',          favorite: 40, devSpeed: 35, loc: 15 },
  { lang: 'Java',         favorite: 45, devSpeed: 40, loc: 25 },
  { lang: 'Scala',        favorite: 50, devSpeed: 20, loc:  5 },
  { lang: 'Kotlin',       favorite: 45, devSpeed: 10, loc:  1 },
  { lang: 'C#',           favorite: 70, devSpeed: 40, loc: 50 },
  { lang: 'PHP',          favorite: 40, devSpeed: 45, loc: 10 },
  { lang: 'Perl',         favorite: 45, devSpeed: 20, loc: 10 },
  { lang: 'Perl6',        favorite: 95, devSpeed: 15, loc: 20 },
  { lang: 'Ruby',         favorite: 80, devSpeed: 80, loc: 80 },
  { lang: 'Python',       favorite: 80, devSpeed: 60, loc: 70 },
  { lang: 'JavaScript',   favorite: 55, devSpeed: 75, loc: 70 },
  { lang: 'Node.js',      favorite: 55, devSpeed: 50, loc: 50 },
  { lang: 'CoffeeScript', favorite: 65, devSpeed: 20, loc: 40 },
  { lang: 'Erlang',       favorite: 30, devSpeed: 10, loc: 10 },
  { lang: 'Elixir',       favorite: 85, devSpeed: 35, loc: 40 },
  { lang: 'Bash',         favorite: 30, devSpeed: 65, loc: 50 },
  { lang: 'Awk',          favorite: 50, devSpeed: 35, loc: 10 },
  { lang: 'Haskell',      favorite: 25, devSpeed:  5, loc:  1 },
  { lang: 'Lisp',         favorite: 20, devSpeed:  5, loc:  1 },
  { lang: 'Swift',        favorite: 40, devSpeed: 25, loc:  1 },
  { lang: 'Golang',       favorite: 35, devSpeed: 30, loc:  1 },
  { lang: 'Prolog',       favorite: 35, devSpeed: 10, loc:  1 },
  { lang: 'Brainfuck',    favorite:  5, devSpeed:  0, loc:  1 },
];

function plotGraph() {
  var langsPlotId = '#js-langs-plot';
  var width = 700;
  var height = 500;
  var margin = {
    top: 10, left: 50, right: 50, bottom: 20
  };

  var svg = d3.select(langsPlotId).append('svg')
    // responsive SVG needs these 2 attributes and no width and height attr
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', '0 0 ' + width + ' ' + height);

  // helper method
  function translateStr(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

  var chart = svg.append('g')
    .attr('transform', translateStr(margin.left, margin.top));

  // favorite
  var xScale = d3.scale.linear()
    .domain([0, 100])
    .range([margin.left, width - margin.right]);

  // devSpeed
  var yScale = d3.scale.linear()
    .domain([0, 100])
    .range([height - margin.bottom, margin.top]);

  // loc
  var rScale = d3.scale.linear()
    .domain([0, 100])
    .range([10, 100]);

  // x axis
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom');

  // y axis
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left');

  // set x axis
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', translateStr(0, height - margin.bottom))
    .call(xAxis)
    .append('text')
      .attr('class', 'label')
      .attr('x', width - margin.right)
      .attr('y', -5)
      .style('text-anchor', 'end')
      .text('開発スピード [%]');

  // set y axis
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', translateStr(margin.left, 0))
    .call(yAxis)
    .append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -10)
      .attr('y', 15)
      .style('text-anchor', 'end')
      .text('好み [%]');

  // colors
  var colors = d3.scale.category20b();

  // plots
  var circles = svg.selectAll('circle.plot')
    .data(langs)
    .enter().append('circle')
      .attr('class', 'plot')
      .attr('cx', function (d) {
        return xScale(d.devSpeed);
      })
      .attr('cy', function (d) {
        return yScale(d.favorite);
      })
      .attr('r',  function (d) {
        return rScale(d.loc);
      })
      .style('opacity', 0.5)
      .style('fill', function (d, i) {
        return colors(i);
      })

  // labels on plots
  var labels = svg.selectAll('text.label')
    .data(langs)
    .enter().append('text')
      .attr('class', 'label')
      .attr('x', function (d) {
        return xScale(d.devSpeed);
      })
      .attr('y', function (d) {
        return yScale(d.favorite);
      })
      .style('text-anchor', 'middle')
      .text(function (d) {
        return d.lang;
      });

};
