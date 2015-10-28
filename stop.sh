#!/bin/bash

PID=$(ps aux | grep "node bin/www" | head -n 1 | grep -Eo "^[^ ]+ +[0-9]+" | grep -Eo "[0-9]+")

kill -SIGHUP $PID
