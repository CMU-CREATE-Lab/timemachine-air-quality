var channels = [{
  source: 'ACHD_Avalon.PM25B_UG_M3',
  label: 'Avalon PM2.5, ug/M^3',
  min: 0,
  max: 100
}, {
  source: 'ACHD_Lawrenceville.PM25_UG_M3',
  label: 'Lawrenceville PM2.5, ug/M^3',
  min: 0,
  max: 100
}, {
  source: 'ACHD_Lawrenceville_2.PM10B_UG_M3',
  label: 'Lawrenceville PM10, ug/M^3',
  min: 0,
  max: 100
}, {
  source: 'ACHD_Avalon.SO2_PPM',
  label: 'Avalon SO2, PPM',
  min: -0.01,
  max: 0.05
}, {
  source: 'ACHD_Lawrenceville.OZONE_PPM',
  label: 'Lawrenceville Ozone, PPM',
  min: 0,
  max: 0.1
}, {
  source: 'ACHD_Lawrenceville.NOX_PPB',
  label: 'Lawrenceville NOX, PPB',
  min: 0,
  max: 100
}, {
  source: 'ACHD_Avalon.H2S_PPM',
  label: 'Avalon H2S, PPM',
  min: -0.01,
  max: 0.03
}, {
  source: 'ACHD_Court_House.CO_PPM',
  label: 'Court House CO, PPM',
  min: 0,
  max: 1
}, {
  source: 'ACHD_Flag_Plaza.CO_PPM',
  label: 'Flag Plaza CO, PPM',
  min: 0,
  max: 1
}, {
  source: 'ACHD_Lawrenceville_2.CO_PPB',
  label: 'Lawrenceville CO, PPB',
  min: 0,
  max: 1000
}, {
  source: 'ACHD_Avalon.OUT_T_DEGC',
  label: 'Avalon Temp, deg C',
  min: -10,
  max: 45
}, {
  source: 'ACHD_Lawrenceville.OUT_T_DEGC',
  label: 'Lawrenceville Temp, deg C',
  min: -10,
  max: 45
}, {
  source: 'ACHD_Lawrenceville.OUT_RH_PERCENT',
  label: 'Lawrenceville Relative Humidity, %',
  min: 0,
  max: 100
}, {
  source: 'ACHD_Avalon.SONICWS_MPH',
  label: 'Avalon wind, MPH',
  min: 0,
  max: 40
}, {
  source: 'ACHD_Avalon.SONICWD_DEG',
  label: 'Avalon wind heading, deg',
  min: 0,
  max: 360
}];
var series = [];
var dateAxis;

window.grapherLoad = function() {
  $("#grapher").append('<div id="dateAxisContainer"><div id="dateAxis"></div></div>');

  dateAxis = new DateAxis("dateAxis", "horizontal", {
    min: 1398916800,
    max: 1401595200
  });

  for (var i = 0; i < channels.length; i++) {
    var channel = channels[i];
    series[i] = {}

    var row = $('<div class="chart"></div>');
    row.append('<div class="chartTitle">' + channel.label + '</div>');
    row.append('<div id="series' + i + '" class="chartContent"></div>');
    row.append('<div id="series' + i + 'axis" class="chartAxis"></div>');

    $('#grapher').append(row);

    series[i].axis = new NumberAxis('series' + i + 'axis', "vertical", {
      min: channel.min,
      max: channel.max
    });
    var datasource;
    (function(source) {
      datasource = function(level, offset, successCallback, failureCallback) {
        $.ajax({
          url: 'http://fluxtream-api-proxy.cmucreatelab.org/api/bodytrack/tiles/1968/' + source + '/' + level + '.' + offset + '.json',
          success: function(data) {
            successCallback(JSON.stringify(data))
          },
          failure: failureCallback,
          headers: {
            Authorization: 'Basic ' + btoa('achd:achdmirror')
          }
        });
      }
    })(channel.source);
    var plot = new DataSeriesPlot(datasource, dateAxis, series[i].axis, {});
    plot.setStyle({
      "styles": [{
        "type": "line",
        "lineWidth": 1,
        "show": true,
        "color": "#0000ff"
      }],
      highlight: {
        "lineWidth": 1,
        "styles": [{
          "type": "lollipop",
          "color": "#ff0000",
          "radius": 1,
          "lineWidth": 1,
          "fill": false
        }, {
          "show": true,
          "type": "value",
          "fillColor": "#ff0000",
          "marginWidth": 10,
          "font": "9pt Helvetica,Arial,Verdana,sans-serif",
          "verticalOffset": 7,
          "numberFormat": "###,##0.0##"
        }]
      }
    });
    series[i].pc = new PlotContainer("series" + i, false, [plot]);
  }
  $(window).resize(setSizes);
  setSizes();
};

function setSizes() {
  dateAxis.setSize($('#dateAxis').width(), $("#dateAxis").height(), SequenceNumber.getNext());
  for (var i = 0; channels.length; i++) {
    series[i].axis.setSize($('#series' + i + 'axis').width(), $('#series' + i + 'axis').height(), SequenceNumber.getNext());
    series[i].pc.setSize($('#series' + i).width(), $('#series' + i).height(), SequenceNumber.getNext());
  }
}

function displayValue(val) {
  $("#valueLabel").html( val ? val['dateString'] + " " + val['valueString'] : "");
}