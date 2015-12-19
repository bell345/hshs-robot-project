#!/usr/bin/python3

import os
import re
import shutil
import argparse
from sys import argv

MAX = 50

verbose = False

def getNewLogName(filename, log_dir="./", n=0):
    m = re.match(r'^(.*)\.([0-9]+)$', filename)
    if m != None:
        filename = m.group(1)
        n = max(n, int(m.group(2)) + 1)

    return os.path.join(log_dir, filename) + "." + str(n)

def rotateLog(filename, log_dir="", n=0):
    if verbose:
        print("Rotating log... (n = {})".format(n))
    new_file = getNewLogName(filename, log_dir=log_dir, n=n)
    if verbose:
        print("Trying new_file: {}".format(new_file))
    if os.path.exists(new_file) and n < MAX:
        n += 1
        rotateLog(new_file, log_dir="", n=n)

    new_file = getNewLogName(filename, log_dir=log_dir, n=n)
    if verbose:
        print("Copying {} to {}".format(filename, new_file))
    shutil.copy(filename, new_file)
    return n

if True:
    
    parser = argparse.ArgumentParser()
    parser.add_argument("-m", "--move", action='store_true',
            help="Move the logs instead of copying them.")
    parser.add_argument("-v", "--verbose", action='store_true',
            help="Debug log output.")
    parser.add_argument("-d", "--dir", default="./logs", 
            help="The directory in which logs will be rotated.")
    parser.add_argument("file", nargs="+", type=str, 
            help="The logs that are to be rotated.")
    args = parser.parse_args()

    if args.verbose:
        verbose = True

    for f in args.file:
        if os.path.exists(f):
            rotateLog(f, log_dir=args.dir)
            if args.move:
                os.remove(f)
