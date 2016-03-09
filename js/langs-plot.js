'use strict';

var langs = [
    { lang: 'C',            liking: 20, difficulty: 30, loc: 30 },
    { lang: 'C++',          liking: 30, difficulty: 40, loc: 10 },
    { lang: 'Java',         liking: 40, difficulty: 60, loc: 20 },
    { lang: 'C#',           liking: 60, difficulty: 54, loc: 45 },
    { lang: 'PHP',          liking: 41, difficulty: 35, loc: 10 },
    { lang: 'Perl',         liking: 53, difficulty: 63, loc: 10 },
    { lang: 'Ruby',         liking: 85, difficulty: 53, loc: 90 },
    { lang: 'Python',       liking: 70, difficulty: 66, loc: 40 },
    { lang: 'JavaScript',   liking: 68, difficulty: 40, loc: 91 },
    { lang: 'CoffeeScript', liking: 80, difficulty: 30, loc: 40 },
    { lang: 'Haskell',      liking: 20, difficulty: 90, loc:  0 },
    { lang: 'Erlang',       liking: 40, difficulty: 80, loc: 10 },
    { lang: 'Elixir',       liking: 73, difficulty: 75, loc: 10 },
    { lang: 'Bash',         liking: 40, difficulty: 50, loc: 50 },
    { lang: 'Awk',          liking: 50, difficulty: 28, loc: 10 },
    { lang: 'Make',         liking: 55, difficulty: 20, loc: 15 },
    { lang: 'Rake',         liking: 60, difficulty: 25, loc:  5 },
    { lang: 'HTML',         liking: 27, difficulty:  5, loc: 25 },
    { lang: 'CSS',          liking: 35, difficulty:  9, loc: 25 },
    { lang: 'Sass',         liking: 41, difficulty: 15, loc: 10 },
    { lang: 'Jade',         liking: 35, difficulty: 20, loc: 10 },
];

function plotGraph() {
    var langsPlotId = '#langs-plot';
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

    // liking
    var xScale = d3.scale.linear()
        .domain([0, 100])
        .range([margin.left, width - margin.right]);

    // difficulty
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
        // .text('Difficulty [%]');
        .text('難易度 [%]');

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
        // .text('Liking [%]');
        .text('好み [%]');

    // colors
    var colors = d3.scale.category20b();

    // plots
    var circles = chart.selectAll('circle')
        .data(langs)
      .enter().append('circle')
        .attr('cx', function (d) {
            return xScale(d.difficulty);
        })
        .attr('cy', function (d) {
            return yScale(d.liking);
        })
        .attr('r',  function (d) {
            return rScale(d.loc);
        })
        .style('opacity', 0.5)
        .style('fill', function (d, i) {
            return colors(i);
        });

    // labels on plots
    var labels = chart.selectAll('text')
        .data(langs)
      .enter().append('text')
        .attr('x', function (d) {
            return xScale(d.difficulty);
        })
        .attr('y', function (d) {
            return yScale(d.liking);
        })
        .style('text-anchor', 'middle')
        .text(function (d) {
            return d.lang;
        });
};
