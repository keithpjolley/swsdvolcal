const express = require('express');
const path    = require('path');
const fs      = require('fs'); const tsvParse = require('d3-dsv').tsvParse; const router  = express.Router({mergeParams:true});
const oneday  = 24*60*60*1000;

var rawData;

/* GET home page. */
router.get('/', function(req, res, next) {
  // this is stupid. we're just making shit up now. this is a clone of rawData
  var data = rawData.map(d => {return {...d}});
  if(/^-?\d+$/.test(req.params.id)) {
    const getID = +req.params.id;
    if(getID>0) {
      res.json(rawData.filter(function(d){return +d.id==getID})[0] || {error:"no such id"});
    } else if(getID<0) {
      res.json(makeBackgroundItems(data));
    } else {
      res.json(tablify(data));
    }
  } else {
    res.json(timelineify(data));
  }
  return;
});

function myDate(d) {
  const date = new Date(d);
  const secs = date.valueOf(); // secs since epoch. this makes sorting the columns super easy.
  const dateStr = date.toString();
  const longDay = date.toLocaleString(undefined, {weekday:'long'});
  // sort by seconds since epoch, add a bunch of date info to make it easy to filter.
  const sortStr  = '<span class="timesort">' + secs + ' ' + dateStr + ' ' + longDay + '</span>';
  // display minimum date, include full time string on hover
  const displaytime = '<time datetime="' + dateStr + '">'
    + date.toLocaleString(undefined, {weekday:'short', hour:'numeric', minute:'numeric'})
    + '</time>';
  const hovertext = '<div class="hovertext">' + dateStr + '</div>';
  return '<div class="timefield">' + sortStr + displaytime + hovertext + '</div>';
}

// create data for a datatable
function tablify(data) {
  // combine data/time
  data.map(row => {
    //row["Volunteer Name"] =  (row["Last Name"]) ? ('<span style="display:none;">' + row["Last Name"] + '</span>' + row["First Name"] + " " + row["Last Name"]) : "";
    row["Volunteer Name"] =  (row["Last Name"]) ? (row["Last Name"] + ', ' + row["First Name"]) : "";
    if(row['Email']) {
      row["Contact"]  = row["Email"] + (row["Phone Number"] ? (" <br>" + row["Phone Number"]) : "");
    } else {
      row["Contact"]  = "<span class='need'> volunteer needed</span>";
    }
    row["Shift Start"]    =  (row["Shift start date"]) ? (myDate(row["Shift start date"] + " " + row["Shift start time"])) : "";
    row["Shift End"]      =  (row["Shift end date"])   ? (myDate(row["Shift end date"]   + " " + row["Shift end time"])) : "";
    //row["Shift Start"]    =  (row["Shift start date"]) ? ((row["Shift start date"] + " " + row["Shift start time"])) : "";
    //row["Shift Start-secs"]    =  (row["Shift start date"]) ? (new Date(row["Shift start date"] + " " + row["Shift start time"]).valueOf()) : "";
    //row["Shift End"]      =  (row["Shift end date"])   ? ((row["Shift end date"]   + " " + row["Shift end time"])) : "";
    
    if(row["Signup Date"]) {
      row["Signup Date"] += " " + row["Signup Time"];
    }
  });

  // comment out what you want to delete (also, apparently this is dynamic).
  const keeps = [
    //"Event",
    "Job",
    //"Job Description",
    //"Shift Description",
    //"Job Location",
    //"Shift Start-secs",
    "Shift Start",
    "Shift End",
    //"Shift start date",
    //"Shift end date",
    "Volunteer Name",
    //"First Name",
    //"Last Name",
    "Contact",
    //"Email",
    //"Phone Number",
    //"Checked In (via app)",
    //"Checked In",
    //"Checked Out (via app)",
    //"Checked Out",
    //"Confirmed",
    //"Disclaimer",
    //"Job Rate",
    //"Parent ID",
    //"Shift Information",
    //"Shift end time",
    //"Shift start time",
    //"Signup Date",
    //"Signup Time",
    //"Sub-Volunteer ID",
    //"Volunteer Identifier",
  ];
  // the difference of "data.columns" and "keeps"
  // (columns is an exposed property...) https://github.com/d3/d3-dsv#dsvFormat
  // delete these columns
  var keys = new Set();
  data.map(row => Object.keys(row).map(key => key && keys.add(key))); // get a master set of all keys
  [...keys].filter(column => keeps.indexOf(column)<0).map(delcol => data.map(row => delete row[delcol])); // delete all obj

  // https://datatables.net/examples/data_sources/js_array.html
  //const columns = keeps.map(row => {return {title: row}});
  //const dataSet = data.map(vol => {
  //  var dsr=[];
  //  keeps.sort().map(col=>dsr.push(vol[col]));
  //  return dsr;
  //});
  const columns = keeps.map(row => {return {data: row, title: row}});
  return({columns: columns, data: data});
}

function timelineify(data) {
  // mogrify  into this:
  // http://visjs.org/docs/timeline/#Example
  //var id = 0;
  var items = [];
  var jobs = Array.from(new Set(data.map(row => {return row.Job}))).sort((a, b) => a.localeCompare(b)); // unique list of jobs

  data.map(row => {
    var content = "need";
    if(row['First Name']) {
      content = row['First Name'] + (row['Last Name'] ? (" " + row['Last Name']) : "");
    } else if(row['Email']) {
      content = row['Email'];
    }
    items.push({
      className: "job" + jobs.indexOf(row['Job']) + (row['Email'] ? "" : " needabody") + (" vis-item-id_" + row['id']), // leave last element as-is
      content: content,
      end:   new Date(row['Shift end date']   + ' ' + row['Shift end time']),
      group: jobs.indexOf(row['Job']),
      id: row['id'],
      start: new Date(row['Shift start date'] + ' ' + row['Shift start time']),
      //type: row['Email'] ? "range" : "point",
      type: "range",
    });
  });

  // create a list of unique days of the event
  const days = new Set([]);
  items.map(row=>days.add(theDay(row.start)))
  items.map(row=>days.add(theDay(row.end))) // not needed since the events are all single day

  const jbgi = makeJobSlotBackgroundItems(data);
  const dbgi = makeDayBackgroundItems(days);
  items = items.concat(jbgi, dbgi);

  var jobid = 0;
  var groups = [],
      wanttot = 0,
      havetot = 0;
  jobs.forEach(job => {
    var volunteerIDs = data.filter(function(d){return d.Job === job}).map(row=>row['Volunteer Identifier'])
    var want = volunteerIDs.length;
    var have = volunteerIDs.filter(function(d){return d !== ''}).length; 
    wanttot += want;
    havetot += have;
    groups.push({
      className: "job" + jobid + (jobid%2 ? " oddrow" : " evenrow"),
      content: job + "<br><br>" + have + " of " + want + " positions filled.<br>" + (want-have) + " still needed.",
      id: jobid++,
      visible: true
    });
  });

  const firstTime = theDay(getMinDate(items, "start"));
  const lastTime  = theDay(getMaxDate(items, "end"));

  return {
    items: items,
    groups: groups,
    options: {
      align: 'left',
      end: lastTime,
      max: lastTime  + (oneday * 2),  // pad the pad
      min: firstTime - oneday,
      showTooltips: false,
      start: firstTime,
      zoomMax: 7*24*60*60*1000, // only allow a zoom OUT of one week. Easy to get lost...
      zoomMin:    1*60*60*1000  // only allow a zoom IN  of one hour
    },
    totals: {want: wanttot, have: havetot}
  };
}

function theDay(date) {
  const d = new Date(date);
  return d.setHours(0,0,0,0);
}

function getMinDate(arr, prop) {
  var min;
  for (var i=0 ; i<arr.length ; i++) {
    if (arr[i].hasOwnProperty(prop) && (!min || new Date(arr[i][prop]).valueOf() < new Date(min).valueOf()))
      min = arr[i][prop];
  }
  return min;
}

function getMaxDate(arr, prop) {
  var max;
  for (var i=0 ; i<arr.length ; i++) {
    if (arr[i].hasOwnProperty(prop) && (!max || new Date(arr[i][prop]).valueOf() > new Date(max).valueOf()))
      max = arr[i][prop];
  }
  return max;
}

function uniq(a) {
  var keys = new Set();
  return a.filter(function(row) {
    var key  = Object.entries(row).sort().toString();
    var uniq = !keys.has(key);
    keys.add(key);
    return uniq;
  });
}

function makeJobSlotBackgroundItems(data) {
  var ret = [];
  var id = 0;
  data.map(row => {
    ret.push({
      start:   ((row["Shift start date"]) ? (row["Shift start date"] + " " + row["Shift start time"]) : ""),
      end:     ((row["Shift end date"])   ? (row["Shift end date"]   + " " + row["Shift end time"])   : "")
    })
  });
  ret = uniq(ret);
  ret.map(d => {
    //d.className   = "noQtips Set3 q" + (id % 12) + "-12"; //
    //d.className   = "noQtips Set3 q" + (4 % 12) + "-12"; // this just happens to be blue. cool.
    //d.content = "your mother";
    d.id      = "bgid-" + id++; 
    d.type    = "background";
  })
  return ret;
}

function makeDayBackgroundItems(data) {
  var ret = [], id = 0;
  Array.from(data).sort().forEach(k=> {
    ret.push({
      className: "noQtips PRGn q" + ((id % 2)*2) + "-3",
      content:   "id:" + id + ", q" + ((id % 2)*2) + "-3",
      end:       k+oneday,
      id:        "day"+k,
      start:     k,
      type:      "background"
    });
    id++;
  });
  return ret;
}

// read info in once at startup.
const dataFile = path.join('data', 'data.tsv'); 
fs.readFile(dataFile, 'utf8', (err, data) => {
  if (err) throw err;
  rawData = tsvParse(data);
});

module.exports = router;
