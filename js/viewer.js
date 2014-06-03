jQuery.support.cors = true;

var json_breathecam;
var timelapse;
var doNotSeek = false;

function setChartCursor(time) {
  doNotSeek = true;
  dateAxis.setCursorPosition(time);
  doNotSeek = false;
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
        timelapse.removeTimeChangeListener(setChartCursorToCurrentTime);
        timelapse.makeVideoVisibleListener(addTimelapseTimeChangeListener);
        timelapse.loadTimelapse(path, null, closestDesiredFrame / timelapse.getFps());
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

function addTimelapseTimeChangeListener() {
  timelapse.addTimeChangeListener(setChartCursorToCurrentTime);
  timelapse.removeVideoVisibleListener(addTimelapseTimeChangeListener);
}

function setChartCursorToCurrentTime() {
  setChartCursor(getCurrentTimeMachineDateInSecs());
}

function setAndRepositionChartCursorToCurrentTime() {
  var time = getCurrentTimeMachineDateInSecs();
  setChartCursor(time);
  repositionChartCursor(time);
  timelapse.removeVideoVisibleListener(setAndRepositionChartCursorToCurrentTime);
}

function selectDay(dateText, dateElem) {
  var date = $.datepicker.formatDate('yy-mm-dd', new Date(dateText));
  var path = json_breathecam.datasets[date];
  if ( typeof (timelapse) !== "undefined" && timelapse && path) {
    timelapse.loadTimelapse(path, null, null, true);
    timelapse.makeVideoVisibleListener(setAndRepositionChartCursorToCurrentTime);
  }
}

function createDatepicker() {
  var startingDate = json_breathecam.latest.date;
  var dateArray = startingDate.split("-");
  $("#datepicker").datepicker({
    defaultDate: new Date(dateArray[0], dateArray[1] - 1, dateArray[2]),
    minDate: new Date(2014, 0),
    onSelect: selectDay,
    beforeShowDay: highlightDays
  });
}

function createTimeMachine(json) {
  json_breathecam = json;
  var settings = {
    url: json_breathecam.latest.path,
    showFullScreenBtn: false,
    mediaType: ".mp4",
    onTimeMachinePlayerReady: function(viewerDivId) {
      setupPostMessageHandlers();
      timelapse.seekToFrame(timelapse.getNumFrames() - 200);
      createCharts();
      timelapse.addTimeChangeListener(setChartCursorToCurrentTime);
    },
    disableTourLooping: true,
    showLogoOnDefaultUI: false,
    datasetType: "breathecam"
  };
  timelapse = new org.gigapan.timelapse.Timelapse("timeMachine", settings);
  createDatepicker();
}