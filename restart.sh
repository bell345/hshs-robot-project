#!/bin/bash

./stop.sh
./rotate_logs.py std*.log --dir=./logs --move
./start.sh
