#! /usr/bin/env python3
'''
User-friendly GEMF wrapper for use in FAVITES (or elsewhere).
Niema Moshiri 2022
'''

# imports
from os import chdir, getcwd, makedirs
from os.path import abspath, expanduser, isdir, isfile
from sys import argv
import argparse

# defaults
DEFAULT_FN_GEMF_NETWORK = 'network.txt'
DEFAULT_FN_GEMF_OUT = 'output.txt'
DEFAULT_FN_GEMF_PARA = 'para.txt'

def parse_args():
    '''
    Parse user arguments

    Returns:
        `argparse.ArgumentParser`: Parsed user arguments
    '''
    # user runs with no args (place-holder if I want to add GUI in future)
    if len(argv) == 1:
        pass

    # parse user args
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-c', '--contact_network', required=True, type=str, help="Contact Network (TSV)")
    parser.add_argument('-s', '--initial_states', required=True, type=str, help="Initial States (TSV)")
    parser.add_argument('-r', '--rates', required=True, type=str, help="State Transition Rates (TSV)")
    parser.add_argument('-t', '--end_time', required=True, type=float, help="End Time")
    parser.add_argument('-o', '--output', required=True, type=str, help="Output Directory")
    parser.add_argument('--gemf_path', required=False, type=str, default='GEMF', help="Path to GEMF Executable")
    args = parser.parse_args()

    # convert local paths to absolute
    args.contact_network = abspath(expanduser(args.contact_network))
    args.initial_states = abspath(expanduser(args.initial_states))
    args.rates = abspath(expanduser(args.rates))
    args.output = abspath(expanduser(args.output))
    return args

def check_args(args):
    '''
    Check user argumentss for validity

    Args:
        `args` (`argparse.ArgumentParser`): Parsed user arguments
    '''
    # check that input files exist
    for fn in [args.contact_network, args.initial_states, args.rates]:
        if not isfile(fn):
            raise ValueError("File not found: %s" % fn)

    # check that end time is positive
    if args.end_time <= 0:
        raise ValueError("End time must be positive: %s" % args.end_time)

    # check that output directory doesn't already exist
    if isdir(args.output) or isfile(args.output):
        raise ValueError("Output directory exists: %s" % args.output)

def prepare_outdir(outdir, para_fn=DEFAULT_FN_GEMF_PARA, network_fn=DEFAULT_FN_GEMF_NETWORK, out_fn=DEFAULT_FN_GEMF_OUT):
    '''
    Prepare GEMF output directory

    Args:
        `outdir` (`str`): Path to output directory

        `para_fn` (`str`): File name of GEMF parameter file

        `network_fn` (`str`): File name of GEMF network file

        `out_fn` (`str`): File name of GEMF output file

    Returns:
        `file`: Write-mode file object to GEMF parameter file

        `file`: Write-mode file object to GEMF network file

        `file`: Write-mode file object to GEMF output file
    '''
    makedirs(outdir)
    para_f = open('%s/%s' % (outdir, para_fn), 'w')
    network_f = open('%s/%s' % (outdir, network_fn), 'w')
    out_f = open('%s/%s' % (outdir, out_fn), 'w')
    return para_f, network_f, out_f

def load_contact_network(contact_network_fn, network_f):
    '''
    Load contact network and convert to GEMF network format

    Args:
        `contact_network_fn` (`str`): Path to input contact network (FAVITES format)

        `network_f` (`file`): Write-mode file object to GEMF network file

    Returns:
        `dict`: A mapping from node label to node number

        `list`: A mapping from node number to node label
    '''
    node2num = dict(); num2node = list()
    for l in open(contact_network_fn):
        # skip empty and header lines
        if len(l) == 0 or l[0] == '#' or l[0] == '\n':
            continue

        # parse NODE line
        if l.startswith('NODE'):
            dummy, u, a = l.split('\t'); u = u.strip()
            if u in node2num:
                raise ValueError("Duplicate node encountered in contact network file: %s" % u)
            node2num[u] = len(num2node); num2node.append(u)

        # parse EDGE line
        elif l.startswith('EDGE'):
            dummy, u, v, a, d_or_u = l.split('\t'); u = u.strip(); v = v.strip(); d_or_u = d_or_u.strip()
            if d_or_u != 'd' and d_or_u != 'u':
                raise ValueError("Last column of contact network EDGE row must be exactly d or u")
            try:
                u_num = node2num[u]
            except:
                raise ValueError("Node found in EDGE section but not in NODE section: %s" % u)
            try:
                v_num = node2num[v]
            except:
                raise ValueError("Node found in EDGE section but not in NODE section: %s" % v)
            network_f.write('%d\t%d\n' % (u_num, v_num))
            if d_or_u == 'u':
                network_f.write('%d\t%d\n' % (v_num, u_num))

        # non-comment and non-empty lines must start with NODE or EDGE
        else:
            raise ValueError("Invalid contact network file: %s" % contact_network_fn)

    # finish up and return
    network_f.close()
    return node2num, num2node

# main function
def main():
    # parse user args and prepare run
    args = parse_args()
    check_args(args)
    para_f, network_f, out_f = prepare_outdir(args.output)
    node2num, num2node = load_contact_network(args.contact_network, network_f)

# execute main function
if __name__ == "__main__":
    main()
