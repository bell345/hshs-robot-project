#!/bin/bash

./rotate_logs.py *.log --dir=./logs --move
sudo touch stdout.log stderr.log
sudo chown net-user:net-user stdout.log stderr.log logs/*
sudo node bin/www >> stdout.log 2>> stderr.log &
