#!/bin/sh
#
# kjolley
# squalor heights, ca, usa
# !date
#
me="$(basename "${0}")"
gooddir="swsdvolcal"
output="./data/data.tsv"

if [ -n "$1" ]
then
  echo "USAGE: ${me}"
  echo "USAGE: parses a 'raw' csv file from volunteerlocal.org"
  echo "USAGE: into a .tsv file that can be read by d3.tsvParse"
  echo "USAGE: must be run from ${gooddir}"
  exit
fi

if [ ! -d "./data" ]
then
  echo "ERROR: ${me}: can't find './data' dir."
  exit 1
fi

if [ ! -d "./views" ]
then
  echo "ERROR: ${me}: can't find './views' dir."
  exit 2
fi

input="./data/$((ls -U1 './data/' | egrep 'san-diego-startup-week-2018.*\.csv$' | tail -1) 2>/dev/null)"
if [ -z "${input}" ]
then
  echo "ERROR: ${me}: no input files found"
  echo "ERROR: ${me}: it should look like './data/san-diego-startup-week-2018*.csv'"
  exit 3
fi
if [ ! -e "${input}" ]
then
  echo "ERROR: ${me}: input file '${input}' not really a file."
  exit 4
fi
echo "INFO: ${me}: parsing '${input}' into '${output}'"
echo "INFO: ${me}: BE SURE YOU REALLY MEANT TO USE THIS FILE: '${input}'"

# tr takes out some non-printable chars that volunteerlocal injects. ??
# change to tsv because some cols have commas in them. 
# awk appends an "id" column and adds a few blank columns on some rows. ?!

shouldhavethismanycolumns=27 # this number changes as fields are added to volunteerlocal

tr -cd '[:print:]\n' < "${input}"                   \
| sed 's/",/"	/g'                                   \
| awk -F"\t" -v NW="${shouldhavethismanycolumns}" ' \
    NR==1{print $0"\"id\"";next}                    \
    NF<NW{$0=$0 "\"\"\t\"\"\t\"\"\t\"\"\t"}             \
         {print $0"\""(NR-1)"\""}'                  \
| sed '1s/"//g'                                     \
> "${output}"

want="$(wc -l < "${input}" | tr -d " ")"  # this bugs
have="$(awk -F"	" -v wf="${shouldhavethismanycolumns}" -v s=0 'NF==wf{s++}END{print s}' "${output}")"

if [ "${want}" -ne "${have}" ]
then
  echo "ERROR: ${me}: I'm sorry but I have screwed something up. The output file is not correct. Shame."
  echo "ERROR: ${me}: There should be '${want}' lines with '${shouldhavethismanycolumns}' columns in the output file. Shame."
  echo "ERROR: ${me}: Instead I have this many rows with this many columns: Shame."
  awk -F"	" -v a=0 '{print NF}' "${output}" | sort | uniq -c | sort -n
  echo "ERROR: ${me}: Shame."
  exit 5
fi

date="$(echo "$input" | sed 's/.*san-diego-startup-week-2018 - VolunteerLocal - //;s/.csv$//;s/\(...\)\([0-9]*\) \([0-9]*\)-\([0-9]*\)\([AP]M\)/\1 \2, \3:\4\5/')"

echo "${date}" > views/current.txt  # this shows how current the data is 

# To create 10 random entries:
# % n=10;(awk 'NR==1{print;exit}' ./data/data.tsv;(while [ $n -gt 0 ];do let n=$n-1;awk 'NR>1' ./data/data.tsv|randomfile;done)|sort -u) > ./data/data-$n.tsv
# % [ $(basename $(pwd)) = "swsdvolcal" ] && rsync --delete -avP --exclude=node_modules/ --exclude=.git/ --exclude=\*.swp $(pwd)/ ec2-user@altgnat.com:/usr/share/nginx/node/swsdvolcal/
