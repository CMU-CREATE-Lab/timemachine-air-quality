jQuery.support.cors = true;

var json_breathecam;
var timelapse;
var doNotSeek = false;

function setChartCursor(time) {
  dateAxis.setCursorPosition(time);
}

// Calling this function during playback will cause massive lag
function repositionChartCursor(time) {
  var max = dateAxis.getMax();
  var min = dateAxis.getMin();
  var span = max - min;
  var offset = span / 2;
  if (time > max) {
    dateAxis.setRange(time + offset - span, time + offset);
  } else if (time < min) {
    dateAxis.setRange(time - offset, time - offset + span);
  }
}

function seekTimeMachine(currentDateInSecs) {
  if (!doNotSeek) {
    var desiredDate = new Date(currentDateInSecs * 1000);
    var desiredYear = desiredDate.getFullYear();
    var desiredMonth = desiredDate.getMonth() + 1;
    var desiredDay = desiredDate.getDate();
    var desiredHour = desiredDate.getHours();
    var desiredMin = desiredDate.getMinutes();
    var desiredAMPM = "AM";

    if (desiredHour == 0)
      desiredHour = 12;
    else if (desiredHour == 12)
      am_pm = "PM";
    else if (desiredHour > 12) {
      desiredHour -= 12;
      desiredAMPM = "PM";
    }

    if (desiredMonth < 10)
      desiredMonth = "0" + desiredMonth;
    if (desiredDay < 10)
      desiredDay = "0" + desiredDay;
    if (desiredHour < 10)
      desiredHour = "0" + desiredHour;
    if (desiredMin < 10)
      desiredMin = "0" + desiredMin;

    var desiredCaptureTime_1 = desiredMonth + "/" + desiredDay + "/" + desiredYear;
    var desiredCaptureTime_2 = desiredHour + ":" + desiredMin + " " + desiredAMPM;
    var desiredCaptureTime = desiredCaptureTime_1 + " " + desiredCaptureTime_2;
    var currentCaptureTime_1 = timelapse.getCurrentCaptureTime().split(" ")[0];
    var closestDesiredFrame = timelapse.findExactOrClosestCaptureTime(desiredDate.toTimeString().substr(0, 5));

    if (desiredCaptureTime_1 != currentCaptureTime_1) {
      // Need to load a new dataset
      var path = json_breathecam.datasets[desiredYear + "-" + desiredMonth + "-" + desiredDay];
      if ( typeof (timelapse) !== "undefined" && timelapse && path) {
        var currentView = timelapse.getView();
        timelapse.loadTimelapse(path, currentView, closestDesiredFrame / timelapse.getFps());
        timelapse.makeVideoVisibleListener(onGrapherDateChange);
      }
    } else {
      // Just seek to the time
      timelapse.seekToFrame(closestDesiredFrame);
    }
  }
}

function getCurrentTimeMachineDateInSecs() {
  var currentCaptureTime = timelapse.getCurrentCaptureTime().split(" ");
  var currentDateStr = currentCaptureTime[0].split("/");
  var currentTimeStr = currentCaptureTime[1].split(":");
  var month = parseInt(currentDateStr[0]);
  var day = parseInt(currentDateStr[1]);
  var year = parseInt(currentDateStr[2]);
  var hour = parseInt(currentTimeStr[0] == 12 ? 0 : currentTimeStr[0]);
  var min = parseInt(currentTimeStr[1]);
  if (currentCaptureTime[2] == "PM")
    hour += 12;
  var currentDate = new Date(year, month - 1, day, hour, min);
  return currentDate.getTime() / 1000;
}

function highlightDays(date) {
  date = $.datepicker.formatDate('yy-mm-dd', date);
  if (json_breathecam.datasets[date])
    return [true, 'date-highlight'];
  else
    return [false, ''];
}

function setChartCursorToCurrentTime() {
  setChartCursor(getCurrentTimeMachineDateInSecs());
}

function onGrapherDateChange() {
  addTimeLineSliderListeners();
  timelapse.removeVideoVisibleListener(onGrapherDateChange);
}

function onCalendarDateChange() {
  var time = getCurrentTimeMachineDateInSecs();
  setChartCursor(time);
  repositionChartCursor(time);
  addTimeLineSliderListeners();
  timelapse.removeVideoVisibleListener(onCalendarDateChange);
}

function selectDay(dateText, dateElem) {
  var date = $.datepicker.formatDate('yy-mm-dd', new Date(dateText));
  var path = json_breathecam.datasets[date];
  if ( typeof (timelapse) !== "undefined" && timelapse && path) {
    timelapse.loadTimelapse(path, null, null, true);
    timelapse.makeVideoVisibleListener(onCalendarDateChange);
  }
}

function addTimeLineSliderListeners() {
  $("#Tslider1").mousedown(function() {
    if (!doNotSeek) {
      doNotSeek = true;
      setChartCursorToCurrentTime();
      timelapse.addTimeChangeListener(setChartCursorToCurrentTime);
      // Make sure we release mousedown upon exiting our viewport if we are inside an iframe
      $("body").one("mouseleave", function(event) {
        if (window && (window.self !== window.top)) {
          if (doNotSeek) {
            timelapse.removeTimeChangeListener(setChartCursorToCurrentTime);
            doNotSeek = false;
          }
        }
      });
      // Release mousedown upon mouseup
      $(document).one("mouseup", function(event) {
        if (doNotSeek) {
          timelapse.removeTimeChangeListener(setChartCursorToCurrentTime);
          doNotSeek = false;
        }
      });
    }
  });
}

function addPlayButtonListeners() {
  $(".playbackButton").click(function() {
    if ($(this).hasClass("pause")) {
      if (!doNotSeek) {
        doNotSeek = true;
        timelapse.addTimeChangeListener(setChartCursorToCurrentTime);
      }
    } else if ($(this).hasClass("play")) {
      if (doNotSeek) {
        timelapse.removeTimeChangeListener(setChartCursorToCurrentTime);
        doNotSeek = false;
      }
    }
  });
}

function unpackVars(str) {
  var keyvals = str.split('&');
  var vars = {};

  if (keyvals.length == 1 && keyvals[0] === "")
    return null;

  for (var i = 0; i < keyvals.length; i++) {
    var keyval = keyvals[i].split('=');
    vars[keyval[0]] = keyval[1];
  }
  return vars;
}

function createTimeMachine(json) {
  json_breathecam = json;

  initialDataset = json_breathecam.latest.path;
  var startingDate = json_breathecam.latest.date;

  var hash = window.location.hash.slice(1);
  var hashVars = unpackVars(hash);

  if (hashVars && hashVars.d) {
    startingDate = hashVars.d;
    initialDataset = initialDataset.replace(/\d\d\d\d-\d\d-\d\d/, hashVars.d);
  }

  var settings = {
    url: initialDataset,
    showFullScreenBtn: false,
    mediaType: ".mp4",
    onTimeMachinePlayerReady: function(viewerDivId) {
      setupPostMessageHandlers();
      if (!hashVars) {
        timelapse.seekToFrame(timelapse.getNumFrames() - 200);
      }
      createCharts();
      addTimeLineSliderListeners();
      addPlayButtonListeners();
    },
    disableTourLooping: true,
    showLogoOnDefaultUI: false,
    datasetType: "breathecam"
  };
  timelapse = new org.gigapan.timelapse.Timelapse("timeMachine", settings);

  // Create datepicker
  var dateArray = startingDate.split("-");
  $("#datepicker").datepicker({
    defaultDate: new Date(dateArray[0], dateArray[1] - 1, dateArray[2]),
    minDate: new Date(2014, 0),
    onSelect: selectDay,
    beforeShowDay: highlightDays
  });
}