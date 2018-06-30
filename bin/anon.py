#! /usr/bin/env python3
# -*- coding: UTF8 -*-

import sys
import os
import csv
import fileinput
import random

me = os.path.basename(sys.argv[0])
infile  = sys.argv[1]
outfile = "data/data.tsv"

random.seed()

names = []
namesfiles = ('bin/names.txt')
with fileinput.input(files=namesfiles) as f:
  for line in f: names.append(line.rstrip())

with open(infile, newline='') as csvin:
  reader = csv.DictReader(csvin, quotechar='"', quoting=csv.QUOTE_ALL)
  with open(outfile, 'w', newline='') as csvout:
    writer = csv.DictWriter(csvout, reader.fieldnames, delimiter='\t', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    writer.writeheader()
    for row in reader:
      first, last = names[random.randrange(len(names))].split()
      if(row['Email']): row['Email'] = "{}{}@example.com".format(first,last)
      if(row['First Name']): row['First Name'] = first
      if(row['Last Name']): row['Last Name'] = last
      if(row['Phone Number']):
        r = random.randrange(3)
        if  (r == 0): ac = "619"
        elif(r == 1): ac = "858"
        else:         ac = "{:03d}".format(random.randrange(1000))
        row['Phone Number'] = "({}) 555-{:04d}".format(ac, random.randrange(10000))
      writer.writerow(row)
