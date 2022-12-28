#! /usr/bin/env python3
from sys import argv
import GEMF_FAVITES

if ('arguments' in globals()):
    GEMF_FAVITES.sys.argv = arguments.split()
    GEMF_FAVITES.main()