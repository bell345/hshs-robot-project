#!/usr/bin/python2

from __future__ import print_function

import motor

import time
import json
from sys import argv
from sys import stdin

while True:
    line = stdin.readline()
    print("New line: {}".format(line))
    if line == "":
        break
    params = json.loads(line)
    speed = params["speed"] if "speed" in params else motor.speed
    direction = params["direction"] if "direction" in params else motor.direction
    
    motor.update(speed, direction)

motor.stop()