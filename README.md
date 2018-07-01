# Express Timeline Visualization for VolunteerLocal data

keith p jolley (c)
Sun Jul  1 11:37:59 PDT 2018
squalor heights, ca, usa

### What's it?
It's a tool to complement what [VolunteerLocal](https://volunteerlocal.com) provides to an event organizer.
I recently helped coordinate ~500 volunteers over a weeklong event and had a couple of needs
that were not being met. In particular I needed an overview of when/where I had people signed
up and where we still needed to recruit more folks. Then, as we got closer to the day of we
needed a way of knowing exactly who was supposed to be where and when, plus a way of seeing 
where we still had holes in the schedule.

For the [overview requirement](https://www.altgnat.com/swsdvolcal/timeline)
I used the [timeline](http://visjs.org/docs/timeline) javascript library.

#### timeline:
![picture of the swsd volunteer calendar timeline site](https://raw.githubusercontent.com/keithpjolley/swsdvolcal/master/public/images/timeline.jpeg)


For the [detailed view](https://www.altgnat.com/swsdvolcal/table) I used [DataTables](https://datatables.net/). DataTables has a [JQuery](https://api.jquery.com/)
dependency so I used it a bit on formatting and what-not.

#### table
![picture of the swsd volunteer calendar table site](https://raw.githubusercontent.com/keithpjolley/swsdvolcal/master/public/images/table.jpeg)


### Setup
This is a node express joint. It runs on port 9004 and I use nginx to proxy the connection:
```
    #
    location /swsdvolcal {
      proxy_pass http://localhost:9004; # swsd startup week san diego volunteerl calendar
    }
```

When debugging I like to run it as:
```sh
$ DEBUG=swsdvolcal:*;find app.js bin package.json routes credentials.js \( -type l -o -type f \) \! -name \.\* | entr -r npm start
```
which causes npm to restart everytime I save a file. Handy.

To use on your own project, download your data from:
https://app.volunteerlocal.com/manage/?go=volunteer_export
and "select all" on custom and standard fields.

Don't check "Group by...".

Do check "Show empty rows...".

Move the downloaded `xxx.csv` into `data/` and run `bin/import.sh`.

The header on the downloaded file isn't quite what we want. It comes
with some garbage chars in it. (?)
Fix by running:
```sh
% bin/import.sh
```

To create 10(or fewer) random entries to help with debug:
```sh
$ n=10;(head -1 ./data/data.tsv;(while [ $n -gt 0 ];do let n=$n-1;awk 'NR>1' ./data/data.tsv|randomfile;done)|sort -u) > ./data/data-$n.tsv
```


