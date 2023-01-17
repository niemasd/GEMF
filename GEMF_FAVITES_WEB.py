#! /usr/bin/env python3
from sys import argv
import GEMF_FAVITES

runGEMFDone = False

def runGEMFWrapper(path, stdout):
    runGEMF()

if ('arguments' in globals()):
    GEMF_FAVITES.sys.argv = arguments.split()
    GEMF_FAVITES.subprocess.call = runGEMFWrapper
    GEMF_FAVITES.main()