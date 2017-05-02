
$(document).ready(function () {
  draw()
});


function draw() {

  var csv = d3.dsv(",", "text/csv;charset=big5");
  csv("https://elsiehsieh.github.io/EQ26/megi_0406.csv", function (data) {

    var timeAllparse = d3.time.format("%Y-%m-%e %H:%M").parse,
      dateformat = d3.time.format("%Y/%m/%d"),
      timeformat = d3.time.format("%H:%M");

    data.forEach(function (d) {
      d.parseTime = timeAllparse(d.Time);
      d.date = dateformat(d.parseTime);
      d.tt = timeformat(d.parseTime);
      d.geo1 = d.Lat + "," + d.Lon;

      var distype = d["DisasterType"].split("&");

      var landslide = 0;
      var rock = 0;
      var subgrade = 0;
      var block = 0;
      var Lateral = 0;

      //土石崩落 路基流失 道路阻斷 邊坡坍方

      if (distype.indexOf("土石流") > -1) {
        landslide = landslide + 1;
      }
      if (distype.indexOf("土石崩落") > -1) {

        rock = rock + 1;
      }
      if (distype.indexOf("路基流失") > -1) {

        subgrade = subgrade + 1;
      }
      if (distype.indexOf("道路阻斷") > -1) {

        block = block + 1;
      }
      if (distype.indexOf("邊坡坍方") > -1) {
        Lateral = Lateral + 1;
      }

      d.landslide1 = landslide;
      d.rock1 = rock;
      d.subgrade1 = subgrade;
      d.block1 = block;
      d.Lateral1 = Lateral;

    });

    //以下順序調動
    var ndx = crossfilter(data);
    var ndxGroupAll = ndx.groupAll();

    var geo1Dim = ndx.dimension(function (d) {
      return d["geo1"];
    });
    var geo1Group = geo1Dim.group().reduceCount();

    var markerGroup = geo1Dim.group().reduce(
      function (p, v) { // add
        p.situation = v.situation;
        ++p.count;
        return p;
      },
      function (p, v) { // remove
        --p.count;
        return p;
      },
      function () { // init
        return { count: 0 };
      }

    );


    var townDim = ndx.dimension(function (d) {
      return d["T_Name"];
    });

    var townGroup = townDim.group().reduceCount(function (d) {
      return d["DisasterMainType"];

    });
    var countyDim = ndx.dimension(function (d) {
      return d["C_Name"];
    });

    var countyGroup = countyDim.group().reduceCount();
    var countyDisastersGroup = countyDim.group().reduceCount(function (d) {
      //return d.landslide1 + d.rock1 + d.subgrade1 + d.block1 + d.Lateral1;
      return d["DisasterMainType"];
    });

    var timedim = ndx.dimension(function (d) {
      return d.parseTime;
    });
    var hourdim = ndx.dimension(function (d) {
      return d3.time.hour(d.parseTime);
    });
    var minTime = timedim.bottom(1)[0].parseTime;
    var maxTime = timedim.top(1)[0].parseTime;

    var disastertypes = ndx.dimension(function (d) {
      return d["DisasterType"];
    }); //return d["DisasterType"]?d["DisasterType"]:"其他災情"; });
    var disastertypesGroup = disastertypes.group().reduceCount();

    var hourdimGroup = hourdim.group()
      .reduceCount(function (d) {
        return d.Time;
      });

    var landslide1Group = hourdim.group().reduceSum(function (d) {
      return d.landslide1;
    });
    var bridge1Group = hourdim.group().reduceSum(function (d) {
      return d.bridge1;
    });
    var flood1Group = hourdim.group().reduceSum(function (d) {
      return d.flood1;
    });
    var road1Group = hourdim.group().reduceSum(function (d) {
      return d.road1;
    });
    //積淹水災情 道路、隧道災情 土石災情 橋梁災情 其他災情

    var colorScale = d3.scale.ordinal().range(["#ea5c6f", "#FF847B", "#FECEA8", "#9EE6CF", "#50C9BA", "#4BA2AC", "#65799B"]);
    //
    var countycolor = d3.scale.ordinal().range(["#3b5998"]);
    //"#08589e", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5", "#ccebc5","#ccebc5"

    var CountySelectMenu = dc.selectMenu('#select-menu')
      .dimension(countyDim)
      .group(countyGroup)
      .title(function (d) {
        return d.key + ':' + d.value + '筆';
      })
      .order(function (a, b) {
        return b.value > a.value ? 1 : a.value > b.value ? -1 : 0;
      });


    var ClusterMap = dc_leaflet.markerChart("#ClusterMap")

    ClusterMap
      .dimension(geo1Dim)
      .group(markerGroup)
      .center([23.5, 121])
      .zoom(7)
      .cluster(true)
      .valueAccessor(function (kv) {
        return kv.value.count;
      })
      .locationAccessor(function (kv) {
        return kv.key;
      })
      .popup(function (kv) {
        return kv.value.situation;
      })
      .filterByArea(true);

    var MarkerMap = dc_leaflet.markerChart("#MarkerMap")
    MarkerMap
      .dimension(geo1Dim)
      .group(markerGroup)
      .center([23.5, 121])
      .zoom(7)
      .cluster(false)
      .valueAccessor(function (kv) {
        return kv.value.count;
      })
      .locationAccessor(function (kv) {
        return kv.key;
      })
      .popup(function (kv) {
        return kv.value.situation;
      })
      .filterByArea(true);


    $('.BTNmarker').on('click', function () {
      ;
      $('.BTNcluster').addClass('btn-default');
      $('.BTNcluster').removeClass('btn-info');
      $(this).removeClass('btn-default');
      $(this).addClass('btn-info');
      $('#MarkerMap').show();
      $('#ClusterMap').hide();
    });

    $('.BTNcluster').on('click', function () {

      $('.BTNmarker').addClass('btn-default');
      $('.BTNmarker').removeClass('btn-info');
      $(this).removeClass('btn-default');
      $(this).addClass('btn-info');
      $('#ClusterMap').show();
      $('#MarkerMap').hide();
    });
    
    var filterCount = dc.dataCount('.filter-count')
      .dimension(ndx)
      .group(ndxGroupAll)
      .html({
        some: '%filter-count'
      });

    var totalCount = dc.dataCount('.total-count')
      .dimension(ndx)
      .group(ndxGroupAll)
      .html({
        some: '%total-count'
      });

    // var trappedNo = ndx.dimension(function (d) {
    //   return d["TrappedNo"];
    // })

    // var trappedNoGroup = trappedNo.group().reduceSum(function (d) {
    //   return d["TrappedNo"];
    // });

    // var trappedCount = dc.numberDisplay('.trapped-count')
    //   .dimension(trappedNo)
    //   .group(trappedNoGroup)
    //   // .html({
    //   //   some: '%trapped-count'
    //   // })
    //   ;



    //disaster type pie chart
    var pie = dc.pieChart("#dis_pie")
      .dimension(disastertypes)
      .group(disastertypesGroup)
      .colors(function (disastertype) {
        return colorScale(disastertype);
      })
      .width(380)
      .height(200)

      .slicesCap(7)
      .innerRadius(20)
      // .renderLabel(true)
      .legend(dc.legend())
      // .title(function (d) { return d.value; })
      .ordering(function (d) { return -d.value; })
    // .on('pretransition', function (chart) {
    //   chart.selectAll('text.pie-slice').text(function (d) {
    //     return d.data.key + ' ' + dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2 * Math.PI) * 100) + '%';
    //   })
    // });


    var countyRowChart = dc.rowChart("#chart-row-county")
      .width(250)
      .height(200)
      .margins({
        top: 5,
        left: 45,
        right: 20,
        bottom: 20
      })
      .dimension(countyDim)
      .group(countyDisastersGroup, "Disasters")
      .labelOffsetX(-45)
      .colors(function (countyDim) {
        return countycolor(countyDim);
      })
      .elasticX(true)
      .ordering(function (d) { return -d.value; })
      .title(function (d) { return d.value; })
      .rowsCap(6);

    var timechart = dc.barChart("#dis_time")
      // .width(795)
      .height(160)
      .transitionDuration(500)
      .margins({
        top: 10,
        right: 0,
        bottom: 37,
        left: 35
      })
      .dimension(hourdim)
      .group(hourdimGroup)
      .colors("#3b5998")
      .elasticY(true)
      .renderHorizontalGridLines(true)
      .mouseZoomable(false)
      .x(d3.time.scale().domain([minTime, maxTime]))
      //   .xAxisLabel("Date")
      .centerBar(true)
      .xUnits(function (d) {
        return 100
      })
      .title(function (d) { return d.value; })
      .brushOn(true)
      .xAxis().tickFormat(d3.time.format('%m/%d %H:%M'));

 
    var datatable = $("#table-graph").DataTable({
      data: data,
      "retrieve": true,
      "bPaginate": true,
      "bSort": true,
      "deferRender": true,
      "bAutoWidth": true,
      "scroller": true,
      "scrollY": '33vh',
      // "scrollCollapse": true,
      "columnDefs": [
        {
          targets: 0,

          data: function (d) {
            return d.C_Name;
          },
        },
        {
          targets: 1,
          data: function (d) {
            return d.T_Name;
          },
        },
        {
          targets: 2,
          data: function (d) {
            return d.date;
          },
          type: 'date',
        },
        {
          targets: 3,
          data: function (d) {

            return d.tt;
          },
        },
        {
          targets: 4,
          data: function (d) {
            return d.DisasterType;
          },
        },
        {
          targets: 5,
          data: function (d) {

            return d.situation;
          },
        }

      ], select: true
    });



    function RefreshTable() {
      dc.events.trigger(function () {
        alldata = townDim.top(Infinity);
        datatable.clear();
        datatable.rows.add(alldata);
        datatable.draw();
      });
    }

    for (var i = 0; i < dc.chartRegistry.list().length; i++) {
      var chartI = dc.chartRegistry.list()[i];
      chartI.on("filtered", RefreshTable);
    }
    RefreshTable();



    dc.renderAll();
  });

   
}