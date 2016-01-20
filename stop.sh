#!/bin/bash

PID=$(ps aux | grep "node bin/www" | head -n 1 | grep -Eo "^[^ ]+ +[0-9]+" | grep -Eo "[0-9]+")

sudo kill -SIGHUP $PID

sudo python2 motor/python/stop.py
