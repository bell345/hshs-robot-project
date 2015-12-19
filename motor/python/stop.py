#!/usr/bin/python

from Adafruit_MotorHAT import Adafruit_MotorHAT as AdaHAT

import atexit

mh = AdaHAT(addr=0x60)

mh.getMotor(1).run(AdaHAT.RELEASE)
mh.getMotor(2).run(AdaHAT.RELEASE)
mh.getMotor(3).run(AdaHAT.RELEASE)
mh.getMotor(4).run(AdaHAT.RELEASE)
