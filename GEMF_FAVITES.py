#! /usr/bin/env python3
'''
User-friendly GEMF wrapper for use in FAVITES (or elsewhere).

Niema Moshiri 2022
'''

# imports
from os.path import isdir, isfile
from sys import argv
import argparse

# parse user args
def parse_args():
    # user runs with no args (place-holder if I want to add GUI in future)
    if len(argv) == 1:
        pass
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-c', '--contact_network', required=True, type=str, help="Contact Network (TSV)")
    parser.add_argument('-s', '--initial_states', required=True, type=str, help="Initial States (TSV)")
    parser.add_argument('-r', '--rates', required=True, type=str, help="State Transition Rates (TSV)")
    parser.add_argument('-t', '--end_time', required=True, type=float, help="End Time")
    parser.add_argument('-o', '--output', required=True, type=str, help="Output Directory")
    return parser.parse_args()

# check user args for validity
def check_args(args):
    for fn in [args.contact_network, args.initial_states, args.rates]:
        if not isfile(fn):
            raise ValueError("File not found: %s" % fn)
    if args.end_time <= 0:
        raise ValueError("End time must be positive: %s" % args.end_time)
    if isdir(args.output) or isfile(args.output):
        raise ValueError("Output directory exists: %s" % args.output)

# main content
if __name__ == "__main__":
    # parse user args and prepare run
    args = parse_args()
    check_args(args)
