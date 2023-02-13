
var mapSvg;



var mapData;
var lineData;
var pieData;

var lineWidth;
var lineHeight;
var lineInnerHeight;
var lineInnerWidth;
var lineMargin = { top: 20, right: 60, bottom: 60, left: 100 };

document.addEventListener('DOMContentLoaded', function() {
  mapSvg = d3.select('#svg1');
  lineSvg = d3.select('#svg2');
  pieSvg = d3.select('#svg3');

  lineWidth = +lineSvg.style('width').replace('px','');
  lineHeight = +lineSvg.style('height').replace('px','');;
  lineInnerWidth = lineWidth - lineMargin.left - lineMargin.right;
  lineInnerHeight = lineHeight - lineMargin.top - lineMargin.bottom;


    // Load both files before doing anything else
    Promise.all([d3.json('https://github.com/ChanMaung/CO2-Emission-Data-Viz/blob/main/data/us.geojson'),
                 d3.csv('https://github.com/ChanMaung/CO2-Emission-Data-Viz/blob/main/data/co2emissions.csv'),                                                
                 d3.csv('https://github.com/ChanMaung/CO2-Emission-Data-Viz/blob/main/data/co2emissionsShares.csv')])
            .then(function(values){
      
    mapData = values[0];
    lineData = values[1];
    pieData = values[2];

    //console.log(lineData);
    drawMap();
    timeline();
    })
  
    

  });


  function getExtentsForYear(yearData) {
    var max = Number.MIN_VALUE;
    var min = Number.MAX_VALUE;
    for(var key in yearData) {
      if(key == 'Year') 
        continue;
      let val = +yearData[key];
      if(val > max)
        max = val;
      if(val < min)
        min = val;
    }
    return [min,max];
  }



 



  function drawMap(){



    mapSvg.selectAll('*').remove();
    var Mapwidth = mapSvg.node().clientWidth;
    var Mapheight = mapSvg.node().clientHeight - 50;
  
    var stateSelected1 = " ";
    var stateEmission1 = " ";
    //console.log(mapData);

    var mapYear = document.querySelector('#year-input').value;
    let yearData = lineData.filter( d => d.Year == mapYear)[0];
    let extent = getExtentsForYear(yearData);
    
    var colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain(extent);

    var Mmargin = ({top: 20, right: 40, bottom: 30, left: 40});
    var MbarHeight = 20;
    var Mheight = 620;
    var Mwidth = 1080;
    
    var MaxisScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([Mmargin.left, Mwidth - Mmargin.right]);
    
    var MaxisBottom = g => g
        .attr("class", `x-axis`)
        .attr("transform", `translate(0,${Mheight - Mmargin.bottom})`)
        .call(d3.axisBottom(MaxisScale)
          .ticks(Mwidth / 80)
          .tickSize(-MbarHeight));    

    const defs = mapSvg.append("defs");
  
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    
    linearGradient.selectAll("stop")
      .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);



      var div1 = d3.select("body").append("div")
           .attr("class", "tooltip-donut")
           .style("opacity", 0);


    var usaProjection = d3.geoAlbersUsa()    
    .fitSize([Mapwidth,Mapheight], mapData);

    const geoPath = d3.geoPath().projection(usaProjection);
    
    mapSvg.selectAll('.state')
    .data(mapData.features)
    .join('path')
    .classed('state',true)
    .attr('d',geoPath)
    .style("stroke", "#fff")
    .style("stroke-width", "1")
    .style('fill', d => {
      let val = +yearData[d.properties.name];
      if(isNaN(val)) 
        return 'white';
      return colorScale(val);
    })
    .on('mouseover', function(d,i) {
      //console.log('mouseover on ' + d.properties.name);
      d3.select(this).transition()
      .duration('50')
      .attr('opacity', '.85')
      .style('stroke','red')
      .style('stroke-width','2');
      
      
      div1.transition()
      .duration(50)
      .style("opacity", 1);
      

     
      stateSelected1 = d.properties.name;
      /*
      lineData.forEach(d => {
      d.stateEmission1 = +d[stateSelected1];
      d.year = +d["Year"];
      if (d.year == mapYear){
        stateEmission1 = d.stateEmission1;
      }

    });
    */
    
    var toolout =  stateSelected1 + "\n";
    //toolout += "CO2 Emission: " + stateEmission1 + "\n";
    div1.html(toolout)
    .style("left", (d3.event.pageX + 10) + "px")
    .style("top", (d3.event.pageY - 15) + "px");
    })
    .on('mouseout', function(d,i) {
      console.log('mouseout on ' + d.properties.name);
      d3.select(this).transition()
      .duration('50')
      .attr('opacity', '1')
      .style('stroke','#fff')
      .style('stroke-width','1');

      div1.transition()
      .duration('50')
      .style("opacity", 0);
    })
    .on('click', function(d) {
      console.log('clicked on ' + d.properties.name);
      countrySelected1 = d.properties.name;
      drawLineChart(countrySelected1);
      drawPie(stateSelected1);

    });

    mapSvg.append('g')
    .attr("transform", `translate(0,${Mheight - Mmargin.bottom - MbarHeight})`)
    .append("rect")
    .attr('transform', `translate(${Mmargin.left}, 0)`)
	  .attr("width", Mwidth - Mmargin.right - Mmargin.left)
	  .attr("height", MbarHeight)
	  .style("fill", "url(#linear-gradient)");

    mapSvg.append('g')
    .call(MaxisBottom);




  }






//////////////////////////////////////////////// Draw Line Chart ////////////////////////////////
  function drawLineChart(stateSelected1) {

    lineSvg.selectAll('*').remove();

    if(!stateSelected1)
      return;
  
  
    
    lineData.forEach(d => {
        d.stateEmission2 = +d[stateSelected1];
        //d.state2 = stateSelected2;
        d.date = +d["Year"];
    }); 
    
    
  
  
 // Create the x scale for the line chart  
  var xScale = d3.scaleLinear();
  xScale.domain(d3.extent(lineData, function(d) { return d.date; }))
  .range([ 0, lineInnerWidth ]);
  

  const g1 = lineSvg.append('g')
  .attr('transform',`translate(${lineMargin.left},${lineMargin.top})`);
  
  // Create the y scale for the line chart 
  const yScale = d3.scaleLinear()
  .domain([0, d3.max(lineData, function(d) {  return d.stateEmission2; }) + (lineInnerHeight / 4)])
  .range([lineInnerHeight,0]);
  
  
  //add the y-axis and x-axis to the plot
  g1.append('g')
  .call(d3.axisLeft(yScale));
  g1.append('g')
  .attr('transform',`translate(0,${lineInnerHeight})`)
  .call(d3.axisBottom(xScale));
  
  const singleLine = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.stateEmission2))  
  .curve(d3.curveMonotoneX)
  //////////////////////////////////
  
  
  
  
  
  
  //////////////////////// draw line
  g1.append('path')
  .datum(lineData)  
  .attr('class','singleLine')      
  .style('fill','none')
  .style('stroke','black')
  .style('stroke-width','2')
  .attr('d', singleLine);
  
  //////////////////////// lables
  var ytext = "CO2 Emission for " + stateSelected1 + "(million metric tons)"
  g1.append('text')
  .attr('transform','rotate(-90)')
  .attr('dy','-60')
  .attr('dx','-50')
  .style('text-anchor','end')
  .text(ytext);
  g1.append('text')
  .attr('transform',`translate(${lineInnerWidth},${lineInnerHeight-10})`)
  .attr('dy','50')
  .attr('dx','-300')
  .style('text-anchor','end')
  .text('Year');
  
  }




  
/////////////// Pie Chart ////////////////




function drawPie(stateSelected1) {
  pieSvg.selectAll('*').remove();
  var pieWidth = pieSvg.node().clientWidth;
  var pieHeight = pieSvg.node().clientHeight;
  console.log(pieWidth);
  console.log(pieHeight);
  var margin = 40;

  var radius = Math.min(pieWidth, pieHeight) / 2 - margin;

  var data = {
    coal: 33,
    petroleum: 33,
    natural_gas: 33
};

pieData.forEach(function(d){
  d.shareP = +d[stateSelected1];
  d.type = d["Shares"];
  if (d.type == "coal"){
    data.coal = d.shareP;
  }
  if (d.type == "petroleum"){
    data.petroleum = d.shareP;
  }
  if (d.type == "natural gas"){
    data.natural_gas = d.shareP;
  }
});

  var color = d3.scaleOrdinal()
    .domain(data)
    .range(["#98abc5", "#8a89a6", "#7b6888"]);

  var pie = d3.pie()
    .value(function(d) {return d.value});
  var data_ready = pie(d3.entries(data));

  const g2 = pieSvg.append("g")
      .attr("transform", "translate(" + pieWidth / 2 + "," + pieHeight / 2 + ")");
  var arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)
    
    
  g2
    .selectAll('mySlices')
    .data(data_ready)
    .enter()
    .append('path')
      .attr('d', arcGenerator)
      .attr('fill', function(d){ return(color(d.data.key)) })
      .attr("stroke", "black")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)
  g2
    .selectAll('mySlices')
    .data(data_ready)
    .enter()
    .append('text')
    .text(function(d){ return d.data.key + " " + d.data.value + "%"})
    .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
    .style("text-anchor", "middle")
    .style("font-size", 17);
}




///////////////////////////////////////////// make vermont green
function findLeast(){
  console.log("Least CO2 clicked");
  mapSvg.selectAll('*').remove();
    var Mapwidth = mapSvg.node().clientWidth;
    var Mapheight = mapSvg.node().clientHeight - 50;
  
    var stateSelected1 = " ";
    var stateEmission1 = " ";
    //console.log(mapData);

    var mapYear = document.querySelector('#year-input').value;
    let yearData = lineData.filter( d => d.Year == mapYear)[0];
    let extent = getExtentsForYear(yearData);
    
    var colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain(extent);

    var Mmargin = ({top: 20, right: 40, bottom: 30, left: 40});
    var MbarHeight = 20;
    var Mheight = 620;
    var Mwidth = 1080;
    
    var MaxisScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([Mmargin.left, Mwidth - Mmargin.right]);
    
    var MaxisBottom = g => g
        .attr("class", `x-axis`)
        .attr("transform", `translate(0,${Mheight - Mmargin.bottom})`)
        .call(d3.axisBottom(MaxisScale)
          .ticks(Mwidth / 80)
          .tickSize(-MbarHeight));    

    const defs = mapSvg.append("defs");
  
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    
    linearGradient.selectAll("stop")
      .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);



      var div1 = d3.select("body").append("div")
           .attr("class", "tooltip-donut")
           .style("opacity", 0);


    var usaProjection = d3.geoAlbersUsa()    
    .fitSize([Mapwidth,Mapheight], mapData);

    const geoPath = d3.geoPath().projection(usaProjection);
    
    mapSvg.selectAll('.state')
    .data(mapData.features)
    .join('path')
    .classed('state',true)
    .attr('d',geoPath)
    .style("stroke", "#fff")
    .style("stroke-width", "1")
    .style('fill', d => {
      let val = +yearData[d.properties.name];
      if(isNaN(val)) 
        return 'white';
      if(d.properties.name == "Vermont")
        return 'green';
      return colorScale(val);
    })
    .on('mouseover', function(d,i) {
      //console.log('mouseover on ' + d.properties.name);
      d3.select(this).transition()
      .duration('50')
      .attr('opacity', '.85')
      .style('stroke','red')
      .style('stroke-width','2');
      
      
      div1.transition()
      .duration(50)
      .style("opacity", 1);
      

     
      stateSelected1 = d.properties.name;
      /*
      lineData.forEach(d => {
      d.stateEmission1 = +d[stateSelected1];
      d.year = +d["Year"];
      if (d.year == mapYear){
        stateEmission1 = d.stateEmission1;
      }

    });
    */
    
    var toolout =  stateSelected1 + "\n";
    //toolout += "CO2 Emission: " + stateEmission1 + "\n";
    div1.html(toolout)
    .style("left", (d3.event.pageX + 10) + "px")
    .style("top", (d3.event.pageY - 15) + "px");
    })
    .on('mouseout', function(d,i) {
      console.log('mouseout on ' + d.properties.name);
      d3.select(this).transition()
      .duration('50')
      .attr('opacity', '1')
      .style('stroke','#fff')
      .style('stroke-width','1');

      div1.transition()
      .duration('50')
      .style("opacity", 0);
    })
    .on('click', function(d) {
      console.log('clicked on ' + d.properties.name);
      countrySelected1 = d.properties.name;
      drawLineChart(countrySelected1);

    });

    mapSvg.append('g')
    .attr("transform", `translate(0,${Mheight - Mmargin.bottom - MbarHeight})`)
    .append("rect")
    .attr('transform', `translate(${Mmargin.left}, 0)`)
	  .attr("width", Mwidth - Mmargin.right - Mmargin.left)
	  .attr("height", MbarHeight)
	  .style("fill", "url(#linear-gradient)");

    mapSvg.append('g')
    .call(MaxisBottom);
}




////////////////////////////////////////////////////// make texas purple
function findMost(){
  console.log("Most CO2 clicked" );

  mapSvg.selectAll('*').remove();
    var Mapwidth = mapSvg.node().clientWidth;
    var Mapheight = mapSvg.node().clientHeight - 50;
  
    var stateSelected1 = " ";
    var stateEmission1 = " ";
    //console.log(mapData);

    var mapYear = document.querySelector('#year-input').value;
    let yearData = lineData.filter( d => d.Year == mapYear)[0];
    let extent = getExtentsForYear(yearData);
    
    var colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain(extent);

    var Mmargin = ({top: 20, right: 40, bottom: 30, left: 40});
    var MbarHeight = 20;
    var Mheight = 620;
    var Mwidth = 1080;
    
    var MaxisScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([Mmargin.left, Mwidth - Mmargin.right]);
    
    var MaxisBottom = g => g
        .attr("class", `x-axis`)
        .attr("transform", `translate(0,${Mheight - Mmargin.bottom})`)
        .call(d3.axisBottom(MaxisScale)
          .ticks(Mwidth / 80)
          .tickSize(-MbarHeight));    

    const defs = mapSvg.append("defs");
  
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    
    linearGradient.selectAll("stop")
      .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);



      var div1 = d3.select("body").append("div")
           .attr("class", "tooltip-donut")
           .style("opacity", 0);


    var usaProjection = d3.geoAlbersUsa()    
    .fitSize([Mapwidth,Mapheight], mapData);

    const geoPath = d3.geoPath().projection(usaProjection);
    
    mapSvg.selectAll('.state')
    .data(mapData.features)
    .join('path')
    .classed('state',true)
    .attr('d',geoPath)
    .style("stroke", "#fff")
    .style("stroke-width", "1")
    .style('fill', d => {
      let val = +yearData[d.properties.name];
      if(isNaN(val)) 
        return 'white';
      if(d.properties.name == 'Texas')
        return 'purple';
      return colorScale(val);
    })
    .on('mouseover', function(d,i) {
      //console.log('mouseover on ' + d.properties.name);
      d3.select(this).transition()
      .duration('50')
      .attr('opacity', '.85')
      .style('stroke','red')
      .style('stroke-width','2');
      
      
      div1.transition()
      .duration(50)
      .style("opacity", 1);
      

     
      stateSelected1 = d.properties.name;
      /*
      lineData.forEach(d => {
      d.stateEmission1 = +d[stateSelected1];
      d.year = +d["Year"];
      if (d.year == mapYear){
        stateEmission1 = d.stateEmission1;
      }

    });
    */
    
    var toolout =  stateSelected1 + "\n";
    //toolout += "CO2 Emission: " + stateEmission1 + "\n";
    div1.html(toolout)
    .style("left", (d3.event.pageX + 10) + "px")
    .style("top", (d3.event.pageY - 15) + "px");
    })
    .on('mouseout', function(d,i) {
      console.log('mouseout on ' + d.properties.name);
      d3.select(this).transition()
      .duration('50')
      .attr('opacity', '1')
      .style('stroke','#fff')
      .style('stroke-width','1');

      div1.transition()
      .duration('50')
      .style("opacity", 0);
    })
    .on('click', function(d) {
      console.log('clicked on ' + d.properties.name);
      countrySelected1 = d.properties.name;
      drawLineChart(countrySelected1);

    });

    mapSvg.append('g')
    .attr("transform", `translate(0,${Mheight - Mmargin.bottom - MbarHeight})`)
    .append("rect")
    .attr('transform', `translate(${Mmargin.left}, 0)`)
	  .attr("width", Mwidth - Mmargin.right - Mmargin.left)
	  .attr("height", MbarHeight)
	  .style("fill", "url(#linear-gradient)");

    mapSvg.append('g')
    .call(MaxisBottom);
}


/////////////////////////////////////////////// timeline
// code from: https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
function timeline(){
  var dataTime = d3.range(0, 19).map(function(d) {
    return new Date(1999 + d, 18, 3);
  });

  var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(900)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .default(new Date(1999, 10, 3))
    .on('onchange', val => {
      d3.select('p#value-time').text(d3.timeFormat('%Y')(val));
      document.querySelector('#year-input').value = d3.timeFormat('%Y')(val);
      drawMap();
      console.log(d3.timeFormat('%Y')(val));
    });

  var gTime = d3
    .select('div#slider-time')
    .append('svg')
    .attr('width', 1000)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

  gTime.call(sliderTime);

  d3.select('p#value-time').text(d3.timeFormat('%Y')(sliderTime.value()));

}

 
