jQuery.support.cors = true;

var json_breathecam;

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

function createTimeMachine() {
  var settings = {
    url: json_breathecam.latest.path,
    showFullScreenBtn: false,
    mediaType: ".mp4",
    onTimeMachinePlayerReady: function(viewerDivId) {
      setupPostMessageHandlers();
    },
    disableTourLooping: true,
    showLogoOnDefaultUI: false,
    datasetType: "breathecam"
  };
  timelapse = new org.gigapan.timelapse.Timelapse("timeMachine", settings);
}