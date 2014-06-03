jQuery.support.cors = true;

var json_breathecam;
var timelapse;

function setTimeMachineListeners() {
  timelapse.addTimeChangeListener(function() {
    setCursor(getCurrentTimeMachineDateInSecs());
  });
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

function selectDay(dateText, dateElem) {
  var date = $.datepicker.formatDate('yy-mm-dd', new Date(dateText));
  var path = json_breathecam.datasets[date];
  if ( typeof (timelapse) !== "undefined" && timelapse && path)
    timelapse.loadTimelapse(path, null, null, true);
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
      createCharts();
      setTimeMachineListeners();
    },
    disableTourLooping: true,
    showLogoOnDefaultUI: false,
    datasetType: "breathecam"
  };
  timelapse = new org.gigapan.timelapse.Timelapse("timeMachine", settings);
  createDatepicker();
}