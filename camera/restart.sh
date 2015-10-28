#!/usr/bin/env bash

sudo killall raspimjpeg
sudo raspimjpeg >/dev/null 2>/dev/null &
sleep 5