#!/usr/bin/python2

from __future__ import print_function

from Adafruit_MotorHAT import Adafruit_MotorHAT as AdaHAT
from Adafruit_MotorHAT import Adafruit_DCMotor as AdaDC

import atexit

mh = AdaHAT(addr=0x60)

def stop():
        mh.getMotor(1).run(AdaHAT.RELEASE)
        mh.getMotor(2).run(AdaHAT.RELEASE)
        mh.getMotor(3).run(AdaHAT.RELEASE)
        mh.getMotor(4).run(AdaHAT.RELEASE)

atexit.register(stop)

# motor assignments
TOP_RIGHT = 1
TOP_LEFT = 2
BOTTOM_RIGHT = 3
BOTTOM_LEFT = 4

# motor flips
FLIP_TOP_RIGHT = True
FLIP_TOP_LEFT = True
FLIP_BOTTOM_RIGHT = True
FLIP_BOTTOM_LEFT = True

speed = 0
direction = 0

MAX_SPEED = 0.5

def setSpeed(motor_id, n):
    print("{}: {}".format(motor_id, n))
    motor = mh.getMotor(motor_id)
    if n == 0:
        motor.run(AdaHAT.RELEASE)
    elif n < 0:
        motor.run(AdaHAT.BACKWARD)
        motor.setSpeed(int((-n)*255))
    elif n > 0:
        motor.run(AdaHAT.FORWARD)
        motor.setSpeed(int(n*255))

def update(speed_param=speed, direction_param=direction):
    global speed
    global direction
    speed = max(min(speed_param, 1), -1)
    direction = direction_param

    if speed < 0:
        direction = -direction

    print("Speed = {}".format(speed))
    print("Direction = {}".format(direction))

    ftl = -1.0 if FLIP_TOP_LEFT     else 1.0
    ftr = -1.0 if FLIP_TOP_RIGHT    else 1.0
    fbl = -1.0 if FLIP_BOTTOM_LEFT  else 1.0
    fbr = -1.0 if FLIP_BOTTOM_RIGHT else 1.0

    maxSpeed = speed * MAX_SPEED
    if direction == 0:
        setSpeed(TOP_LEFT, maxSpeed*ftl)
        setSpeed(BOTTOM_LEFT, maxSpeed*fbl)
        setSpeed(TOP_RIGHT, maxSpeed*ftr)
        setSpeed(BOTTOM_RIGHT, maxSpeed*fbr)
    elif direction > 0:
        setSpeed(TOP_LEFT, maxSpeed*ftl)
        setSpeed(BOTTOM_LEFT, maxSpeed*fbl)
        setSpeed(TOP_RIGHT, maxSpeed*(1 - abs(direction))*ftr)
        setSpeed(BOTTOM_RIGHT, maxSpeed*(1 - abs(direction))*fbr)
    elif direction < 0:
        setSpeed(TOP_LEFT, maxSpeed*(1 - abs(direction))*ftl)
        setSpeed(BOTTOM_LEFT, maxSpeed*(1 - abs(direction))*fbl)
        setSpeed(TOP_RIGHT, maxSpeed*ftr)
        setSpeed(BOTTOM_RIGHT, maxSpeed*fbr)
