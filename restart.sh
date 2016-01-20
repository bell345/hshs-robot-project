#!/bin/bash

./stop.sh
#./rotate_logs.py *.log --dir=./logs --move
#find ./ -path './node_modules' -prune -o -name '*.log' -print | \
#xargs ./rotate_logs.py --dir=./logs --move
./start.sh
