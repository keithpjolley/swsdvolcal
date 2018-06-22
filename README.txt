run in debug mode
$ DEBUG=swsdvolcal:* npm start
or:
$ DEBUG=swsdvolcal:*;find app.js bin package.json routes views data credentials.js \( -type l -o -type f \) \! -name \.\* | entr -r npm start

Download data from:  https://app.volunteerlocal.com/manage/?go=volunteer_export
with "select all" selected on custom and standard fields.
Don't check "Group by...".
Do check "Show empty rows...".

The header on the downloaded file isn't quite what we want.
The data on the downloaded file isn't quite what we want, either.
Fix by running:
% bin/import.sh

To create 10(or fewer) random entries:
% n=10;(awk 'NR==1{print;exit}' ./data/data.tsv;(while [ $n -gt 0 ];do let n=$n-1;awk 'NR>1' ./data/data.tsv|randomfile;done)|sort -u) > ./data/data-$n.tsv

% [ $(basename $(pwd)) = "swsdvolcal" ] && rsync --delete -avP --exclude=node_modules/ $(pwd)/ ec2-user@altgnat.com:/usr/share/nginx/node/swsdvolcal/
