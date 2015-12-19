#!/bin/bash

./stop.sh
./rotate_logs.py *.log --dir=./logs --move
./start.sh
